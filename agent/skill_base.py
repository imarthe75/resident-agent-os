"""Skill abstraction and execution framework."""

import logging
from abc import ABC, abstractmethod
from typing import Any, ClassVar

from pydantic import BaseModel, ValidationError

from agent.exceptions import ECCLimitError, SchemaValidationError

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


class Skill(ABC):
    """
    Abstract base class for executable skills.
    Each skill must define input/output schemas and execute logic.
    """

    name: ClassVar[str]
    description: ClassVar[str]
    input_schema: ClassVar[type[BaseModel]]
    output_schema: ClassVar[type[BaseModel]]

    def __init__(self) -> None:
        self._retry_count: int = 0

    @property
    def retry_count(self) -> int:
        """Get current retry count."""
        return self._retry_count

    def run(self, raw_input: dict) -> dict:
        """
        Main entry point: validate input → execute → validate output.
        Handles schema validation and retry tracking.
        """
        try:
            validated = self.input_schema.model_validate(raw_input)
        except ValidationError as e:
            logger.error(f"Input validation failed for {self.name}: {e}")
            raise SchemaValidationError(
                f"Invalid input for {self.name}: {e}"
            ) from e

        try:
            result = self.execute(validated)
        except ECCLimitError:
            raise
        except Exception as e:
            self._retry_count += 1
            logger.warning(
                f"Skill {self.name} failed (attempt {self._retry_count}): {e}"
            )
            if self._retry_count >= MAX_RETRIES:
                logger.error(
                    f"Skill {self.name} exceeded ECC limit ({MAX_RETRIES} attempts)"
                )
                raise ECCLimitError(
                    f"Skill '{self.name}' exceeded ECC retry limit"
                ) from e
            raise

        try:
            self.output_schema.model_validate(result)
        except ValidationError as e:
            logger.error(f"Output validation failed for {self.name}: {e}")
            raise SchemaValidationError(
                f"Invalid output from {self.name}: {e}"
            ) from e

        logger.info(f"Skill {self.name} completed successfully")
        return result

    @abstractmethod
    def execute(self, validated_input: BaseModel) -> dict:
        """
        Execute the skill logic. Subclasses override this.
        Must return a dict matching output_schema.
        """
        pass
