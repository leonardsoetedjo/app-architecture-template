# JavaScript Generators (Yeoman)

ReactJS and Quasar generators use Yeoman — the JavaScript ecosystem standard.

## Status

⚠️ **Stub** — full implementation pending. Skeleton structure created.

## Planned Generators

| Generator | Stack | Description |
|-----------|-------|-------------|
| `yo clean-architecture:app` | ReactJS | Scaffold new ReactJS service |
| `yo clean-architecture:app` | Quasar | Scaffold new Quasar service |
| `yo clean-architecture:page` | ReactJS | Add a page + route |
| `yo clean-architecture:page` | Quasar | Add a page + route |
| `yo clean-architecture:feature` | Both | Add feature slice (model + ui + api) |
| `yo clean-architecture:component` | Both | Add UI component |

## Prerequisites

```bash
npm install -g yo generator-clean-architecture
```

## Usage (Future)

```bash
# Scaffold ReactJS app
mkdir my-frontend && cd my-frontend
yo clean-architecture:app --stack=reactjs --service-name=admin-ui

# Scaffold Quasar app
mkdir my-quasar && cd my-quasar
yo clean-architecture:app --stack=quasar --service-name=trader-ui

# Add feature
yo clean-architecture:feature --stack=reactjs --feature-name=OrderBook
```

## Templates Needed

### ReactJS
- `generators/app/templates/reactjs/` — vite.config, tsconfig, src/app/, src/pages/, src/features/, src/shared/
- `generators/feature/templates/reactjs/` — model/, ui/, api/
- `generators/page/templates/reactjs/` — page.tsx, route.tsx

### Quasar
- `generators/app/templates/quasar/` — quasar.config.ts, src/boot/, src/pages/, src/features/, src/composables/
- `generators/feature/templates/quasar/` — model/, ui/, api/, composable/
- `generators/page/templates/quasar/` — page.vue, route.ts

## Governance

- ReactJS enforces: TYPESCRIPT-STRICT-001, REACT-HOOKS-ONLY, REACT-STATE-PATTERN
- Quasar enforces: TYPESCRIPT-STRICT-001, QUASAR-COMPOSABLE-PATTERN, QUASAR-API-ISOLATION

## Next Steps

1. Copy `boilerplate/reactjs/` → `generators/app/templates/reactjs/`
2. Add `index.js` with prompts for stack, service-name, package-name
3. Wire `yeoman-generator` v5 (CommonJS, Node 18+)
4. Add `generator.spec.js` using EJS render tests (no yeoman-test dependency hell)
5. Repeat for Quasar stack
