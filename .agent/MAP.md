# 🗺️ Mapeo del Framework (MAP.md)

Este documento define la estructura y dependencias de la infraestructura del framework y sus proyectos satélites en el host.

## 📂 Estructura de Directorios

```
/opt/casmart/
├── .agent/                      # Estado cognitivo central del agente
├── agent/                       # Motor de ejecución del Agente Residente
├── memory/                      # Lógica de memoria local (Valkey)
├── resident-ui/                 # Panel de administración del agente (Puerto 3000)
├── consulta-smart/              # Chatbot IA (Satélite)
│   ├── backend/                 # API FastAPI (Puerto 8202)
│   └── frontend/                # UI React/Vite (Puerto 8201)
├── lexivault-ai/                # Bóveda Documental (Satélite)
│   ├── backend/                 # API Flask/FastAPI (Puerto 5005)
│   └── frontend-react/          # UI React (Puerto 8501)
└── idp-smart/                   # Extractor PDF a JSON (Satélite)
    ├── app/                     # API FastAPI (Puerto 8102)
    └── frontend/                # UI React (Puerto 8101)
```

## 🔋 Recursos del Host y Puertos Centralizados

| Servicio | Puerto Interno | Puerto Host | Volumen Local | Propósito |
| :--- | :---: | :---: | :--- | :--- |
| **resident-ui** | `3000` | `3000` | No | Dashboard del Agente Residente |
| **casmarts-core-cache** | `6379` | `6379` | `./data/valkey` | Memoria corto plazo y Celery Broker común |
| **casmarts-core-storage** | `8333` | `8333` | `./data/seaweedfs` | Almacenamiento S3 SeaweedFS común |

## 🌐 Recursos Externos

| Servicio | Dirección IP / Host | Puertos | Propósito |
| :--- | :--- | :--- | :--- |
| **Base de Datos** | `10.4.3.23` | `5432` | PostgreSQL central para satélites |
| **Authentik / Vault** | `10.4.3.208` | `9000` / `8200` | Control de accesos y secretos central |
| **NVIDIA NIM API** | Externa | HTTPS | Inferencia y embeddings local/cloud |

## 🔗 Mapeos DNS y URLs Públicas

Este host tiene IP `10.4.3.31` y sirve los tres satélites bajo subdominios `*.casmart.internal`.

| URL Pública | IP | Puerto Host | Proyecto | Servicio |
| :--- | :---: | :---: | :--- | :--- |
| `chat.casmart.internal` | `10.4.3.31` | `8201` | consulta-smart | Frontend React (Vite) |
| `chat.casmart.internal/api` | `10.4.3.31` | `8202` | consulta-smart | Backend FastAPI |
| `lexivault.casmart.internal` | `10.4.3.31` | `8501` | lexivault-ai | Frontend React |
| `lexivault.casmart.internal/api` | `10.4.3.31` | `5005` | lexivault-ai | Backend Flask/FastAPI |
| `idp.casmart.internal` | `10.4.3.31` | `8101` | idp-smart | Frontend React (Vite) |
| `idp.casmart.internal/api` | `10.4.3.31` | `8102` | idp-smart | Backend FastAPI |
| `vault.casmart.internal` | `10.4.3.208` | `8200` | — | HashiCorp Vault (reservado) |

> **Nota:** Los mapeos DNS son resoluciones internas de red. Se requiere un reverse proxy (nginx/traefik) apuntando a los puertos de host para servir bajo esos subdominios. Ver sección de reverse proxy.
