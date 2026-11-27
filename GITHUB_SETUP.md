# Resident Agent OS v1.0.0 — Git Remotes & Release Guide

This repository is designed to stay 100% generic (zero organization or customer data) so it can be synchronized cleanly across internal GitLab (`origin`) and public GitHub (`github`).

## Configured Remotes

```bash
git remote -v
# origin  <internal-gitlab-url>/resident-agent-os.git
# github  https://github.com/<owner>/resident-agent-os.git
```

## Pre-Release Verification Checklist

Run before tagging or pushing any release:

```bash
# 1. Mechanical repository verifiers
python3 verifiers/run.py

# 2. Node hook & skill-eval test suite
node --test tests/hooks/*.test.js tests/evals/*.test.js

# 3. Python test suite (with optional PG18 integration via TEST_POSTGRES_DSN)
pytest tests -q

# 4. Deterministic command-filter benchmark (0% error marker loss)
python3 scripts/benchmark_filters.py

# 5. Confirm VERSION matches pyproject.toml and resident-ui/package.json
cat VERSION
```

## Tagging & Publishing

```bash
# Create/update annotated release tag matching VERSION
git tag -a v1.0.0 -m "Resident Agent OS v1.0.0"

# Push branch and tag to GitLab and GitHub
git push origin main v1.0.0
git push github main v1.0.0

# Build a reproducible ZIP archive directly from the git tag
git archive --format=zip --prefix=resident-agent-os/ v1.0.0 -o resident-agent-os_v1.0.0.zip
```
