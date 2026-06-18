# Resident Agent OS — Architecture Reference

## Executive Summary

**Resident Agent OS** es un framework Python de producción que implementa un agente cognitivo persistente, local-first, sin dependencias de APIs externas de IA. Unifica cuatro paradigmas:

1. **OpenSpec** (Fission-AI) — Contratos vivos y especificaciones estructuradas
2. **Superpowers** (obra) — Loop determinista y resiliente con pipelines cognitivos
3. **Ponytail** (DietrichGebert) — Persistencia ligera y manejo de memoria en capas
4. **ECC** (affaan-m) — Skills modulares, herramientas ejecutables, control determinista

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      .agent/ (Cognitive OS Initialization)               │
│  ┌──────────┬──────────┬──────────┬──────────┬────────────────┐         │
│  │ AGENT.md │RULES.md  │HEUR...md │SPECS.md  │ SYSTEM_PROMPT  │ STATE   │
│  │(Laws)    │(5 rules) │(Theory)  │(Contracts)│(Full Prompt)  │.md     │
│  └──────────┴──────────┴──────────┴──────────┴────────────────┘         │
│                               │                                  │        │
└───────────────────────────────┼──────────────────────────────────┼───────┘
                                │                                  │
                                ▼                                  ▼
                    ┌─────────────────────┐         ┌──────────────────────┐
                    │  HeuristicEngine    │         │ StateParser + Atomic │
                    │  (and/or/gte/lte/eq)│         │  JSON ← → STATE.md   │
                    │                     │         │ (fcntl-locked)       │
                    └─────────────────────┘         └──────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
          ┌──────────┐   ┌──────────┐   ┌──────────┐
          │ Skills   │   │ Specs    │   │ Memory   │
          │ (Skill   │   │ Validation│   │Retrieval │
          │  ABC)    │   │          │   │          │
          └──────────┘   └──────────┘   └──────────┘
                │               │               │
                └───────────────┼───────────────┘
                                │
                    ┌───────────▼────────────┐
                    │ ResidentAgentLoop      │
                    │ (10-Phase Executor)    │
                    │                        │
                    │ 1. boot()              │
                    │ 2. load_context()      │
                    │ 3. retrieve_memory()   │
                    │ 4. apply_heuristics()  │
                    │ 5. ensure_spec()       │
                    │ 6. plan_tasks()        │
                    │ 7. execute()           │
                    │ 8. verify()            │
                    │ 9. store_memory()      │
                    │ 10. update_state()     │
                    └───────────┬────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌─────────────┐ ┌──────────────┐ ┌──────────────┐
        │   Valkey    │ │ PostgreSQL + │ │ LoopState    │
        │  (short-tm) │ │   pgvector   │ │(in-memory)   │
        │   <5ms      │ │  (long-tm)   │ │+ atomic      │
        │             │ │  HNSW idx    │ │ STATE.md     │
        └─────────────┘ └──────────────┘ └──────────────┘

         SEMANTIC CACHE    EMBEDDINGS DB    SESSION STATE
         (Redis-compat)    (1536-dim)      (JSON ← → .md)
```

---

## Core Components

### 1. Heuristic Engine (`agent/heuristic_engine.py`)

**Purpose:** Evaluación determinista de reglas basadas en contexto.

**Operators:** `and`, `or`, `gte`, `lte`, `eq`

**Rules File:** `.agent/heuristics.json`

```python
from agent import HeuristicEngine

engine = HeuristicEngine(".agent/heuristics.json")
actions = engine.evaluate({
    "retry_count": 2,
    "has_external_api": True,
    "has_local_alternative": True,
})
# Returns: ["use_local"] (H001 matches, priority 1)
```

**Built-in Rules:**

| Rule | Condition | Action | Priority |
|------|-----------|--------|----------|
| H001 | `external_api AND local_alternative` | `use_local` | 1 |
| H002 | `has_query AND valkey_available` | `check_semantic_cache` | 2 |
| H003 | `retry_count >= 3` | `halt_and_reflect` | 3 |
| H004 | `new_dependency_added == true` | `create_adr` | 4 |
| H005 | `spec_missing == true` | `require_spec_before_code` | 5 |

### 2. ResidentAgentLoop (`agent/loop.py`)

**The Core:** 10-phase deterministic execution engine.

```python
from agent import ResidentAgentLoop

