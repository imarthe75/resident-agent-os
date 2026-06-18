# Resident Agent OS — Complete Index

**Status:** ✅ Production-Ready (June 18, 2026)

## 📖 Documentation Map

| Document | Purpose | Audience |
|----------|---------|----------|
| [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md) | Usage guide with code examples | Developers |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System design, diagrams, data flows | Architects, Developers |
| [.agent/AGENT.md](.agent/AGENT.md) | Golden laws & operational mandates | Everyone |
| [.agent/HEURISTICS.md](.agent/HEURISTICS.md) | Heuristic theory + application | Designers |
| [.agent/SPECS.md](.agent/SPECS.md) | Active spec contracts | Product Managers |
| [.agent/SYSTEM_PROMPT.md](.agent/SYSTEM_PROMPT.md) | Full cognitive prompt (v3) | AI Engineers |
| [.agent/STATE.md](.agent/STATE.md) | Session diary & ritual checklist | Operations |
| [docs/guia-de-estilo-sql.md](docs/guia-de-estilo-sql.md) | SQL style guide | Database Engineers |

---

## 🏗️ Core Architecture Files

### Python Packages

#### `agent/` — Execution Engine
- **`__init__.py`** — Public API exports
- **`exceptions.py`** — 8 custom exception types
- **`heuristic_engine.py`** — Machine-readable rule evaluation
- **`loop.py`** — 10-phase ResidentAgentLoop (THE CORE)
- **`skill_base.py`** — Skill ABC with Pydantic validation
- **`state_parser.py`** — Atomic STATE.md JSON persistence

#### `memory/` — Cognitive Memory System
- **`__init__.py`** — Package exports
- **`agent_state.py`** — LoopState dataclass + session tracking
- **`long_term_memory.py`** — PostgreSQL + pgvector with HNSW
- **`semantic_cache.py`** — Valkey semantic cache <5ms

### Configuration & Infrastructure

| File | Purpose | Format |
|------|---------|--------|
| `requirements.txt` | Python dependencies (5) | pip |
| `.agent/heuristics.json` | Machine-readable rules | JSON |
| `sql/agent_memory.sql` | pgvector schema + HNSW | PostgreSQL |
| `hooks/hooks.json` | Claude Code harness hooks | JSON |

### Automation Scripts

| File | Trigger | Purpose |
|------|---------|---------|
| `scripts/hooks/pre-compact.js` | PreToolUse | Retry/token warnings |
| `scripts/hooks/post-edit.js` | PostToolUse (on_edit) | Syntax validation |
| `scripts/hooks/session-end.js` | Stop | Session persistence |

---

## 🎯 Quick Reference

### Import the Loop

```python
from agent import ResidentAgentLoop

loop = ResidentAgentLoop()
loop.boot()                           # 1. Health checks
ctx = loop.load_context()             # 2. Load .agent/*.md
memory = loop.retrieve_memory(...)    # 3. Cache → pgvector
actions = loop.apply_heuristics(ctx)  # 4. Apply rules
loop.ensure_spec("SPEC-001")          # 5. Validate spec
queue = loop.plan_tasks(skills, ins)  # 6. Validate inputs
result = loop.execute(skill, inp)     # 7. Run skill (max 3 retries)
loop.verify(skill, result)            # 8. Validate output
loop.store_memory(lesson, emb)        # 9. Persist to pgvector
loop.update_state({"done": True})     # 10. Atomic STATE.md
loop.close()
```

### Write a Skill

```python
from pydantic import BaseModel
from agent import Skill

class MyInput(BaseModel):
    query: str

class MyOutput(BaseModel):
    result: str

class MySkill(Skill):
    name = "my_skill"
    description = "Does X"
    input_schema = MyInput
    output_schema = MyOutput
    
    def execute(self, inp: MyInput) -> dict:
        return {"result": f"Processed: {inp.query}"}

skill = MySkill()
output = skill.run({"query": "test"})
```

### Access Memory

```python
from memory import SemanticCache, LongTermMemory

# Short-term (Valkey)
cache = SemanticCache()
cache.set("query", [0.1, ...], "response")
cached = cache.get([0.11, ...])  # If similarity >= 0.90

# Long-term (PostgreSQL)
ltm = LongTermMemory()
ltm.store_lesson("learned", [0.2, ...])
results = ltm.search_lessons([...], limit=3)
ltm.close()
```

### Evaluate Heuristics

```python
from agent import HeuristicEngine

engine = HeuristicEngine(".agent/heuristics.json")
actions = engine.evaluate({"retry_count": 3})
# Returns: ["halt_and_reflect"]
```

---

## 🔧 Setup Checklist

- [ ] Install Python dependencies: `pip install -r requirements.txt`
- [ ] Boot Docker services: `docker compose up -d valkey postgres`
- [ ] Apply schema: `docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql`
- [ ] Set `.env` variables: `POSTGRES_PASSWORD`, `VALKEY_HOST`, etc.
- [ ] Test import: `python3 -c "from agent import ResidentAgentLoop; print('OK')"`
- [ ] Run smoke test: See RESIDENT_AGENT_OS_QUICKSTART.md → "Basic Usage"

---

## 📊 System Components Overview

