# Resident Agent OS — Quick Start Guide

## Installation

```bash
# Install Python dependencies
python3 -m pip install -r requirements.txt

# Or use a virtual environment (recommended)
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Start Services

```bash
# Boot Valkey (short-term cache) and PostgreSQL (long-term memory)
docker compose up -d valkey postgres

# Verify services
docker compose ps
```

## Initialize Database Schema

```bash
# Apply the memory schema and HNSW vector indexes
docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql
```

## Basic Usage: The 10-Phase Loop

```python
from agent import ResidentAgentLoop

# Create and boot the loop
loop = ResidentAgentLoop(
    agent_dir=Path(".agent"),
    heuristics_path=Path(".agent/heuristics.json"),
    state_path=Path(".agent/STATE.md"),
)

# Phase 1: Boot — health checks + service initialization
loop.boot()

# Phase 2: Load context — read all .agent/*.md files
context = loop.load_context()

# Phase 3: Retrieve memory — cache → pgvector fallback
relevant_memory = loop.retrieve_memory(
    query="example query",
    embedding=[0.1, 0.2, ...]  # 1536-dim vector
)

# Phase 4: Apply heuristics — evaluate rules
actions = loop.apply_heuristics({
    "retry_count": 0,
    "has_query": True,
    "valkey_available": True,
})
# Returns: ["check_semantic_cache"]

# Phase 5: Ensure spec — mandatory spec validation
try:
    loop.ensure_spec("SPEC-001")
except SpecMissingError:
    print("Spec must be defined in .agent/SPECS.md first")

# Phase 6: Plan tasks — validate skill inputs
queue = loop.plan_tasks(
    skills=[skill_a, skill_b],
    inputs=[{"param": "value"}, {"param": "value2"}]
)

# Phase 7: Execute — run skill with retry tracking
result = loop.execute(skill_a, {"param": "value"})

# Phase 8: Verify — validate output schema
loop.verify(skill_a, result)

# Phase 9: Store memory — persist lessons to pgvector
loop.store_memory(
    lesson="Learned something important",
    embedding=[...],  # 1536-dim vector
    memory_type="lesson",
    importance_score=0.8,
)

# Phase 10: Update state — atomic persistence to STATE.md
loop.update_state({
    "skills_executed": ["skill_a"],
    "messages_generated": 5,
})

# Close connections
loop.close()
```

## Writing Custom Skills

All skills inherit from `Skill` and must define input/output schemas.

```python
from pydantic import BaseModel
from agent import Skill

class MySkillInput(BaseModel):
    query: str
    max_results: int = 10

class MySkillOutput(BaseModel):
    status: str
    results: list[str]

class MySkill(Skill):
    name = "my_skill"
    description = "Does something useful"
    input_schema = MySkillInput
    output_schema = MySkillOutput

    def execute(self, validated_input: MySkillInput) -> dict:
        # Your implementation here
        results = [f"result_{i}" for i in range(validated_input.max_results)]
        return {
            "status": "success",
            "results": results,
        }

# Usage
skill = MySkill()
output = skill.run({"query": "test", "max_results": 5})
# Automatically validates input → execute() → validates output
```

## Heuristic Rules

The heuristic engine evaluates rules from `.agent/heuristics.json`:

```python
from agent import HeuristicEngine

engine = HeuristicEngine(".agent/heuristics.json")

# Evaluate rules
actions = engine.evaluate({
    "retry_count": 3,
    "has_external_api": True,
    "has_local_alternative": True,
})
# Returns: ["use_local", "halt_and_reflect", ...]
```

**Built-in Rules:**

| ID | Condition | Action | Priority |
|---|---|---|---|
| H001 | `external_api AND local_alternative` | `use_local` | 1 |
| H002 | `has_query AND valkey_available` | `check_semantic_cache` | 2 |
| H003 | `retry_count >= 3` | `halt_and_reflect` | 3 |
| H004 | `new_dependency_added == true` | `create_adr` | 4 |
| H005 | `spec_missing == true` | `require_spec_before_code` | 5 |

## Memory Management

### Short-Term Memory (Valkey)

Semantic cache for query deduplication:

```python
from memory import SemanticCache

cache = SemanticCache()

# Store a query + embedding + response
cache.set(
    query_text="What is machine learning?",
    query_embedding=[0.1, 0.2, ...],
    response_text="Machine learning is..."
)

# Retrieve cached response (if similarity >= threshold)
cached = cache.get(query_embedding=[0.11, 0.21, ...])
if cached:
    print(cached)  # "Machine learning is..."
```

### Long-Term Memory (PostgreSQL + pgvector)

Persistent semantic memory with HNSW indexing:

```python
from memory import LongTermMemory

ltm = LongTermMemory()

# Store a lesson
ltm.store_lesson(
    content="Error X happens when Y condition is true. Solution: Z",
    embedding=[...]
)

# Search lessons by similarity
results = ltm.search_lessons(
    query_embedding=[...],
    limit=3
)
# Returns: [(content, similarity), ...]

# Store memory with metadata
ltm.store_memory(
    content="Discovered pattern ABC",
    embedding=[...],
    session_id="uuid-here",
    memory_type="pattern",
    importance_score=0.7,
    metadata={"tags": ["optimization", "caching"]},
)

# Close connection pool
ltm.close()
```

## State Management

Session state persists to `.agent/STATE.md` as a JSON block:

```python
from agent import read_state, write_state

