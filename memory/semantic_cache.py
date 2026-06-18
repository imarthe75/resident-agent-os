"""Semantic cache using Valkey/Redis for query deduplication."""

import json
import logging
import os
from typing import Optional

import numpy as np
import redis
import redis.exceptions

logger = logging.getLogger(__name__)


class SemanticCache:
    """
    Caché semántica local utilizando Valkey/Redis para almacenar respuestas de LLMs.
    Compara las consultas nuevas contra las previas utilizando similitud de coseno sobre embeddings.
    """

    def __init__(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        threshold: float = 0.90,
    ) -> None:
        if host is None:
            host = os.getenv("VALKEY_HOST", "localhost")
        if port is None:
            port = int(os.getenv("VALKEY_PORT", "6379"))

        try:
            self.client = redis.Redis(
                host=host,
                port=port,
                decode_responses=True,
                socket_connect_timeout=2,
                retry_on_timeout=True,
            )
            self.client.ping()
        except redis.exceptions.ConnectionError as e:
            logger.error(f"Failed to connect to Valkey: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error connecting to Valkey: {e}")
            raise

        self.threshold = threshold

    def _cosine_similarity(self, a: list, b: list) -> float:
        """Compute cosine similarity between two vectors."""
        a_norm = np.linalg.norm(a)
        b_norm = np.linalg.norm(b)
        denom = a_norm * b_norm
        if denom == 0.0:
            return 0.0
        return float(np.dot(a, b) / denom)

    def set(self, query_text: str, query_embedding: list, response_text: str) -> None:
        """
        Almacena una consulta, su embedding y la respuesta generada.
        """
        try:
            cache_key = f"cache:query:{hash(query_text)}"
            payload = {
                "query": query_text,
                "embedding": json.dumps(query_embedding),
                "response": response_text,
            }
            self.client.hset(cache_key, mapping=payload)
            self.client.sadd("cache:keys", cache_key)
            logger.debug(f"Cached query: {query_text[:50]}...")
        except redis.exceptions.ConnectionError as e:
            logger.warning(f"Failed to set cache entry: {e}")
        except Exception as e:
            logger.error(f"Unexpected error setting cache: {e}")

    def get(self, query_embedding: list) -> Optional[str]:
        """
        Busca si existe alguna consulta previa en la caché con similitud semántica
        mayor o igual al threshold establecido.
        """
        try:
            keys = self.client.smembers("cache:keys")
            best_similarity = -1.0
            best_response = None

            for key in keys:
                cache_data = self.client.hgetall(key)
                if not cache_data:
                    continue

                try:
                    cached_embedding = json.loads(cache_data["embedding"])
                    similarity = self._cosine_similarity(query_embedding, cached_embedding)

                    if similarity > best_similarity:
                        best_similarity = similarity
                        best_response = cache_data["response"]
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning(f"Failed to parse cached embedding: {e}")
                    continue

            if best_similarity >= self.threshold:
                logger.info(
                    f"Semantic cache HIT with similarity {best_similarity:.4f}"
                )
                return best_response

            logger.debug(f"Semantic cache MISS, best similarity {best_similarity:.4f}")
            return None
        except redis.exceptions.ConnectionError as e:
            logger.warning(f"Failed to get cache entry: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting cache: {e}")
            return None

    def ping(self) -> bool:
        """Health check: verify connection to Valkey."""
        try:
            self.client.ping()
            return True
        except Exception as e:
            logger.warning(f"Valkey ping failed: {e}")
            return False
