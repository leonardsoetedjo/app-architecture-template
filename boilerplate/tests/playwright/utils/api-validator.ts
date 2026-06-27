/**
 * API Schema Validator — validates Playwright API responses against OpenAPI spec.
 *
 * Uses Ajv (JSON Schema validator) with OpenAPI format support.
 * Extracts schema from the OpenAPI spec by path + method + status code.
 *
 * Usage:
 * ```typescript
 * import { validateResponse } from '@/utils/api-validator';
 *
 * test('API response matches schema', async ({ request }) => {
 *   const response = await request.get('/api/v1/orders');
 *   validateResponse('/api/v1/orders', 'GET', response.status(), await response.json());
 * });
 * ```
 */

import Ajv, { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import openApiSpec from '../schemas/openapi.json';

/**
 * Compiled schema cache to avoid re-compiling the same schema on every test run.
 */
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  discriminator: true,
});
addFormats(ajv);

const compiledCache = new Map<string, ValidateFunction>();

/**
 * OpenAPI 3.0 specification shape (sufficient for our validation needs).
 */
interface OpenApiSpec {
  openapi: string;
  info: Record<string, unknown>;
  paths: Record<string, unknown>;
  components?: {
    schemas?: Record<string, unknown>;
  };
}

const spec: OpenApiSpec = openApiSpec as unknown as OpenApiSpec;

/**
 * Type-safe deep index into an object with Record<string, unknown> shape.
 */
function getKey(obj: Record<string, unknown>, key: string): unknown {
  return obj[key];
}

/**
 * Resolve a JSON Schema reference like "#/components/schemas/OrderResponse"
 * to the actual schema object in the OpenAPI spec.
 */
function resolveRef(ref: string): unknown {
  const parts = ref.replace(/^#\//, '').split('/');
  let current: unknown = spec;
  for (const part of parts) {
    if (current === undefined || current === null) {
      throw new Error(`Cannot resolve JSON Schema ref: ${ref} (traversed to null/undefined)`);
    }
    current = getKey(current as Record<string, unknown>, part);
  }
  return current;
}

/**
 * Dereference a JSON schema by recursively resolving $ref pointers.
 * Handles circular references (returns a shallow circular reference).
 */
function dereference(schema: unknown, visited = new Set<string>()): Record<string, unknown> | unknown {
  if (schema === null || typeof schema !== 'object') {
    return schema;
  }

  if (Array.isArray(schema)) {
    return schema.map((item) => dereference(item, visited));
  }

  const obj = schema as Record<string, unknown>;

  // Handle $ref
  if (typeof obj.$ref === 'string') {
    const ref = obj.$ref;
    if (visited.has(ref)) {
      return { $ref: ref };
    }
    visited.add(ref);
    const resolved = resolveRef(ref);

    // Collect sibling properties (OpenAPI pattern: { $ref, description })
    const siblings: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (key !== '$ref') {
        siblings[key] = val;
      }
    }

    if (resolved !== null && typeof resolved === 'object' && !Array.isArray(resolved)) {
      const dereferenced = dereference(resolved, visited) as Record<string, unknown>;
      const merged: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(dereferenced)) {
        merged[k] = v;
      }
      for (const [k, v] of Object.entries(siblings)) {
        merged[k] = v;
      }
      return merged;
    }
    return siblings;
  }

  // Handle nullable (OpenAPI 3.0 style: { type, nullable: true })
  if (obj.nullable === true && obj.type) {
    const { nullable: _, ...rest } = obj;
    return dereference({ oneOf: [rest, { type: 'null' }] }, visited);
  }

  // Handle allOf (schema composition)
  if (Array.isArray(obj.allOf)) {
    return dereference({ allOf: obj.allOf.map((sub) => dereference(sub, visited)) }, visited);
  }

  // Recurse into object properties
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'nullable') continue;
    result[key] = dereference(value, visited);
  }
  return result;
}

/**
 * Build the cache key for a compiled schema.
 */
function cacheKey(path: string, method: string, statusCode: number | string): string {
  return `${method.toUpperCase()} ${path} ${statusCode}`;
}

/**
 * Extract the response schema from the OpenAPI spec for a given path/method/status.
 */
