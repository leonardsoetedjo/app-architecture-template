---
title: "Template: Feature List (`feature-list.json`)"
number: "08"
type: "Template"
created: "2026-06-27"
status: "active"
---
# Template: Feature List (`feature-list.json`)

> **Purpose**: Starter template for the `feature-list.json` artifact used by the Agent Session Harness.
> **When to use**: The initializer agent creates this file at the start of every multi-session task.
> **Where it lives**: Repository root, tracked in git.
> **See also**: `docs/01-agnostic/01-standards/18-agent-session-harness.md`

---

## Structure

```json
{
  "version": "1.0",
  "project": "${PROJECT_NAME}",
  "generated_at": "${ISO8601_TIMESTAMP}",
  "features": []
}
```

## Feature Object Schema

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique ID. Format: `DOMAIN-NNN` matching test case IDs |
| `category` | string | Yes | `functional`, `non-functional`, `security`, `refactor`, `test`, `docs` |
| `priority` | integer | Yes | 1 = highest. Lower numbers merge first |
| `description` | string | Yes | One-sentence what the feature does |
| `acceptance_criteria` | string[] | Yes | Verifiable outcomes. Use specific codes/states |
| `passes` | boolean | Yes | `false` initially. Only field coding agents modify |
| `notes` | string | No | Free text. Coding agents append verification details |
| `depends_on` | string[] | No | IDs of features that must pass before this one |
| `estimated_sessions` | integer | No | How many agent sessions this feature typically needs |

## Example: Order Service

```json
{
  "version": "1.0",
  "project": "order-service",
  "generated_at": "2026-06-04T00:00:00Z",
  "generated_by": "initializer",
  "source_issue": "https://github.com/leonardsoetedjo/order-service/issues/42",
  "features": [
    {
      "id": "ORD-001",
      "category": "functional",
      "priority": 1,
      "description": "User can create an order with at least one item",
      "acceptance_criteria": [
        "POST /api/v1/orders returns 201 with order ID",
        "Order appears in database with PENDING status",
        "OrderPlaced domain event is published to outbox"
      ],
      "passes": false,
      "notes": "",
      "estimated_sessions": 1
    },
    {
      "id": "ORD-002",
      "category": "functional",
      "priority": 2,
      "description": "User can list their orders with pagination",
      "acceptance_criteria": [
        "GET /api/v1/orders returns 200 with paginated list",
        "Default page size is 20, max is 100",
        "Only orders for authenticated user are returned",
        "Total count included in response metadata"
      ],
      "passes": false,
      "notes": "",
      "depends_on": ["ORD-001"],
      "estimated_sessions": 1
    },
    {
      "id": "ORD-003",
      "category": "functional",
      "priority": 3,
      "description": "User can cancel a PENDING order",
      "acceptance_criteria": [
        "PATCH /api/v1/orders/{id}/cancel returns 200",
        "Order status changes to CANCELLED",
        "OrderCancelled domain event is published",
        "Already-shipped orders return 409 Conflict"
      ],
      "passes": false,
      "notes": "",
      "depends_on": ["ORD-001"],
      "estimated_sessions": 1
    },
    {
      "id": "ORD-SEC-001",
      "category": "security",
      "priority": 1,
      "description": "Only authenticated users can create orders",
      "acceptance_criteria": [
        "POST /api/v1/orders without JWT returns 401",
        "POST /api/v1/orders with invalid JWT returns 403",
        "User can only access their own orders"
      ],
      "passes": false,
      "notes": ""
    },
    {
      "id": "ORD-NF-001",
      "category": "non-functional",
      "priority": 4,
      "description": "Order creation endpoint p95 latency < 200ms",
      "acceptance_criteria": [
        "Load test: 100 RPS for 60s, p95 < 200ms",
        "No 5xx errors during load test",
        "Database connection pool stays below 80% utilization"
      ],
      "passes": false,
      "notes": ""
    }
  ]
}
```

## Rules for Coding Agents

1. **Only modify `passes` and `notes`**. Never remove, reorder, or edit `acceptance_criteria`.
2. **Set `passes: true` only after ALL acceptance criteria are verified**.
3. **Include verification evidence in `notes`** — which tests were run, commit hash, any caveats.
4. **Never set `passes: true` on a feature with unmet dependencies**.

## Rules for Initializer Agent

1. **Decompose the requirement into 15–50 features**. If more than 50, split into multiple GitHub issues.
2. **All `passes` must be `false`** when created.
3. **Priorities must be sequential** (1, 2, 3...) with no gaps.
4. **Every feature must have at least 2 acceptance criteria**.
5. **Map directly to test case IDs** from `docs/01-agnostic/01-standards/10-testing.md`.

## Validation Script

```bash
#!/usr/bin/env bash
# validate-feature-list.sh
set -e

FILE="feature-list.json"

if [ ! -f "$FILE" ]; then
  echo "ERROR: $FILE not found"
  exit 1
fi

# Validate JSON structure
python3 -c "
import json, sys
with open('$FILE') as f:
    data = json.load(f)

required = ['version', 'project', 'generated_at', 'features']
for key in required:
    if key not in data:
        print(f'ERROR: Missing key: {key}')
        sys.exit(1)

if not data['features']:
    print('ERROR: features array is empty')
    sys.exit(1)

for i, feat in enumerate(data['features']):
    for key in ['id', 'category', 'priority', 'description', 'acceptance_criteria', 'passes']:
        if key not in feat:
            print(f'ERROR: feature[{i}] missing key: {key}')
            sys.exit(1)
    if feat['passes']:
        print(f'WARNING: feature[{i}] {feat[\"id\"]} already marked as passing — initializer should not do this')

print(f'OK: {len(data[\"features\"])} features validated')
"
```

---

*Template version: 1.0*
*Part of Agent Session Harness standard*
