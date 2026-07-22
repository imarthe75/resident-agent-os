class AuraAuditException(Exception):
    """Clase base para todas las excepciones en AuraAudit."""
    pass

class SkillExecutionError(AuraAuditException):
    """Excepción lanzada cuando una Skill falla durante la ejecución."""
    pass

class InvalidConfigError(AuraAuditException):
    """Excepción lanzada cuando la configuración del entorno no es válida."""
    pass
