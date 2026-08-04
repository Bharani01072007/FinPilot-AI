"""Retrieval-Augmented Generation (RAG) Architecture Interfaces.

Defines abstract interfaces for Embedding Providers, Vector Stores, Retrievers, and Hybrid Search.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional


class EmbeddingProvider(ABC):
    """Interface for text embedding vector generation models."""

    @abstractmethod
    def embed_text(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        pass


class VectorStoreProvider(ABC):
    """Interface for Vector Database Storage (Pinecone, Pgvector, Qdrant, Chroma)."""

    @abstractmethod
    def upsert_vectors(self, collection_name: str, vectors: List[Dict[str, Any]]) -> bool:
        pass

    @abstractmethod
    def similarity_search(
        self, collection_name: str, query_vector: List[float], top_k: int = 5, filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        pass


class RetrieverInterface(ABC):
    """Interface for document chunk retrieval."""

    @abstractmethod
    def retrieve_context(self, query: str, top_k: int = 5) -> List[str]:
        pass


class HybridSearchProvider(ABC):
    """Interface for combining dense vector search and sparse BM25 keyword search."""

    @abstractmethod
    def hybrid_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        pass
