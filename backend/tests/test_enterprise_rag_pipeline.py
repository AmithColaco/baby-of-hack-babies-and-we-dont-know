"""Comprehensive Tests for Enterprise RAG Pipeline (Stages 1-4)."""

import json
from pathlib import Path
import pytest

from app.services.enterprise_rag import (
    BM25Index,
    ContextDeduplicator,
    CrossEncoderReranker,
    DenseVectorIndex,
    Document,
    DocumentType,
    EmbeddingPipeline,
    EnterpriseRAGPipeline,
    FilterCriteria,
    GroundedGenerator,
    JSONExtractor,
    MarkdownExtractor,
    NormalizedHashEmbeddingProvider,
    PDFExtractor,
    RAGResponse,
    RecursiveCharacterChunker,
    reciprocal_rank_fusion,
)


def test_markdown_and_json_extractors(tmp_path: Path):
    """Verify document extractors for Markdown and structured JSON."""
    # 1. Test Markdown Extractor
    md_file = tmp_path / "test_doc.md"
    md_file.write_text(
        "---\nauthor: Master Pandit\ncategory: Painting\n---\n# Kangra Miniature\n\nWasli paper is hand-burnished.",
        encoding="utf-8",
    )
    md_extractor = MarkdownExtractor()
    doc_md = md_extractor.extract(md_file, source_uri="uri://heritage/kangra.md", tenant_id="tenant_a")
    assert doc_md.doc_type == DocumentType.MARKDOWN
    assert doc_md.tenant_id == "tenant_a"
    assert doc_md.metadata.get("category") == "Painting"
    assert "Wasli paper is hand-burnished" in doc_md.content

    # 2. Test JSON Extractor
    json_file = tmp_path / "test_doc.json"
    json_file.write_text(
        json.dumps({
            "title": "Bastar Dhokra Craft",
            "content": "Lost-wax bell metal bronze casting dating back 4,000 years to Harappan lineage.",
            "artisan": "Sukhruram Ghadwa",
        }),
        encoding="utf-8",
    )
    json_extractor = JSONExtractor()
    doc_json = json_extractor.extract(json_file, source_uri="uri://heritage/dhokra.json", tenant_id="tenant_a")
    assert doc_json.doc_type == DocumentType.JSON
    assert "Lost-wax bell metal" in doc_json.content
    assert doc_json.metadata.get("artisan") == "Sukhruram Ghadwa"


def test_deterministic_recursive_chunker():
    """Verify deterministic token budgeting, 10-15% sliding overlap, and metadata enrichment."""
    chunker = RecursiveCharacterChunker(target_tokens=40, overlap_pct=0.15, chars_per_token=4.0)

    doc = Document(
        id="doc_test_100",
        content=(
            "# Section 1: Overview\n"
            "KAARIGAR enforces transparent fair-trade economics.\n\n"
            "## Section 2: Pricing Formula\n"
            "The 4-part formula guarantees 100% direct artisan share, a modest 5% platform fee, "
            "and statutory 5% GST tax. Zero dealer margins exist."
        ),
        source_uri="file:///policies/pricing.md",
        tenant_id="tenant_kaarigar",
        metadata={"tags": ["pricing", "fair-trade"]},
    )

    chunks = chunker.chunk_document(doc)
    assert len(chunks) >= 2, f"Expected multiple chunks, got {len(chunks)}"

    for idx, c in enumerate(chunks):
        assert c.id == f"doc_test_100#c{idx:03d}"
        assert c.metadata.doc_id == "doc_test_100"
        assert c.metadata.source_uri == "file:///policies/pricing.md"
        assert c.metadata.tenant_id == "tenant_kaarigar"
        assert c.metadata.chunk_index == idx
        assert c.metadata.total_chunks == len(chunks)
        assert c.metadata.token_count > 0


def test_batched_embedding_pipeline():
    """Verify dynamic batching and deterministic normalized vector generation."""
    chunker = RecursiveCharacterChunker(target_tokens=50)
    doc = Document(
        id="doc_emb",
        content="Bastar Dhokra bronze casting uses wild honeycomb beeswax and riverbed clay.",
        source_uri="file:///dhokra.md",
    )
    chunks = chunker.chunk_document(doc)

    pipeline = EmbeddingPipeline(provider=NormalizedHashEmbeddingProvider(dimension=64), batch_size=4)
    embedded = pipeline.embed_chunks(chunks)

    assert len(embedded) > 0
    assert embedded[0].embedding is not None
    assert len(embedded[0].embedding) == 64
    # Check unit vector L2 normalization
    norm = sum(x**2 for x in embedded[0].embedding) ** 0.5
    assert abs(norm - 1.0) < 1e-4


