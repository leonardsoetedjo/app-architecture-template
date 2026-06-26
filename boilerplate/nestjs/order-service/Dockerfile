# ---- Build stage ----
FROM node:20-alpine AS builder
ARG GIT_COMMIT=unknown

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source and build
COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
ARG GIT_COMMIT=unknown
LABEL commit="$GIT_COMMIT"

WORKDIR /app

# Only production dependencies + compiled output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

ENV NODE_ENV=production
EXPOSE 3000

USER node

CMD ["node", "dist/main"]