```
┌─────────────────────────────────────────────────────────┐
│           ResidentAgentLoop (10 Phases)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Phase 1-10: Boot → Context → Memory → Heuristics   │
│  │ → Spec → Plan → Execute → Verify → Store → Update  │
│  └─────────────────────────────────────────────────┘   │
└────────────┬──────────────────────────────┬─────────────┘
             │                              │
      ┌──────▼───────┐            ┌────────▼─────────┐
      │ Valkey Cache │            │ PostgreSQL+      │
      │ <5ms lookup  │            │ pgvector (HNSW)  │
      │ Semantic sim │            │ 1536-dim vectors │
      └──────────────┘            └──────────────────┘
             │                              │
             └──────────┬───────────────────┘
                        │
              ┌─────────▼────────────┐
              │  LoopState + Hooks   │
              │  SESSION PERSISTENCE │
              │  (STATE.md, atomic)  │
              └──────────────────────┘
```

---

## 🎓 Learning Path

1. **Start here:** [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md) — 10 min read
2. **Understand design:** [ARCHITECTURE.md](ARCHITECTURE.md) — 20 min read
3. **Review laws:** [.agent/AGENT.md](.agent/AGENT.md) — 5 min read
4. **Check heuristics:** [.agent/HEURISTICS.md](.agent/HEURISTICS.md) — 10 min read
5. **Write your first skill** — 30 min (see QUICKSTART)
6. **Deploy to production** — See setup checklist above

---

## 🛡️ Key Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| No external LLM APIs | Local-first core loop, no Anthropic/OpenAI calls |
| Data sovereignty | All data in ./data Docker volumes |
| Graceful degradation | Services continue if Valkey/PG unavailable |
| Schema validation | Pydantic enforced on input + output |
| Deterministic execution | Heuristics in machine-readable JSON, not code |
| ECC limit | Max 3 retries per skill, then halt_and_reflect |
| Atomic persistence | fcntl locks + temp file + os.replace() |
| Error tracking | Full audit trail in LoopState |
| Mandatory specs | Spec contracts enforced before code |
| Credential security | NO hardcoded passwords (env vars only) |

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `PostgreSQL unavailable` | `docker compose restart postgres` |
| `Valkey unavailable` | `docker compose restart valkey` |
| `Schema not ready` | `docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql` |
| `Skill exceeded ECC limit` | Check error logs, query `memory.lessons`, redesign skill |
| `Spec missing` | Add spec to `.agent/SPECS.md` and mark `APROBADO` |
| `ModuleNotFoundError` | `pip install -r requirements.txt` |

---

## 📝 Configuration Reference

### Environment Variables

```bash
# PostgreSQL
POSTGRES_DB=db_resident_knowledge
POSTGRES_USER=admin
POSTGRES_PASSWORD=<your_secure_password>
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Valkey
VALKEY_HOST=localhost
VALKEY_PORT=6379

# Agent
AGENT_DIR=.agent
TOKEN_WARN_THRESHOLD=40000
```

### Heuristics Rules (`.agent/heuristics.json`)

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "H001",
      "priority": 1,
      "condition": {"and": [...]},
      "action": "use_local"
    }
  ]
}
```

### Spec Template (`.agent/SPECS.md`)

```markdown
## [SPEC-001] Example Spec

### Requirements
- REQ-001: Feature X must work
- REQ-002: Performance < 100ms

### Constraints
- Local-first only
- No external APIs

### Acceptance Criteria
- Test passes
- Meets performance requirement

### Status
- ✅ APROBADO (ready for code)
- ⏳ PENDING (waiting for review)
```

---

## 🔗 Related Projects

**OpenSpec** (Fission-AI) — Live spec contracts
**Superpowers** (obra) — Deterministic execution pipelines
**Ponytail** (DietrichGebert) — Lightweight persistence
**ECC** (affaan-m) — Modular skill framework

---

## 📅 Maintenance

### Regular Tasks

- **Daily:** Check `docker compose ps` to verify services
- **Weekly:** Review `.agent/STATE.md` for error patterns
- **Monthly:** Audit `memory.agent_memory` for old entries
- **Quarterly:** Update `requirements.txt` and test dependencies

### Upgrading PostgreSQL

PostgreSQL 17 → 18: Update `docker-compose.yml` image to `pgvector/pgvector:pg18`

---

## 🎖️ Credits

**Framework Integration:**
- OpenSpec: Live specification contracts
- Superpowers: Cognitive pipeline architecture
- Ponytail: Dual-layer memory persistence
- ECC: Modular skill execution + control

**Technologies:**
- Python 3.12+
- PostgreSQL 18 + pgvector
- Valkey 8 (Redis-compatible)
- Pydantic 2.6+ (schema validation)
- Node.js (hooks automation)

---

## 📞 Support

For issues or questions:
1. Check [RESIDENT_AGENT_OS_QUICKSTART.md](RESIDENT_AGENT_OS_QUICKSTART.md) → Troubleshooting
2. Review [ARCHITECTURE.md](ARCHITECTURE.md) → Design section
3. Check `.agent/AGENT.md` for operational laws
4. Inspect session state in `.agent/STATE.md`

---

**Last Updated:** June 18, 2026  
**Version:** 1.0.0 (Production)  
**Status:** ✅ Ready for Deployment
