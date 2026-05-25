import { worker } from './handlers';

// Initialize MSW
if (typeof window !== 'undefined') {
  worker.start({
    onUnhandledRequest: 'bypass',
  });
}

export { worker };
export * from './handlers';
