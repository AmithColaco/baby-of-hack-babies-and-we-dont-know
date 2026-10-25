"""Enterprise Retrieval-Augmented Generation (RAG) Architecture Package."""

from app.services.enterprise_rag.generation import GroundedGenerator
from app.services.enterprise_rag.ingestion import (
    BaseEmbeddingProvider,
    EmbeddingPipeline,
    GeminiEmbeddingProvider,
    JSONExtractor,
    MarkdownExtractor,
    NormalizedHashEmbeddingProvider,
    PDFExtractor,
    RecursiveCharacterChunker,
)
from app.services.enterprise_rag.pipeline import EnterpriseRAGPipeline
from app.services.enterprise_rag.retrieval import (
    BM25Index,
    ContextDeduplicator,
    CrossEncoderReranker,
    DenseVectorIndex,
    reciprocal_rank_fusion,
)
from app.services.enterprise_rag.schemas import (
    Chunk,
    ChunkMetadata,
    Citation,
    Document,
    DocumentType,
    FaithfulnessReport,
    FilterCriteria,
    RAGResponse,
    ScoredChunk,
)

__all__ = [
    "EnterpriseRAGPipeline",
    "Document",
    "Chunk",
    "ChunkMetadata",
    "DocumentType",
    "FilterCriteria",
    "ScoredChunk",
    "Citation",
    "FaithfulnessReport",
    "RAGResponse",
    "MarkdownExtractor",
    "JSONExtractor",
    "PDFExtractor",
    "RecursiveCharacterChunker",
    "EmbeddingPipeline",
    "BaseEmbeddingProvider",
    "GeminiEmbeddingProvider",
    "NormalizedHashEmbeddingProvider",
    "DenseVectorIndex",
    "BM25Index",
    "CrossEncoderReranker",
    "ContextDeduplicator",
    "reciprocal_rank_fusion",
    "GroundedGenerator",
]
