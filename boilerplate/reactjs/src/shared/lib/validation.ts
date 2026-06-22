import { useState, useMemo, useCallback } from 'react';
import type { ZodType } from 'zod';

export function useFormValidation<T extends Record<string, unknown>>(
  schema: ZodType<T>,
  values: T,
) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const errors = useMemo<Record<string, string>>(() => {
    const result = schema.safeParse(values);
    if (result.success) return {};
    const errs: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join('.');
      if (!errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [schema, values]);

  const isValid = useMemo(() => Object.keys(errors).length === 0, [errors]);

  const touchField = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }, []);

  const touchAll = useCallback(() => {
    const flatKeys = flattenKeys(values);
    const allTouched = flatKeys.reduce(
      (acc, k) => ({ ...acc, [k]: true }),
      {} as Record<string, boolean>,
    );
    setTouched(allTouched);
  }, [values]);

  return { touched, errors, isValid, touchField, touchAll };
}

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || obj === undefined) return [];
  if (typeof obj !== 'object') return prefix ? [prefix] : [];

  if (Array.isArray(obj)) {
    const keys: string[] = [];
    for (let i = 0; i < obj.length; i++) {
      const item = obj[i];
      const itemPrefix = prefix ? `${prefix}.${i}` : `${i}`;
      if (item !== null && typeof item === 'object') {
        keys.push(...flattenKeys(item, itemPrefix));
      } else {
        keys.push(itemPrefix);
      }
    }
    return keys;
  }

  const keys: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val !== null && typeof val === 'object') {
      keys.push(...flattenKeys(val, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}
