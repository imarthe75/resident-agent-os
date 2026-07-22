from abc import ABC, abstractmethod
from pydantic import BaseModel
from .exceptions import SkillExecutionError

class Skill(ABC):
    name: str
    description: str
    input_schema: type[BaseModel]
    output_schema: type[BaseModel]

    def run(self, inputs: dict) -> BaseModel:
        # 1. Validar entradas
        try:
            validated_input = self.input_schema(**inputs)
        except Exception as e:
            raise SkillExecutionError(f"Error de validación de entrada en la Skill {self.name}: {e}")

        # 2. Ejecutar lógica
        try:
            raw_output = self.execute(validated_input)
        except Exception as e:
            raise SkillExecutionError(f"Fallo durante la ejecución de la Skill {self.name}: {e}")

        # 3. Validar salidas
        try:
            validated_output = self.output_schema(**raw_output)
        except Exception as e:
            raise SkillExecutionError(f"Error de validación de salida en la Skill {self.name}: {e}")

        return validated_output

    @abstractmethod
    def execute(self, validated_input: BaseModel) -> dict:
        """Lógica principal de la skill. Debe ser implementada por subclases."""
        pass
