// .dependency-cruiser.cjs — NestJS Clean Architecture rules
// Run: npx depcruise --validate .dependency-cruiser.cjs src/

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ========================================================================
    // Clean Architecture Layer Enforcement
    // ========================================================================
    {
      name: 'domain-no-frameworks',
      comment: 'Domain layer must have ZERO framework imports',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: {
        path: '^(node_modules/)?(@nestjs|typeorm|class-validator|class-transformer|express|@nestjs/)',
      },
    },
    {
      name: 'domain-no-application',
      comment: 'Domain must not depend on application layer',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/application/' },
    },
    {
      name: 'domain-no-infrastructure',
      comment: 'Domain must not depend on infrastructure layer',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'application-no-infrastructure',
      comment: 'Application must not depend on infrastructure layer',
      severity: 'error',
      from: { path: '^src/application/' },
      to: { path: '^src/infrastructure/' },
    },
    {
      name: 'application-no-persistence',
      comment: 'Application must not depend on persistence implementations',
      severity: 'error',
      from: { path: '^src/application/' },
      to: {
        path: '^(node_modules/)?(typeorm|pg|@nestjs/typeorm)',
      },
    },
    {
      name: 'application-no-http',
      comment: 'Application must not depend on HTTP frameworks',
      severity: 'error',
      from: { path: '^src/application/' },
      to: {
        path: '^(node_modules/)?(@nestjs/platform-express|express)',
      },
    },

    // ========================================================================
    // Dependency Direction
    // ========================================================================
    {
      name: 'no-circular',
      comment: 'No circular dependencies anywhere',
      severity: 'error',
      from: {},
      to: { circular: true },
    },

    // ========================================================================
    // Infrastructure Hygiene
    // ========================================================================
    {
      name: 'infrastructure-domain-access',
      comment: 'Infrastructure may only access domain via ports',
      severity: 'warn',
      from: { path: '^src/infrastructure/' },
      to: {
        path: '^src/domain/',
        pathNot: '^src/domain/ports/',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg',
      ],
    },
    exclude: {
      path: 'node_modules/',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: './tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
};
