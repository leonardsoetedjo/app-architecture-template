# API Schema Validation (Ajv + OpenAPI)

Runtime validation of backend API responses against the OpenAPI specification using Ajv during Playwright E2E tests.

## What This Catches

| What | How |
|------|-----|
| Missing required fields | Schema `required` array |
| Wrong types | `type: string` vs `type: integer` |
| Invalid enum values | `enum: ["PENDING", "CONFIRMED", ...]` |
| Bad monetary format | `pattern: "^\\d+\\.\\d{2}$"` |
| Wrong date format | `format: "date-time"` |
| Invalid UUIDs | `format: "uuid"` |
| Nullable violations | `nullable: true` → `{ oneOf: [schema, null] }` |

## File Layout

```
boilerplate/tests/playwright/
├── schemas/
│   └── openapi.json              ← Extracted from backend OpenAPI endpoint
├── utils/
│   └── api-validator.ts          ← validateResponse(), isValidResponse()
└── e2e/
    └── api-schema-validation.spec.ts   ← Tests using the validator
```

## Running Locally

### 1. Extract OpenAPI Spec

Start the backend, then extract its OpenAPI spec:

```bash
# Java (Spring Boot + springdoc)
curl -sf http://localhost:8080/api/v1/docs -o schemas/openapi.json

# NestJS (Swagger)
curl -sf http://localhost:3000/api/docs-json -o schemas/openapi.json

# Python (FastAPI)
curl -sf http://localhost:8000/openapi.json -o schemas/openapi.json
```

### 2. Run Schema Validation Tests

```bash
cd boilerplate/tests/playwright
npm install

# Run only API schema validation tests
npx playwright test e2e/api-schema-validation.spec.ts --project=api

# Run alongside full-stack E2E tests
npx playwright test --project=api --project=chromium
```

## Using `validateResponse()`

```typescript
import { test, expect } from '@playwright/test';
import { validateResponse } from '../utils/api-validator';

test('API response matches spec', async ({ request }) => {
  const response = await request.get('/api/v1/orders');
  const body = await response.json();

  // Throws detailed error if body doesn't match OpenAPI schema
  validateResponse('/api/v1/orders', 'GET', 200, body);
});
```

### Optional Validation (no throw)

```typescript
import { isValidResponse } from '../utils/api-validator';

const result = isValidResponse('/api/v1/orders', 'GET', 200, body);
if (!result.valid) {
  console.warn('Schema drift detected:', result.errors);
}
```

## Updating the OpenAPI Spec

The committed `schemas/openapi.json` is a **snapshot**. Before updating it:

1. Start the backend with your latest changes
2. Re-extract the spec (see step 1 above)
3. Run the schema validation tests — they will fail if the spec drifted
4. Fix either the backend or the spec until tests pass
5. Commit the updated `openapi.json`

In CI, the `e2e.yml` workflow automatically extracts the spec from the running backend before tests, so you'll catch drift immediately.

## How It Works

1. **Spec Loading**: `schemas/openapi.json` loaded as a JSON module
2. **Dereferencing**: The `dereference()` function resolves `$ref` pointers recursively and converts OpenAPI 3.0 `nullable: true` into Ajv-compatible `{ oneOf: [schema, { type: 'null' }] }`
3. **Compilation**: Each unique `(path, method, status)` schema is compiled once and cached in a `Map`
4. **Validation**: `ajv.compile()` produces a validator function that returns `true`/`false` with detailed error objects

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `$ref` not found | Spec references a schema that was removed | Regenerate from backend |
| `nullable` rejected | Ajv doesn't understand OpenAPI `nullable` | Already handled by dereference |
| Pattern `^\d+\.\d{2}$` fails | Backend sends `99.9` or `99` | Fix JacksonConfig or Decimal serialization |
| Missing `fieldErrors` | Backend returns different error shape | Update spec or backend |

## Related

- **Issue #224**: OpenAPI type generation (compile-time TypeScript)
- **Issue #231**: Pact.io contract testing (consumer/provider contracts)
- **Standard 25**: `docs/01-agnostic/01-standards/25-e2e-testing.md` §Schema Validation
