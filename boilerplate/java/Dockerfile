# Multi-stage build for the order-service Spring Boot application
# Builder: Maven + JDK 21 | Runtime: Red Hat UBI-minimal + JRE 21
FROM maven:3.9.6-eclipse-temurin-21 AS builder
ARG GIT_COMMIT=unknown
WORKDIR /app

# Copy pom files first for Docker layer caching
COPY common/pom.xml /app/common/pom.xml
COPY order-service/pom.xml /app/order-service/pom.xml

# Download dependencies (cached layer independent of source changes)
RUN mvn -f common/pom.xml dependency:go-offline -q 2>&1 | tail -3 && \
    mvn -f order-service/pom.xml dependency:go-offline -q 2>&1 | tail -3

# Copy source after dependency resolution
COPY order-service/src /app/order-service/src
COPY common/src /app/common/src

# Build common → install to local .m2, then package order-service
RUN mvn -f common/pom.xml clean install -DskipTests -q 2>&1 | tail -5 && \
    mvn -f order-service/pom.xml clean package -DskipTests -q 2>&1 | tail -5

# ── Runtime ──
FROM registry.access.redhat.com/ubi9/openjdk-21-runtime:latest
ARG GIT_COMMIT=unknown
LABEL commit="$GIT_COMMIT"
WORKDIR /app

COPY --from=builder /app/order-service/target/order-service-*.jar app.jar

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
