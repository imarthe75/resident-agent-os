"""Tests for deterministic SSOT host sync (scripts/sync_agent_dirs.py + ros sync-hosts)."""

import tempfile
import unittest
from pathlib import Path

from scripts.sync_agent_dirs import render_claude_agent, sync_hosts

ROOT = Path(__file__).resolve().parents[1]


class TestSyncHosts(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.repo = Path(self.tmp.name)

        # Seed canonical SSOT directories
        (self.repo / "agents").mkdir()
        (self.repo / "agents" / "general-purpose.md").write_text(
            "---\nname: general-purpose\ndescription: Fast helper\ntools: \"*\"\ntier: fast\n---\n\n# Body\n",
            encoding="utf-8",
        )
        (self.repo / "agents" / "security-reviewer.md").write_text(
            "---\nname: security-reviewer\ndescription: Security auditor\ntools: Read, Grep\n---\n\n# Security\n",
            encoding="utf-8",
        )
        # Non-markdown file in agents/ (e.g. Python runtime like agent_harness.py) must be ignored
        (self.repo / "agents" / "agent_harness.py").write_text("VALUE = 1\n", encoding="utf-8")

        (self.repo / "commands").mkdir()
        (self.repo / "commands" / "review.md").write_text("# Review command\n", encoding="utf-8")

        (self.repo / ".agents" / "skills" / "demo-skill").mkdir(parents=True)
        (self.repo / ".agents" / "skills" / "demo-skill" / "SKILL.md").write_text(
            "---\nname: demo-skill\ndescription: Demo\n---\n\n# Demo\n",
            encoding="utf-8",
        )
        # Unmanaged Claude local settings must never be touched
        (self.repo / ".claude").mkdir()
        (self.repo / ".claude" / "settings.local.json").write_text('{"local": true}\n', encoding="utf-8")

    def test_copy_sync_injects_claude_models_and_detects_drift(self):
        # Before sync: check fails with missing entries
        pre = sync_hosts(self.repo, mode="copy", check=True)
        self.assertFalse(pre["in_sync"])
        self.assertIn(".claude/agents/general-purpose.md", pre["missing"])
        self.assertIn(".claude/agents/security-reviewer.md", pre["missing"])
        self.assertIn(".claude/commands/review.md", pre["missing"])
        self.assertIn(".claude/skills/demo-skill/SKILL.md", pre["missing"])

        # Perform sync
        res = sync_hosts(self.repo, mode="copy", check=False)
        self.assertTrue(res["in_sync"])
        self.assertEqual(res["agent_models"]["general-purpose"], "haiku")
        self.assertEqual(res["agent_models"]["security-reviewer"], "opus")
        self.assertFalse((self.repo / ".claude" / "agents" / "agent_harness.py").exists())
        self.assertEqual(
            (self.repo / ".claude" / "settings.local.json").read_text(encoding="utf-8"),
            '{"local": true}\n',
        )

        # Rendered .claude/agents/general-purpose.md has model: haiku and no tier:
        gp_text = (self.repo / ".claude" / "agents" / "general-purpose.md").read_text(encoding="utf-8")
        self.assertIn("model: haiku", gp_text)
        self.assertNotIn("tier:", gp_text)
        # Canonical agents/general-purpose.md remains provider-neutral
        canon_text = (self.repo / "agents" / "general-purpose.md").read_text(encoding="utf-8")
        self.assertIn("tier: fast", canon_text)
        self.assertNotIn("model:", canon_text)

        # Immediate re-check is clean
        clean = sync_hosts(self.repo, mode="copy", check=True)
        self.assertTrue(clean["in_sync"])
        self.assertEqual(clean["drifted"], [])
        self.assertEqual(clean["missing"], [])

        # Editing a projected file manually triggers drift detection
        (self.repo / ".claude" / "skills" / "demo-skill" / "SKILL.md").write_text("drifted\n", encoding="utf-8")
        drifted = sync_hosts(self.repo, mode="copy", check=True)
        self.assertFalse(drifted["in_sync"])
        self.assertIn(".claude/skills/demo-skill/SKILL.md", drifted["drifted"])

        # Re-sync repairs the drift
        repaired = sync_hosts(self.repo, mode="copy", check=False)
        self.assertTrue(repaired["in_sync"])
        self.assertIn(".claude/skills/demo-skill/SKILL.md", repaired["updated"])

    def test_symlink_mode_links_commands_and_skills_while_rendering_agents(self):
        res = sync_hosts(self.repo, mode="symlink", check=False)
        self.assertTrue(res["in_sync"])
        self.assertTrue((self.repo / ".claude" / "commands" / "review.md").is_symlink())
        self.assertTrue((self.repo / ".claude" / "skills" / "demo-skill").is_symlink())
        # Agents are always rendered real files because model: is injected
        self.assertFalse((self.repo / ".claude" / "agents" / "general-purpose.md").is_symlink())
        self.assertIn("model: haiku", (self.repo / ".claude" / "agents" / "general-purpose.md").read_text(encoding="utf-8"))

        check = sync_hosts(self.repo, mode="symlink", check=True)
        self.assertTrue(check["in_sync"])

    def test_render_claude_agent_custom_unlisted_tier(self):
        rendered, model = render_claude_agent(
            "---\nname: custom-helper\ndescription: Custom\ntier: reasoning\n---\n\n# Hi\n",
            "custom-helper",
            ROOT,
        )
        self.assertEqual(model, "opus")
        self.assertIn("model: opus", rendered)
        self.assertNotIn("tier:", rendered)


if __name__ == "__main__":
    unittest.main()
