"""Enterprise RAG – Pydantic v2 Domain Schemas and Transfer Objects."""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class DocumentType(str, Enum):
    PDF = "pdf"
    MARKDOWN = "markdown"
    JSON = "json"
    TEXT = "text"


class Document(BaseModel):
    """Raw extracted document before chunking."""

    id: str = Field(..., description="Unique document identifier")
    content: str = Field(..., description="Raw text content of the document")
    doc_type: DocumentType = Field(default=DocumentType.TEXT, description="Source format")
    source_uri: str = Field(..., description="URI or file path of the source")
    tenant_id: str = Field(default="default", description="Tenant or namespace for isolation")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    metadata: dict[str, Any] = Field(default_factory=dict, description="Arbitrary document metadata")


class ChunkMetadata(BaseModel):
    """Enriched metadata attached to each deterministic chunk."""

    chunk_id: str = Field(..., description="Deterministic unique identifier {doc_id}#c{idx}")
    doc_id: str = Field(..., description="Parent document identifier")
    source_uri: str = Field(..., description="Source document URI")
    section_path: list[str] = Field(default_factory=list, description="Hierarchical heading path")
    chunk_index: int = Field(..., description="0-indexed position within parent document")
    total_chunks: int = Field(..., description="Total chunks in parent document")
    start_char: int = Field(default=0, description="Start character offset in parent document")
    end_char: int = Field(default=0, description="End character offset in parent document")
    token_count: int = Field(default=0, description="Estimated token count")
    tenant_id: str = Field(default="default", description="Tenant / namespace isolation key")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    tags: list[str] = Field(default_factory=list)
    custom: dict[str, Any] = Field(default_factory=dict)


class Chunk(BaseModel):
    """Processed searchable text chunk with dense embedding and metadata."""

    id: str = Field(..., description="Deterministic chunk ID")
    content: str = Field(..., description="Text segment content")
    metadata: ChunkMetadata = Field(..., description="Enriched chunk metadata")
    embedding: Optional[list[float]] = Field(default=None, description="Dense vector embedding")


class FilterCriteria(BaseModel):
    """Pre-retrieval filtering constraints."""

    tenant_id: str = Field(default="default", description="Tenant/namespace constraint")
    tags: Optional[list[str]] = Field(default=None, description="Must match any of these tags")
    source_uri: Optional[str] = Field(default=None, description="Filter by specific source URI")
    custom_metadata: Optional[dict[str, Any]] = Field(default=None, description="Key-value metadata match")


class ScoredChunk(BaseModel):
    """Retrieved chunk annotated with search scores."""

    chunk: Chunk
    dense_score: Optional[float] = None
    sparse_score: Optional[float] = None
    rrf_score: float = 0.0
    rerank_score: Optional[float] = None


class Citation(BaseModel):
    """Grounding citation reference."""

    chunk_id: str
    source_uri: str
    section_path: list[str]
    snippet: str


class FaithfulnessReport(BaseModel):
    """Self-correction and hallucination evaluation metrics."""

    is_grounded: bool
    faithfulness_score: float = Field(..., ge=0.0, le=1.0)
    hallucination_detected: bool
    unsupported_claims: list[str] = Field(default_factory=list)


class RAGResponse(BaseModel):
    """Synthesized answer with attribution and evaluation guardrails."""

    query: str
    answer: str
    citations: list[Citation] = Field(default_factory=list)
    retrieved_chunks: list[ScoredChunk] = Field(default_factory=list)
    faithfulness: FaithfulnessReport
    used_fallback: bool = False
    latency_ms: float = 0.0