loop = ResidentAgentLoop()

# Phase 1: Boot
loop.boot()

# Phase 2: Load context from .agent/
context = loop.load_context()

# Phase 3: Retrieve cached or long-term memory
memory = loop.retrieve_memory(embedding=[...])

# Phase 4: Apply heuristics
actions = loop.apply_heuristics(context)

# Phase 5: Ensure spec exists
loop.ensure_spec("SPEC-001")

# Phase 6: Validate skill inputs
queue = loop.plan_tasks([skill_a], [{"param": "x"}])

# Phase 7: Execute skill (with retry tracking, max 3)
result = loop.execute(skill_a, {"param": "x"})

# Phase 8: Verify output schema
loop.verify(skill_a, result)

# Phase 9: Store lessons to pgvector
loop.store_memory("Learned X", embedding=[...], importance_score=0.8)

# Phase 10: Update session state (atomic)
loop.update_state({"status": "ok"})

loop.close()
```

**Error Handling:**
- `ServiceUnavailableError` — Valkey/PG down, but continues degraded
- `ECCLimitError` — 3 retries exhausted, halts and reflects
- `SpecMissingError` — No spec contract found
- `SchemaValidationError` — Input/output validation failure

### 3. Skill Abstraction (`agent/skill_base.py`)

**Base Class:** `Skill(ABC)`

```python
from pydantic import BaseModel
from agent import Skill

class MySkillInput(BaseModel):
    query: str

class MySkillOutput(BaseModel):
    result: str

class MySkill(Skill):
    name = "my_skill"
    description = "Does something"
    input_schema = MySkillInput
    output_schema = MySkillOutput

    def execute(self, validated_input: MySkillInput) -> dict:
        return {"result": f"Processed: {validated_input.query}"}

# Usage
skill = MySkill()
output = skill.run({"query": "test"})  # Validates → executes → validates
```

**Features:**
- Pydantic schema validation on input and output
- ECC retry limit (max 3 attempts)
- Automatic error tracking in `LoopState`
- Comprehensive logging

### 4. Memory Layers

#### Short-Term: Semantic Cache (Valkey)

```python
from memory import SemanticCache

cache = SemanticCache()

# Store
cache.set(
    query_text="What is ML?",
    query_embedding=[0.1, 0.2, ...],
    response_text="Machine learning is..."
)

# Retrieve (cosine similarity >= threshold)
cached = cache.get([0.11, 0.21, ...])
```

**Characteristics:**
- Redis-compatible (Valkey)
- Cosine similarity >= 0.90 threshold
- <5ms lookup time
- Graceful degradation on connection failure

#### Long-Term: PostgreSQL + pgvector

```python
from memory import LongTermMemory

ltm = LongTermMemory()

# Store lessons
ltm.store_lesson(
    content="Error X happens when Y. Solution: Z",
    embedding=[...]
)

# Search
results = ltm.search_lessons([...], limit=3)

# Store memory with metadata
ltm.store_memory(
    content="Discovered pattern ABC",
    embedding=[...],
    session_id="uuid",
    memory_type="pattern",
    importance_score=0.7,
)

# Search with filters
results = ltm.search_memory(
    embedding=[...],
    memory_type_filter="pattern",
    limit=5
)
```

**Characteristics:**
- HNSW index (cosine distance, m=16, ef=64)
- 1536-dimensional vectors (OpenAI standard)
- Metadata: session_id, memory_type, importance_score
- Audit columns: fccreacion, fcmodificacion, uaccreacion, row_version
- ThreadedConnectionPool (minconn=1, maxconn=5)
- Backwards compatible with `memory.lessons` table

### 5. State Machine (`memory/agent_state.py`)

```python
from memory import LoopState

state = LoopState()

# Track session
state.session_id  # UUID
state.current_phase  # "boot", "execute", etc.
state.current_skill  # Active skill name
state.retry_counts  # {"skill_a": 2, ...}
state.errors  # [{skill, error, phase, timestamp}, ...]
state.completed_skills  # ["skill_a", "skill_b"]

