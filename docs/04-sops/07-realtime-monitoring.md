---
name: "Real-time Architecture Monitoring"
type: "sop"
audience: ["human", "ai-agent"]
related: ["sop-01", "sop-02", "architecture-monitor", "check-file-architecture"]
tags: ["monitoring", "real-time", "architecture", "auto-revert", "violations"]
last_verified: "2026-05-27"
---

# Real-time Architecture Monitoring

**Purpose:** Catch architecture violations as AI agents write code, before commit.

**Related Issue:** #83 (Real-time AI agent monitoring)

---

## 🎯 Overview

Traditional architecture checks run at commit time or PR time - too late in the development cycle. Real-time monitoring catches violations **as code is written**, preventing wasted effort on code that will be rejected.

**Benefits:**
- Immediate feedback (<5 seconds)
- Auto-revert violating changes
- Prevents accumulation of technical debt
- Educational - helps AI agents learn patterns

---

## 🛠️ Components

### 1. Background Monitor (`scripts/architecture-monitor.py`)

A file watcher that monitors source files and validates architecture in real-time.

**Features:**
- Watches `.py`, `.java`, `.ts`, `.tsx`, `.js`, `.jsx`, `.vue` files
- Skips test files and non-critical paths
- Auto-reverts violating files to last committed version
- Logs violations to `.github/architecture-violations.log`
- Escalates after 3+ violations in a session

**Usage:**
```bash
# Install dependency
pip install watchdog

# Start monitoring
python scripts/architecture-monitor.py

# Output:
# 🛡️  Architecture Monitor
# ============================================================
# Watching: /path/to/project
# File types: .py, .java, .ts, .tsx, .js, .jsx, .vue
# ...
# Press Ctrl+C to stop
```

**Example session:**
```
🔍 Checking architecture: src/domain/Order.py
  ❌ VIOLATION DETECTED in src/domain/Order.py
     Layer: domain
     Forbidden imports found: ['from fastapi import']
  📝 Logged violation #1
  🔄 Auto-reverting src/domain/Order.py...
  ✅ Reverted successfully

🔍 Checking architecture: src/domain/Product.py
  ✅ src/domain/Product.py passes architecture check
```

### 2. File-level Checker (`scripts/check-file-architecture.sh`)

Standalone script to check a single file's architecture compliance.

**Usage:**
```bash
# Check specific file
./scripts/check-file-architecture.sh src/domain/Order.java

# Output:
# 🔍 Checking architecture: src/domain/Order.java
#    Layer: domain
#    Type: java
# ✅ src/domain/Order.java passes architecture check
```

**Integration:**
- Used by background monitor
- Can be called from IDE hooks
- Useful for manual checks

---

## 🔧 Integration with delegate_task

When delegating tasks to subagents, enable real-time validation:

```python
from hermes_tools import delegate_task

delegate_task(
    goal="Implement order validation feature",
    context="""
    MANDATORY WORKFLOW:
    1. Start architecture monitor before coding:
       python scripts/architecture-monitor.py &
    
    2. Before ANY code change: run ./scripts/architecture-pre-commit.sh
    3. Paste output in response
    4. If fails: fix violations BEFORE proceeding
    
    Real-time monitor will:
    - Watch your file changes
    - Auto-revert violations
    - Alert after 3+ violations
    """,
    toolsets=['terminal', 'file'],
    # Auto-validate after each code change
    validation=[
        './scripts/check-file-architecture.sh <changed_file>',
        './scripts/architecture-pre-commit.sh'
    ],
    # Block on validation failure
    validation_mode='blocking'
)
```

---

## 📊 Escalation Policy

The monitor implements progressive escalation:

| Violations | Action |
|------------|--------|
| **1st** | Log violation, auto-revert |
| **2nd** | Log violation, auto-revert, warn |
| **3rd** | Create GitHub escalation issue |
| **4th+** | Continue logging, notify team |

**Escalation issue includes:**
- Violation count
- Session timestamp
- Recent violations from log
- Action items for architecture team

---

## 🎯 Architecture Layers Checked

### Domain Layer

**Location:** `src/domain/`, `src/main/java/**/domain/`

**Forbidden imports:**

| Language | Forbidden |
|----------|-----------|
| Java | `org.springframework.*`, `jakarta.persistence.*`, `javax.persistence.*`, `lombok.*` |
| Python | `fastapi`, `sqlalchemy`, `pydantic` |
| TypeScript/JavaScript | `infrastructure/*`, `@infrastructure/*` |

