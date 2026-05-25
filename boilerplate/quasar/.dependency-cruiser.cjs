/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  extends: "dependency-cruiser/configs/recommended-strict",
  forbidden: [
    {
      name: "domain-cannot-depend-on-higher-layers",
      comment: "Domain layer must be pure — no imports from application or infrastructure",
      severity: "error",
      from: {
        path: "^src/types"
      },
      to: {
        path: "^(src/(hooks|services|store|components|pages)|src/[^/]+)"
      }
    },
    {
      name: "hooks-cannot-import-services-directly",
      comment: "Hooks (application layer) should receive services via DI, not import them directly",
      severity: "error",
      from: {
        path: "^src/hooks"
      },
      to: {
        path: "^src/services",
      }
    },
    {
      name: "no-circular-dependencies",
      comment: "No circular dependencies between modules",
      severity: "error",
      from: {},
      to: {
        circular: true
      }
    },
    {
      name: "no-any-type",
      comment: "The 'any' type is forbidden throughout the codebase",
      severity: "error",
      from: {},
      to: {
        dependencyTypes: ["type-only"],
      }
    }
  ],
  options: {
    exclude: {
      path: [
        "\\.stories\\.(tsx|ts|jsx|js)$",
        "vite-env\\.d\\.ts$",
        "^src/styles/"
      ]
    },
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: ["npm", "npm-dev", "npm-optional", "npm-peer", "npm-bundled"]
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json"
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"]
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/(@[^/]+/[^/]+|[^/]+)"
      }
    }
  }
};
