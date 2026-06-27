# SOP-36: Synchronize Backend/Frontend Domain Types

**Standard ID:** 36  
**Applies to:** All backend+frontend stack combinations  
**Category:** Type Safety / API Contract  
**Related Standards:** [06 API Contract](06-api-contract.md), [34 UTC Date](34-utc-date-standard.md), [35 Error Response](35-error-response-standard.md)  

---

## 1. Problem

Backend domain types (Java `BigDecimal`, Python `Decimal`) and frontend TypeScript types are manually maintained in parallel, leading to:

| Backend Type | Default JSON Serialization | Frontend Type | Risk |
|--------------|---------------------------|---------------|------|
| `BigDecimal` (Java) | `number` (IEEE 754) | `string` | **Precision loss** (1000.99 → 1000.9899999999) |
| `Decimal` (Python) | `string` (Pydantic default) | `string` | ✅ Safe |
| `UUID` (Java/Python) | `string` | `string` | ✅ Safe |
| `OffsetDateTime` (Java) | `string` (ISO 8601) | `string` | ✅ Safe |
| `LocalDateTime` (Java) | `string` | `string` | ⚠️ Timezone issues |

---

## 2. Solution: OpenAPI → TypeScript

**Workflow:**

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│ Backend DTOs     │────▶│ OpenAPI Spec    │────▶│ Generated TS   │
│ @Schema / Pydantic│     │ /v3/api-docs    │     │ src/generated/ │
└──────────────────┘     └─────────────────┘     └──────────────────┘
       │                                                       │
       │  CI: fail if generated types ≠ committed              │
       └───────────────────────────────────────────────────────┘
```

### 2.1 Backend DTO Requirements

#### Java: Annotate DTOs with `@Schema`

```java
public record OrderDetailResult(
    @Schema(description = "Order UUID", example = "550e8400-e29b-41d4-a716-446655440000")
    UUID orderId,

    @Schema(description = "Total order amount as string (BigDecimal)", example = "1000.99")
    BigDecimal totalAmount,   // ← serialized as string by JacksonConfig

    @Schema(description = "Current order status", example = "PENDING")
    OrderState status
) {}
```

#### Java: BigDecimal → String Serialization

Add `JacksonConfig.java` (already in template at `infrastructure/config/JacksonConfig.java`):

```java
@Configuration
public class JacksonConfig {
    @Bean
    @Primary
    public SimpleModule bigDecimalAsStringModule() {
        SimpleModule module = new SimpleModule();
        module.addSerializer(BigDecimal.class, new JsonSerializer<>() {
            @Override
            public void serialize(BigDecimal value, JsonGenerator gen, SerializerProvider serializers)
                    throws IOException {
                gen.writeString(value.toPlainString());
            }
        });
        return module;
    }
}
```

> **Result:** `BigDecimal` values serialize as JSON strings, preserving precision.

#### Python: Pydantic with `Decimal`

```python
from pydantic import BaseModel, Field
from decimal import Decimal

class OrderItemResponse(BaseModel):
    product_id: str = Field(alias="productId")
    quantity: int
    unit_price: Decimal = Field(alias="unitPrice")  # Pydantic serializes as string by default
```

> Pydantic v2 automatically serializes `Decimal` as JSON string. No extra config needed.

### 2.2 Generate TypeScript from OpenAPI

#### Install

```bash
# ReactJS
npm install --save-dev openapi-typescript
npm install --save decimal.js

# Quasar (already installed)
npm install --save decimal.js
```

#### Generate Command

```bash
# ReactJS / Quasar
npm run generate:api-types
```

This runs:

```bash
openapi-typescript http://localhost:8080/v3/api-docs -o src/generated/api.ts
```

#### Generated Output (Example)

```typescript
// src/generated/api.ts (auto-generated, DO NOT EDIT)

export interface OrderDetail {
    /** Order UUID */
    orderId: string;

    /** Total order amount as string (BigDecimal) */
    totalAmount: string;   // ← string, not number

    /** Current order status */
    status: "PENDING" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURNED" | "REFUNDED";

    /** Line items in this order */
    items: OrderItem[];

    /** When order was created */
    createdAt: string;
}

export interface OrderItem {
    /** Product UUID */
    productId: string;
    /** Quantity ordered */
    quantity: number;
    /** Unit price as string (BigDecimal) */
    unitPrice: string;     // ← string, not number
    /** Total line amount as string (BigDecimal) */
    totalAmount: string;
}
```

### 2.3 Frontend: Use `decimal.js` for Arithmetic

```typescript
import Decimal from 'decimal.js';

// API returns string — parse before arithmetic
const unitPrice = new Decimal(orderItem.unitPrice);
const quantity = new Decimal(orderItem.quantity);
const total = unitPrice.times(quantity);  // precise multiplication

