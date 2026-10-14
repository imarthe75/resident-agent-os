"""Heuristic evaluation engine for context-driven decision making."""

import json
import logging
from pathlib import Path
from typing import Any

from agent.exceptions import HeuristicRuleError

logger = logging.getLogger(__name__)

# Rules with priority <= this are guard rules (ECC retry limit, data sovereignty). If one of them cannot be evaluated the engine fails CLOSED
# (raises): silently skipping the retry-limit rule is how a loop burns tokens forever.
CRITICAL_PRIORITY_MAX = 2
_LOGIC_OPS = ("and", "or", "not")
_COMPARE_OPS = ("gte", "lte", "gt", "lt", "eq", "ne", "in")


class HeuristicEngine:
    """
    Loads and evaluates heuristic rules from heuristics.json.
    Returns ordered list of applicable actions based on context evaluation.

    Operators: and, or, not, gte, lte, gt, lt, eq, ne, in. Conditions are validated when the file is LOADED, so a typo in an operator is a
    boot error, not a rule that quietly never fires.
    """

    def __init__(self, rules_path: Path | str) -> None:
        """Load, validate and sort rules by priority."""
        self.rules_path = Path(rules_path)
        self.rules = []

        if not self.rules_path.exists():
            logger.warning("Heuristics file not found: %s", self.rules_path)
            return

        try:
            with open(self.rules_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise HeuristicRuleError(f"Invalid JSON in {self.rules_path}: {e}") from e
        except OSError as e:
            raise HeuristicRuleError(f"Cannot read {self.rules_path}: {e}") from e

        rules = data.get("rules", [])
        for r in rules:
            self._validate_condition(r.get("condition", {}), r.get("id"))
        self.rules = sorted(rules, key=lambda r: r.get("priority", 999))
        logger.info("Loaded %d heuristic rules", len(self.rules))

    def _validate_condition(self, cond: Any, rule_id: Any) -> None:
        if not cond:
            return
        if not isinstance(cond, dict) or len(cond) != 1:
            raise HeuristicRuleError(f"Rule {rule_id}: a condition is an object with exactly one operator, got {cond!r}")
        op, arg = next(iter(cond.items()))
        if op in ("and", "or"):
            if not isinstance(arg, list) or not arg:
                raise HeuristicRuleError(f"Rule {rule_id}: '{op}' needs a non-empty list")
            for c in arg:
                self._validate_condition(c, rule_id)
        elif op == "not":
            self._validate_condition(arg, rule_id)
        elif op in _COMPARE_OPS:
            if not isinstance(arg, list) or len(arg) != 2 or not isinstance(arg[0], str):
                raise HeuristicRuleError(f"Rule {rule_id}: '{op}' needs [field_path, value], got {arg!r}")
            if op == "in" and not isinstance(arg[1], list):
                raise HeuristicRuleError(f"Rule {rule_id}: 'in' needs a list as its value")
        else:
            raise HeuristicRuleError(f"Rule {rule_id}: unknown condition operator '{op}'")

    def evaluate(self, context: dict[str, Any]) -> list[str]:
        """
        Evaluate all rules against the context. Returns the actions of the matching rules, in priority order.

        An error while evaluating a rule is never swallowed: guard rules (priority <= CRITICAL_PRIORITY_MAX) re-raise as HeuristicRuleError;
        any other rule is logged WITH its traceback and reported to the caller as the action 'rule_error:<id>', so a broken rule is visible
        in the result instead of just missing from it.
        """
        actions = []
        for rule in self.rules:
            try:
                if self._eval_condition(rule.get("condition", {}), context):
                    action = rule.get("action")
                    if action:
                        actions.append(action)
                        logger.debug("Rule %s matched: %s", rule.get("id"), action)
            except Exception as e:
                logger.error("Error evaluating rule %s", rule.get("id"), exc_info=True)
                if rule.get("priority", 999) <= CRITICAL_PRIORITY_MAX:
                    raise HeuristicRuleError(f"Guard rule {rule.get('id')} could not be evaluated: {e}") from e
                actions.append(f"rule_error:{rule.get('id')}")
        return actions

    def _eval_condition(self, condition: dict, context: dict) -> bool:
        if not condition:
            return True
        op, arg = next(iter(condition.items()))
        if op == "and":
            return all(self._eval_condition(c, context) for c in arg)
        if op == "or":
            return any(self._eval_condition(c, context) for c in arg)
        if op == "not":
            return not self._eval_condition(arg, context)
        field_path, expected = arg
        val = self._resolve(field_path, context)
        if op == "eq":
            return val == expected
        if op == "ne":
            return val != expected
        if val is None:
            return False
        if op == "in":
            return val in expected
        if op == "gte":
            return val >= expected
        if op == "lte":
            return val <= expected
        if op == "gt":
            return val > expected
        if op == "lt":
            return val < expected
        raise HeuristicRuleError(f"Unknown condition operator in {condition}")

    def _resolve(self, field_path: str, context: dict) -> Any:
        """Resolve a dot-notation path against the context (a leading "context." is ignored). None if any key is missing."""
        key = field_path[len("context."):] if field_path.startswith("context.") else field_path
        val: Any = context
        for part in key.split("."):
            if not isinstance(val, dict):
                return None
            val = val.get(part)
        return val
