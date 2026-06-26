# Multi-stage build for the Vue + TypeScript + Quasar frontend
FROM node:20 AS builder
ARG GIT_COMMIT=unknown
WORKDIR /app

# Copy package files first (best cache layer)
COPY package.json package-lock.json ./
RUN npm ci --color=never --no-audit --no-fund

# Copy source and build with Vite (not quasar CLI — project uses Vite plugin)
COPY . .
RUN npx vite build

# ── Production serve ──
FROM registry.access.redhat.com/ubi9/nginx-124:latest
ARG GIT_COMMIT=unknown
LABEL commit="$GIT_COMMIT"
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
