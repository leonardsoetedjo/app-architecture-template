# Pact Contract Tests

Consumer-driven contract tests for the Order Service API.

## What is Contract Testing?

Contract testing validates that the backend API implementation matches frontend expectations. Unlike type generation (OpenAPI → TypeScript), contract testing validates:

- Enum values (all possible values)
- HTTP status codes per endpoint
- Error response shapes
- Actual response vs. contract

## Running Tests

### Consumer Tests (ReactJS)

```bash
cd boilerplate/reactjs
npm run test:pact
```

This runs the consumer Pact tests and generates a contract file in `tests/pact/contracts/`.

### Provider Verification (Java)

```bash
cd boilerplate/java/order-service
mvn test -Dtest=OrderContractVerificationTest
```

**Note:** Provider tests require a running database. The `@State` methods need to seed test data before verification. The current implementation has stub `@State` methods — implement data seeding in a real project.

## Contract File

After running consumer tests, the contract is written to:

```
tests/pact/contracts/react-frontend-order-service.json
```

This file is consumed by the Java provider verification test via `@PactFolder("../reactjs/tests/pact/contracts")`.

## CI Integration

```yaml
# .github/workflows/contract-testing.yml
name: Contract Testing

on: [pull_request]

jobs:
  consumer:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: cd boilerplate/reactjs && npm ci && npm run test:pact

  provider:
    runs-on: ubuntu-latest
    needs: consumer
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: '17'
          distribution: 'temurin'
      - run: cd boilerplate/java/order-service && mvn test -Dtest=OrderContractVerificationTest
```

## When to Update Contracts

| Scenario | Action |
|----------|--------|
| Frontend changes expected response shape | Update `orders.pact.test.ts`, run `npm run test:pact` |
| Backend adds new field | Consumer test auto-passes (extra fields ignored). Update if frontend needs it. |
| Backend changes enum value | Both consumer + provider tests fail. Coordinate update. |
| Backend removes field | Consumer test fails. Update frontend + contract. |

## Resources

- [Pact Documentation](https://docs.pact.io/)
- [Standard 06: API Contract Governance](../docs/01-agnostic/01-standards/06-api-contract.md)