// Display — format with locale
function formatMoney(amount: string): string {
    return new Decimal(amount).toFixed(2);  // "1000.99"
}
```

> **Never use `parseFloat()` or `Number()` on money fields.** These lose precision.

---

## 3. CI Integration

Add to `.github/workflows/` (or equivalent):

```yaml
      - name: Generate API types from backend
        run: |
          # Start backend in background (or use deployed URL)
          npm run generate:api-types

      - name: Fail if generated types differ from committed
        run: |
          if ! git diff --quiet src/generated/; then
            echo "❌ Generated API types differ from committed."
            echo "Run 'npm run generate:api-types' locally and commit changes."
            git diff src/generated/
            exit 1
          fi
```

---

## 4. Type Mapping Reference

| Backend Type | JSON Output | Generated TS Type | Frontend Usage |
|-------------|-------------|-------------------|----------------|
| Java `BigDecimal` | `"1000.99"` | `string` | `new Decimal(str)` |
| Python `Decimal` | `"1000.99"` | `string` | `new Decimal(str)` |
| NestJS `Decimal` | `"1000.99"` | `string` | `new Decimal(str)` |
| Java `UUID` | `"550e..."` | `string` | `string` (no conversion) |
| Python `UUID` | `"550e..."` | `string` | `string` (no conversion) |
| Java `OffsetDateTime` | `"2026-01-15T10:30:00+01:00"` | `string` | `new Date(str)` |
| Java `boolean` | `true` | `boolean` | `boolean` (no conversion) |
| Java `int` / `long` | `42` | `number` | `number` (safe for whole numbers) |
| Java `enum` | `"PENDING"` | union literal | `OrderStatusLiteral` |

---

## 5. Validation with Zod

Use Zod to validate API responses at runtime:

```typescript
import { z } from 'zod';
import Decimal from 'decimal.js';

const OrderItemSchema = z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    unitPrice: z.string().refine(
        val => {
            try {
                new Decimal(val);
                return true;
            } catch {
                return false;
            }
        },
        { message: "unitPrice must be a valid decimal string" }
    ),
    totalAmount: z.string(),
});

const OrderDetailSchema = z.object({
    orderId: z.string().uuid(),
    customerId: z.string().uuid(),
    status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'RETURNED', 'REFUNDED']),
    items: z.array(OrderItemSchema),
    totalAmount: z.string(),
    createdAt: z.string().datetime(),
    confirmedAt: z.string().datetime().nullable().optional(),
    isDeleted: z.boolean(),
});

// Validate at API boundary
const result = OrderDetailSchema.parse(await response.json());
```

---

## 6. Common Pitfalls

| Pitfall | Symptom | Fix |
|---------|---------|-----|
| `parseFloat(amount)` on money | Precision loss | Use `new Decimal(amountStr)` |
| Backend sends `BigDecimal` as `number` | 1000.99 → 1000.9899999999 | Add `JacksonConfig` with string serializer |
| Frontend uses `number` for money | TypeScript accepts it silently | Generate types from OpenAPI (forces `string`) |
| Enum value added to backend | Frontend compilation error | Regenerate types, update union |
| Manual type definitions | Drift over time | Use OpenAPI → TypeScript generation |
| `new Decimal(null)` | Runtime error | Validate with Zod before construction |

---

## 7. Per-Stack Quick Reference

### Java + ReactJS / Java + Quasar

| Step | Action |
|------|--------|
| 1 | Annotate DTOs with `@Schema` |
| 2 | Add `JacksonConfig.java` (BigDecimal → string) |
| 3 | Verify `/v3/api-docs` includes all response types |
| 4 | Frontend: `npm run generate:api-types` |
| 5 | Frontend: Use `new Decimal(amount)` for arithmetic |

### NestJS + ReactJS / NestJS + Quasar

| Step | Action |
|------|--------|
| 1 | DTOs already use `string` for Decimal (`.toString()`) |
| 2 | Add `@ApiProperty()` decorators to DTOs |
| 3 | Verify `/api-json` includes all response types |
| 4 | Frontend: `npm run generate:api-types` |
| 5 | Frontend: Use `new Decimal(amount)` for arithmetic |

### Python + ReactJS / Python + Quasar

| Step | Action |
|------|--------|
| 1 | Pydantic models already serialize Decimal as string |
| 2 | Add `Field(description=...)` to model fields |
| 3 | Verify `/openapi.json` includes all response types |
| 4 | Frontend: `npm run generate:api-types` |
| 5 | Frontend: Use `new Decimal(amount)` for arithmetic |

---

## 8. Verification Checklist

- [ ] All DTOs have `@Schema` (Java) or `Field()` (Python) annotations
- [ ] Java `JacksonConfig` serializes `BigDecimal` as string
- [ ] OpenAPI spec at `/v3/api-docs` (Java) or `/openapi.json` (Python) is accessible
- [ ] Frontend `npm run generate:api-types` produces no errors
- [ ] Generated types use `string` for money fields
- [ ] Frontend uses `decimal.js` (not `parseFloat`) for money arithmetic
- [ ] Zod schemas validate API responses at runtime
- [ ] CI fails if generated types differ from committed

---

*Last updated: 2026-06-27 | Standard 36 | Template v2.2*
