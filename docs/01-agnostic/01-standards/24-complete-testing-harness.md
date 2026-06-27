---
title: "Complete Testing Harness Guide"
number: "24"
type: "Standard"
created: "2026-06-27"
status: "active"
---
# Complete Testing Harness Guide

> **Version:** 1.0 | **Date:** 2026-06-14 | **Status:** Active

Comprehensive testing harness for all layers: unit, integration, API, contract, UI, database, and deployment testing across Python, Java, Node.js, and TypeScript.

---

## 📊 Testing Pyramid 2026

```
                    ┌─────────────┐
                   │   E2E (10%)  │  Playwright, Cypress
                  ├───────────────┤
                 │  Contract (15%) │  Pact, Schemathesis
                ├─────────────────┤
               │  Integration (25%)│  Testcontainers, pytest
              ├───────────────────┤
             │    Unit (50%)      │  pytest, JUnit, Vitest
            └─────────────────────┘
```

**Key Insight:** API tests run 10-50x faster than E2E tests and catch 80% of backend bugs. Invest 40%+ of test effort at API layer.

---

## 🧪 Unit Testing

### Python (pytest)

**Tools:** pytest, pytest-asyncio, pytest-mock

**Installation:**
```bash
pip install pytest pytest-asyncio pytest-mock
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    python-unit:
      glob: "tests/unit/*.py"
      run: cd boilerplate/python && pytest tests/unit/ -v --tb=short
```

**Test Example:**
```python
# tests/unit/test_order_service.py
import pytest
from unittest.mock import Mock
from src.services.order_service import OrderService

@pytest.mark.asyncio
async def test_create_order_validates_items():
    mock_repo = Mock()
    service = OrderService(mock_repo)
    
    with pytest.raises(ValueError, match="Items required"):
        await service.create_order(customer_id="cust_123", items=[])
    
    assert mock_repo.save.called is False
```

---

### Java (JUnit 5)

**Tools:** JUnit 5, Mockito, AssertJ

**Installation:**
```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    java-unit:
      glob: "src/test/java/**/*Test.java"
      run: cd boilerplate/java && mvn test -Dtest=*Test -q
```

**Test Example:**
```java
// OrderServiceTest.java
@Test
void createOrder_WithEmptyItems_ThrowsValidationException() {
    OrderService service = new OrderService(mockRepository);
    
    assertThatThrownBy(() -> service.createOrder("cust_123", List.of()))
        .isInstanceOf(ValidationException.class)
        .hasMessageContaining("Items required");
    
    verify(mockRepository, never()).save(any());
}
```

---

### TypeScript (Vitest)

**Tools:** Vitest, @testing-library/react, MSW

**Installation:**
```bash
npm install -D vitest @testing-library/react msw
```

**Pre-commit Hook:**
```yaml
# lefthook.yml
pre-commit:
  commands:
    react-unit:
      glob: "src/**/*.test.tsx"
      run: cd boilerplate/reactjs && npm run test:unit
```

**Test Example:**
```typescript
// OrderForm.test.tsx
import { render, screen } from '@testing-library/react';
import { OrderForm } from './OrderForm';

test('shows validation error for empty items', async () => {
  render(<OrderForm />);
  
  const submitButton = screen.getByRole('button', { name: /submit/i });
  await userEvent.click(submitButton);
  
  expect(await screen.findByText('Items required')).toBeInTheDocument();
});
```

---

## 🗄️ Database Testing

### Testcontainers (All Languages)

**Why Testcontainers:**
- ✅ Real databases in Docker (not mocks)
- ✅ Isolated per test (no state leakage)
- ✅ CI/CD ready (works anywhere Docker runs)
- ✅ Supports PostgreSQL, MySQL, Redis, MongoDB, Kafka

---

### Python (Testcontainers + pytest)

**Installation:**
```bash
pip install testcontainers[postgresql,redis] pytest
```

**Test Example:**
```python
# tests/integration/test_order_repository.py
import pytest
from testcontainers.postgres import PostgresContainer
from sqlalchemy import create_engine

@pytest.fixture
def postgres_container():
    with PostgresContainer("postgres:15-alpine") as postgres:
        yield postgres

def test_repository_saves_order(postgres_container):
    engine = create_engine(postgres_container.get_connection_url())
    repo = OrderRepository(engine)
    
    order = Order(customer_id="cust_123", total=99.99)
    saved = repo.save(order)
    
    assert saved.id is not None
    assert repo.get_by_id(saved.id) == saved
```

