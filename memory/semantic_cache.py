"""Response cache on Valkey/Redis.

Two lookups, and they are NOT interchangeable:
  * get_exact(query_text)  -> same normalised question => same stored answer. Safe for decisions.
  * get(embedding)         -> the answer of the most SIMILAR earlier question (cosine >= threshold). A near-duplicate question can have a
                              different right answer, so this is opt-in: callers that did not ask for it explicitly (allow_semantic) get None.

Keys are sha256 of the normalised text. (They used to be Python's hash(), which is randomised per process: after a restart every entry was
orphaned and re-created.) The index is bounded (MAX_ENTRIES, oldest evicted) and every entry expires (TTL), so a semantic lookup scans a
bounded set instead of every key ever written.
"""
import hashlib
import json
import logging
import os
import re
import time
from typing import Optional

import numpy as np
import redis
import redis.exceptions

logger = logging.getLogger(__name__)

KEY_PREFIX = "cache:query:"
INDEX_KEY = "cache:index"          # sorted set: member = cache key, score = unix time written
MAX_ENTRIES = int(os.getenv("SEMANTIC_CACHE_MAX_ENTRIES", "2000"))
TTL_SECONDS = int(os.getenv("SEMANTIC_CACHE_TTL_SECONDS", str(7 * 24 * 3600)))


def normalize_query(text: str) -> str:
    return re.sub(r"\s+", " ", (text or "").strip()).lower()


def cache_key(query_text: str) -> str:
    return KEY_PREFIX + hashlib.sha256(normalize_query(query_text).encode("utf-8")).hexdigest()


class SemanticCache:
    def __init__(self, host: Optional[str] = None, port: Optional[int] = None, threshold: float = 0.90) -> None:
        host = host or os.getenv("VALKEY_HOST", "localhost")
        port = port if port is not None else int(os.getenv("VALKEY_PORT", "6379"))
        try:
            self.client = redis.Redis(host=host, port=port, decode_responses=True, socket_connect_timeout=2, retry_on_timeout=True)
            self.client.ping()
        except redis.exceptions.ConnectionError as e:
            logger.error("Failed to connect to Valkey: %s", e)
            raise
        except Exception as e:
            logger.error("Unexpected error connecting to Valkey: %s", e, exc_info=True)
            raise
        self.threshold = threshold

    @staticmethod
    def _cosine_similarity(a: list, b: list) -> float:
        denom = float(np.linalg.norm(a)) * float(np.linalg.norm(b))
        return 0.0 if denom == 0.0 else float(np.dot(a, b) / denom)

    def set(self, query_text: str, query_embedding: Optional[list], response_text: str) -> None:
        """Store an answer. The embedding is optional (an exact-only entry is valid); a zero vector is refused, never stored as if it meant something."""
        if query_embedding is not None and not any(query_embedding):
            logger.warning("SemanticCache.set: all-zero embedding ignored (entry stored for exact lookup only)")
            query_embedding = None
        key = cache_key(query_text)
        try:
            payload = {"query": normalize_query(query_text), "response": response_text}
            if query_embedding is not None:
                payload["embedding"] = json.dumps(list(query_embedding))
            pipe = self.client.pipeline()
            pipe.hset(key, mapping=payload)
            pipe.expire(key, TTL_SECONDS)
            pipe.zadd(INDEX_KEY, {key: time.time()})
            pipe.execute()
            self._evict_overflow()
        except redis.exceptions.ConnectionError as e:
            logger.warning("Failed to set cache entry: %s", e)
        except Exception as e:
            logger.error("Unexpected error setting cache: %s", e, exc_info=True)

    def _evict_overflow(self) -> None:
        """Keep only the newest MAX_ENTRIES: the evicted entries are DELETED, not just forgotten by the index (otherwise storage grows until TTL)."""
        overflow = int(self.client.zcard(INDEX_KEY)) - MAX_ENTRIES
        if overflow > 0:
            old = self.client.zrange(INDEX_KEY, 0, overflow - 1)
            if old:
                self.client.delete(*old)
                self.client.zrem(INDEX_KEY, *old)

    def get_exact(self, query_text: str) -> Optional[str]:
        try:
            val = self.client.hget(cache_key(query_text), "response")
            if val is not None:
                logger.info("Semantic cache EXACT hit")
            return val
        except redis.exceptions.ConnectionError as e:
            logger.warning("Failed to get cache entry: %s", e)
            return None
        except Exception as e:
            logger.error("Unexpected error getting cache: %s", e, exc_info=True)
            return None

    def get(self, query_embedding: list, allow_semantic: bool = True) -> Optional[str]:
        """Most similar earlier answer with cosine >= threshold. Pass allow_semantic=False to make this a no-op (the loop does by default)."""
        if not allow_semantic or query_embedding is None or not any(query_embedding):
            return None
        try:
            best_sim, best = -1.0, None
            for key in self.client.zrevrange(INDEX_KEY, 0, MAX_ENTRIES - 1):
                data = self.client.hgetall(key)
                if not data:                                              # expired: drop the dangling index member
                    self.client.zrem(INDEX_KEY, key)
                    continue
                if "embedding" not in data:
                    continue
                try:
                    sim = self._cosine_similarity(query_embedding, json.loads(data["embedding"]))
                except (json.JSONDecodeError, ValueError) as e:
                    logger.warning("Unparseable cached embedding for %s: %s", key, e)
                    continue
                if sim > best_sim:
                    best_sim, best = sim, data["response"]
            if best_sim >= self.threshold:
                logger.info("Semantic cache SEMANTIC hit (similarity %.4f)", best_sim)
                return best
            logger.debug("Semantic cache MISS (best similarity %.4f)", best_sim)
            return None
        except redis.exceptions.ConnectionError as e:
            logger.warning("Failed to get cache entry: %s", e)
            return None
        except Exception as e:
            logger.error("Unexpected error getting cache: %s", e, exc_info=True)
            return None

    def size(self) -> int:
        return int(self.client.zcard(INDEX_KEY))

    def ping(self) -> bool:
        try:
            self.client.ping()
            return True
        except Exception as e:
            logger.warning("Valkey ping failed: %s", e)
            return False
