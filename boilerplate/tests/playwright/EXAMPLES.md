# E2E Test Examples

> **For:** Copy-paste ready code examples  
> **Purpose:** Full working examples for common test patterns

---

## Example 1: New Feature Test File

**File:** `e2e/discount.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Discount Codes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.getByPlaceholder('Username').fill('admin');
    await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Welcome')).toBeVisible();
  });

  test('applies valid discount to order total', async ({ page }) => {
    await page.goto('http://localhost:5173/orders/new');
    await page.getByLabel('Customer ID').fill('550e8400-e29b-41d4-a716-446655440001');
    await page.getByLabel('Discount Code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('10% discount applied')).toBeVisible();
    await expect(page.getByText('Total:')).toContainText(/\d+\.\d{2}/);
  });

  test('rejects invalid discount code', async ({ page }) => {
    await page.goto('http://localhost:5173/orders/new');
    await page.getByLabel('Discount Code').fill('INVALID');
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('Invalid discount code')).toBeVisible();
  });

  test('prevents discount on shipping cost', async ({ page }) => {
    await page.goto('http://localhost:5173/orders/new');
    await page.getByLabel('Discount Code').fill('SAVE10');
    await page.getByRole('button', { name: 'Apply' }).click();
    const total = await page.getByText('Total:').textContent();
    expect(total).not.toContain('shipping discount');
  });
});
```

---

## Example 2: Bug Fix (Regression Test)

**File:** `e2e/orders.spec.ts` (add to existing file)

```typescript
test('regression: #123 - discount applies to subtotal only', async ({ page }) => {
  await page.goto('http://localhost:5173/login');
  await page.getByPlaceholder('Username').fill('admin');
  await page.getByPlaceholder('Password', { exact: true }).fill('admin123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  
  await page.goto('http://localhost:5173/orders/new');
  await page.getByLabel('Customer ID').fill('550e8400-e29b-41d4-a716-446655440001');
  await page.getByLabel('Discount Code').fill('SAVE10');
  await page.getByRole('button', { name: 'Apply' }).click();
  
  // This test would have caught the bug
  const total = await page.getByText('Total:').textContent();
  expect(total).not.toContain('shipping discount');
});
```

**Workflow:**
1. Add this test FIRST (before fixing the bug)
2. Run: `npm run e2e -- --grep "regression"` → Should FAIL ❌
3. Implement the fix
4. Run again: `npm run e2e -- --grep "regression"` → Should PASS ✅

---

## Example 3: UI Component Change

**Before (bad selectors):**
```typescript
test('submits order form', async ({ page }) => {
  await page.goto('http://localhost:5173/orders/new');
  await page.locator('.btn-primary').click();
  await page.locator('.modal-content > div:nth-child(2) > span').click();
});
```

**After (robust selectors):**
```typescript
test('submits order form', async ({ page }) => {
  await page.goto('http://localhost:5173/orders/new');
  await page.getByRole('button', { name: 'Submit Order' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
});
```

**Selector Priority (best to worst):**
1. `getByRole('button', { name: '...' })` - Most accessible
2. `getByLabel('...')` - For form inputs
3. `getByPlaceholder('...')` - For input fields
4. `getByText('...')` - For static text
5. `locator('...')` - Last resort (CSS/XPath)

---

## Example 4: Page Object Model

**File:** `fixtures/pages/OrdersPage.ts`

```typescript
import { Page, Locator } from '@playwright/test';

export class OrdersPage {
  readonly page: Page;
  readonly customerInput: Locator;
  readonly discountInput: Locator;
  readonly applyButton: Locator;
  readonly submitButton: Locator;
  readonly totalText: Locator;

  constructor(page: Page) {
    this.page = page;
    this.customerInput = page.getByLabel('Customer ID');
    this.discountInput = page.getByLabel('Discount Code');
    this.applyButton = page.getByRole('button', { name: 'Apply' });
    this.submitButton = page.getByRole('button', { name: 'Submit Order' });
    this.totalText = page.getByText('Total:');
  }

  async goto() {
    await this.page.goto('http://localhost:5173/orders/new');
  }

  async fillCustomer(customerId: string) {
    await this.customerInput.fill(customerId);
  }

  async applyDiscount(code: string) {
    await this.discountInput.fill(code);
    await this.applyButton.click();
  }

  async submit() {
    await this.submitButton.click();
  }

  async getTotal(): Promise<string> {
    return await this.totalText.textContent();
  }
}
```

