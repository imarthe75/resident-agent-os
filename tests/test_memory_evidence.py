import tempfile
import unittest
from pathlib import Path

from agent.exceptions import AgentMemoryError
from memory import lesson_check as lc
from memory.long_term_memory import EMBEDDING_DIM, EVIDENCE_LEVELS, LongTermMemory, validate_evidence_level


class TestEvidenceLevel(unittest.TestCase):
    def test_levels(self):
        self.assertEqual(EVIDENCE_LEVELS, ("CIERTO", "PROBABLE", "HIPOTESIS"))
        self.assertEqual(validate_evidence_level("cierto"), "CIERTO")
        for bad in ("", None, "seguro", "TRUE"):
            with self.assertRaises(AgentMemoryError):
                validate_evidence_level(bad)

    def test_invalid_level_is_refused_before_any_database_access(self):
        ltm = LongTermMemory.__new__(LongTermMemory)             # no pool: if it tried to touch the DB it would raise AttributeError instead
        with self.assertRaises(AgentMemoryError):
            ltm.store_memory("x", [1.0] * EMBEDDING_DIM, "sid", evidence_level="seguro")
        with self.assertRaises(AgentMemoryError):
            ltm.search_memory([1.0] * EMBEDDING_DIM, min_evidence="seguro")


class TestLessonCheck(unittest.TestCase):
    def setUp(self):
        t = tempfile.TemporaryDirectory()
        self.addCleanup(t.cleanup)
        self.root = Path(t.name)
        (self.root / "core").mkdir()
        (self.root / "core" / "retry.py").write_text("def plan_tasks():\n    pass\n")

    def test_existing_references_are_not_dangling(self):
        self.assertEqual(lc.dangling_references("El error está en `core/retry.py`, función `plan_tasks()`.", self.root), [])

    def test_renamed_file_and_deleted_function_are_reported(self):
        out = lc.dangling_references("Arreglar `core/old_retry.py` y `missing_helper()` y `plan_tasks`", self.root)
        self.assertEqual(out, ["archivo: core/old_retry.py", "identificador: missing_helper"])

    def test_text_without_references_has_nothing_to_report(self):
        self.assertEqual(lc.dangling_references("Usar uuid7 en PG18 para PKs", self.root), [])


if __name__ == "__main__":
    unittest.main()
