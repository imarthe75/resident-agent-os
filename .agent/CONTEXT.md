# 🌌 Contexto del Agente Residente (CONTEXT.md)

Este framework está diseñado para gobernar y normar cómo se comportan los agentes de IA dentro de un ecosistema compuesto por el Agente Residente y tres satélites principales.

## 🎯 Propósito del Agente Residente
El propósito del Agente Residente es servir como un operador inteligente soberano y centralizado que mantiene el control y la bitácora del estado cognitivo de todos los proyectos en el host local.

## 🛰️ Satélites Coexistentes
1. **Consulta-Smart (`/consulta-smart`):** Chatbot impulsado por IA con RAG para consultas y análisis de documentos.
2. **LexiVault AI (`/lexivault-ai`):** Bóveda documental segura e inteligente con extracción estructural y cifrado dinámico.
3. **IDP-Smart (`/idp-smart`):** Extractor inteligente de PDFs a formato JSON.

## 🛠️ Servicios e Integración Comunes
El ecosistema centraliza sus servicios en la raíz y utiliza componentes corporativos compartidos:
- **Base de Datos Externa:** Servidor PostgreSQL en `10.4.3.23` que almacena los datos de los tres proyectos satélite.
- **Gestión de Identidad y Secretos:** Servidor Authentik y HashiCorp Vault en `10.4.3.208`.
- **Caché y Celery Broker (`casmarts-core-cache`):** Valkey 8 local en puerto `6379`.
- **Almacenamiento S3 (`casmarts-core-storage`):** SeaweedFS local sirviendo en puertos `9333` (master), `8080` (volume) y `8333` (S3).
- **Procesamiento de LLM / Embeddings:** Integración directa por API con NVIDIA NIM (se configurará la clave API más adelante).
