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
