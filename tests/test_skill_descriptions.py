"""Skill descriptions are loaded into every request: each must fit the Agent Skills limit of 1024 characters.
Idea from Chisle's tool/skill weight report."""
import re
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[1] / "skills"


def test_each_skill_description_fits_the_limit():
    too_long = []
    for f in sorted(SKILLS.glob("*/SKILL.md")):
        m = re.match(r"---\n(.*?)\n---", f.read_text(errors="ignore"), re.S)
        assert m, f"{f} has no frontmatter"
        d = re.search(r"^description:\s*(?:[>|]-?)?\s*(.*?)(?=^\S[\w-]*:|\Z)", m.group(1), re.S | re.M)
        assert d, f"{f} has no description"
        if len(" ".join(d.group(1).split())) > 1024:
            too_long.append(f.parent.name)
    assert too_long == []


def test_frontmatter_follows_the_agent_skills_format():
    """agentskills.io (validator from anthropics/skills skill-creator): strict YAML, `name` kebab-case <= 64 chars equal to its folder,
    `description` without angle brackets. An unquoted «texto: más texto» description is invalid YAML and a strict loader skips the skill."""
    import yaml
    bad = []
    for f in sorted(SKILLS.glob("*/SKILL.md")):
        m = re.match(r"---\n(.*?)\n---", f.read_text(errors="ignore"), re.S)
        try:
            fm = yaml.safe_load(m.group(1)) if m else None
        except yaml.YAMLError:
            bad.append(f"{f.parent.name}: invalid YAML")
            continue
        if not isinstance(fm, dict):
            bad.append(f"{f.parent.name}: no frontmatter")
            continue
        name, desc = str(fm.get("name", "")), str(fm.get("description", ""))
        if name != f.parent.name or not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", name) or len(name) > 64:
            bad.append(f"{f.parent.name}: name {name!r}")
        if not desc.strip() or "<" in desc or ">" in desc:
            bad.append(f"{f.parent.name}: description")
    assert bad == []
