# Resident Agent OS — GitHub Setup Instructions

## 🚀 Create Repository on GitHub

### Option 1: Using GitHub CLI (Recommended)

If you have `gh` installed on your machine, run this command:

```bash
gh repo create resident-agent-os \
  --source=. \
  --remote=origin \
  --push \
  --public \
  --description="Production-grade Python framework: Persistent cognitive agents with local-first memory, deterministic heuristics, and modular skills. Unifies OpenSpec, Superpowers, Ponytail, and ECC."
```

**Expected output:**
```
✓ Created repository imarthe75/resident-agent-os on GitHub
✓ Added remote https://github.com/imarthe75/resident-agent-os.git
✓ Pushed commits to https://github.com/imarthe75/resident-agent-os.git
```

### Option 2: Manual Setup on GitHub Web

1. Go to **https://github.com/new**
2. Fill in:
   - **Repository name:** `resident-agent-os`
   - **Description:** `Production-grade Python framework: Persistent cognitive agents with local-first memory, deterministic heuristics, and modular skills. Unifies OpenSpec, Superpowers, Ponytail, and ECC.`
   - **Visibility:** Public
   - **Initialize repository:** NO (we already have a repo)

3. Click **Create repository**

4. On your machine, update the remote and push:

```bash
# Change remote URL
git remote set-url origin https://github.com/imarthe75/resident-agent-os.git

# Push all commits
git push -u origin main

# Verify
git remote -v
```

**Expected output:**
```
origin  https://github.com/imarthe75/resident-agent-os.git (fetch)
origin  https://github.com/imarthe75/resident-agent-os.git (push)
```

---

## 📋 Pre-Push Checklist

Before pushing, verify:

```bash
# Current branch
git branch -a
# Output: * main

# Remote configured
git remote -v
# Output: origin  https://github.com/imarthe75/resident-agent-os.git (fetch/push)

# Commits ready
git log --oneline -5
# Output: Shows your 3 commits (heuristics + architecture + index)

# Working tree clean
git status
# Output: On branch main, nothing to commit, working tree clean
```

---

## 🔑 GitHub Authentication

### If using HTTPS (Recommended)

You'll be prompted for credentials. Use:
- **Username:** your GitHub username (e.g., `imarthe75`)
- **Password:** Personal Access Token (not your GitHub password)

**To create a PAT:**
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control)
4. Copy the token and use as password when prompted

### If using SSH

Set up SSH key first:
```bash
ssh-keygen -t ed25519 -C "imarthe75@gmail.com"
# Add key to GitHub: https://github.com/settings/keys

git remote set-url origin git@github.com:imarthe75/resident-agent-os.git
git push -u origin main
```

---

## 📊 Repository Structure in GitHub

After pushing, you should see:

```
resident-agent-os/
├── agent/
│   ├── __init__.py
│   ├── exceptions.py
│   ├── heuristic_engine.py
│   ├── loop.py
│   ├── skill_base.py
│   └── state_parser.py
├── memory/
│   ├── __init__.py
│   ├── agent_state.py
│   ├── long_term_memory.py
│   └── semantic_cache.py
├── .agent/
│   ├── heuristics.json (22 comprehensive rules)
│   ├── AGENT.md
│   ├── HEURISTICS.md
│   ├── SPECS.md
│   └── ... (other agent files)
├── scripts/
│   └── hooks/
│       ├── pre-compact.js
│       ├── post-edit.js
│       └── session-end.js
├── sql/
│   └── agent_memory.sql
├── requirements.txt
├── RESIDENT_AGENT_OS_QUICKSTART.md
├── ARCHITECTURE.md
├── INDEX.md
├── GITHUB_SETUP.md (this file)
└── ... (other docs)
```

---

## ✅ Post-Push Verification

Once pushed, verify on GitHub:

```bash
# View repository
open https://github.com/imarthe75/resident-agent-os

# View commits
open https://github.com/imarthe75/resident-agent-os/commits/main

# View files
open https://github.com/imarthe75/resident-agent-os/tree/main/agent
```

---

## 🔗 Quick Links (After Push)

| Link | Purpose |
|------|---------|
| https://github.com/imarthe75/resident-agent-os | Repository home |
| https://github.com/imarthe75/resident-agent-os/commits/main | Commit history |
| https://github.com/imarthe75/resident-agent-os/releases | Releases (create after v1.0.0 stable) |
| https://github.com/imarthe75/resident-agent-os/issues | Issues tracker |
| https://github.com/imarthe75/resident-agent-os/discussions | Discussions |

---

## 📝 Next Steps After Repository is Live

1. **Create release tag:**
   ```bash
   git tag -a v1.0.0 -m "Resident Agent OS v1.0.0 - Production Release"
   git push origin v1.0.0
   ```

2. **Create GitHub Release:**
   - Go to https://github.com/imarthe75/resident-agent-os/releases/new
   - Tag: `v1.0.0`
   - Release title: `Resident Agent OS v1.0.0`
   - Description: Copy from README or ARCHITECTURE.md

3. **Enable GitHub Pages (Optional):**
   - Settings → Pages
   - Source: `main` branch, `/root` folder
   - This will publish your docs at `https://imarthe75.github.io/resident-agent-os`

4. **Add Topics (GitHub Settings):**
   - `python`
   - `agent`
   - `ai`
   - `heuristics`
   - `postgresql`
   - `valkey`
   - `memory`

---

## 🆘 Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/imarthe75/resident-agent-os.git
git push -u origin main
```

### "Permission denied (publickey)"
You're using SSH but haven't added your key to GitHub:
```bash
# Add your public key to https://github.com/settings/keys
cat ~/.ssh/id_ed25519.pub  # Copy this
```

### "Repository not found"
Check spelling and that you created the repo on GitHub first.

### "Updates were rejected"
Someone pushed to main before you:
```bash
git pull origin main
git push origin main
```

---

## 📞 Support

If you encounter issues:
1. Check GitHub docs: https://docs.github.com/en/get-started
2. Verify remote: `git remote -v`
3. Check authentication: `gh auth status` (if using gh CLI)
