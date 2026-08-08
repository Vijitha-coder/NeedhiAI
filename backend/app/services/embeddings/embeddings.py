"""
Modular embedding service with multiple providers and fallback
"""
import os
import math
from typing import List
import re
from app.config import settings

class BaseEmbedder:
    def embed(self, texts: List[str]) -> List[List[float]]:
        raise NotImplementedError

    def embed_query(self, text: str) -> List[float]:
        return self.embed([text])[0]

class TFIDFEmbedder(BaseEmbedder):
    """Lightweight TF-IDF based embedder - no external model needed, works offline"""
    def __init__(self, dim: int = 384):
        self.dim = dim
        self.vocab = {}
        self.idf = {}
        self._built = False

    def _tokenize(self, text: str) -> List[str]:
        text = text.lower()
        # Simple tokenization
        tokens = re.findall(r'\b\w+\b', text)
        # Filter very short tokens
        tokens = [t for t in tokens if len(t) > 2]
        return tokens

    def _hash_token(self, token: str) -> int:
        # Deterministic hash to dimension
        return hash(token) % self.dim

    def embed(self, texts: List[str]) -> List[List[float]]:
        embeddings = []
        for text in texts:
            tokens = self._tokenize(text)
            if not tokens:
                embeddings.append([0.0] * self.dim)
                continue

            vec = [0.0] * self.dim
            token_counts = {}
            for tok in tokens:
                token_counts[tok] = token_counts.get(tok, 0) + 1

            for token, count in token_counts.items():
                idx = self._hash_token(token)
                # TF * basic IDF approximation
                tf = count / len(tokens)
                vec[idx] += tf

            # L2 normalize
            norm = math.sqrt(sum(x*x for x in vec)) or 1.0
            vec = [x / norm for x in vec]
            embeddings.append(vec)

        return embeddings

class SentenceTransformerEmbedder(BaseEmbedder):
    def __init__(self, model_name: str = None):
        try:
            from sentence_transformers import SentenceTransformer
            model_name = model_name or settings.EMBEDDING_MODEL
            self.model = SentenceTransformer(model_name)
            self.available = True
        except Exception as e:
            print(f"SentenceTransformer not available: {e}")
            self.available = False
            self.fallback = TFIDFEmbedder()

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not self.available:
            return self.fallback.embed(texts)
        try:
            embeddings = self.model.encode(texts, normalize_embeddings=True)
            return embeddings.tolist()
        except Exception as e:
            print(f"ST embedding failed, fallback to TFIDF: {e}")
            return self.fallback.embed(texts)

class OpenAIEmbedder(BaseEmbedder):
    def __init__(self, model: str = None):
        self.model = model or settings.OPENAI_EMBEDDING_MODEL
        self.api_key = settings.LLM_API_KEY
        self.base_url = settings.LLM_BASE_URL
        self.available = bool(self.api_key)
        if not self.available:
            self.fallback = TFIDFEmbedder()

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not self.available:
            return self.fallback.embed(texts)
        try:
            from openai import OpenAI
            client = OpenAI(api_key=self.api_key, base_url=self.base_url)
            response = client.embeddings.create(input=texts, model=self.model)
            return [item.embedding for item in response.data]
        except Exception as e:
            print(f"OpenAI embedding failed: {e}, fallback")
            return self.fallback.embed(texts)

def get_embedder() -> BaseEmbedder:
    provider = settings.EMBEDDING_PROVIDER.lower()

    if provider == "openai":
        return OpenAIEmbedder()
    elif provider in ["sentence_transformer", "sbert"]:
        return SentenceTransformerEmbedder()
    elif provider == "local_tfidf":
        return TFIDFEmbedder()
    else:
        # Auto: try sentence transformer, then openai, then tfidf
        try:
            embedder = SentenceTransformerEmbedder()
            if embedder.available:
                return embedder
        except:
            pass

        if settings.LLM_API_KEY:
            return OpenAIEmbedder()

        return TFIDFEmbedder()

# Singleton
_embedder_instance = None

def get_embedder_instance() -> BaseEmbedder:
    global _embedder_instance
    if _embedder_instance is None:
        _embedder_instance = get_embedder()
    return _embedder_instance
