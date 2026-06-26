/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  extends: "dependency-cruiser/configs/recommended-strict",
  forbidden: [
    // Rule: domain-cannot-depend-on-higher-layers (FSD: entities → shared only)
    {
      name: "domain-cannot-depend-on-higher-layers",
      comment: "Entities (domain layer) must not import from features, pages, widgets, or app layers",
      severity: "error",
      from: {
        path: "^src/entities/"
      },
      to: {
        path: "^(src/(features|pages|widgets|app))"
      }
    },
    // Rule: features-cannot-depend-on-pages-or-widgets (app is OK for typed hooks)
    {
      name: "features-cannot-depend-on-pages-or-widgets",
      comment: "Features (application layer) must not import from pages or widgets",
      severity: "error",
      from: {
        path: "^src/features/"
      },
      to: {
        path: "^(src/(pages|widgets))"
      }
    },
    // Rule: no-circular-dependencies
    {
      name: "no-circular-dependencies",
      comment: "No circular dependencies between modules",
      severity: "error",
      from: {},
      to: {
        circular: true
      }
    },
  ],
  options: {
    exclude: {
      path: [
        "\\.stories\\.(tsx|ts|jsx|js)$",
        "vite-env\\.d\\.ts$",
        "^src/styles/",
        "\\.css$"
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
