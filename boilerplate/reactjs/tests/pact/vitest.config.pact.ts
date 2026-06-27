import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Dedicated Vitest config for Pact contract tests.
 *
 * Excludes MSW mock server setup (src/tests/setup.ts) because Pact tests
 * communicate with the Pact mock server, not MSW.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      app: path.resolve(__dirname, '../../src/app'),
      pages: path.resolve(__dirname, '../../src/pages'),
      widgets: path.resolve(__dirname, '../../src/widgets'),
      features: path.resolve(__dirname, '../../src/features'),
      entities: path.resolve(__dirname, '../../src/entities'),
      shared: path.resolve(__dirname, '../../src/shared'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    // No MSW setup — Pact tests use real HTTP to the Pact mock server
    setupFiles: [],
    // Only run Pact tests
    include: ['tests/pact/**/*.pact.test.ts'],
  },
});