**Rationale:** Domain layer must be pure business logic, framework-agnostic.

### Application Layer

**Location:** `src/application/`, `src/main/java/**/application/`

**Forbidden imports:**

| Language | Forbidden |
|----------|-----------|
| Java | `@RestController`, `@Controller`, HTTP frameworks |
| Python | `infrastructure.*`, `@infrastructure/*` |
| TypeScript/JavaScript | `infrastructure/*`, `@infrastructure/*` |

**Rationale:** Application layer orchestrates use cases, not HTTP handling.

---

## 🚨 Auto-Revert Behavior

When a violation is detected:

1. **Immediate feedback** - Print violation details
2. **Log violation** - Add to `.github/architecture-violations.log`
3. **Auto-revert** - Run `git restore <file>` to revert to last commit
4. **Continue monitoring** - Don't stop on violations

**Example:**
```bash
# Developer writes:
from fastapi import FastAPI  # In domain layer - VIOLATION!

# Monitor detects:
🔍 Checking architecture: src/domain/Order.py
  ❌ VIOLATION DETECTED in src/domain/Order.py
     Layer: domain
     Forbidden imports found: ['from fastapi import']
  📝 Logged violation #1
  🔄 Auto-reverting src/domain/Order.py...
  ✅ Reverted successfully

# File is now reverted - developer must fix before continuing
```

---

## 📋 Best Practices

### For AI Agents

1. **Start monitor before coding**
   ```bash
   python scripts/architecture-monitor.py &
   ```

2. **Watch for auto-revert messages**
   - If file reverts, check what import caused it
   - Move framework code to infrastructure layer

3. **Learn from violations**
   - Review `.github/architecture-violations.log`
   - Understand why import was forbidden
   - Apply pattern to future code

### For Human Developers

1. **Use as educational tool**
   - Monitor helps learn Clean Architecture patterns
   - Immediate feedback accelerates learning

2. **Review escalation issues**
   - When escalation issue created, review root cause
   - Update AI agent instructions if pattern repeats

3. **Tune monitor sensitivity**
   - Adjust forbidden patterns as needed
   - Add new patterns for project-specific rules

---

## 🔧 Customization

### Add New Language Support

Edit `scripts/architecture-monitor.py`:

```python
# Add to should_check_file()
if file_path.suffix not in ['.py', '.java', '.ts', '.tsx', '.js', '.jsx', '.vue', '.go']:
    return False

# Add to check_file_architecture()
if file_path.suffix == '.go':
    if '/domain/' in file_str:
        forbidden_pattern = r'import.*gin|import.*gorm'  # Example
```

### Adjust Violation Thresholds

Edit escalation logic in `ArchitectureMonitor.escalate_if_needed()`:

```python
# Change from 3 to 5 violations before escalation
if self.violation_count >= 5:
    # ... escalation code
```

### Add Custom Patterns

Edit forbidden patterns in `check_file_architecture()`:

```bash
# Add project-specific patterns
if [ "$LAYER" = "domain" ] && [ "$EXT" = "py" ]; then
  FORBIDDEN_PATTERN="import fastapi|import sqlalchemy|from myproject.infrastructure"
fi
```

---

## 📊 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to detect violations | <5 seconds | Monitor log timestamps |
| Violations auto-fixed | 100% | Auto-revert success rate |
| Manual review required | 0% (common violations) | Escalation issue count |
| AI agent learning rate | Improving over time | Violations per session trend |

---

## 🐛 Troubleshooting

### Monitor doesn't start

```bash
# Check if watchdog is installed
pip install watchdog

# Verify file permissions
chmod +x scripts/architecture-monitor.py
```

### False positives

```bash
# Review forbidden patterns in check-file-architecture.sh
# Adjust regex if too broad
```

### Auto-revert fails

```bash
# Ensure file is tracked by git
git status

# If untracked, monitor won't revert (expected behavior)
```

---

## 🔗 Related Documentation

- Issue #83: Real-time AI agent monitoring
- `scripts/architecture-monitor.py` - Background monitor
- `scripts/check-file-architecture.sh` - File-level checker
- `.github/architecture-violations.log` - Violation log
- AGENTS.md - AI agent requirements

---

**Last Updated:** 2026-05-27  
**Status:** Implemented
