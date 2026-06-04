/**
 * Test Setup File
 * 
 * Configure global test utilities and mocks here.
 */

import { config } from '@vue/test-utils';
import { Quasar, Notify, Dialog, Loading } from 'quasar';

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Global components and plugins
config.global.plugins = [Quasar];
config.global.components = {};

// Mock notifications
vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuasar: () => ({
      notify: vi.fn(),
      dialog: {
        create: vi.fn(),
      },
      loading: {
        show: vi.fn(),
        hide: vi.fn(),
      },
    }),
  };
});

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
