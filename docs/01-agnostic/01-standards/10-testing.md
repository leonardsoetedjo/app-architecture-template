---
name: "Testing Standards & Test Case Design"
type: "Standard"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# Testing Standards & Test Case Design

This document defines the mandatory structure and directives for creating test cases across all platforms. The goal is to ensure that tests are deterministic, traceable, and easily interpretable by both human developers and AI agents.

## 1. Test Case Template

Every test case must be documented using the following structure. This ensures consistency and allows AI agents to generate automation code directly from the specification.

### 📋 Fields Per Test Case

| Field | Requirement | Description |
| :--- | :--- | :--- |
| **Test Case ID** | `DOMAIN-NNN` | Unique identifier. Format: `[Domain/Module]-[Number]` (e.g., `ORDER-001`). |
| **Intent** | Mandatory | A concise description of the specific behavior or business rule being verified. |
| **Actor** | Mandatory | The entity executing the test. Options: `pytest automation`, `pytest-asyncio fixture`, or `human developer`. |
| **Steps** | Mandatory | A numbered, ordered sequence of actions required to reproduce the scenario. |
| **Expected Result** | Mandatory | The exact correct outcome, including specific HTTP codes, database states, or UI changes. |
| **Remarks** | Optional | Notes on edge cases, timing constraints, production defaults, or known gaps. |

---

### 📝 Example Test Case
**ID**: `ORDER-001`  
**Intent**: Verify that an order cannot be created with an empty items list.  
**Actor**: `pytest automation`  
**Steps**:
1. Authenticate as a valid user.
2. Send a `POST /api/v1/orders` request with a valid `customer_id` but an empty `items` array.
3. Capture the response.  
**Expected Result**: 
- HTTP Status: `422 Unprocessable Entity`.
- Response Body: Contains a semantic error message: `"Order must have at least one item"`.
- Database: No record is created in the `orders` table.  
**Remarks**: This tests the semantic validation in the `PlaceOrderUseCase`.

## 2. AI Agent Directives

When generating test cases or automation code, AI agents **MUST** adhere to the following:

1. **Zero Assumption**: Do not assume state. Every test case must start with the "Steps" to establish the necessary preconditions (e.g., "Create a user", "Seed product data").
2. **Atomic Verification**: One test case = one behavior. Do not bundle multiple intents into a single ID.
3. **Assertion Precision**: Avoid vague expected results like "Success". Use specific markers: "HTTP 201", "Field `status` is `PENDING`", "Log contains `X-Correlation-ID`".
4. **Negative First**: For every "Happy Path" case, create at least two "Sad Path" cases (e.g., unauthorized access, invalid input, resource not found).

## 3. Recommended Good Practices

To ensure high confidence and maintainability, apply these patterns:

### 🟢 BDD Formatting
Use the **Given-When-Then** approach within the "Steps" and "Expected Result" sections:
- **Given**: The initial state (Preconditions).
- **When**: The action being tested (Trigger).
- **Then**: The observable outcome (Verification).

### 🟢 Idempotency Testing
For all `POST` and `PUT` operations, include a test case that executes the same request twice with the same `Idempotency-Key` to verify that no duplicate resources are created.

### 🟢 Boundary Analysis
Explicitly test the "edges" of your logic:
- **Empty Sets**: Empty lists, empty strings.
- **Extreme Values**: Max/Min integers, very large payloads.
- **Nulls**: Missing optional fields.

### 🟢 Observability Validation
Don't just test the response; test the side effects. Verify that:
- The correct **Domain Event** was published to the Outbox.
- The logs contain the correct **Correlation-ID**.
- The audit trail was updated.

### 🟢 Test Isolation
Ensure tests are independent. Use unique identifiers (UUIDs) for every test run to avoid collisions in shared databases. Cleanup data using fixtures or transaction rollbacks.
