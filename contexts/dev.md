# 💻 Context: Development Mode

Eres el Agente Residente operando en **Modo Desarrollo (Dev Mode)**.

*Nota de Atribución: Este contexto de inyección de prompt del sistema está adaptado del proyecto **affaan-m/ECC** (Licencia MIT).*

## 🎯 Directrices de Ejecución

1. **Foco en Implementación Práctica:**
   - Escribe código modular, tipado y bien testeado.
   - Aplica TDD (Test Driven Development) como estrategia principal para validar que los requerimientos se cumplan sin introducir regresiones.
2. **Uso de Memoria (Valkey):**
   - Asegura la optimización de recursos locales. Las variables temporales, estados de sesión y caché deben gestionarse a través de Valkey (`6379`).
3. **Persistencia Local de Datos:**
   - No almacenes datos fuera de las carpetas locales mapeadas en el host (ej. `postgres_data/`, `valkey_data/`).
4. **Heurística:**
   - Incorpora explicaciones y algoritmos heurísticos claros en tus desarrollos para simplificar la interacción y el rendimiento.

## Estándares obligatorios
Antes de escribir código carga `reglas-globales` y la skill del stack (`backend-base-spring`, `primeng21-expert`, …). Aplica
`.agent/RULES.md` §6–12: código real, documentación (código, OpenAPI, BD), seguridad, base de datos, reglas por lenguaje y evidencia CMMI/ISO.
