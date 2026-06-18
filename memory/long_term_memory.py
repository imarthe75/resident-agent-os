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
    ) -> None:
        """
        Guarda contenido en la tabla memory.agent_memory con metadatos.
        """
        if metadata is None:
            metadata = {}
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO memory.agent_memory
                            (session_id, content, embedding, memory_type, importance_score, metadata)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            session_id,
                            content,
                            embedding,
                            memory_type,
                            importance_score,
                            json.dumps(metadata),
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
    ) -> list:
        """
        Busca en memory.agent_memory usando HNSW cosine distance.
        Opcionalmente filtra por memory_type.
        """
        try:
            with self._get_conn() as conn:
                with conn.cursor() as cur:
                    if memory_type_filter:
                        cur.execute(
                            """
                            SELECT content, memory_type, importance_score,
                                   1 - (embedding <=> %s::vector) AS similarity
                            FROM memory.agent_memory
                            WHERE memory_type = %s
                            ORDER BY embedding <=> %s::vector
                            LIMIT %s
                            """,
                            (embedding, memory_type_filter, embedding, limit),
                        )
                    else:
                        cur.execute(
                            """
                            SELECT content, memory_type, importance_score,
                                   1 - (embedding <=> %s::vector) AS similarity
                            FROM memory.agent_memory
                            ORDER BY embedding <=> %s::vector
                            LIMIT %s
                            """,
                            (embedding, embedding, limit),
                        )
                    return cur.fetchall()
        except psycopg2.Error as e:
            logger.error(f"Failed to search memory: {e}")
            return []

    def close(self) -> None:
        """Close all pooled connections."""
        try:
            self._pool.closeall()
            logger.info("PostgreSQL connection pool closed")
        except Exception as e:
            logger.error(f"Error closing connection pool: {e}")


Base_Memory = LongTermMemory
