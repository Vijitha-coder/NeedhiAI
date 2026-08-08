"""
Modular Vector Store with ChromaDB fallback to in-memory
"""
import os
import math
from typing import List, Dict, Any, Optional
from app.config import settings
from app.services.embeddings.embeddings import get_embedder_instance

class BaseVectorStore:
    def add(self, ids: List[str], texts: List[str], metadatas: List[Dict], embeddings: Optional[List[List[float]]] = None):
        raise NotImplementedError

    def query(self, query_text: str, n_results: int = 5, where: Optional[Dict] = None) -> List[Dict]:
        raise NotImplementedError

    def delete(self, ids: List[str]):
        raise NotImplementedError

class InMemoryVectorStore(BaseVectorStore):
    def __init__(self):
        self.store = {}  # id -> {text, metadata, embedding}
        self.embedder = get_embedder_instance()

    def add(self, ids: List[str], texts: List[str], metadatas: List[Dict], embeddings: Optional[List[List[float]]] = None):
        if embeddings is None:
            embeddings = self.embedder.embed(texts)

        for i, id in enumerate(ids):
            self.store[id] = {
                "text": texts[i],
                "metadata": metadatas[i] if i < len(metadatas) else {},
                "embedding": embeddings[i] if i < len(embeddings) else []
            }

    def _cosine_sim(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x*y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x*x for x in a))
        norm_b = math.sqrt(sum(x*x for x in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def query(self, query_text: str, n_results: int = 5, where: Optional[Dict] = None) -> List[Dict]:
        if not self.store:
            return []

        query_emb = self.embedder.embed_query(query_text)

        scored = []
        for id, item in self.store.items():
            # Filter by where if provided
            if where:
                match = True
                for k, v in where.items():
                    if item["metadata"].get(k) != v:
                        match = False
                        break
                if not match:
                    continue

            sim = self._cosine_sim(query_emb, item["embedding"])
            scored.append({
                "id": id,
                "text": item["text"],
                "metadata": item["metadata"],
                "distance": 1 - sim,
                "similarity": sim
            })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:n_results]

    def delete(self, ids: List[str]):
        for id in ids:
            self.store.pop(id, None)

class ChromaVectorStore(BaseVectorStore):
    def __init__(self, collection_name: str = "legal_knowledge", persist_path: str = None):
        self.collection_name = collection_name
        self.persist_path = persist_path or settings.VECTOR_DB_PATH
        self.embedder = get_embedder_instance()
        self._init_client()

    def _init_client(self):
        try:
            import chromadb
            from chromadb.config import Settings as ChromaSettings

            self.client = chromadb.PersistentClient(path=self.persist_path)
            # Use our custom embedding function wrapper
            self.collection = self.client.get_or_create_collection(name=self.collection_name)
            self.available = True
        except Exception as e:
            print(f"ChromaDB not available: {e}, using in-memory")
            self.available = False
            self.fallback = InMemoryVectorStore()

    def add(self, ids: List[str], texts: List[str], metadatas: List[Dict], embeddings: Optional[List[List[float]]] = None):
        if not self.available:
            return self.fallback.add(ids, texts, metadatas, embeddings)

        if embeddings is None:
            embeddings = self.embedder.embed(texts)

        try:
            self.collection.add(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)
        except Exception as e:
            print(f"Chroma add failed: {e}")
            # Try upsert
            try:
                self.collection.upsert(ids=ids, documents=texts, metadatas=metadatas, embeddings=embeddings)
            except Exception as e2:
                print(f"Chroma upsert failed too: {e2}")

    def query(self, query_text: str, n_results: int = 5, where: Optional[Dict] = None) -> List[Dict]:
        if not self.available:
            return self.fallback.query(query_text, n_results, where)

        try:
            query_emb = self.embedder.embed_query(query_text)
            results = self.collection.query(
                query_embeddings=[query_emb],
                n_results=n_results,
                where=where
            )

            output = []
            if results and results['ids']:
                for i in range(len(results['ids'][0])):
                    output.append({
                        "id": results['ids'][0][i],
                        "text": results['documents'][0][i] if results['documents'] else "",
                        "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                        "distance": results['distances'][0][i] if results['distances'] else 0,
                        "similarity": 1 - (results['distances'][0][i] if results['distances'] else 0)
                    })
            return output
        except Exception as e:
            print(f"Chroma query failed: {e}, fallback")
            return self.fallback.query(query_text, n_results, where)

    def delete(self, ids: List[str]):
        if not self.available:
            return self.fallback.delete(ids)
        try:
            self.collection.delete(ids=ids)
        except Exception as e:
            print(f"Chroma delete failed: {e}")

def get_vector_store(collection_name: str = "legal_knowledge") -> BaseVectorStore:
    db_type = settings.VECTOR_DB_TYPE.lower()
    if db_type == "memory":
        return InMemoryVectorStore()
    elif db_type == "chroma":
        # Try chroma, fallback to memory if fails
        store = ChromaVectorStore(collection_name=collection_name)
        if not store.available:
            return store.fallback
        return store
    else:
        return InMemoryVectorStore()

# Global stores
_knowledge_store = None
_contract_store = None

def get_knowledge_store():
    global _knowledge_store
    if _knowledge_store is None:
        _knowledge_store = get_vector_store(collection_name="legal_knowledge")
    return _knowledge_store

def get_contract_store():
    global _contract_store
    if _contract_store is None:
        _contract_store = get_vector_store(collection_name="contract_chunks")
    return _contract_store
