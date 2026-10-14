"""LongTermMemory refuses fabricated embeddings (checked before any database is touched), and the loop never invents one."""
import unittest
from unittest import mock

from agent.exceptions import AgentMemoryError
from agent.loop import ResidentAgentLoop
from memory.long_term_memory import EMBEDDING_DIM, validate_embedding


class TestValidate(unittest.TestCase):
    def test_none_wrong_size_and_zero_vector_are_refused(self):
        for bad in (None, [], [0.1] * 10, [0.0] * EMBEDDING_DIM):
            with self.assertRaises(AgentMemoryError, msg=repr(bad)[:30]):
                validate_embedding(bad)

    def test_real_vector_passes(self):
        validate_embedding([0.0] * (EMBEDDING_DIM - 1) + [1.0])


class TestLoopStoreMemory(unittest.TestCase):
    def test_loop_does_not_fabricate_an_embedding(self):
        loop = ResidentAgentLoop()
        loop._ltm = mock.Mock()                   # stand-in store: the point is that it is never called with a made-up vector
        with self.assertRaises(AgentMemoryError):
            loop.store_memory("lección", embedding=None)
        loop._ltm.store_memory.assert_not_called()


if __name__ == "__main__":
    unittest.main()