def test_hybrid_retrieval_and_rrf():
    """Verify dense + BM25Okapi sparse search and Reciprocal Rank Fusion (k=60)."""
    chunker = RecursiveCharacterChunker(target_tokens=50)
    embedding_pipeline = EmbeddingPipeline(provider=NormalizedHashEmbeddingProvider(dimension=64))

    doc1 = Document(
        id="doc_pricing",
        content="KAARIGAR 4-part transparent pricing formula: 100% direct artisan share, 5% platform fee, 5% GST.",
        source_uri="file:///pricing.md",
        tenant_id="tenant_main",
    )
    doc2 = Document(
        id="doc_dhokra",
        content="Bastar Lost-Wax Ritual Guardian Horse in bell metal bronze by master sculptor Sukhruram Ghadwa.",
        source_uri="file:///dhokra.md",
        tenant_id="tenant_main",
    )

    chunks = chunker.chunk_document(doc1) + chunker.chunk_document(doc2)
    embedded_chunks = embedding_pipeline.embed_chunks(chunks)

    dense_index = DenseVectorIndex()
    dense_index.index_chunks(embedded_chunks)

    sparse_index = BM25Index()
    sparse_index.index_chunks(embedded_chunks)

    query = "What is the platform fee in pricing formula?"
    q_vec = embedding_pipeline.embed_query(query)

    dense_res = dense_index.search(q_vec, top_k=5)
    sparse_res = sparse_index.search(query, top_k=5)

    fused = reciprocal_rank_fusion(dense_res, sparse_res, k=60, top_k=5)
    assert len(fused) > 0
    # Top chunk should be pricing
    assert "pricing" in fused[0].chunk.id.lower() or "fee" in fused[0].chunk.content.lower()


def test_post_retrieval_reranker_and_deduplication():
    """Verify cross-encoder re-ranking and context deduplication."""
    chunker = RecursiveCharacterChunker(target_tokens=40)
    embedding_pipeline = EmbeddingPipeline(provider=NormalizedHashEmbeddingProvider(dimension=64))

    doc = Document(
        id="doc_pottery",
        content="Jaipur Blue Pottery is crafted from ground quartz rock, soda glass, and cobalt oxide glaze.",
        source_uri="file:///blue_pottery.md",
    )
    chunks = embedding_pipeline.embed_chunks(chunker.chunk_document(doc))

    dense_index = DenseVectorIndex()
    dense_index.index_chunks(chunks)
    sparse_index = BM25Index()
    sparse_index.index_chunks(chunks)

    query = "ground quartz rock in Jaipur Blue Pottery"
    dense_res = dense_index.search(embedding_pipeline.embed_query(query), top_k=5)
    sparse_res = sparse_index.search(query, top_k=5)
    fused = reciprocal_rank_fusion(dense_res, sparse_res, k=60, top_k=5)

    reranker = CrossEncoderReranker()
    reranked = reranker.rerank(query, fused, top_n=3)
    assert len(reranked) > 0
    assert reranked[0].rerank_score is not None
    assert reranked[0].rerank_score > 0.0

    deduplicator = ContextDeduplicator(redundancy_threshold=0.85)
    deduped = deduplicator.deduplicate(reranked)
    formatted = deduplicator.format_context_for_prompt(deduped)
    assert "[CHUNK_ID:" in formatted
    assert "Jaipur Blue Pottery" in formatted


def test_grounded_generation_citations_and_guardrails():
    """Verify strict citation enforcement, hallucination guardrail, and safe fallback."""
    generator = GroundedGenerator()

    # 1. Test empty context safe fallback
    resp_empty = generator.generate("What is the speed of light in vacuum?", "", [])
    assert resp_empty.used_fallback is True
    assert "do not have sufficient information" in resp_empty.answer

    # 2. Test hallucination detection on unsupported answer
    context = "Kangra miniature paintings use wasli paper burnished with an agate stone."
    faithfulness = generator.evaluate_faithfulness(
        "Quantum computing relies on superconducting qubits and laser teleportation.",
        context,
    )
    assert faithfulness.hallucination_detected is True
    assert faithfulness.is_grounded is False


def test_end_to_end_enterprise_rag_pipeline(tmp_path: Path):
    """Verify end-to-end EnterpriseRAGPipeline execution on live documents."""
    pipeline = EnterpriseRAGPipeline(
        embedding_provider=NormalizedHashEmbeddingProvider(dimension=128),
        target_tokens=100,
        overlap_pct=0.15,
        retrieve_top_k=10,
        rerank_top_n=3,
    )

    doc_file = tmp_path / "pricing_policy.md"
    doc_file.write_text(
        "# KAARIGAR Fair Trade Policy\n\n"
        "KAARIGAR enforces an uncompromised 4-part transparent pricing breakdown:\n"
        "1. Base Price: 100% goes directly to the master artisan.\n"
        "2. Platform Infrastructure Fee: Modest 5% fee for archiving and photogrammetry.\n"
        "3. Statutory GST: Exact 5% tax.\n"
        "4. Total Price: The arithmetic sum with zero hidden margins.",
        encoding="utf-8",
    )

    indexed_count = pipeline.ingest_file(doc_file, source_uri="uri://kaarigar/pricing.md", tenant_id="tenant_kaarigar")
    assert indexed_count > 0

    # Query with tenant isolation filter
    filter_criteria = FilterCriteria(tenant_id="tenant_kaarigar")
    response: RAGResponse = pipeline.query("How does the 5% platform fee work?", filter_criteria=filter_criteria)

    assert response.query == "How does the 5% platform fee work?"
    assert len(response.retrieved_chunks) > 0
    assert response.faithfulness.is_grounded is True
    assert response.latency_ms >= 0.0
    assert len(response.answer) > 20