---

### Java (Testcontainers + JUnit)

**Installation:**
```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.0</version>
    <scope>test</scope>
</dependency>
```

**Test Example:**
```java
@Testcontainers
class OrderRepositoryTest {
    
    @Container
    static PostgreSQLContainer<?> postgres = 
        new PostgreSQLContainer<>("postgres:15-alpine");
    
    @Test
    void savesOrderSuccessfully() {
        String url = postgres.getJdbcUrl();
        OrderRepository repo = new OrderRepository(url);
        
        Order order = new Order("cust_123", BigDecimal.valueOf(99.99));
        Order saved = repo.save(order);
        
        assertThat(saved.getId()).isNotNull();
        assertThat(repo.findById(saved.getId())).isPresent();
    }
}
```

---

### Go (Testcontainers)

**Installation:**
```bash
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
```

**Test Example:**
```go
func TestRepository_SavesOrder(t *testing.T) {
    ctx := context.Background()
    
    container, err := postgres.Run(ctx, "postgres:15-alpine")
    testcontainers.CleanupContainer(t, container)
    
    connStr, _ := container.ConnectionString(ctx)
    db, _ := sql.Open("pgx", connStr)
    
    repo := NewOrderRepository(db)
    order := Order{CustomerID: "cust_123", Total: 99.99}
    
    saved := repo.Save(ctx, order)
    assert.NotNil(t, saved.ID)
}
```

---

## 🔌 API Testing

### Python (httpx + pytest)

**Installation:**
```bash
pip install httpx pytest-asyncio
```

**Test Example:**
```python
# tests/api/test_orders_api.py
import pytest
import httpx

@pytest.mark.asyncio
async def test_create_order(api_client):
    payload = {"customer_id": "cust_123", "items": [{"product_id": "prod_1", "quantity": 2}]}
    
    async with httpx.AsyncClient() as client:
        response = await client.post("/orders", json=payload)
    
    assert response.status_code == 201
    assert response.json()["id"] is not None
    assert response.json()["status"] == "PENDING"
```

---

### Java (REST Assured)

**Installation:**
```xml
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
</dependency>
```

**Test Example:**
```java
@Test
void createOrder_Returns201WithValidPayload() {
    given()
        .contentType(ContentType.JSON)
        .body("{\"customer_id\": \"cust_123\", \"items\": []}")
    .when()
        .post("/orders")
    .then()
        .statusCode(201)
        .body("id", notNullValue())
        .body("status", equalTo("PENDING"));
}
```

---

### TypeScript (Playwright API)

**Installation:**
```bash
npm install -D @playwright/test
```

**Test Example:**
```typescript
// tests/api/orders.spec.ts
import { test, expect } from '@playwright/test';

test('POST /orders creates order', async ({ request }) => {
  const response = await request.post('/api/orders', {
    data: {
      customer_id: 'cust_123',
      items: [{ product_id: 'prod_1', quantity: 2 }]
    }
  });
  
  expect(response.status()).toBe(201);
  const json = await response.json();
  expect(json.id).toBeDefined();
  expect(json.status).toBe('PENDING');
});
```

---

## 📜 Contract Testing

### Pact (Consumer-Driven Contracts)

**Why Pact:**
- ✅ Consumer-driven (prevents breaking changes)
- ✅ Fast (seconds, not minutes)
- ✅ Isolated (no full stack needed)
- ✅ CI/CD ready (Pact Broker for contract management)

---

### Node.js (Pact)

**Installation:**
```bash
npm install -D @pact-foundation/pact@^14.0.0
```

**Consumer Test:**
```typescript
// consumer/pact/consumer.test.ts
import { PactV4 } from '@pact-foundation/pact';

const provider = new PactV4({
  consumer: 'order-web',
  provider: 'order-api',
});

describe('Order Consumer', () => {
  it('returns order by ID', async () => {
    provider
      .given('order exists')
      .uponReceiving('GET /orders/123')
      .withRequest({ method: 'GET', path: '/orders/123' })
      .willRespondWith({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: '123',
          status: 'PENDING',
          total: 99.99,
        },
      });
    
    await provider.executeTest(async () => {
      const order = await orderClient.getOrder('123');
      expect(order.status).toBe('PENDING');
    });
  });
});
```

