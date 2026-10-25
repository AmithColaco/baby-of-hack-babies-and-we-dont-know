"""Enterprise RAG – Complete Orchestration Pipeline.

Unifies:
1. Ingestion & Document Processing (Extractors, Deterministic Chunker, Dynamic Batched Embeddings).
2. Hybrid Retrieval Pipeline (Dense Vector Index + BM25Okapi + Reciprocal Rank Fusion k=60).
3. Post-Retrieval Processing (Cross-Encoder Re-Ranking + Context Deduplication).
4. Grounded Synthesis & Guardrails (Citation Attribution + Faithfulness Evaluation).
"""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional, Union

from app.services.enterprise_rag.generation import GroundedGenerator
from app.services.enterprise_rag.ingestion import (
    BaseEmbeddingProvider,
    EmbeddingPipeline,
    JSONExtractor,
    MarkdownExtractor,
    PDFExtractor,
    RecursiveCharacterChunker,
)
from app.services.enterprise_rag.retrieval import (
    BM25Index,
    ContextDeduplicator,
    CrossEncoderReranker,
    DenseVectorIndex,
    reciprocal_rank_fusion,
)
from app.services.enterprise_rag.schemas import (
    Chunk,
    Document,
    FilterCriteria,
    RAGResponse,
)

logger = logging.getLogger(__name__)


class EnterpriseRAGPipeline:
    """Production-grade Enterprise RAG Pipeline implementing 4 decoupled modular stages."""

    def __init__(
        self,
        embedding_provider: Optional[BaseEmbeddingProvider] = None,
        target_tokens: int = 600,
        overlap_pct: float = 0.15,
        rrf_k: int = 60,
        retrieve_top_k: int = 25,
        rerank_top_n: int = 5,
        gemini_api_key: Optional[str] = None,
    ) -> None:
        # Stage 1: Ingestion Components
        self.chunker = RecursiveCharacterChunker(target_tokens=target_tokens, overlap_pct=overlap_pct)
        self.embedding_pipeline = EmbeddingPipeline(provider=embedding_provider)
        self.md_extractor = MarkdownExtractor()
        self.json_extractor = JSONExtractor()
        self.pdf_extractor = PDFExtractor()

        # Stage 2: Hybrid Retrieval Components
        self.dense_index = DenseVectorIndex()
        self.sparse_index = BM25Index()
        self.rrf_k = rrf_k
        self.retrieve_top_k = retrieve_top_k

        # Stage 3: Post-Retrieval Processing
        self.reranker = CrossEncoderReranker()
        self.deduplicator = ContextDeduplicator()
        self.rerank_top_n = rerank_top_n

        # Stage 4: Synthesis & Guardrails
        self.generator = GroundedGenerator(api_key=gemini_api_key)

        # Internal chunk storage
        self._all_chunks: list[Chunk] = []

    def ingest_documents(self, documents: list[Document]) -> int:
        """Chunk, embed, and index a collection of documents."""
        all_new_chunks: list[Chunk] = []
        for doc in documents:
            chunks = self.chunker.chunk_document(doc)
            all_new_chunks.extend(chunks)

        if not all_new_chunks:
            return 0

        # Generate dense embeddings with dynamic batching
        embedded_chunks = self.embedding_pipeline.embed_chunks(all_new_chunks)
        self._all_chunks.extend(embedded_chunks)

        # Index into dense and sparse stores
        self.dense_index.index_chunks(self._all_chunks)
        self.sparse_index.index_chunks(self._all_chunks)

        logger.info(
            f"Successfully indexed {len(documents)} documents into {len(embedded_chunks)} searchable chunks."
        )
        return len(embedded_chunks)

    def ingest_file(
        self,
        file_path: Union[str, Path],
        source_uri: Optional[str] = None,
        tenant_id: str = "default",
    ) -> int:
        """Extract and index a file on disk (Markdown, JSON, or PDF)."""
        p = Path(file_path)
        uri = source_uri or str(p)
        suffix = p.suffix.lower()

        if suffix in (".md", ".markdown"):
            doc = self.md_extractor.extract(p, source_uri=uri, tenant_id=tenant_id)
        elif suffix == ".json":
            doc = self.json_extractor.extract(p, source_uri=uri, tenant_id=tenant_id)
        elif suffix == ".pdf":
            doc = self.pdf_extractor.extract(p, source_uri=uri, tenant_id=tenant_id)
        else:
            doc = self.md_extractor.extract(p, source_uri=uri, tenant_id=tenant_id)

        return self.ingest_documents([doc])

    def query(
        self,
        query_text: str,
        filter_criteria: Optional[FilterCriteria] = None,
    ) -> RAGResponse:
        """Execute end-to-end RAG pipeline:

        1. Dense semantic search + BM25 sparse search.
        2. Reciprocal Rank Fusion (RRF k=60).
        3. Cross-encoder re-ranking (top-K -> top-N).
        4. Context deduplication & formatting.
        5. Grounded synthesis with citation extraction and faithfulness guardrails.
        """
        clean_query = query_text.strip()
        if not clean_query:
            return self.generator.generate(clean_query, "", [])

        # 1. Dense Semantic Retrieval
        query_vector = self.embedding_pipeline.embed_query(clean_query)
        dense_results = self.dense_index.search(
            query_vector=query_vector,
            top_k=self.retrieve_top_k,
            criteria=filter_criteria,
        )

        # 2. Sparse BM25 Retrieval
        sparse_results = self.sparse_index.search(
            query=clean_query,
            top_k=self.retrieve_top_k,
            criteria=filter_criteria,
        )

        # 3. Reciprocal Rank Fusion (k=60)
        fused_candidates = reciprocal_rank_fusion(
            dense_results=dense_results,
            sparse_results=sparse_results,
            k=self.rrf_k,
            top_k=self.retrieve_top_k,
        )

        # 4. Cross-Encoder Re-Ranking (top-K -> top-N)
        reranked_chunks = self.reranker.rerank(
            query=clean_query,
            candidates=fused_candidates,
            top_n=self.rerank_top_n,
        )

        # 5. Context Deduplication & Compression
        deduplicated_chunks = self.deduplicator.deduplicate(reranked_chunks)
        formatted_context = self.deduplicator.format_context_for_prompt(deduplicated_chunks)

        # 6. Grounded Generation & Guardrail Evaluation
        response = self.generator.generate(
            query=clean_query,
            formatted_context=formatted_context,
            retrieved_chunks=deduplicated_chunks,
        )

        return response
