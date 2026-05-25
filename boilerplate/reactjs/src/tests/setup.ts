/* eslint-disable @typescript-eslint/no-explicit-any */

import '@testing-library/jest-dom';

// Mock Intl APIs for testing
const patchIntl = (): void => {
  const originalIntl = (globalThis as any).Intl;
  (globalThis as any).Intl = {
    DateTimeFormat: originalIntl.DateTimeFormat,
    NumberFormat: originalIntl.NumberFormat,
    Collator: originalIntl.Collator,
    PluralRules: originalIntl.PluralRules,
    RelativeTimeFormat: originalIntl.RelativeTimeFormat,
  };
};

beforeEach(() => {
  patchIntl();
});

// Mock matchMedia for responsive tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  configurable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: (_ev: Event) => false,
  }),
});
