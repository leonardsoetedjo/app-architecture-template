/** Template Renderer Tests — Standalone, no yeoman-test needed. */
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

const ROOT = path.join(__dirname, '..');

function renderFile(tmplPath, context) {
  const template = fs.readFileSync(tmplPath, 'utf8');
  return ejs.render(template, context, { filename: tmplPath });
}

const GREEN = '\u001b[32m';
const RED = '\u001b[31m';
const RESET = '\u001b[0m';

let passCount = 0;
let failCount = 0;

function assert(ok, msg) {
  if (ok) {
    console.log(`${GREEN}  ✔${RESET} ${msg}`);
    passCount++;
  } else {
    console.log(`${RED}  ✘ ${msg}${RESET}`);
    failCount++;
  }
}

function renderFile(tmplPath, context) {
  const template = fs.readFileSync(tmplPath, 'utf8');
  return ejs.render(template, context, { filename: tmplPath });
}

// ── Fixtures (matching generator expectations) ──
const SERVICE_CTX = {
  serviceName: 'order-service',
  serviceNameKebab: 'order-service',
  serviceNameSnake: 'order_service',
  serviceNamePascal: 'OrderService',
  packageName: 'com.example',
  databaseName: 'order_service_db',
};

const FEATURE_CTX = {
  featureName: 'CreateOrder',
  featureNamePascal: 'CreateOrder',
  featureNameCamel: 'createOrder',
  featureNameKebab: 'create-order',
  featureNameSnake: 'create_order',
  entityName: 'Order',
  packageName: 'com.example',
  hasDomainEvents: false,
  hasExternalApiCalls: false,
  hasFileUploads: false,
};

console.log('\nTemplate Renderer Tests\n=========================\n');

// ── App: Java ──
console.log('App generator – Java stack');
{
  const tpl = path.join(ROOT, 'app/templates/java/app/pom.xml.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('<artifactId>order-service</artifactId>'), 'pom.xml artifactId');
  assert(out.includes('<groupId>com.example</groupId>'), 'pom.xml groupId');
  assert(out.includes('spring-boot-starter-parent'), 'pom.xml parent');
}

{
  const tpl = path.join(ROOT, 'app/templates/java/app/application.java.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('public class OrderServiceApplication'), 'main class');
}

{
  const tpl = path.join(ROOT, 'app/templates/java/app/application.yml.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('order-service'), 'application.yml');
}

// ── App: Python ──
console.log('\nApp generator – Python stack');
{
  const tpl = path.join(ROOT, 'app/templates/python/app/pyproject.toml.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('name = "order-service"'), 'pyproject.toml name');
}

{
  const tpl = path.join(ROOT, 'app/templates/python/app/main.py.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('OrderService'), 'main.py service name');
  assert(out.includes('FastAPI'), 'main.py FastAPI');
}

{
  const tpl = path.join(ROOT, 'app/templates/python/app/settings.py.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('order_service'), 'settings.py');
}

{
  const tpl = path.join(ROOT, 'app/templates/python/app/alembic.ini.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(out.includes('order_service'), 'alembic.ini');
}

// ── Endpoint: Java ──
console.log('\nEndpoint generator – Java stack');
{
  const tpl = path.join(ROOT, 'endpoint/templates/java/domain/entity.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('public class Order'), 'entity class');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/domain/repository.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('interface OrderRepository'), 'repository interface');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/application/usecase.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('interface CreateOrderUseCase'), 'use case interface');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/application/command.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('CreateOrderCommand'), 'command DTO');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/application/result.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('CreateOrderResult'), 'result DTO');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/infrastructure/controller.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('@RestController'), 'controller annotation');
  assert(out.includes('/api/v1/create-order'), 'controller path kebab');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/java/infrastructure/repository-impl.java.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('implements OrderRepository'), 'repo impl');
}

// ── Endpoint: Python ──
console.log('\nEndpoint generator – Python stack');
{
  const tpl = path.join(ROOT, 'endpoint/templates/python/domain/entity.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('class CreateOrderEntity'), 'entity class');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/python/domain/repository.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('class CreateOrderRepository'), 'repository port');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/python/application/usecase.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('class CreateOrderUseCase'), 'use case class');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/python/application/dtos.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('CreateOrderCommand'), 'command DTO');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/python/infrastructure/router.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('APIRouter'), 'router base');
  assert(out.includes('/api/v1/create-order'), 'router path');
}

{
  const tpl = path.join(ROOT, 'endpoint/templates/python/infrastructure/repository.py.ejs');
  const out = renderFile(tpl, FEATURE_CTX);
  assert(out.includes('class CreateOrderRepository'), 'repo impl');
}

// ── Negative: wrong stack should not cross-contaminate ──
console.log('\nCross-stack negative checks');
{
  const tpl = path.join(ROOT, 'app/templates/java/app/pom.xml.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(!out.includes('pyproject.toml'), 'java template lacks python refs');
}

{
  const tpl = path.join(ROOT, 'app/templates/python/app/pyproject.toml.ejs');
  const out = renderFile(tpl, SERVICE_CTX);
  assert(!out.includes('pom.xml'), 'python template lacks java refs');
}

// ── Summary ──
console.log('\n=========================');
console.log(`${GREEN}${passCount} passed${RESET}, ${failCount > 0 ? RED : GREEN}${failCount} failed${RESET}`);
console.log('=========================\n');
process.exit(failCount > 0 ? 1 : 0);
