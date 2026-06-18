# Resident Agent OS

> **Production-grade Python framework for persistent cognitive agents with deterministic heuristics, dual-layer memory, and modular skills.**
>
> *Unifying OpenSpec (live specs), Superpowers (deterministic loops), Ponytail (lightweight persistence), and ECC (modular skills) into a unified, local-first architecture.*

[![Python 3.12+](https://img.shields.io/badge/python-3.12%2B-blue.svg)](https://www.python.org/downloads/)
[![PostgreSQL 18](https://img.shields.io/badge/postgresql-18-336791.svg)](https://www.postgresql.org/)
[![Valkey 8](https://img.shields.io/badge/valkey-8-ff0000.svg)](https://valkey.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Status: Production](https://img.shields.io/badge/status-production-green.svg)](#)

## 🎯 Overview

Resident Agent OS is a **deterministic, resilient, and local-first** framework for building cognitive agents that:

- **Remember across sessions** via dual-layer memory (Valkey cache + PostgreSQL pgvector)
- **Make decisions using heuristics** (22 machine-readable rules, not hardcoded strings)
- **Execute skills reliably** with ECC retry limit (max 3 attempts) and full error tracking
- **Respect data sovereignty** — no external APIs, all data stays on-premise
- **Validate contracts** — spec-first development with mandatory spec validation
- **Degrade gracefully** — continue operating even if services fail

## ✨ Key Features

### 🔄 10-Phase Deterministic Loop

```
boot() → load_context() → retrieve_memory() → apply_heuristics() → 
ensure_spec() → plan_tasks() → execute() → verify() → store_memory() → 
update_state()
```

Each phase is atomic, logged, and recoverable.

### 🧠 22 Heuristic Rules

Covers ECC control, local-first policies, cognitive load minimization, Nielsen's 10 Usability Heuristics, and spec-driven development.

```python
from agent import HeuristicEngine

engine = HeuristicEngine(".agent/heuristics.json")
actions = engine.evaluate({
    "retry_count": 2,
    "valkey_available": True,
    "has_query": True,
})
# Returns: ["check_semantic_cache"]
```

### 💾 Dual-Layer Memory

| Layer | Technology | Latency | Purpose |
|-------|-----------|---------|---------|
| **Short-term** | Valkey (Redis-compatible) | <5ms | Semantic cache, cosine similarity |
| **Long-term** | PostgreSQL + pgvector | 10-50ms | Lessons, decisions, facts with 1536-dim HNSW |

### 🛠️ Skill Framework

```python
from pydantic import BaseModel
from agent import Skill

class MyInput(BaseModel):
    query: str

class MyOutput(BaseModel):
    result: str

class MySkill(Skill):
    name = "my_skill"
    description = "Does something useful"
    input_schema = MyInput
    output_schema = MyOutput
    
    def execute(self, inp: MyInput) -> dict:
        return {"result": f"Processed: {inp.query}"}

# Usage: automatic input/output validation + ECC retry tracking
skill = MySkill()
output = skill.run({"query": "test"})
```

### 📋 Schema Validation

100% Pydantic validation on skill inputs and outputs. Fail fast on schema mismatch.

### 🔒 State Machine

Atomic JSON persistence to `STATE.md` with fcntl locking for concurrent safety.

```python
from memory import LoopState

state = LoopState()
state.advance_phase("execute")
state.increment_retry("skill_a")
state.record_error("skill_a", "Connection timeout", "execute")

# Persisted atomically to .agent/STATE.md
state_dict = state.to_dict()
```

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.12+
python3 --version

# Docker with docker-compose
docker --version
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/imarthe75/resident-agent-os.git
   cd resident-agent-os
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   # Or in a virtual environment:
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Boot services:**
   ```bash
   docker compose up -d valkey postgres
   ```

4. **Initialize database schema:**
   ```bash
   docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql
   ```

5. **Test the loop:**
   ```python
   python3 << 'EOF'
   from agent import ResidentAgentLoop
   
   loop = ResidentAgentLoop()
   loop.boot()
   ctx = loop.load_context()
   actions = loop.apply_heuristics({"retry_count": 0})
   loop.update_state({"test": "initialization"})
   loop.close()
   print("✅ Agent OS initialized")
   EOF
   ```

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md) | Complete usage guide with code examples |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, diagrams, data flows, performance |
| [INDEX.md](INDEX.md) | File index, quick reference, learning path |
| [GITHUB_SETUP.md](GITHUB_SETUP.md) | Instructions for creating this repo on GitHub |
| [.agent/AGENT.md](.agent/AGENT.md) | Golden laws & operational mandates |
| [.agent/HEURISTICS.md](.agent/HEURISTICS.md) | Heuristic theory (Nielsen + Sweller) |

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│           ResidentAgentLoop (10 Phases)                │
│  boot → load_context → retrieve_memory → apply_heuristics
│  → ensure_spec → plan_tasks → execute → verify → 
│  store_memory → update_state                            │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
      ┌──────▼───────┐            ┌────────▼─────────┐
      │ Valkey Cache │            │ PostgreSQL+      │
      │ <5ms lookup  │            │ pgvector (HNSW)  │
      │ Cosine sim   │            │ 1536-dim         │
      └──────────────┘            └──────────────────┘
```

**For detailed architecture, see [ARCHITECTURE.md](ARCHITECTURE.md).**

## 🛡️ Design Principles

| Principle | Mechanism |
|-----------|-----------|
| **Local-First** | No external LLM APIs, all data in Docker volumes |
| **Deterministic** | Heuristics in machine-readable JSON, ordered by priority |
| **Resilient** | ECC limit (3 retries) + graceful degradation |
| **Safe** | Pydantic schema validation + atomic persistence |
| **Transparent** | Full error tracking + audit trail in LoopState |

## 📦 Core Components

### `agent/` Package
- **`loop.py`** — 10-phase ResidentAgentLoop (THE CORE)
- **`heuristic_engine.py`** — Machine-readable rule evaluation
- **`skill_base.py`** — Skill abstraction with Pydantic validation
- **`state_parser.py`** — Atomic STATE.md JSON persistence
- **`exceptions.py`** — 8 custom exception types

### `memory/` Package
- **`long_term_memory.py`** — PostgreSQL + pgvector with ThreadedConnectionPool
- **`semantic_cache.py`** — Valkey semantic cache <5ms
- **`agent_state.py`** — LoopState dataclass + session tracking

### Configuration
- **`.agent/heuristics.json`** — 22 comprehensive heuristic rules
- **`requirements.txt`** — 5 core dependencies
- **`sql/agent_memory.sql`** — pgvector schema with HNSW indexes

### Automation
- **`scripts/hooks/`** — pre-compact.js, post-edit.js, session-end.js

## 🔧 Configuration

### Environment Variables

```bash
# PostgreSQL
POSTGRES_DB=db_resident_knowledge
POSTGRES_USER=admin
POSTGRES_PASSWORD=your_secure_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Valkey
VALKEY_HOST=localhost
VALKEY_PORT=6379

# Agent
AGENT_DIR=.agent
TOKEN_WARN_THRESHOLD=40000
```

Create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env with your values
```

## 📊 Statistics

- **~1,978 lines** of production Python code
- **8 exception types** for structured error handling
- **10 execution phases** (deterministic loop)
- **22 heuristic rules** (machine-readable)
- **2 memory layers** (Valkey + PostgreSQL)
- **3 automation hooks** (Claude Code integration)
- **100% schema validation** (Pydantic)
- **0 external LLM API calls** in core loop

## 🎓 Learning Path

1. **Read this README** (5 min)
2. **Read RESIDENT_AGENT_OS_QUICKSTART.md** (10 min)
3. **Review ARCHITECTURE.md** (20 min)
4. **Explore the code** — start with `agent/loop.py`
5. **Write your first Skill** (30 min)
6. **Deploy to production** 🚀

## 🔗 Related Projects

This framework unifies four paradigms:

- **OpenSpec** (Fission-AI) — Live spec contracts
- **Superpowers** (obra) — Deterministic execution pipelines
- **Ponytail** (DietrichGebert) — Lightweight persistence
- **ECC** (affaan-m) — Modular skill framework

## 🚨 Common Issues

| Issue | Solution |
|-------|----------|
| PostgreSQL unavailable | `docker compose restart postgres` |
| Valkey unavailable | `docker compose restart valkey` |
| Schema not ready | `docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql` |
| Skill exceeded ECC limit | Check error logs, query `memory.lessons`, redesign skill |
| Spec missing | Add spec to `.agent/SPECS.md` and mark `APROBADO` |

See [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md#troubleshooting) for more.

## 📝 License

MIT License — See [LICENSE](LICENSE) file.

## 👤 Author

**Claude Code Agent** @ Anthropic
- Email: imarthe75@gmail.com
- GitHub: [@imarthe75](https://github.com/imarthe75)

## 🤝 Contributing

This is a production framework. To contribute:

1. Read `.agent/AGENT.md` (the golden laws)
2. Follow the spec-first approach (define in `.agent/SPECS.md`)
3. Use TDD with the skill framework
4. Ensure 100% Pydantic schema validation
5. Create an ADR for infrastructure changes

## 📞 Support

For questions or issues:
1. Check [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md)
2. Review [ARCHITECTURE.md](ARCHITECTURE.md)
3. Check `.agent/AGENT.md` for operational laws
4. Open an [issue on GitHub](https://github.com/imarthe75/resident-agent-os/issues)

---

**Status:** ✅ Production Ready (v1.0.0)  
**Last Updated:** June 18, 2026  
**Python:** 3.12+  
**PostgreSQL:** 18+  
**Valkey:** 8+
