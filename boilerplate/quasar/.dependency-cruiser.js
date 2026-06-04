/**
 * Dependency Cruiser Configuration
 * 
 * Enforces architecture boundaries and import rules for Quasar boilerplate.
 * 
 * Run with: npx depcruise --validate .dependency-cruiser.js src/
 * 
 * Rules:
 * - Domain layer: No framework imports (Vue, Quasar, Pinia, Axios)
 * - Application layer: No infrastructure imports
 * - Features: Can only import from their own directory or shared modules
 * - Stores: Can only import from features or types
 */

export default {
  forbidden: [
    {
      name: 'no-domain-framework-imports',
      severity: 'error',
      comment: 'Domain layer cannot import Vue, Quasar, Pinia, Axios, or other frameworks',
      from: {
        path: 'src/features/[^/]+/(types|hooks)/',
        pathNot: '\\.test\\.ts$',
      },
      to: {
        dependencyTypes: [
          'npm:vue',
          'npm:quasar', 
          'npm:pinia',
          'npm:axios',
        ],
      },
    },
    {
      name: 'no-circular-dependencies',
      severity: 'error',
      comment: 'Circular dependencies are not allowed',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Orphan modules (not imported by anyone) should be reviewed',
      from: {
        orphan: true,
        pathNot: [
          '\\.test\\.ts$',
          'src/main\\.ts',
          'src/router\\.ts',
          'src/quasar\\.d\\.ts',
        ],
      },
      to: {},
    },
    {
      name: 'features-cannot-import-infrastructure',
      severity: 'error',
      comment: 'Features should not import infrastructure modules directly',
      from: {
        path: 'src/features/',
        pathNot: ['\\.test\\.ts$', 'api/'],
      },
      to: {
        path: 'src/infrastructure/',
      },
    },
    {
      name: 'stores-cannot-import-components',
      severity: 'error',
      comment: 'Stores should not import UI components',
      from: {
        path: 'src/stores/',
      },
      to: {
        path: 'src/components/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: [
        'node_modules',
        'dist',
        '.quasar',
      ],
    },
    excludeTests: false,
    progress: {
      on: true,
      favicon: '🔍',
    },
  },
};
