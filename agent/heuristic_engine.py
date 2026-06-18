"""Heuristic evaluation engine for context-driven decision making."""

import json
import logging
from pathlib import Path
from typing import Any

from agent.exceptions import HeuristicRuleError

logger = logging.getLogger(__name__)


class HeuristicEngine:
    """
    Loads and evaluates heuristic rules from heuristics.json.
    Returns ordered list of applicable actions based on context evaluation.
    """

    def __init__(self, rules_path: Path | str) -> None:
        """Load and sort rules by priority."""
        self.rules_path = Path(rules_path)
        self.rules = []

        if not self.rules_path.exists():
            logger.warning(f"Heuristics file not found: {self.rules_path}")
            return

        try:
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.rules = data.get("rules", [])
            self.rules.sort(key=lambda r: r.get("priority", 999))
            logger.info(f"Loaded {len(self.rules)} heuristic rules")
        except json.JSONDecodeError as e:
            raise HeuristicRuleError(f"Invalid JSON in {self.rules_path}: {e}") from e
        except OSError as e:
            raise HeuristicRuleError(f"Cannot read {self.rules_path}: {e}") from e

    def evaluate(self, context: dict[str, Any]) -> list[str]:
        """
        Evaluate all rules against the given context.
        Returns list of applicable action strings, ordered by priority.
        """
        actions = []
        for rule in self.rules:
            try:
                if self._eval_condition(rule.get("condition", {}), context):
                    action = rule.get("action")
                    if action:
                        actions.append(action)
                        logger.debug(
                            f"Rule {rule.get('id')} matched: {action}"
                        )
            except Exception as e:
                logger.error(f"Error evaluating rule {rule.get('id')}: {e}")
        return actions

    def _eval_condition(self, condition: dict, context: dict) -> bool:
        """
        Recursively evaluate a condition object.
        Supports operators: and, or, gte, lte, eq
        """
        if not condition:
            return True

        if "and" in condition:
            return all(
                self._eval_condition(c, context) for c in condition["and"]
            )
        if "or" in condition:
            return any(
                self._eval_condition(c, context) for c in condition["or"]
            )

        if "gte" in condition:
            field_path, threshold = condition["gte"]
            val = self._resolve(field_path, context)
            return val is not None and val >= threshold

        if "lte" in condition:
            field_path, threshold = condition["lte"]
            val = self._resolve(field_path, context)
            return val is not None and val <= threshold

        if "eq" in condition:
            field_path, expected = condition["eq"]
            val = self._resolve(field_path, context)
            return val == expected

        raise HeuristicRuleError(f"Unknown condition operator in {condition}")

    def _resolve(self, field_path: str, context: dict) -> Any:
        """
        Resolve a dot-notation path against context dict.
        Strips leading "context." prefix.
        Returns None if any intermediate key is missing.
        """
        key = field_path
        if key.startswith("context."):
            key = key[len("context.") :]

        parts = key.split(".")
        val: Any = context
        for part in parts:
            if not isinstance(val, dict):
                return None
            val = val.get(part)
        return val
