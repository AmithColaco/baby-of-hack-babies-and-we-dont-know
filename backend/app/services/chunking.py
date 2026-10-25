"""KAARIGAR – Automated Semantic Document Chunker for RAG.

Provides automated, boundary-aware text chunking with sliding window overlap,
eliminating the need to manually chunk or hardcode knowledge fragments.
"""

from __future__ import annotations

import logging
import re
from dataclasses import dataclass, field
from typing import Any, Optional

logger = logging.getLogger(__name__)


@dataclass
class KnowledgeDocument:
    """Represents a raw or curated knowledge document loaded from external JSON."""

    id: str
    title: str
    category: str  # platform_policy, product, craft_tradition, editorial_story, making_stage
    content: str
    product_id: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class RAGChunk:
    """Represents an atomic, searchable knowledge chunk in the RAG retrieval index."""

    id: str
    title: str
    category: str
    content: str
    product_id: Optional[str] = None
    tags: list[str] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)


class DocumentChunker:
    """Automated text chunker with semantic hierarchy and sliding window overlap.

    Splits long documents along natural language boundaries (paragraphs, sentences, clauses)
    while preserving document-level metadata, tags, and product associations.
    """

    def __init__(
        self,
        max_chunk_size: int = 700,
        chunk_overlap: int = 120,
        min_chunk_size: int = 80,
    ) -> None:
        self.max_chunk_size = max_chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        # Hierarchical separators ordered by semantic cohesion
        self.separators = ["\n\n", "\n", ". ", "? ", "! ", "; ", ", ", " "]

    def _split_text_recursive(self, text: str, separators: list[str]) -> list[str]:
        """Recursively split text using the first separator that yields pieces."""
        text = text.strip()
        if len(text) <= self.max_chunk_size:
            return [text] if text else []

        if not separators:
            # Hard fallback: slice by character limit if no separators remain
            return [text[i : i + self.max_chunk_size] for i in range(0, len(text), self.max_chunk_size)]

        sep = separators[0]
        remaining_seps = separators[1:]

        parts = text.split(sep)
        chunks: list[str] = []
        current_block: list[str] = []
        current_len = 0

        for part in parts:
            part_str = part.strip()
            if not part_str:
                continue

            part_len = len(part_str) + len(sep)

            # If an individual part itself exceeds max_chunk_size, recursively subdivide it
            if len(part_str) > self.max_chunk_size:
                if current_block:
                    combined = sep.join(current_block).strip()
                    if combined:
                        chunks.append(combined)
                    current_block = []
                    current_len = 0

                sub_chunks = self._split_text_recursive(part_str, remaining_seps)
                chunks.extend(sub_chunks)
                continue

            if current_len + part_len > self.max_chunk_size and current_block:
                combined = sep.join(current_block).strip()
                if combined:
                    chunks.append(combined)
                current_block = [part_str]
                current_len = part_len
            else:
                current_block.append(part_str)
                current_len += part_len

        if current_block:
            combined = sep.join(current_block).strip()
            if combined:
                chunks.append(combined)

        return chunks

    def _apply_overlap(self, chunks: list[str]) -> list[str]:
        """Apply sliding window context overlap between successive chunks."""
        if len(chunks) <= 1 or self.chunk_overlap <= 0:
            return chunks

        overlapped_chunks: list[str] = [chunks[0]]

        for i in range(1, len(chunks)):
            prev_chunk = chunks[i - 1]
            curr_chunk = chunks[i]

            # Extract last ~chunk_overlap characters from previous chunk
            if len(prev_chunk) > self.chunk_overlap:
                overlap_text = prev_chunk[-self.chunk_overlap :]
                # Snap to the start of a word to avoid truncated words
                space_idx = overlap_text.find(" ")
                if space_idx != -1 and space_idx < len(overlap_text) - 10:
                    overlap_text = overlap_text[space_idx + 1 :]
                stitched = f"...{overlap_text.strip()} {curr_chunk}"
            else:
                stitched = curr_chunk

            overlapped_chunks.append(stitched.strip())

        return overlapped_chunks

    def chunk_document(self, doc: KnowledgeDocument) -> list[RAGChunk]:
        """Convert a KnowledgeDocument into one or more semantic RAGChunk objects."""
        raw_content = (doc.content or "").strip()
        if not raw_content:
            return []

        # If document comfortably fits within max_chunk_size * 1.25, keep as single atomic chunk
        # to preserve full document integrity and direct ID matching
        if len(raw_content) <= int(self.max_chunk_size * 1.25):
            chunk_metadata = dict(doc.metadata)
            chunk_metadata.update({
                "source_doc_id": doc.id,
                "chunk_index": 0,
                "total_chunks": 1,
            })
            return [
                RAGChunk(
                    id=doc.id,
                    title=doc.title,
                    category=doc.category,
                    content=raw_content,
                    product_id=doc.product_id,
                    tags=list(doc.tags),
                    metadata=chunk_metadata,
                )
            ]

        # Multi-chunk splitting
        raw_splits = self._split_text_recursive(raw_content, self.separators)
        final_splits = self._apply_overlap(raw_splits)
        total_parts = len(final_splits)

        chunks: list[RAGChunk] = []
        for idx, text_block in enumerate(final_splits, start=1):
            chunk_id = f"{doc.id}_c{idx}" if total_parts > 1 else doc.id
            chunk_title = f"{doc.title} (Part {idx})" if total_parts > 1 else doc.title

            meta = dict(doc.metadata)
            meta.update({
                "source_doc_id": doc.id,
                "chunk_index": idx - 1,
                "total_chunks": total_parts,
            })

            chunks.append(
                RAGChunk(
                    id=chunk_id,
                    title=chunk_title,
                    category=doc.category,
                    content=text_block,
                    product_id=doc.product_id,
                    tags=list(doc.tags),
                    metadata=meta,
                )
            )

        return chunks

    def chunk_documents(self, docs: list[KnowledgeDocument]) -> list[RAGChunk]:
        """Process a list of documents and return all generated RAG chunks."""
        all_chunks: list[RAGChunk] = []
        for doc in docs:
            doc_chunks = self.chunk_document(doc)
            all_chunks.extend(doc_chunks)
        return all_chunks
