# GitHub Branch Protection Configuration Guide

**Purpose:** Configure server-side enforcement that cannot be bypassed, even with `git commit --no-verify`.

**Related Issue:** #82 (Make pre-commit unbypassable)

---

## 🛡️ Required Branch Protection Rules

### For `main` Branch

**Navigate to:** `Settings → Branches → Add rule`

**Branch name pattern:** `main`

**✅ Enable these settings:**

| Setting | Value | Purpose |
|---------|-------|---------|
| **Require status checks to pass before merging** | ✅ ENABLED | Blocks merge if CI fails |
| **Require branches to be up to date before merging** | ✅ ENABLED | Prevents stale merges |
| **Require conversation resolution before merging** | ✅ ENABLED | All comments must be resolved |
| **Include administrators** | ✅ ENABLED | No bypass even for admins |
| **Require pull request reviews before merging** | ✅ ENABLED | Human review required |
| **Required number of approvals** | `1` minimum | At least 1 approval |
| **Dismiss stale pull request approvals when new commits are pushed** | ✅ ENABLED | Re-approval needed after changes |
| **Restrict who can dismiss pull request reviews** | ✅ ENABLED | Prevent dismissal abuse |
| **Allow specific actors to dismiss pull request reviews** | `@architecture-team` | Only architects can dismiss |

**Status checks to require:**
- `architecture-gate (java)`
- `architecture-gate (python)`
- `architecture-gate (frontend)`
- `validate-commits`

---

### For `develop` Branch

**Branch name pattern:** `develop`

**✅ Enable these settings:**

Same as `main` branch, but you may optionally:
- Set "Required number of approvals" to `1` (same as main)
- Enable "Include administrators" (recommended)

---

## 📋 CODEOWNERS Configuration

**File:** `.github/CODEOWNERS` (already created)

**Purpose:** Require architecture team review for changes to critical paths.

**Protected paths:**
- `/domain/**` - Business logic (no frameworks allowed)
- `/application/**` - Use cases (no infrastructure allowed)
- Architecture tests
- Architecture documentation
- Docker Compose files
- Architecture guardrails scripts

**Reviewers:** `@architecture-team`

---

## 👥 Setting Up @architecture-team

**Steps:**

1. Go to repository **Settings** → **Collaborators and teams**
2. Click **New team** or select existing team
3. Name: `architecture-team`
4. Add members:
   - Lead architect(s)
   - Senior developers
   - Technical leads
5. Set permission level: `Write` (minimum)
6. Save

**Team responsibilities:**
- Review PRs touching domain/application layers
- Approve architecture compliance
- Dismiss reviews only when violations are truly resolved
- Maintain CODEOWNERS file

---

## 🔧 Testing Branch Protection

### Test 1: Bypass Attempt with --no-verify

```bash
# Try to bypass pre-commit hook
git commit --no-verify -m "feat: add feature without architecture check"

# Expected: Commit succeeds locally (hook bypassed)
# BUT: PR will be blocked by:
#   - CI/CD architecture-gate (fails)
#   - Commit validation workflow (fails)
#   - CODEOWNERS review required (cannot merge without approval)
```

### Test 2: Missing Architecture Evidence

```bash
# Commit without architecture evidence
git commit -m "feat: add feature"

# Expected: Commit-msg hook blocks commit
# Error: "Commit message must include architecture compliance evidence"
```

### Test 3: Architecture Violation in PR

```bash
# Create PR with domain layer importing Spring
# Expected:
#   - architecture-gate (java) fails ❌
#   - PR shows "Some checks haven't completed yet"
#   - Merge button disabled
#   - Cannot merge until fixed
```

---

## 🚨 What Cannot Be Bypassed

| Mechanism | Bypassable? | Consequence if Attempted |
|-----------|-------------|--------------------------|
| Pre-commit hook | ✅ Yes (`--no-verify`) | Still caught by CI/CD |
| Commit-msg hook | ✅ Yes (`--no-verify`) | Still caught by CI/CD |
| Branch protection | ❌ No | GitHub blocks merge |
| Status check requirements | ❌ No | GitHub blocks merge |
| CODEOWNERS review | ❌ No | GitHub blocks merge |
| CI/CD architecture-gate | ❌ No | GitHub blocks merge |
| Commit validation workflow | ❌ No | GitHub blocks merge |

**Bottom line:** Client-side hooks can be bypassed, but server-side enforcement CANNOT.

---

## 📊 Enforcement Flow

```
Developer makes change
       ↓
Pre-commit hook (can bypass with --no-verify)
       ↓
Commit-msg hook (can bypass with --no-verify)
       ↓
Push to remote
       ↓
CI/CD triggers:
  - architecture-gate (java/python/frontend)
  - validate-commits
       ↓
CODEOWNERS review required
       ↓
Branch protection checks:
  - All status checks must pass ✅
  - Required approvals received ✅
  - Branch up to date ✅
  - Conversations resolved ✅
       ↓
Merge allowed ✅
```

---

## 🎯 Success Criteria

- [x] CODEOWNERS file created with architecture-critical paths
- [x] Branch protection rules documented
- [x] CI/CD enhanced with explicit failure handling
- [x] Commit validation workflow created (from #80)
- [x] Bypass attempt logging script created
- [ ] Branch protection rules configured in GitHub (manual step)
- [ ] @architecture-team created (manual step)

---

## 📝 Manual Configuration Checklist

**After merging this PR, repository administrators must:**

### 1. Configure Branch Protection

- [ ] Go to Settings → Branches → Add rule
- [ ] Create rule for `main` branch (see settings above)
- [ ] Create rule for `develop` branch (see settings above)
- [ ] Add required status checks:
  - [ ] `architecture-gate (java)`
  - [ ] `architecture-gate (python)`
  - [ ] `architecture-gate (frontend)`
  - [ ] `validate-commits`

### 2. Create Architecture Team

- [ ] Go to Settings → Collaborators and teams
- [ ] Create team: `architecture-team`
- [ ] Add team members (architects, tech leads)
- [ ] Set permission level: `Write`

### 3. Test Enforcement

- [ ] Create test PR with architecture violation
- [ ] Verify CI/CD blocks merge
- [ ] Verify CODEOWNERS review required
- [ ] Test bypass attempt with `--no-verify`
- [ ] Verify server-side checks still block

---

## 🔗 Related Documentation

- Issue #82: Make pre-commit unbypassable
- AGENTS.md: Mandatory Architecture Compliance section
- `.github/CODEOWNERS`: Architecture review requirements
- `.github/workflows/architecture-gate.yml`: CI/CD enforcement
- `.github/workflows/commit-validation.yml`: Commit message validation

---

**Last Updated:** 2026-05-27  
**Status:** Ready for manual configuration
