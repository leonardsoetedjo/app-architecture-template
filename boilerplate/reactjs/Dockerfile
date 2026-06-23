# Multi-stage build for the React + TypeScript + Ant Design frontend
FROM node:20 AS builder
WORKDIR /app

# Copy package files first (best cache layer)
COPY package.json ./
RUN npm install --color=never --no-audit --no-fund

# Copy source and build
COPY . .
RUN npm run build

# ── Production serve ──
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
