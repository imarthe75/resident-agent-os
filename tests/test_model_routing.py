"""Tests for provider-agnostic model routing (.agent/model-routing.json + agent/model_routing.py)."""

import json
import os
import tempfile
import unittest
from pathlib import Path

from agent.model_routing import list_agent_routing, resolve_model

ROOT = Path(__file__).resolve().parents[1]


class TestModelRouting(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)

    def test_all_seven_canonical_agents_route_across_providers(self):
        table = list_agent_routing(repo_root=ROOT)
        names = {row["agent"] for row in table["agents"]}
        self.assertEqual(
            names,
            {
                "adversarial-reviewer",
                "architect",
                "code-reviewer",
                "debugger",
                "general-purpose",
                "planner",
                "security-reviewer",
            },
        )

        gp_claude = resolve_model(agent_name="general-purpose", provider="claude", repo_root=ROOT)
        self.assertEqual(gp_claude["tier"], "fast")
        self.assertEqual(gp_claude["model"], "haiku")
        self.assertEqual(gp_claude["escalate_to"], "balanced")

        gp_agy = resolve_model(agent_name="general-purpose", provider="antigravity", repo_root=ROOT)
        self.assertEqual(gp_agy["model"], "flash")

        gp_gemini = resolve_model(agent_name="general-purpose", provider="gemini", repo_root=ROOT)
        self.assertEqual(gp_gemini["model"], "gemini-2.5-flash")

        sec_claude = resolve_model(agent_name="security-reviewer", provider="claude", repo_root=ROOT)
        self.assertEqual(sec_claude["tier"], "reasoning")
        self.assertEqual(sec_claude["model"], "opus")

        sec_codex = resolve_model(agent_name="security-reviewer", provider="codex", repo_root=ROOT)
        self.assertEqual(sec_codex["model"], "o3")

    def test_task_promotes_fast_agent_without_downgrading_reasoning_agent(self):
        promoted = resolve_model(
            agent_name="general-purpose",
            task="business-logic",
            provider="claude",
            repo_root=ROOT,
        )
        self.assertEqual(promoted["tier"], "balanced")
        self.assertEqual(promoted["selection_source"], "task_promotion")
        self.assertEqual(promoted["model"], "sonnet")

        promoted_sec = resolve_model(
            agent_name="general-purpose",
            task="security",
            provider="antigravity",
            repo_root=ROOT,
        )
        self.assertEqual(promoted_sec["tier"], "reasoning")
        self.assertEqual(promoted_sec["model"], "pro")

        # Reasoning reviewer stays reasoning even if task is mechanical/docs
        protected = resolve_model(
            agent_name="adversarial-reviewer",
            task="docs",
            provider="claude",
            repo_root=ROOT,
        )
        self.assertEqual(protected["tier"], "reasoning")
        self.assertEqual(protected["model"], "opus")

        # Explicit tier always overrides
        forced = resolve_model(
            agent_name="adversarial-reviewer",
            tier="fast",
            provider="claude",
            repo_root=ROOT,
        )
        self.assertEqual(forced["tier"], "fast")
        self.assertEqual(forced["selection_source"], "explicit_tier")
        self.assertEqual(forced["model"], "haiku")

    def test_project_local_override_and_env_override(self):
        local_cfg = self.repo / ".agent" / "model-routing.json"
        local_cfg.parent.mkdir(parents=True, exist_ok=True)
        local_cfg.write_text(
            json.dumps({
                "schema_version": 1,
                "default_tier": "balanced",
                "tiers": {
                    "fast": {"providers": {"claude": "haiku-custom", "ollama": "llama3.2:3b"}},
                    "balanced": {"providers": {"claude": "sonnet-custom", "ollama": "qwen2.5:14b"}},
                    "reasoning": {"providers": {"claude": "opus-custom", "ollama": "deepseek-r1:32b"}},
                },
                "agents": {"general-purpose": {"tier": "fast"}},
            }),
            encoding="utf-8",
        )

        res = resolve_model(agent_name="general-purpose", provider="ollama", repo_root=self.repo)
        self.assertEqual(res["model"], "llama3.2:3b")
        self.assertEqual(Path(res["config_path"]), local_cfg.resolve())

        old_env = os.environ.get("ROS_MODEL_OLLAMA_FAST")
        os.environ["ROS_MODEL_OLLAMA_FAST"] = "qwen3:4b"
        try:
            res_env = resolve_model(agent_name="general-purpose", provider="ollama", repo_root=self.repo)
            self.assertEqual(res_env["model"], "qwen3:4b")
            self.assertIn("ROS_MODEL_OLLAMA_FAST", res_env["env_overrides"])
        finally:
            if old_env is None:
                os.environ.pop("ROS_MODEL_OLLAMA_FAST", None)
            else:
                os.environ["ROS_MODEL_OLLAMA_FAST"] = old_env

    def test_invalid_provider_or_tier_raises_value_error(self):
        with self.assertRaises(ValueError):
            resolve_model(agent_name="general-purpose", provider="unknown-provider", repo_root=ROOT)
        with self.assertRaises(ValueError):
            resolve_model(tier="ultra-mega", provider="claude", repo_root=ROOT)


if __name__ == "__main__":
    unittest.main()
