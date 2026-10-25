"""Enterprise RAG – Stage 4: Grounded Synthesis, Citation Extraction & Faithfulness Guardrails.

Features:
- Strict system prompt enforcing citations against retrieved chunk IDs.
- Deterministic safe fallback ("I do not have sufficient information in the context").
- Citation parsing and attribution mapping.
- Self-correction evaluation guardrail (calculating faithfulness & hallucination detection).
"""

from __future__ import annotations

import logging
import os
import re
import time
from typing import Optional

from app.services.enterprise_rag.schemas import (
    Citation,
    FaithfulnessReport,
    RAGResponse,
    ScoredChunk,
)

logger = logging.getLogger(__name__)

SAFE_FALLBACK_ANSWER = (
    "I do not have sufficient information in the verified context to answer this inquiry authoritatively."
)


class GroundedGenerator:
    """Enterprise RAG Generator enforcing strict context grounding, citations, and evaluation."""

    def __init__(self, api_key: Optional[str] = None) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")

    def _call_llm(self, prompt: str) -> Optional[str]:
        """Execute LLM call via Gemini or configured provider."""
        if not self.api_key:
            return None

        try:
            import google.generativeai as genai

            genai.configure(api_key=self.api_key, transport="rest")
            model = genai.GenerativeModel("gemini-2.0-flash")
            response = model.generate_content(prompt)
            return (response.text or "").strip()
        except Exception as e:
            logger.warning(f"LLM API generation failed: {e}")
            return None

    def _generate_grounded_fallback(self, query: str, chunks: list[ScoredChunk]) -> str:
        """Deterministic curatorial synthesis when LLM is unavailable or offline."""
        if not chunks:
            return SAFE_FALLBACK_ANSWER

        top = chunks[0].chunk
        lines = [
            f"According to verified archives [{top.id}]:\n",
            f"{top.content}\n",
        ]

        if len(chunks) > 1:
            second = chunks[1].chunk
            lines.append(f"Additional corroborating context [{second.id}]:\n{second.content}")

        return "\n".join(lines)

    def extract_citations(self, text: str, chunks: list[ScoredChunk]) -> list[Citation]:
        """Extract all cited chunk IDs from the generated text and link to source documents."""
        chunk_map = {item.chunk.id: item.chunk for item in chunks}
        # Match citations like [chunk_id] or [CHUNK_ID: chunk_id]
        cited_ids = re.findall(r"\[(?:CHUNK_ID:\s*)?([a-zA-Z0-9_\-#]+)\]", text)

        citations: list[Citation] = []
        seen = set()

        for cid in cited_ids:
            if cid in chunk_map and cid not in seen:
                seen.add(cid)
                c = chunk_map[cid]
                snippet = c.content[:200] + ("..." if len(c.content) > 200 else "")
                citations.append(
                    Citation(
                        chunk_id=c.id,
                        source_uri=c.metadata.source_uri,
                        section_path=c.metadata.section_path,
                        snippet=snippet,
                    )
                )

        return citations

    def evaluate_faithfulness(self, answer: str, context_text: str) -> FaithfulnessReport:
        """Evaluate retrieval faithfulness and detect hallucinations.

        Computes n-gram claim overlap and checks for unsupported assertions.
        """
        if answer == SAFE_FALLBACK_ANSWER:
            return FaithfulnessReport(
                is_grounded=True,
                faithfulness_score=1.0,
                hallucination_detected=False,
                unsupported_claims=[],
            )

        context_lower = context_text.lower()
        # Segment answer into candidate statements
        sentences = [s.strip() for s in re.split(r"[.!?]\s+", answer) if len(s.strip()) > 15]

        if not sentences:
            return FaithfulnessReport(
                is_grounded=True,
                faithfulness_score=1.0,
                hallucination_detected=False,
                unsupported_claims=[],
            )

        grounded_count = 0
        unsupported: list[str] = []

        for sentence in sentences:
            words = set(re.findall(r"\b[a-zA-Z0-9_\-]{4,}\b", sentence.lower()))
            if not words:
                grounded_count += 1
                continue

            # Fraction of substantive words found in context
            matched_words = [w for w in words if w in context_lower]
            ratio = len(matched_words) / len(words)

            if ratio >= 0.55:
                grounded_count += 1
            else:
                unsupported.append(sentence)

        faithfulness_score = round(grounded_count / len(sentences), 3)
        hallucination_detected = faithfulness_score < 0.70

        return FaithfulnessReport(
            is_grounded=not hallucination_detected,
            faithfulness_score=faithfulness_score,
            hallucination_detected=hallucination_detected,
            unsupported_claims=unsupported,
        )

    def generate(
        self,
        query: str,
        formatted_context: str,
        retrieved_chunks: list[ScoredChunk],
    ) -> RAGResponse:
        """Synthesize answer with strict citation enforcement and guardrail evaluation."""
        start_time = time.perf_counter()

        # If no relevant chunks survived retrieval/reranking
        if not retrieved_chunks:
            latency = (time.perf_counter() - start_time) * 1000.0
            return RAGResponse(
                query=query,
                answer=SAFE_FALLBACK_ANSWER,
                citations=[],
                retrieved_chunks=[],
                faithfulness=FaithfulnessReport(
                    is_grounded=True,
                    faithfulness_score=1.0,
                    hallucination_detected=False,
                ),
                used_fallback=True,
                latency_ms=round(latency, 2),
            )

        system_instruction = (
            "You are an enterprise AI specialist providing grounded, accurate information based strictly "
            "on the verified context below.\n\n"
            "STRICT CITATION RULES:\n"
            "1. Ground every claim directly in the provided context.\n"
            "2. At the end of every substantive sentence or claim, include the exact chunk identifier in brackets, "
            "e.g. [doc_id#c001].\n"
            "3. If the answer cannot be determined with certainty from the context, reply EXACTLY with:\n"
            f"\"{SAFE_FALLBACK_ANSWER}\"\n"
            "4. Do NOT fabricate facts, dates, names, or statistics not present in the context."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"### VERIFIED CONTEXT:\n{formatted_context}\n\n"
            f"### USER QUERY:\n{query}\n\n"
            f"GROUNDED ANSWER:"
        )

        raw_answer = self._call_llm(prompt)
        used_fallback = False

        if not raw_answer:
            raw_answer = self._generate_grounded_fallback(query, retrieved_chunks)
            used_fallback = True

        # Extract citations
        citations = self.extract_citations(raw_answer, retrieved_chunks)

        # Run faithfulness and hallucination guardrail
        faithfulness = self.evaluate_faithfulness(raw_answer, formatted_context)

        # Self-correction guardrail: if severe hallucination is detected, replace with safe fallback
        if faithfulness.hallucination_detected:
            logger.warning(
                f"Hallucination detected (score: {faithfulness.faithfulness_score}). Engaging safe fallback."
            )
            raw_answer = SAFE_FALLBACK_ANSWER
            used_fallback = True
            citations = []

        latency = (time.perf_counter() - start_time) * 1000.0

        return RAGResponse(
            query=query,
            answer=raw_answer,
            citations=citations,
            retrieved_chunks=retrieved_chunks,
            faithfulness=faithfulness,
            used_fallback=used_fallback,
            latency_ms=round(latency, 2),
        )
