"""KAARIGAR – JSON Knowledge Base Loader & Ingestion Service.

Decouples heritage corpus data from Python application code by loading,
validating, and automatically chunking documents from backend/app/data/knowledge_corpus.json.

Includes file modification timestamp (mtime) caching for zero-downtime hot-reload.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any, Optional

from app.services.chunking import DocumentChunker, KnowledgeDocument, RAGChunk

logger = logging.getLogger(__name__)

# Default location for knowledge corpus JSON relative to this file
_DEFAULT_JSON_PATH = Path(__file__).resolve().parent.parent / "data" / "knowledge_corpus.json"

# In-memory cached chunks and timestamp tracking
_CACHED_CHUNKS: Optional[list[RAGChunk]] = None
_CACHED_DOCS: Optional[list[KnowledgeDocument]] = None
_LAST_MTIME: float = 0.0


def _load_documents_from_disk(file_path: Path) -> list[KnowledgeDocument]:
    """Read and validate documents from the specified JSON file."""
    if not file_path.exists():
        logger.error(f"Knowledge corpus JSON file not found at: {file_path}")
        return []

    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        raw_docs = data.get("documents", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        documents: list[KnowledgeDocument] = []

        for item in raw_docs:
            if not isinstance(item, dict):
                continue

            doc_id = str(item.get("id", "")).strip()
            title = str(item.get("title", "")).strip()
            category = str(item.get("category", "")).strip()
            content = str(item.get("content", "")).strip()

            if not doc_id or not title or not content:
                logger.warning(f"Skipping malformed knowledge item: id={doc_id}, title={title}")
                continue

            doc = KnowledgeDocument(
                id=doc_id,
                title=title,
                category=category or "craft_tradition",
                content=content,
                product_id=item.get("product_id"),
                tags=[str(t).strip().lower() for t in item.get("tags", []) if t],
                metadata=item.get("metadata", {}),
            )
            documents.append(doc)

        logger.info(f"Loaded {len(documents)} validated documents from {file_path.name}")
        return documents

    except Exception as e:
        logger.exception(f"Failed to parse knowledge corpus JSON from {file_path}: {e}")
        return []


def get_static_chunks(
    json_path: Optional[Path] = None,
    force_reload: bool = False,
    chunk_size: int = 700,
    chunk_overlap: int = 120,
) -> list[RAGChunk]:
    """Retrieve all static RAG chunks from the JSON knowledge base.

    Automatically checks the file modification timestamp (mtime) and hot-reloads
    if the JSON has been edited on disk.
    """
    global _CACHED_CHUNKS, _CACHED_DOCS, _LAST_MTIME

    target_path = json_path or _DEFAULT_JSON_PATH

    # Check file modification time for automatic hot-reloading
    current_mtime = 0.0
    if target_path.exists():
        try:
            current_mtime = os.path.getmtime(target_path)
        except OSError:
            current_mtime = 0.0

    needs_reload = (
        force_reload
        or _CACHED_CHUNKS is None
        or (current_mtime > 0 and current_mtime != _LAST_MTIME)
    )

    if needs_reload:
        docs = _load_documents_from_disk(target_path)
        if docs:
            chunker = DocumentChunker(max_chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            chunks = chunker.chunk_documents(docs)
            _CACHED_DOCS = docs
            _CACHED_CHUNKS = chunks
            _LAST_MTIME = current_mtime
            logger.info(
                f"Ingested {len(docs)} documents into {len(chunks)} automated semantic RAG chunks."
            )
        else:
            # Fallback if file is empty or missing and no previous cache exists
            if _CACHED_CHUNKS is None:
                logger.warning("Falling back to minimal emergency seed corpus.")
                _CACHED_CHUNKS = _get_emergency_seed()
                _CACHED_DOCS = []

    return list(_CACHED_CHUNKS or [])


def reload_knowledge_base() -> list[RAGChunk]:
    """Explicitly force a reload of the JSON knowledge base and re-chunk all documents."""
    return get_static_chunks(force_reload=True)


def get_document_count() -> int:
    """Return total number of loaded parent documents."""
    if _CACHED_DOCS is None:
        get_static_chunks()
    return len(_CACHED_DOCS or [])


def get_chunk_count() -> int:
    """Return total number of generated RAG chunks."""
    if _CACHED_CHUNKS is None:
        get_static_chunks()
    return len(_CACHED_CHUNKS or [])


def _get_emergency_seed() -> list[RAGChunk]:
    """Minimal emergency in-memory seed in the unlikely event the JSON file is deleted."""
    return [
        RAGChunk(
            id="policy_pricing_transparency",
            title="KAARIGAR 4-Part Transparent Pricing Formula",
            category="platform_policy",
            content=(
                "KAARIGAR enforces an uncompromised 4-part transparent pricing breakdown on every craftwork:\n"
                "1. Actual Artisan Price (Base Price): 100% of this amount goes directly to the master craftsperson.\n"
                "2. Platform Infrastructure Fee: 5%.\n"
                "3. Applicable Taxes (GST): 5%.\n"
                "4. Total Final Price: Base Price + 5% Fee + 5% Tax."
            ),
            tags=["pricing", "platform fee", "gst", "fair trade"],
        ),
        RAGChunk(
            id="policy_escrow_and_returns",
            title="Artisan Escrow Protection & 7-Day White-Glove Inspection Window",
            category="platform_policy",
            content="Patron funds are held in secure escrow upon ordering. Artisan payout is released after the 7-day white-glove inspection window.",
            tags=["escrow", "delivery", "inspection", "return"],
        ),
    ]