function extractResponseSchema(path: string, method: string, statusCode: number | string): unknown {
  const resolvedPath = getKey(spec.paths, path);
  if (resolvedPath === undefined) {
    throw new Error(
      `OpenAPI spec has no definition for path: ${path}. Available paths: ${Object.keys(spec.paths).join(', ')}`
    );
  }

  const operation = getKey(resolvedPath as Record<string, unknown>, method.toLowerCase());
  if (operation === undefined) {
    throw new Error(
      `OpenAPI spec has no ${method.toUpperCase()} operation for ${path}. Available methods: ${Object.keys(resolvedPath as Record<string, unknown>).join(', ')}`
    );
  }

  const op = operation as Record<string, unknown>;
  const responses = op.responses as Record<string, unknown> | undefined;
  if (!responses) {
    throw new Error(
      `OpenAPI spec: ${method.toUpperCase()} ${path} has no responses section`
    );
  }

  const response = responses[statusCode] || responses['default'];
  if (!response) {
    throw new Error(
      `OpenAPI spec has no response for status ${statusCode} on ${method.toUpperCase()} ${path}. ` +
        `Available status codes: ${Object.keys(responses).join(', ')}`
    );
  }

  const resp = response as Record<string, unknown>;
  const content = resp.content as Record<string, unknown> | undefined;
  if (!content) {
    throw new Error(`OpenAPI spec response for ${method.toUpperCase()} ${path} ${statusCode} has no content section`);
  }

  const jsonContent = content['application/json'] as Record<string, unknown> | undefined;
  if (!jsonContent) {
    throw new Error(
      `OpenAPI spec response for ${method.toUpperCase()} ${path} ${statusCode} has no application/json content. ` +
        `Available content types: ${Object.keys(content).join(', ')}`
    );
  }

  return jsonContent.schema;
}

/**
 * Get or compile a JSON Schema validator for the given path/method/status.
 * Caches compiled validators to avoid re-compilation across test runs.
 */
function getValidator(path: string, method: string, statusCode: number | string): ValidateFunction {
  const key = cacheKey(path, method, statusCode);

  if (!compiledCache.has(key)) {
    const rawSchema = extractResponseSchema(path, method, statusCode);
    const dereferenced = dereference(rawSchema);
    // AJV compile accepts plain object shape; cast for TypeScript
    const validate = ajv.compile(dereferenced as Record<string, unknown>);
    compiledCache.set(key, validate);
  }

  return compiledCache.get(key)!;
}

/**
 * Validate an API response body against the OpenAPI spec for the given endpoint.
 *
 * @param path      API path (e.g., '/api/v1/orders')
 * @param method    HTTP method (e.g., 'GET', 'POST')
 * @param statusCode HTTP status code returned by the API
 * @param body      Response body parsed as JSON
 * @throws Error with detailed validation message if body doesn't match schema
 */
export function validateResponse(path: string, method: string, statusCode: number | string, body: unknown): void {
  const validate = getValidator(path, method, statusCode);
  const valid = validate(body);

  if (!valid) {
    const errors = formatErrors(validate.errors);
    throw new Error(
      `API response validation failed for ${method.toUpperCase()} ${path} (HTTP ${statusCode}):\n${errors}`
    );
  }
}

/**
 * Validate an API response and return true/false instead of throwing.
 * Useful for optional validation or collecting multiple errors.
 */
export function isValidResponse(
  path: string,
  method: string,
  statusCode: number | string,
  body: unknown
): { valid: boolean; errors?: string } {
  try {
    validateResponse(path, method, statusCode, body);
    return { valid: true };
  } catch (err) {
    return { valid: false, errors: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Format Ajv errors into a human-readable string.
 */
function formatErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return 'Unknown validation error';
  }
  return errors
    .map((err) => {
      const path = err.instancePath || '/';
      const message = err.message || 'Invalid value';
      return `  - ${path}: ${message} (schema path: ${err.schemaPath})`;
    })
    .join('\n');
}

/**
 * Pre-load common schemas at module initialization (optional optimization).
 * Call this in global setup to warm the cache before tests run.
 */
export function preloadSchemas(paths: Array<{ path: string; method: string; statusCode: number | string }>): void {
  for (const { path, method, statusCode } of paths) {
    getValidator(path, method, statusCode);
  }
}