# Methods
state.advance_phase("execute")
state.increment_retry("skill_a")
state.record_error("skill_a", "Connection timeout", "execute")

# Serialization
dict_repr = state.to_dict()
state_restored = LoopState.from_dict(dict_repr)
```

### 6. State Persistence (`agent/state_parser.py`)

```python
from agent import read_state, write_state

# Read from STATE.md
state = read_state(Path(".agent/STATE.md"))

# Write (atomic operation, fcntl-locked)
write_state(Path(".agent/STATE.md"), {
    "session_id": "uuid",
    "completed_skills": ["skill_a"],
})
```

**Format:** JSON block in markdown (human-readable + machine-readable)

```markdown
## 🤖 Estado de Máquina
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "current_phase": "execute",
  "completed_skills": ["skill_a"],
  ...
}
```
```

---

## Data Flow

### Boot Sequence

```
┌─────────────────┐
│ ResidentAgent   │
│ Loop.boot()     │
└────────┬────────┘
         │
         ├─ load_dotenv()
         │
         ├─ SemanticCache.ping() ──→ Valkey:6379
         │  └─ On failure: log WARNING, set to None (graceful degrade)
         │
         ├─ LongTermMemory.ping() ──→ PostgreSQL:5432
         │  └─ On failure: log WARNING, set to None (graceful degrade)
         │
         ├─ LongTermMemory.schema_ready()
         │  └─ Check memory.agent_memory exists
         │  └─ On missing: log WARNING (need to run sql/agent_memory.sql)
         │
         └─ HeuristicEngine(heuristics_path)
            └─ Load .agent/heuristics.json
```

### Execution Cycle

```
┌─────────────────────────────────┐
│ load_context()                  │
│ ↓ Read .agent/*.md files        │
│ ↓ Read .agent/STATE.md JSON     │
│ ↓ Build context dict            │
├─────────────────────────────────┤
│ retrieve_memory(embedding)      │
│ ↓ SemanticCache.get(embedding)  │ (<5ms hit)
│ ├─ Hit → return cached response │
│ └─ Miss → LongTermMemory.search │ (HNSW)
├─────────────────────────────────┤
│ apply_heuristics(context)       │
│ ↓ HeuristicEngine.evaluate()    │
│ ↓ Return list of actions        │
├─────────────────────────────────┤
│ ensure_spec(spec_id)            │
│ ↓ Check SPECS.md for spec       │
│ └─ Raise SpecMissingError if X  │
├─────────────────────────────────┤
│ plan_tasks(skills, inputs)      │
│ ↓ Validate input schemas        │
│ ↓ Return validated queue        │
├─────────────────────────────────┤
│ execute(skill, input)           │
│ ↓ skill.run(input)              │
│ ├─ On success: append to done   │
│ └─ On failure: increment retry  │
│    └─ If retry >= 3: raise ECCLimitError
├─────────────────────────────────┤
│ verify(skill, output)           │
│ ↓ Validate output schema        │
│ └─ Raise SchemaValidationError  │
├─────────────────────────────────┤
│ store_memory(lesson, embedding) │
│ ↓ LongTermMemory.store_memory() │
│ ↓ Insert into memory.agent_memory
├─────────────────────────────────┤
│ update_state(summary)           │
│ ↓ LoopState.to_dict()           │
│ ↓ write_state() [atomic]        │
├─────────────────────────────────┤
│ close()                         │
│ ↓ LongTermMemory.close()        │
│ ↓ Close connection pool         │
└─────────────────────────────────┘
```

---

## Exception Hierarchy

```
ResidentAgentError (base)
├── ServiceUnavailableError
│   └─ Valkey/PostgreSQL unreachable
├── ECCLimitError
│   └─ 3 retries exceeded, halt_and_reflect
├── SpecMissingError
│   └─ No spec found for requested change
├── SchemaValidationError
│   └─ Pydantic input/output validation failure
├── StateParseError
│   └─ STATE.md JSON block corrupted
├── HeuristicRuleError
│   └─ heuristics.json malformed
└── AgentMemoryError
    └─ Memory read/write failure
```

---

## Configuration

### Environment Variables