# Read current state
state_dict = read_state(Path(".agent/STATE.md"))

# Write state (atomic operation with fcntl locking)
write_state(
    Path(".agent/STATE.md"),
    {
        "session_id": "uuid",
        "completed_skills": ["skill_a", "skill_b"],
        "retry_counts": {"skill_c": 2},
    }
)
```

The JSON block is embedded in markdown for human readability:

```markdown
## 🤖 Estado de Máquina
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "completed_skills": ["skill_a"],
  ...
}
```
```

## Environment Variables

| Variable | Default | Purpose |
|---|---|---|
| `POSTGRES_DB` | `db_resident_knowledge` | PostgreSQL database name |
| `POSTGRES_USER` | `admin` | PostgreSQL user |
| `POSTGRES_PASSWORD` | `` (empty) | PostgreSQL password |
| `POSTGRES_HOST` | `localhost` | PostgreSQL host |
| `POSTGRES_PORT` | `5432` | PostgreSQL port |
| `VALKEY_HOST` | `localhost` | Valkey/Redis host |
| `VALKEY_PORT` | `6379` | Valkey/Redis port |
| `AGENT_DIR` | `.agent` | Agent context directory |
| `TOKEN_WARN_THRESHOLD` | `40000` | Context token warning threshold |

Set in `.env` or `export` them:

```bash
export POSTGRES_PASSWORD="my_secure_password"
export VALKEY_HOST="redis.example.com"
```

## Error Handling

Eight exception types for structured error handling:

```python
from agent import (
    ResidentAgentError,          # Base exception
    ServiceUnavailableError,     # Valkey/PG down
    ECCLimitError,              # 3 retries exceeded
    SpecMissingError,           # Spec not found
    SchemaValidationError,      # Pydantic validation failure
    StateParseError,            # STATE.md JSON corruption
    HeuristicRuleError,         # heuristics.json malformed
    AgentMemoryError,           # Memory read/write failure
)

try:
    loop.ensure_spec("SPEC-001")
except SpecMissingError as e:
    print(f"Spec validation failed: {e}")
except ECCLimitError as e:
    print(f"Too many retries: {e}")
    # Halt and reflect — check memory.lessons for patterns
except SchemaValidationError as e:
    print(f"Invalid input/output: {e}")
```

## Hooks Integration

The framework supports three lifecycle hooks in `hooks/hooks.json`:

- **pre-compact.js** — Warns about retry attempts and token usage (advisory only)
- **post-edit.js** — Validates Python/JavaScript syntax after file edits
- **session-end.js** — Persists session summary to STATE.md and PostgreSQL

These are executed by the Claude Code harness automatically.

## Architecture Overview

```
┌─────────────────────────────────────┐
│   ResidentAgentLoop (10 phases)     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┃
│  1. boot()                          │
│  2. load_context()                  │
│  3. retrieve_memory()               │
│  4. apply_heuristics()              │
│  5. ensure_spec()                   │
│  6. plan_tasks()                    │
│  7. execute(Skill)                  │
│  8. verify()                        │
│  9. store_memory()                  │
│  10. update_state()                 │
└─────────────────────────────────────┘
           │
      ┌────┼────┐
      │    │    │
      ▼    ▼    ▼
  ╔════╗╔════╗╔════════════╗
  ║.agent  ║ Heuristics   ║
  ║files║  Engine        ║
  ║    ║                 ║
  ╚════╝╚════╝╚════════════╝
      │
  ┌───┴───────────┬──────────────┐
  │               │              │
  ▼               ▼              ▼
┌──────────┐ ┌──────────┐  ┌──────────────┐
│ Valkey   │ │Postgres+ │  │  LoopState   │
│Semantic  │ │pgvector  │  │  (STATE.md)  │
│Cache     │ │(1536-dim)│  │              │
│(<5ms)    │ │ (HNSW)   │  │(Atomic JSON) │
└──────────┘ └──────────┘  └──────────────┘
```

## Key Design Principles

1. **Local-First**: No external cloud APIs. All data stays on-premise.
2. **Graceful Degradation**: Services unavailable? Continue with reduced capability.
3. **Deterministic Heuristics**: Rules are machine-readable, not hardcoded strings.
4. **ECC Limit**: Max 3 retries per skill. On failure, halt and consult long-term memory.
5. **Atomic State Persistence**: STATE.md updates are atomic (no torn writes).
6. **Schema Validation**: All inputs/outputs validated with Pydantic.
7. **Mandatory Specs**: No code without a corresponding spec contract.

## Troubleshooting

### "PostgreSQL unavailable"
```bash
docker compose ps
# Should see: postgres — Up
# If down, restart: docker compose restart postgres
```

### "Valkey unavailable"
```bash
docker compose ps
# Should see: valkey — Up
# If down, restart: docker compose restart valkey
```

### "Schema not ready"
```bash
docker compose exec postgres psql -U admin -d db_resident_knowledge -f sql/agent_memory.sql
```

### "Skill exceeded ECC limit"
The skill failed 3 times. Check the error log and:
1. Query `memory.lessons` for similar past errors
2. Redesign the skill logic or input validation
3. Never re-queue the same skill without changes

### "Spec missing"
Add the spec to `.agent/SPECS.md` and mark it `APROBADO` before executing the skill.

---

**For more details, see `.agent/AGENT.md`, `.agent/HEURISTICS.md`, and `.agent/SYSTEM_PROMPT.md`.**