**Provider Test:**
```typescript
// provider/pact/provider.test.ts
import { Verifier } from '@pact-foundation/pact';

describe('Order Provider', () => {
  it('validates Pact contracts', async () => {
    const verifier = new Verifier({
      provider: 'order-api',
      providerBaseUrl: 'http://localhost:3000',
      pactBrokerUrl: 'https://pact-broker.example.com',
    });
    
    await verifier.verifyProvider();
  });
});
```

---

### Python (Pact)

**Installation:**
```bash
pip install pact-python
```

**Consumer Test:**
```python
# tests/contract/test_order_consumer.py
from pact import Consumer, Provider

pact = Consumer('OrderWeb').has_pact_with(Provider('OrderApi'))

def test_get_order():
    (pact
     .given('order exists')
     .upon_receiving('GET /orders/123')
     .with_request('GET', '/orders/123')
     .will_respond_with(200, body={'id': '123', 'status': 'PENDING'}))
    
    with pact:
        order = order_client.get_order('123')
        assert order['status'] == 'PENDING'
```

---

## 🖥️ UI/E2E Testing

### Playwright (Recommended for 2026)

**Why Playwright over Cypress:**
- ✅ **Cross-browser** (Chromium, Firefox, WebKit/Safari)
- ✅ **Multi-tab/window** testing
- ✅ **Parallel execution** (built-in, free)
- ✅ **Language agnostic** (JS, TS, Python, Java, C#)
- ✅ **4x faster** than Cypress in benchmarks

**Installation:**
```bash
# Node.js
npm install -D @playwright/test
npx playwright install

# Python
pip install playwright
playwright install

# Java
mvn install:install-file -Dplaywright
```

---

### TypeScript (Playwright)

**Pre-push Hook:**
```yaml
# lefthook.yml
pre-push:
  commands:
    playwright-e2e:
      run: cd boilerplate/reactjs && npx playwright test
```

**Test Example:**
```typescript
// tests/e2e/order-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete order flow', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('[name="email"]', 'user@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
  
  // Create order
  await page.click('text=New Order');
  await page.fill('[name="productId"]', 'prod_123');
  await page.fill('[name="quantity"]', '2');
  await page.click('button:has-text("Submit")');
  
  await expect(page.locator('.order-success')).toBeVisible();
  await expect(page.locator('[data-testid="order-status"]')).toHaveText('PENDING');
});
```

**Parallel Execution (CI):**
```yaml
# .github/workflows/e2e.yml
- name: Playwright tests
  run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
  strategy:
    matrix:
      shardIndex: [1, 2, 3, 4]
      shardTotal: [4]
```

---

### Python (Playwright)

**Installation:**
```bash
pip install playwright pytest-playwright
playwright install
```

**Test Example:**
```python
# tests/e2e/test_order_flow.py
from playwright.sync_api import Page, expect

def test_complete_order_flow(page: Page):
    page.goto("/login")
    page.fill('[name="email"]', 'user@example.com')
    page.click('button[type="submit"]')
    
    expect(page).to_have_url("/dashboard")
    
    page.click("text=New Order")
    page.fill('[name="productId"]', 'prod_123')
    page.click('button:has-text("Submit")')
    
    expect(page.locator('.order-success')).to_be_visible()
```

---

## 🚀 Deployment Testing

### Kubernetes Health Probes

**Liveness Probe** (Is the app dead? → Restart):
```yaml
# kubernetes/deployment.yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 8080
  initialDelaySeconds: 15
  periodSeconds: 20
  failureThreshold: 3
```

**Readiness Probe** (Can it handle traffic? → Remove from load balancer):
```yaml
readinessProbe:
  httpGet:
    path: /readyz
    port: 8080
  initialDelaySeconds: 5
  periodSeconds: 10
  failureThreshold: 3
```

**Critical Rule:** Never fail liveness probe due to external dependencies (database, cache). Use readiness probe for dependency checks.

---

### Smoke Testing

**Post-Deployment Validation:**
```bash
#!/bin/bash
# scripts/smoke-test.sh

set -e

echo "Running smoke tests..."

# Health check
curl -f http://localhost:8080/healthz || exit 1

# Database connectivity
curl -f http://localhost:8080/readyz || exit 1

# API smoke test
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/orders)
if [ "$response" != "200" ] && [ "$response" != "401" ]; then
  echo "Orders API smoke test failed"
  exit 1
fi

echo "All smoke tests passed!"
```

**Pre-push Hook:**
```yaml
# lefthook.yml
pre-push:
  commands:
    smoke-test:
      run: |
        docker-compose up -d
        sleep 10
        ./scripts/smoke-test.sh
        docker-compose down
```

---

### Integration Testing (Post-Deployment)

**Test Example:**
```python
# tests/deployment/test_integration.py
import httpx
import pytest

@pytest.mark.integration
def test_full_order_workflow():
    """Test complete order flow in deployed environment."""
    base_url = "https://staging.example.com"
    
    with httpx.Client() as client:
        # Login
        token = client.post(f"{base_url}/auth/login", 
                          json={"email": "test@example.com", "password": "test"}).json()["token"]
        
        # Create order
        order = client.post(f"{base_url}/api/orders",
                          json={"customer_id": "cust_123", "items": []},
                          headers={"Authorization": f"Bearer {token}"}).json()
        
        assert order["status"] == "PENDING"
        
        # Verify in database
        db_order = client.get(f"{base_url}/api/orders/{order['id']}",
                            headers={"Authorization": f"Bearer {token}"}).json()
        
        assert db_order["id"] == order["id"]
```

---

## 📊 Complete Validation Matrix

| Layer | Tool | Python | Java | TypeScript | When |
|-------|------|--------|------|------------|------|
| **Unit** | Framework | pytest | JUnit 5 | Vitest | Pre-commit |
| **Integration** | Database | Testcontainers | Testcontainers | Testcontainers | Pre-push |
| **API** | HTTP Client | httpx | REST Assured | Playwright API | Pre-push |
| **Contract** | CDC | Pact | Pact | Pact | Pre-push |
| **E2E** | Browser | Playwright | Playwright | Playwright | Pre-merge |
| **Deployment** | Smoke | curl/pytest | curl/pytest | curl/pytest | Post-deploy |
| **Database** | Migration | Alembic | Flyway | Prisma | Pre-commit |
| **Docker** | Lint | hadolint | hadolint | hadolint | Pre-commit |

---

## 🎯 Recommended Test Distribution

```
Unit Tests:        50% (fast, isolated, deterministic)
Integration Tests: 25% (database, external services)
Contract Tests:    15% (API boundaries, consumer expectations)
E2E Tests:         10% (critical user journeys only)
```

**Why:** API tests catch 80% of bugs at 10-50x the speed of E2E tests. Invest accordingly.

---

## 🔧 Tool Installation Summary

### Python
```bash
# Unit & Integration
pip install pytest pytest-asyncio pytest-mock testcontainers[postgresql,redis]

# API Testing
pip install httpx pytest-httpx

# Contract Testing
pip install pact-python

# UI Testing
pip install playwright pytest-playwright
playwright install
```

### Java
```xml
<!-- Unit & Integration -->
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>5.11.0</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <version>1.19.0</version>
    <scope>test</scope>
</dependency>

<!-- API Testing -->
<dependency>
    <groupId>io.rest-assured</groupId>
    <artifactId>rest-assured</artifactId>
    <version>5.4.0</version>
    <scope>test</scope>
</dependency>

<!-- Contract Testing -->
<dependency>
    <groupId>au.dius</groupId>
    <artifactId>pact-jvm-provider</artifactId>
    <version>4.6.0</version>
    <scope>test</scope>
</dependency>
```

### TypeScript
```bash
# Unit & Integration
npm install -D vitest @testing-library/react @testing-library/user-event

# API Testing
npm install -D @playwright/test

# Contract Testing
npm install -D @pact-foundation/pact@^14.0.0

# UI Testing
npm install -D @playwright/test
npx playwright install
```

---

## 📚 References

- **Testcontainers:** https://testcontainers.com/
- **Playwright:** https://playwright.dev/
- **Pact:** https://docs.pact.io/
- **REST Assured:** https://rest-assured.io/
- **pytest:** https://docs.pytest.org/
- **JUnit 5:** https://junit.org/junit5/
- **Vitest:** https://vitest.dev/
- **Standard 21:** `docs/01-agnostic/01-standards/21-validation-harness.md`
- **Standard 23:** `docs/01-agnostic/01-standards/23-database-docker-validation.md`
