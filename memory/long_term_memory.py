"""Long-term semantic memory with PostgreSQL + pgvector."""

import json
import logging
import os
from contextlib import contextmanager
from typing import Any, Iterator, Optional

import psycopg2
import psycopg2.extensions
import psycopg2.pool

logger = logging.getLogger(__name__)


def _build_dsn() -> str:
    """Build PostgreSQL DSN from environment variables."""
    return (
        f"dbname={os.getenv('POSTGRES_DB', 'db_resident_knowledge')} "
        f"user={os.getenv('POSTGRES_USER', 'admin')} "
        f"password={os.getenv('POSTGRES_PASSWORD', '')} "
        f"host={os.getenv('POSTGRES_HOST', 'localhost')} "
        f"port={os.getenv('POSTGRES_PORT', '5432')}"
    )


EMBEDDING_DIM = 1536
EVIDENCE_LEVELS = ("CIERTO", "PROBABLE", "HIPOTESIS")      # strongest first


def validate_evidence_level(level: str) -> str:
    from agent.exceptions import AgentMemoryError
    lv = (level or "").upper()
    if lv not in EVIDENCE_LEVELS:
        raise AgentMemoryError(f"evidence_level must be one of {EVIDENCE_LEVELS}, got {level!r}")
    return lv


def validate_embedding(embedding) -> None:
    """A memory without a real vector would be searched as if it meant something. Refuse it instead of inventing one."""
    from agent.exceptions import AgentMemoryError
    if embedding is None:
        raise AgentMemoryError("embedding required: refusing to store a memory without a real vector")
    if len(embedding) != EMBEDDING_DIM:
        raise AgentMemoryError(f"embedding has {len(embedding)} dimensions, expected {EMBEDDING_DIM}")
    if not any(embedding):
        raise AgentMemoryError("all-zero embedding refused: it carries no meaning and would pollute similarity search")


class LongTermMemory:
    """
    Motor de memoria a largo plazo basado en PostgreSQL con soporte pgvector local.
    Almacena reflexiones, decisiones y aprendizajes conceptuales del agente residente.
    Usa connection pooling y context managers para gestión de recursos.
    """

    def __init__(self, dsn: Optional[str] = None) -> None:
        if dsn is None:
            dsn = _build_dsn()
        try:
            self._pool = psycopg2.pool.ThreadedConnectionPool(
                minconn=1, maxconn=5, dsn=dsn
            )
        except psycopg2.OperationalError as e:
            logger.error(f"Failed to connect to PostgreSQL: {e}")
            raise

    @contextmanager
    def _get_conn(self) -> Iterator[psycopg2.extensions.connection]:
        """Context manager for connection pooling."""
        conn = self._pool.getconn()
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            self._pool.putconn(conn)

    def ping(self) -> bool:
        """Health check: verify connection to PostgreSQL."""
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute("SELECT 1")
            return True
        except Exception as e:
            logger.warning(f"PostgreSQL ping failed: {e}")
            return False

    def schema_ready(self) -> bool:
        """Check if memory schema and tables exist."""
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT EXISTS (
                            SELECT 1 FROM information_schema.tables
                            WHERE table_schema = 'memory' AND table_name = 'agent_memory'
                        )
                        """
                    )
                    return cur.fetchone()[0]
        except Exception as e:
            logger.warning(f"Schema readiness check failed: {e}")
            return False

    def store_lesson(self, content: str, embedding: list) -> None:
        """
        Guarda una lección aprendida en la tabla memory.lessons.
        Compatibilidad backwards con código existente.
        """
        validate_embedding(embedding)
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "INSERT INTO memory.lessons (content, embedding) VALUES (%s, %s)",
                        (content, embedding),
                    )
            logger.info("Lesson stored in long-term memory")
        except psycopg2.Error as e:
            logger.error(f"Failed to store lesson: {e}")
            raise

    def search_lessons(self, query_embedding: list, limit: int = 3) -> list:
        """
        Busca las lecciones más similares a la lección o consulta provista
        usando distancia de coseno en pgvector.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        SELECT content, 1 - (embedding <=> %s::vector) AS similarity
                        FROM memory.lessons
                        ORDER BY embedding <=> %s::vector
                        LIMIT %s
                        """,
                        (query_embedding, query_embedding, limit),
                    )
                    return cur.fetchall()
        except psycopg2.Error as e:
            logger.error(f"Failed to search lessons: {e}")
            return []

    def store_memory(
        self,
        content: str,
        embedding: list,
        session_id: str,
        memory_type: str = "lesson",
        importance_score: float = 0.5,
        metadata: Optional[dict] = None,
        evidence_level: str = "HIPOTESIS",
    ) -> None:
        """
        Guarda contenido en la tabla memory.agent_memory con metadatos.
        """
        validate_embedding(embedding)
        evidence_level = validate_evidence_level(evidence_level)
        if metadata is None:
            metadata = {}
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO memory.agent_memory
                            (session_id, content, embedding, memory_type, importance_score, metadata, evidence_level)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """,
                        (
                            session_id,
                            content,
                            embedding,
                            memory_type,
                            importance_score,
                            json.dumps(metadata),
                            evidence_level,
                        ),
                    )
            logger.info(f"Memory stored: {memory_type}")
        except psycopg2.Error as e:
            logger.error(f"Failed to store memory: {e}")
            raise

    def search_memory(
        self,
        embedding: list,
        limit: int = 3,
        memory_type_filter: Optional[str] = None,
        min_evidence: Optional[str] = None,
    ) -> list:
        """
        Busca en memory.agent_memory usando HNSW cosine distance. Filtros opcionales: memory_type y `min_evidence`
        (p. ej. "PROBABLE" excluye las HIPOTESIS: una hipótesis no debe recuperarse como si fuera un hecho).
        Cada fila: (content, memory_type, importance_score, similarity, evidence_level).
        """
        where, params = [], []
        if memory_type_filter:
            where.append("memory_type = %s")
            params.append(memory_type_filter)
        if min_evidence:
            allowed = EVIDENCE_LEVELS[: EVIDENCE_LEVELS.index(validate_evidence_level(min_evidence)) + 1]
            where.append("evidence_level = ANY(%s)")
            params.append(list(allowed))
        sql = ("SELECT content, memory_type, importance_score, 1 - (embedding <=> %s::vector) AS similarity, evidence_level "
               "FROM memory.agent_memory" + (" WHERE " + " AND ".join(where) if where else "") +
               " ORDER BY embedding <=> %s::vector LIMIT %s")
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(sql, (embedding, *params, embedding, limit))
                    return cur.fetchall()
        except psycopg2.Error as e:
            logger.error("Failed to search memory: %s", e, exc_info=True)
            return []

    def close(self) -> None:
        """Close all pooled connections."""
        try:
            self._pool.closeall()
            logger.info("PostgreSQL connection pool closed")
        except Exception as e:
            logger.error(f"Error closing connection pool: {e}")


Base_Memory = LongTermMemory
