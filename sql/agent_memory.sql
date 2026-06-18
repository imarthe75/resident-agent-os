/*
 * Resident Agent OS — Long-term Semantic Memory Schema
 * PostgreSQL 18 + pgvector
 *
 * Creates the memory schema and agent_memory table with HNSW vector index.
 * Idempotent: safe to run multiple times.
 */

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector;
COMMENT ON EXTENSION vector IS 'pgvector extension for vector similarity search';

CREATE EXTENSION IF NOT EXISTS pgcrypto;
COMMENT ON EXTENSION pgcrypto IS 'Cryptographic functions';

-- Schema
CREATE SCHEMA IF NOT EXISTS memory;
COMMENT ON SCHEMA memory IS 'Semantic long-term memory for the Resident Agent OS.';

-- Primary table: memory.agent_memory
CREATE TABLE IF NOT EXISTS memory.agent_memory (
    id               uuid         NOT NULL DEFAULT uuidv7()    PRIMARY KEY,
    session_id       uuid         NOT NULL,
    content          text         NOT NULL,
    embedding        vector(1536),
    metadata         jsonb        NOT NULL DEFAULT '{}',
    memory_type      varchar(50)  NOT NULL DEFAULT 'lesson',
    importance_score float        NOT NULL DEFAULT 0.5
        CHECK (importance_score BETWEEN 0.0 AND 1.0),
    fccreacion       timestamptz  NOT NULL DEFAULT now(),
    fcmodificacion   timestamptz,
    uaccreacion      varchar(100) NOT NULL DEFAULT current_user,
    row_version      integer      NOT NULL DEFAULT 1
);

COMMENT ON TABLE memory.agent_memory IS
    'Semantic memory storage: lessons, decisions, facts with embeddings';
COMMENT ON COLUMN memory.agent_memory.id IS
    'UUIDv7 primary key — ordered temporal UUID';
COMMENT ON COLUMN memory.agent_memory.session_id IS
    'Session identifier for grouping memories by session';
COMMENT ON COLUMN memory.agent_memory.content IS
    'Text content of the memory (lesson, decision, fact)';
COMMENT ON COLUMN memory.agent_memory.embedding IS
    '1536-dimensional cosine embedding (OpenAI standard)';
COMMENT ON COLUMN memory.agent_memory.metadata IS
    'JSONB metadata: phase, tags, references, etc.';
COMMENT ON COLUMN memory.agent_memory.memory_type IS
    'Type: lesson, decision, fact, pattern, error, etc.';
COMMENT ON COLUMN memory.agent_memory.importance_score IS
    'Relevance/importance score 0.0-1.0 (higher = more important)';
COMMENT ON COLUMN memory.agent_memory.fccreacion IS
    'Creation timestamp (audit trail)';
COMMENT ON COLUMN memory.agent_memory.fcmodificacion IS
    'Last modification timestamp (audit trail)';
COMMENT ON COLUMN memory.agent_memory.uaccreacion IS
    'Creator user (audit trail)';
COMMENT ON COLUMN memory.agent_memory.row_version IS
    'Row version for optimistic locking';

-- HNSW index (cosine distance) — PREFERRED over ivfflat per project mandate
CREATE INDEX IF NOT EXISTS ix_agent_memory__embedding_hnsw
    ON memory.agent_memory
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
COMMENT ON INDEX ix_agent_memory__embedding_hnsw IS
    'HNSW index for fast cosine distance similarity search on embeddings';

-- Supporting indexes
CREATE INDEX IF NOT EXISTS ix_agent_memory__session_id
    ON memory.agent_memory (session_id);
COMMENT ON INDEX ix_agent_memory__session_id IS
    'Index for fast filtering by session_id';

CREATE INDEX IF NOT EXISTS ix_agent_memory__memory_type
    ON memory.agent_memory (memory_type);
COMMENT ON INDEX ix_agent_memory__memory_type IS
    'Index for fast filtering by memory_type (lesson, decision, etc.)';

CREATE INDEX IF NOT EXISTS ix_agent_memory__importance_desc
    ON memory.agent_memory (importance_score DESC);
COMMENT ON INDEX ix_agent_memory__importance_desc IS
    'Index for sorting/filtering by importance score (highest first)';

CREATE INDEX IF NOT EXISTS ix_agent_memory__fccreacion_desc
    ON memory.agent_memory (fccreacion DESC);
COMMENT ON INDEX ix_agent_memory__fccreacion_desc IS
    'Index for temporal queries (most recent memories first)';

-- Backwards compatibility: keep memory.lessons with its original schema
CREATE TABLE IF NOT EXISTS memory.lessons (
    id         uuid         NOT NULL DEFAULT uuidv7() PRIMARY KEY,
    content    text         NOT NULL,
    embedding  vector(1536),
    created_at timestamptz  NOT NULL DEFAULT now()
);
COMMENT ON TABLE memory.lessons IS
    'Legacy lessons table. New code must use memory.agent_memory.';

-- HNSW on lessons for backwards-compat searches
CREATE INDEX IF NOT EXISTS ix_lessons__embedding_hnsw
    ON memory.lessons
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);
COMMENT ON INDEX ix_lessons__embedding_hnsw IS
    'HNSW index for legacy lessons table compatibility';

-- Idempotent migration: copy lessons → agent_memory
DO $$
DECLARE
    v_count integer;
BEGIN
    SELECT COUNT(*) INTO v_count FROM memory.lessons;
    IF v_count > 0 THEN
        INSERT INTO memory.agent_memory
            (id, session_id, content, embedding, memory_type, fccreacion)
        SELECT
            id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            content,
            embedding,
            'lesson',
            created_at
        FROM memory.lessons
        ON CONFLICT (id) DO NOTHING;
        RAISE NOTICE 'Migrated % row(s) from memory.lessons to memory.agent_memory.', v_count;
    END IF;
END
$$ LANGUAGE plpgsql;
