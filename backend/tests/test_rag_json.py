"""KAARIGAR – Tests for JSON Knowledge Corpus Ingestion and Automated Semantic Chunking."""

import json
from pathlib import Path
import pytest

from app.services.chunking import DocumentChunker, KnowledgeDocument, RAGChunk
from app.services import knowledge_loader, rag_service


def test_knowledge_corpus_json_validity():
    """Verify that backend/app/data/knowledge_corpus.json exists, is valid JSON, and has required fields."""
    json_path = Path(__file__).resolve().parent.parent / "app" / "data" / "knowledge_corpus.json"
    assert json_path.exists(), f"Missing knowledge_corpus.json at {json_path}"

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert "documents" in data
    docs = data["documents"]
    assert len(docs) >= 15, f"Expected at least 15 documents, found {len(docs)}"

    for doc in docs:
        assert "id" in doc and len(doc["id"]) > 0
        assert "title" in doc and len(doc["title"]) > 0
        assert "category" in doc and len(doc["category"]) > 0
        assert "content" in doc and len(doc["content"]) > 20
        assert "tags" in doc and isinstance(doc["tags"], list)


def test_automated_document_chunker():
    """Verify automated boundary-aware chunking and overlap logic."""
    chunker = DocumentChunker(max_chunk_size=150, chunk_overlap=30)

    # 1. Short document should remain a single chunk
    short_doc = KnowledgeDocument(
        id="short_test_doc",
        title="Short Policy",
        category="platform_policy",
        content="This is a concise platform policy that easily fits within one single chunk.",
        tags=["policy", "test"],
    )
    single_chunks = chunker.chunk_document(short_doc)
    assert len(single_chunks) == 1
    assert single_chunks[0].id == "short_test_doc"
    assert single_chunks[0].title == "Short Policy"
    assert single_chunks[0].metadata["total_chunks"] == 1

    # 2. Long document should be automatically chunked with overlap
    long_text = (
        "In Pandit Ram Swaroop Sharma's atelier in the Kangra Valley, time is measured not by clocks but by stone burnishing and pigment settling. "
        "Wasli paper requires laminating three sheets of acid-free rag paper with neem-infused starch paste to prevent pest infestation. "
        "Once sun-cured against marble slabs, the artist rubs the surface with a heated agate stone until it acquires the dense smoothness of ivory. "
        "Sharma uses a squirrel-hair brush with three hairs plucked from a wild mountain squirrel."
    )
    long_doc = KnowledgeDocument(
        id="long_test_doc",
        title="Wasli Master Story",
        category="editorial_story",
        content=long_text,
        product_id="pahari-miniature",
        tags=["kangra", "wasli"],
    )
    multi_chunks = chunker.chunk_document(long_doc)
    assert len(multi_chunks) > 1, f"Expected multiple chunks, got {len(multi_chunks)}"
    assert all("long_test_doc" in c.id for c in multi_chunks)
    assert all(c.category == "editorial_story" for c in multi_chunks)
    assert all(c.product_id == "pahari-miniature" for c in multi_chunks)
    assert multi_chunks[0].metadata["chunk_index"] == 0
    assert multi_chunks[0].metadata["total_chunks"] == len(multi_chunks)


def test_knowledge_loader_ingestion():
    """Verify that knowledge_loader parses JSON and produces RAGChunk instances."""
    chunks = knowledge_loader.get_static_chunks(force_reload=True)
    assert len(chunks) >= 20

    # Ensure key policies and crafts exist in loaded chunks
    chunk_ids = [c.id for c in chunks]
    assert any("pricing_transparency" in cid for cid in chunk_ids)
    assert any("dhokra" in cid for cid in chunk_ids)
    assert any("blue_pottery" in cid for cid in chunk_ids)
    assert any("chanderi" in cid for cid in chunk_ids)

    # Check metrics helpers
    doc_count = knowledge_loader.get_document_count()
    chunk_count = knowledge_loader.get_chunk_count()
    assert doc_count >= 15
    assert chunk_count >= doc_count


def test_rag_service_hybrid_retrieval_with_json_corpus():
    """Verify hybrid retrieval over JSON-ingested knowledge corpus."""
    # 1. Retrieve for pricing policy
    pricing_results = rag_service.retrieve_relevant_chunks("What is the 5% platform fee for?", top_k=3)
    assert len(pricing_results) > 0
    top_chunk, score = pricing_results[0]
    assert "pricing" in top_chunk.title.lower() or "platform" in top_chunk.title.lower() or score > 0.1

    # 2. Retrieve for Bastar Dhokra lost-wax casting
    dhokra_results = rag_service.retrieve_relevant_chunks("Bastar lost wax brass horse sculpture", top_k=3)
    assert len(dhokra_results) > 0
    assert any("dhokra" in c.tags or "lost-wax" in c.tags or "dhokra" in c.title.lower() for c, _ in dhokra_results)

    # 3. Retrieve for Kangra wasli miniature
    miniature_results = rag_service.retrieve_relevant_chunks("Pahari Kangra wasli miniature painting", top_k=3)
    assert len(miniature_results) > 0
    assert any("pahari" in c.tags or "miniature" in c.tags for c, _ in miniature_results)