**Usage in test:**
```typescript
import { test, expect } from '@playwright/test';
import { OrdersPage } from '../fixtures/pages/OrdersPage';

test.describe('Orders', () => {
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    ordersPage = new OrdersPage(page);
    await ordersPage.goto();
  });

  test('applies discount', async ({ page }) => {
    await ordersPage.fillCustomer('550e8400-e29b-41d4-a716-446655440001');
    await ordersPage.applyDiscount('SAVE10');
    const total = await ordersPage.getTotal();
    expect(total).toContain(/\d+\.\d{2}/);
  });
});
```

---

## Example 5: API Testing

**File:** `e2e/api/orders-api.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Orders API', () => {
  const API_BASE = 'http://localhost:8080';
  const AUTH_TOKEN = 'test-token';

  test('GET /orders returns list', async ({ request }) => {
    const response = await request.get(`${API_BASE}/orders`, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const orders = await response.json();
    expect(Array.isArray(orders)).toBeTruthy();
  });

  test('POST /orders creates new order', async ({ request }) => {
    const newOrder = {
      customerId: '550e8400-e29b-41d4-a716-446655440001',
      items: [{ productId: 'prod-1', quantity: 2 }]
    };

    const response = await request.post(`${API_BASE}/orders`, {
      headers: { 
        'Authorization': AUTH_TOKEN,
        'Content-Type': 'application/json'
      },
      data: newOrder
    });
    
    expect(response.status()).toBe(201);
    const order = await response.json();
    expect(order.id).toBeDefined();
    expect(order.customerId).toBe(newOrder.customerId);
  });

  test('GET /orders/:id returns 404 for non-existent', async ({ request }) => {
    const response = await request.get(`${API_BASE}/orders/non-existent-id`, {
      headers: { 'Authorization': AUTH_TOKEN }
    });
    
    expect(response.status()).toBe(404);
  });
});
```

---

## Example 6: Handling Loading States

```typescript
test('shows loading state during submission', async ({ page }) => {
  await page.goto('http://localhost:5173/orders/new');
  await page.getByLabel('Customer ID').fill('550e8400-e29b-41d4-a716-446655440001');
  await page.getByRole('button', { name: 'Submit Order' }).click();
  
  // Wait for loading spinner
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByText('Submitting...')).toBeVisible();
  
  // Wait for success message
  await expect(page.getByText('Order created successfully')).toBeVisible({ timeout: 10000 });
});
```

---

## Example 7: Handling Network Requests

```typescript
test('waits for API response before proceeding', async ({ page }) => {
  await page.goto('http://localhost:5173/orders/new');
  
  // Wait for initial data load
  await page.waitForResponse('/api/orders', { timeout: 10000 });
  
  // Fill and submit
  await page.getByLabel('Customer ID').fill('550e8400-e29b-41d4-a716-446655440001');
  
  // Wait for POST request
  const [response] = await Promise.all([
    page.waitForResponse(res => 
      res.url().includes('/api/orders') && 
      res.request().method() === 'POST'
    ),
    page.getByRole('button', { name: 'Submit Order' }).click()
  ]);
  
  expect(response.status()).toBe(201);
});
```

---

## Running Examples

```bash
# Run specific example file
npm run e2e -- e2e/discount.spec.ts

# Run tests matching pattern
npm run e2e -- --grep "discount"

# Debug specific test
npm run e2e:debug -- --grep "discount"

# Run in UI mode
npm run e2e:ui
```

---

## More Examples

- **Smoke tests:** See `e2e/smoke.spec.ts`
- **Authentication:** See `e2e/auth.spec.ts`
- **Full suite:** Run `npm run e2e` and check `e2e/` directory

---

**Last Updated:** 2026-05-26 | **Issue:** [#74](https://github.com/leonardsoetedjo/app-architecture-template/issues/74)
