import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './mocks/server';

// Start MSW before tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers between tests
afterEach(() => server.resetHandlers());

// Close MSW after all tests
afterAll(() => server.close());

/* eslint-disable @typescript-eslint/no-explicit-any */
import '@testing-library/jest-dom';

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
