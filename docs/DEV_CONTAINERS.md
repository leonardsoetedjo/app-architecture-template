---
title: "Dev Containers Guide"
type: "Documentation"
created: "2026-06-27"
status: "active"
---
# Dev Containers Guide

This document describes the Dev Containers configuration for the app-architecture-template project.

## What are Dev Containers?

[Dev Containers](https://containers.dev/) (Development Containers) allow you to use a Docker container as a full-featured development environment. They provide:

- **Consistent environments** - Same tools, versions, and extensions for all developers
- **Isolation** - No pollution of your local machine with project dependencies
- **Reproducibility** - Exact same setup across different machines
- **Pre-configured tooling** - All necessary tools, extensions, and settings included

## Quick Start

### Prerequisites

1. [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker + Dev Containers extension)
2. [VS Code](https://code.visualstudio.com/) with [Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Getting Started

1. Open the project folder in VS Code:
   ```bash
   code boilerplate/java/order-service
   ```

2. Press `F1` and select **Dev Containers: Reopen in Container**

3. VS Code will build and start the container (first time takes ~5 minutes)

4. Once opened, you're working inside the container with all tools pre-installed

## Available Configurations

### Java Order Service (Spring Boot)

**Location**: `boilerplate/java/order-service/.devcontainer/`

**Includes**:
- JDK 21 with SDKMAN
- Maven 3.9.6
- Docker-in-Docker for Testcontainers
- GitHub CLI
- VS Code extensions:
  - Java Extension Pack
  - Spring Boot Extension Pack
  - Maven support
  - Docker support

**Ports**:
- 8080: Spring Boot application

**Post-create**: Runs `./mvnw clean install -DskipTests`

**Usage**:
```bash
# Start Spring Boot application
./mvnw spring-boot:run

# Run tests
./mvnw test

# Access Swagger UI
open http://localhost:8080/swagger-ui.html
```

---

### Python Order Service (FastAPI)

**Location**: `boilerplate/python/order-service/.devcontainer/`

**Includes**:
- Python 3.11
- Poetry for dependency management
- Docker-in-Docker
- GitHub CLI
- VS Code extensions:
  - Python Extension Pack
  - Pylance (type checking)
  - Black Formatter
  - Ruff (linting)
  - MyPy type checker
  - Docker support

**Ports**:
- 8000: FastAPI application

**Post-create**: Installs Poetry and project dependencies

**Usage**:
```bash
# Start FastAPI application
poetry run uvicorn src.main:app --reload --host 0.0.0.0

# Run tests
poetry run pytest

# Access Swagger UI
open http://localhost:8000/api/v1/docs
```

---

### ReactJS Frontend

**Location**: `boilerplate/reactjs/.devcontainer/`

**Includes**:
- Node.js 20
- TypeScript support
- Docker-in-Docker
- GitHub CLI
- VS Code extensions:
  - ESLint
  - Prettier
  - ES7+ React/Redux snippets
  - Storybook extension
  - Auto-tag extensions
  - Docker support

**Ports**:
- 5173: Vite dev server
- 6006: Storybook

**Post-create**: Runs `npm ci`

**Usage**:
```bash
# Start Vite dev server
npm run dev

# Start Storybook
npm run storybook

# Run tests
npm run test
```

---

### Quasar Frontend

**Location**: `boilerplate/quasar/.devcontainer/`

**Includes**:
- Node.js 20
- TypeScript support
- Docker-in-Docker
- GitHub CLI
- VS Code extensions:
  - ESLint
  - Prettier
  - Volar (Vue 3)
  - Quasar extension
  - Storybook extension
  - Auto-tag extensions
  - Docker support

**Ports**:
- 9000: Quasar dev server
- 6006: Storybook

**Post-create**: Runs `npm ci`

**Usage**:
```bash
# Start Quasar dev server
quasar dev

# Start Storybook
npm run storybook

# Run tests
quasar test
```

---

## Customization

### Adding Tools

Edit the `devcontainer.json` file:

```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    }
  },
  "postCreateCommand": "npm install -g <your-tool>"
}
```

### Custom Dockerfile

Create a `Dockerfile` in the `.devcontainer` directory and reference it:

```json
{
  "build": {
    "dockerfile": "Dockerfile"
  }
}
```

### Environment Variables

Add to `devcontainer.json`:

```json
{
  "containerEnv": {
    "MY_VAR": "value",
    "ANOTHER_VAR": "value"
  }
}
```

### VS Code Settings

Add to `customizations.vscode.settings`:

```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true,
        "your.setting": "value"
      }
    }
  }
}
```

---

## Troubleshooting

### Container Won't Start

1. Check Docker Desktop is running
2. Verify you have sufficient resources (4GB+ RAM, 2+ CPUs)
3. Try rebuilding: `F1` → **Dev Containers: Rebuild Container**

### Port Forwarding Issues

1. Check ports are forwarded in Dev Containers panel
2. Verify application is binding to `0.0.0.0` not `127.0.0.1`
3. Try manual port forwarding in Dev Containers panel

### Slow Performance

1. Increase Docker resource limits (Docker Desktop → Settings → Resources)
2. Use WSL2 backend on Windows
3. Consider using a more powerful machine

### Extensions Not Installing

1. Check internet connectivity
2. Try manual install from Extensions panel
3. Rebuild container

---

## Best Practices

1. **Commit devcontainer.json** - Ensures all team members have identical environments
2. **Use features** - Leverage pre-built Dev Container Features for common tools
3. **Pin versions** - Avoid `latest` tags for reproducible builds
4. **Document** - Keep this guide updated with configuration changes
5. **Test regularly** - Rebuild containers periodically to catch issues early

---

## Resources

- [Dev Containers Documentation](https://containers.dev/)
- [Dev Container Features](https://containers.dev/features)
- [VS Code Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)
- [Dev Container Specification](https://github.com/devcontainers/spec)

---

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md)
- [Clean Architecture Standards](01-agnostic/01-standards/02-architecture.md)
- [Agent Session Harness](04-sops/18-agent-session-harness.md)
