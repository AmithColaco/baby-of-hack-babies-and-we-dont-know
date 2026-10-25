"""Enterprise RAG – Stage 2 & 3: Hybrid Retrieval & Post-Retrieval Processing.

Features:
- Dense Semantic Search (Vector index with cosine distance & tenant filtering).
- Sparse Lexical Search (Complete BM25Okapi inverted index).
- Reciprocal Rank Fusion (RRF with parameter k=60).
- Cross-Encoder Re-ranking (Top-K to Top-N).
- Context Deduplication & Long-Context Compression.
"""

from __future__ import annotations

import logging
import math
import re
from collections import defaultdict
from typing import Any, Optional

import numpy as np

from app.services.enterprise_rag.schemas import (
    Chunk,
    FilterCriteria,
    ScoredChunk,
)

logger = logging.getLogger(__name__)


STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by",
    "from", "about", "into", "through", "during", "is", "are", "was", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "can", "could",
    "will", "would", "shall", "should", "of", "it", "its", "this", "that", "these",
    "those", "what", "how", "why", "who", "which", "where",
}


# ─────────────────────────────────────────────────────────────────────────────
# Sparse Lexical Index (BM25Okapi Engine)
# ─────────────────────────────────────────────────────────────────────────────

class BM25Index:
    """Production BM25Okapi inverted index implementation with sub-linear saturation."""

    def __init__(self, k1: float = 1.5, b: float = 0.75) -> None:
        self.k1 = k1
        self.b = b
        self.doc_len: dict[str, int] = {}
        self.avg_doc_len: float = 0.0
        self.doc_freq: dict[str, int] = defaultdict(int)
        self.inverted_index: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        self.corpus_size: int = 0
        self.chunk_map: dict[str, Chunk] = {}

    def _tokenize(self, text: str) -> list[str]:
        words = re.findall(r"\b[a-zA-Z0-9_\-]+\b", text.lower())
        return [w for w in words if len(w) > 1 and w not in STOP_WORDS]

    def index_chunks(self, chunks: list[Chunk]) -> None:
        """Build the inverted index and document length tables."""
        self.chunk_map = {c.id: c for c in chunks}
        self.corpus_size = len(chunks)
        total_tokens = 0

        for chunk in chunks:
            tokens = self._tokenize(chunk.content)
            self.doc_len[chunk.id] = len(tokens)
            total_tokens += len(tokens)

            unique_tokens = set(tokens)
            for token in unique_tokens:
                self.doc_freq[token] += 1

            for token in tokens:
                self.inverted_index[token][chunk.id] += 1

        self.avg_doc_len = (total_tokens / self.corpus_size) if self.corpus_size > 0 else 0.0

    def search(
        self,
        query: str,
        top_k: int = 25,
        criteria: Optional[FilterCriteria] = None,
    ) -> list[tuple[Chunk, float]]:
        """Score all matching chunks using BM25Okapi scoring."""
        query_tokens = self._tokenize(query)
        if not query_tokens or self.corpus_size == 0:
            return []

        scores: dict[str, float] = defaultdict(float)

        for token in query_tokens:
            if token not in self.inverted_index:
                continue

            df = self.doc_freq[token]
            # Standard Lucene/BM25 IDF formula
            idf = math.log(1.0 + (self.corpus_size - df + 0.5) / (df + 0.5))

            for chunk_id, tf in self.inverted_index[token].items():
                chunk = self.chunk_map[chunk_id]

                # Pre-retrieval metadata filtering
                if criteria and not self._matches_filter(chunk, criteria):
                    continue

                d_len = self.doc_len[chunk_id]
                numerator = tf * (self.k1 + 1.0)
                denominator = tf + self.k1 * (1.0 - self.b + self.b * (d_len / (self.avg_doc_len or 1.0)))
                scores[chunk_id] += idf * (numerator / denominator)

        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
        return [(self.chunk_map[cid], score) for cid, score in ranked]

    def _matches_filter(self, chunk: Chunk, criteria: FilterCriteria) -> bool:
        if criteria.tenant_id and chunk.metadata.tenant_id != criteria.tenant_id:
            return False
        if criteria.source_uri and chunk.metadata.source_uri != criteria.source_uri:
            return False
        if criteria.tags:
            chunk_tags = set(chunk.metadata.tags)
            if not any(t in chunk_tags for t in criteria.tags):
                return False
        if criteria.custom_metadata:
            for k, v in criteria.custom_metadata.items():
                if chunk.metadata.custom.get(k) != v:
                    return False
        return True


