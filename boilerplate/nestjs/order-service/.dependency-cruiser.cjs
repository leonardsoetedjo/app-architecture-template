/**
 * Dependency-cruiser architecture rules for NestJS.
 *
 * Updated for comprehensive parity:
 *   - domain → domain only (no NestJS, no TypeORM, no class-validator)
 *   - application → domain only
 *   - infrastructure → application + domain + all libs
 *   - Added: cache, events, ratelimit, metrics, logging, http dirs
 */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-domain-imports-application-or-infra',
      comment:
        'Domain layer must not depend on application or infrastructure layers',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: [
        { path: '^src/application/' },
        { path: '^src/infrastructure/' },
      ],
    },
    {
      name: 'no-application-imports-infra',
      comment:
        'Application layer must not depend on infrastructure layer',
      severity: 'error',
      from: { path: '^src/application/' },
      to: [{ path: '^src/infrastructure/' }],
    },
    {
      name: 'no-framework-in-domain',
      comment:
        'Domain layer must not import NestJS, TypeORM, or class-validator',
      severity: 'error',
      from: { path: '^src/domain/' },
      to: [
        { path: 'node_modules/@nestjs/' },
        { path: 'node_modules/typeorm/' },
        { path: 'node_modules/class-validator/' },
        { path: 'node_modules/class-transformer/' },
        { path: 'node_modules/rxjs/' },
        { path: 'node_modules/reflect-metadata/' },
      ],
    },
    {
      name: 'no-typeorm-in-application',
      comment:
        'Application layer must not import TypeORM',
      severity: 'error',
      from: { path: '^src/application/' },
      to: [
        { path: 'node_modules/typeorm/' },
        { path: 'node_modules/@nestjs/typeorm/' },
      ],
    },
    {
      name: 'no-nestjs-platform-in-application',
      comment:
        'Application layer must not import platform-express or platform-fastify',
      severity: 'error',
      from: { path: '^src/application/' },
      to: [
        { path: 'node_modules/@nestjs/platform-express/' },
        { path: 'node_modules/@nestjs/platform-fastify/' },
      ],
    },
    {
      name: 'no-circular-dependencies',
      comment: 'Circular dependencies are not allowed',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
      dependencyTypes: [
        'core',
        'npm',
        'npm-dev',
        'npm-optional',
        'npm-peer',
        'npm-bundled',
        'npm-no-pkg',
      ],
    },
    tsConfig: {
      fileName: './tsconfig.json',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/[^/]+',
      },
    },
  },
};
