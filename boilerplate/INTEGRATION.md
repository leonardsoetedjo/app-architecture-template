# Frontend-Backend Integration Guide

Quick-reference for running Java + ReactJS locally.

## Default Ports

| Service | Port | Config File |
|---------|------|-------------|
| Java (Spring Boot) | `8080` | `application.yml` → `server.port` |
| ReactJS (Vite dev) | `5173` | Default Vite dev server |

## CORS

Java boilerplate includes `CorsConfig.java` allowing `localhost:5173`.
No manual proxy needed for local development.

## Environment Variables (ReactJS)

Create `.env.development` in `boilerplate/reactjs/`:

```bash
VITE_API_BASE_URL=http://localhost:8080
```

## Start Both Services

```bash
# Terminal 1 — Java backend
cd boilerplate/java/order-service
JAVA_HOME=/usr/lib/jvm/temurin-21-jdk-amd64 ./mvnw spring-boot:run

# Terminal 2 — ReactJS frontend
cd boilerplate/reactjs
npm run dev
```

Open `http://localhost:5173` → login `admin` / `admin123` → see landing page.

## Production Build

```bash
# Java
cd boilerplate/java/order-service
./mvnw -B package -DskipTests

# ReactJS
cd boilerplate/reactjs
npm run build   # outputs dist/ for nginx
```

## Auth Flow

- ReactJS `AuthProvider` manages login state via `/api/v1/auth/login` and `/api/v1/auth/logout`
- Java `SecurityConfig` secures all endpoints except `/api/v1/auth/**` and `/actuator/health`
- Default user: `admin` / `admin123` (in-memory, configurable)

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `401 Unauthorized` on API calls | Ensure `credentials: 'include'` in fetch/XHR |
| `CORS blocked` | Check `CorsConfig.java` origins include `localhost:5173` |
| Java won't compile | Verify `JAVA_HOME` points to JDK 21 |

---
*Last updated: 2026-06-16*
