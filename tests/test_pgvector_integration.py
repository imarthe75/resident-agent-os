"""Real PostgreSQL + pgvector integration tests for sql/agent_memory.sql and LongTermMemory.

Guarded strictly by `ROS_TEST_PG_DSN` (a dedicated disposable test DB — NEVER point to a production database).
Skipped honestly when `ROS_TEST_PG_DSN` is not set.
"""

import os
import unittest
import uuid
from pathlib import Path

import psycopg2

from memory.long_term_memory import EMBEDDING_DIM, LongTermMemory

ROOT = Path(__file__).resolve().parents[1]
SCHEMA_SQL = ROOT / "sql" / "agent_memory.sql"
TEST_DSN = os.getenv("ROS_TEST_PG_DSN")


@unittest.skipUnless(TEST_DSN, "set ROS_TEST_PG_DSN to a disposable pgvector test DB to run real PG integration tests")
class TestPgVectorIntegration(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        sql = SCHEMA_SQL.read_text(encoding="utf-8")
        conn = psycopg2.connect(TEST_DSN)
        conn.autocommit = True
        try:
            with conn.cursor() as cur:
                # Apply twice to verify full idempotency of sql/agent_memory.sql.
                cur.execute(sql)
                cur.execute(sql)
        finally:
            conn.close()

    def setUp(self):
        self.ltm = LongTermMemory(dsn=TEST_DSN)
        self.addCleanup(self.ltm.close)
        self.session_id = str(uuid.uuid4())
        self.addCleanup(self._cleanup_session)

    def _cleanup_session(self):
        conn = psycopg2.connect(TEST_DSN)
        try:
            with conn.cursor() as cur:
                cur.execute("DELETE FROM memory.agent_memory WHERE session_id = %s", (self.session_id,))
                cur.execute("DELETE FROM memory.session_summaries WHERE session_id = %s", (self.session_id,))
            conn.commit()
        finally:
            conn.close()

    def test_ping_schema_ready_and_evidence_filtered_vector_search(self):
        self.assertTrue(self.ltm.ping())
        self.assertTrue(self.ltm.schema_ready())

        vec_a = [0.0] * EMBEDDING_DIM
        vec_a[0] = 1.0
        vec_b = [0.0] * EMBEDDING_DIM
        vec_b[0] = 0.99
        vec_b[1] = 0.14

        self.ltm.store_memory(
            content="Verified fix: use UUIDv7 PKs on PostgreSQL 18",
            embedding=vec_a,
            session_id=self.session_id,
            memory_type="decision",
            importance_score=0.9,
            evidence_level="CIERTO",
            project_id="proj-alpha",
        )
        self.ltm.store_memory(
            content="Other project verified decision",
            embedding=vec_a,
            session_id=self.session_id,
            memory_type="decision",
            importance_score=0.9,
            evidence_level="CIERTO",
            project_id="proj-beta",
        )
        self.ltm.store_memory(
            content="Unverified hypothesis about cache TTL",
            embedding=vec_b,
            session_id=self.session_id,
            memory_type="lesson",
            importance_score=0.4,
            evidence_level="HIPOTESIS",
            project_id="proj-alpha",
        )

        # min_evidence="PROBABLE" + project_id="proj-alpha" must return only proj-alpha CIERTO.
        filtered = self.ltm.search_memory(vec_a, limit=10, min_evidence="PROBABLE", project_id="proj-alpha")
        contents = [row[0] for row in filtered]
        self.assertIn("Verified fix: use UUIDv7 PKs on PostgreSQL 18", contents)
        self.assertNotIn("Unverified hypothesis about cache TTL", contents)
        self.assertNotIn("Other project verified decision", contents)

        listed = self.ltm.list_memories(project_id="proj-alpha", limit=10)
        self.assertTrue(all(row["project_id"] == "proj-alpha" for row in listed))

        # session_summaries table exists and accepts real JSONB metrics + project_id.
        conn = psycopg2.connect(TEST_DSN)
        try:
            with conn.cursor() as cur:
                cur.execute(
                    "INSERT INTO memory.session_summaries (project_id, session_id, summary, metrics) "
                    "VALUES (%s, %s, %s, %s::jsonb) RETURNING id",
                    ("proj-alpha", self.session_id, "Integration test summary", '{"errors": 0, "tokens_saved_est": 120}'),
                )
                row = cur.fetchone()
                self.assertIsNotNone(row)
            conn.commit()
        finally:
            conn.close()
        summaries = self.ltm.list_session_summaries(project_id="proj-alpha", limit=5)
        self.assertGreaterEqual(len(summaries), 1)


if __name__ == "__main__":
    unittest.main()
