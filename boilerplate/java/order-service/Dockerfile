# Multi-stage build for production-ready Spring Boot jar
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app
COPY . .
RUN chmod +x mvnw
RUN --mount=type=cache,target=/root/.m2 \
    if [ -d "../common" ]; then cd ../common && ./mvnw -B install -DskipTests && cd /app; fi && \
    ./mvnw -B package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