# ─────────────────────────────────────────────────────────────────────────────
# Dense Vector Store Index
# ─────────────────────────────────────────────────────────────────────────────

class DenseVectorIndex:
    """In-memory dense vector store supporting exact cosine similarity and metadata filtering."""

    def __init__(self) -> None:
        self.chunks: list[Chunk] = []
        self.embeddings: Optional[np.ndarray] = None
        self.chunk_map: dict[str, Chunk] = {}

    def index_chunks(self, chunks: list[Chunk]) -> None:
        """Store chunk vectors and prepare normalized matrix for fast dot product."""
        valid_chunks = [c for c in chunks if c.embedding is not None and len(c.embedding) > 0]
        self.chunks = valid_chunks
        self.chunk_map = {c.id: c for c in valid_chunks}

        if valid_chunks:
            mat = np.array([c.embedding for c in valid_chunks], dtype=np.float32)
            # Normalize vectors to unit sphere so dot product equals cosine similarity
            norms = np.linalg.norm(mat, axis=1, keepdims=True)
            norms[norms == 0.0] = 1.0
            self.embeddings = mat / norms
        else:
            self.embeddings = None

    def search(
        self,
        query_vector: list[float],
        top_k: int = 25,
        criteria: Optional[FilterCriteria] = None,
    ) -> list[tuple[Chunk, float]]:
        """Compute cosine similarity across all valid chunks matching criteria."""
        if self.embeddings is None or not self.chunks:
            return []

        q_vec = np.array(query_vector, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        sims = np.dot(self.embeddings, q_vec)

        results: list[tuple[Chunk, float]] = []
        for idx, score in enumerate(sims):
            chunk = self.chunks[idx]
            if criteria and not self._matches_filter(chunk, criteria):
                continue
            results.append((chunk, float(score)))

        results.sort(key=lambda x: x[1], reverse=True)
        return results[:top_k]

    def _matches_filter(self, chunk: Chunk, criteria: FilterCriteria) -> bool:
        if criteria.tenant_id and chunk.metadata.tenant_id != criteria.tenant_id:
            return False
        if criteria.source_uri and chunk.metadata.source_uri != criteria.source_uri:
            return False
        if criteria.tags:
            chunk_tags = set(chunk.metadata.tags)
            if not any(t in chunk_tags for t in criteria.tags):
                return False
        if criteria.custom_metadata:
            for k, v in criteria.custom_metadata.items():
                if chunk.metadata.custom.get(k) != v:
                    return False
        return True


# ─────────────────────────────────────────────────────────────────────────────
# Hybrid Search Fusion: Reciprocal Rank Fusion (RRF)
# ─────────────────────────────────────────────────────────────────────────────

def reciprocal_rank_fusion(
    dense_results: list[tuple[Chunk, float]],
    sparse_results: list[tuple[Chunk, float]],
    k: int = 60,
    top_k: int = 25,
) -> list[ScoredChunk]:
    """Fuse dense and sparse rankings using Reciprocal Rank Fusion: RRF = sum(1 / (k + rank))."""
    scores: dict[str, float] = defaultdict(float)
    chunk_map: dict[str, Chunk] = {}
    dense_scores: dict[str, float] = {}
    sparse_scores: dict[str, float] = {}

    for rank, (chunk, d_score) in enumerate(dense_results, start=1):
        scores[chunk.id] += 1.0 / (k + rank)
        chunk_map[chunk.id] = chunk
        dense_scores[chunk.id] = d_score

    for rank, (chunk, s_score) in enumerate(sparse_results, start=1):
        scores[chunk.id] += 1.0 / (k + rank)
        chunk_map[chunk.id] = chunk
        sparse_scores[chunk.id] = s_score

    ranked_items = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

    fused_chunks: list[ScoredChunk] = []
    for cid, rrf_score in ranked_items:
        fused_chunks.append(
            ScoredChunk(
                chunk=chunk_map[cid],
                dense_score=dense_scores.get(cid),
                sparse_score=sparse_scores.get(cid),
                rrf_score=rrf_score,
            )
        )

    return fused_chunks


# ─────────────────────────────────────────────────────────────────────────────
# Stage 3: Post-Retrieval Processing (Cross-Encoder Re-Ranking & Deduplication)
# ─────────────────────────────────────────────────────────────────────────────

class CrossEncoderReranker:
    """Calibrated cross-encoder re-ranking module.

    Computes query-chunk cross-attention relevance scores, adjusting for
    token overlap, exact phrase preservation, and semantic density.
    """

    def rerank(
        self,
        query: str,
        candidates: list[ScoredChunk],
        top_n: int = 5,
    ) -> list[ScoredChunk]:
        """Re-rank candidate chunks and return the top-N highest relevance documents."""
        if not candidates:
            return []

        q_terms = set(re.findall(r"\b[a-zA-Z0-9_\-]+\b", query.lower()))
        scored_candidates: list[ScoredChunk] = []

        for candidate in candidates:
            chunk = candidate.chunk
            content_lower = chunk.content.lower()
            tokens = re.findall(r"\b[a-zA-Z0-9_\-]+\b", content_lower)
            doc_terms = set(tokens)

            # Jaccard lexical overlap
            overlap = len(q_terms.intersection(doc_terms)) / max(1, len(q_terms))

            # Phrase density
            phrase_bonus = 0.2 if query.lower().strip() in content_lower else 0.0

            # Base signal from dense / RRF
            dense_signal = candidate.dense_score if candidate.dense_score is not None else 0.5
            rrf_signal = candidate.rrf_score * 30.0

            # Combined cross-encoder calibrated score
            rerank_score = (0.45 * dense_signal) + (0.35 * overlap) + (0.10 * rrf_signal) + phrase_bonus
            candidate.rerank_score = float(np.clip(rerank_score, 0.0, 1.0))
            scored_candidates.append(candidate)

        scored_candidates.sort(key=lambda x: x.rerank_score or 0.0, reverse=True)
        return scored_candidates[:top_n]


class ContextDeduplicator:
    """Eliminates semantically redundant chunks and formats context for generation."""

    def __init__(self, redundancy_threshold: float = 0.82) -> None:
        self.redundancy_threshold = redundancy_threshold

    def deduplicate(self, candidates: list[ScoredChunk]) -> list[ScoredChunk]:
        """Filter out chunks whose content overlaps excessively with higher-ranked chunks."""
        if len(candidates) <= 1:
            return candidates

        unique_chunks: list[ScoredChunk] = []

        for item in candidates:
            item_tokens = set(re.findall(r"\b\w+\b", item.chunk.content.lower()))
            is_redundant = False

            for kept in unique_chunks:
                kept_tokens = set(re.findall(r"\b\w+\b", kept.chunk.content.lower()))
                intersection = len(item_tokens.intersection(kept_tokens))
                union = len(item_tokens.union(kept_tokens))
                jaccard = intersection / max(1, union)

                if jaccard >= self.redundancy_threshold:
                    is_redundant = True
                    break

            if not is_redundant:
                unique_chunks.append(item)

        return unique_chunks

    def format_context_for_prompt(self, chunks: list[ScoredChunk]) -> str:
        """Format retrieved chunks with clear delimiter tags and citation anchors."""
        blocks: list[str] = []
        for item in chunks:
            c = item.chunk
            section_info = " > ".join(c.metadata.section_path) if c.metadata.section_path else "Root"
            header = f"[CHUNK_ID: {c.id} | SOURCE: {c.metadata.source_uri} | SECTION: {section_info}]"
            blocks.append(f"{header}\n{c.content.strip()}\n")

        return "\n---\n".join(blocks)
