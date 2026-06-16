# NestJS Order Service — Development Container

This directory contains a sample `.devcontainer` configuration for local development.

For fleet-wide dev containers, see the root `docker-compose.yml` and `docker-compose.standalone.yml`.

## Quick Start

```bash
cd boilerplate/nestjs/order-service
npm ci
npm run start:dev
```

## Structure

- `devcontainer.json` — VS Code remote container config
- `Dockerfile` — Development image with Node.js 20 + ts-node

## Environment Variables

```bash
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=orders
NODE_ENV=development
```