```bash
# PostgreSQL
POSTGRES_DB=db_resident_knowledge
POSTGRES_USER=admin
POSTGRES_PASSWORD=<your_password>
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Valkey
VALKEY_HOST=localhost
VALKEY_PORT=6379

# Agent
AGENT_DIR=.agent

# Hooks
TOKEN_WARN_THRESHOLD=40000
```

### Heuristics File (`.agent/heuristics.json`)

```json
{
  "version": "1.0",
  "rules": [
    {
      "id": "H001",
      "priority": 1,
      "condition": {
        "and": [
          {"eq": ["context.has_external_api", true]},
          {"eq": ["context.has_local_alternative", true]}
        ]
      },
      "action": "use_local",
      "description": "..."
    }
  ]
}
```

---

## Deployment

### Prerequisites

```bash
# Python 3.12+
python3 --version

# PostgreSQL 18 + pgvector
docker compose up -d postgres valkey

# Apply schema
docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql

# Install deps
pip install -r requirements.txt
```

### Lifecycle Hooks

Claude Code harness invokes three hooks (defined in `hooks/hooks.json`):

| Hook | Script | Trigger | Purpose |
|------|--------|---------|---------|
| PreToolUse | `pre-compact.js` | Always | Warn about retries/tokens |
| PostToolUse | `post-edit.js` | on_edit | Validate Python/JS syntax |
| Stop | `session-end.js` | Always | Persist session to DB |

---

## Design Principles

1. **Local-First**
   - No external LLM APIs in core loop
   - All data stays on-premise in Docker volumes
   - Graceful degradation if services unavailable

2. **Deterministic Heuristics**
   - Rules in machine-readable JSON
   - No hardcoded decision strings
   - Ordered by priority for predictability

3. **ECC Limit (3 Retries)**
   - Max 3 attempts per skill
   - On 4th failure: halt and reflect
   - Query memory.lessons for patterns

4. **Atomic State Persistence**
   - STATE.md updates via temp file + os.replace()
   - fcntl.flock for concurrent access safety
   - JSON block embedded in markdown

5. **Schema Validation**
   - Pydantic on input and output
   - Fail fast on schema mismatch
   - Clear error messages

6. **Mandatory Spec Contracts**
   - No code without spec in SPECS.md
   - Enforced via ensure_spec() phase
   - Prevents spec drift

---

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Valkey semantic cache hit | <5ms | Cosine similarity >= 0.90 |
| PostgreSQL HNSW search | 10-50ms | Depends on index state |
| Pydantic validation | <1ms | Simple schemas |
| State JSON persistence | 5-10ms | Atomic file operation |
| Skill execution | Variable | Application-dependent |

---

## Testing Strategy

```python
# Test HeuristicEngine
from agent import HeuristicEngine
engine = HeuristicEngine(".agent/heuristics.json")
assert engine.evaluate({"retry_count": 3}) == ["halt_and_reflect"]

# Test LoopState
from memory import LoopState
state = LoopState()
state.increment_retry("skill_a")
assert state.get_retry("skill_a") == 1

# Test Skill
from agent import Skill
class TestSkill(Skill):
    name = "test"
    description = "test"
    input_schema = ...
    output_schema = ...
    def execute(self, validated_input):
        return {"status": "ok"}

skill = TestSkill()
result = skill.run({"param": "value"})

# Test state persistence
from agent import read_state, write_state
write_state(Path(".agent/STATE.md"), {"test": "data"})
state = read_state(Path(".agent/STATE.md"))
assert state["test"] == "data"
```

---

## Troubleshooting

### "PostgreSQL schema not ready"
```bash
docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql
```

### "Valkey unavailable"
```bash
docker compose ps valkey
docker compose restart valkey
```

### "Skill exceeded ECC limit"
1. Check error logs in `state.errors`
2. Query `memory.lessons` for similar past failures
3. Redesign skill logic or input validation
4. Never re-queue same skill without changes

---

## References

- **AGENT.md** — Golden Laws and operational mandates
- **HEURISTICS.md** — Heuristic theory and application
- **SPECS.md** — Active spec contracts
- **SYSTEM_PROMPT.md** — Full cognitive prompt (v3)
- **RESIDENT_AGENT_OS_QUICKSTART.md** — Usage guide with examples
