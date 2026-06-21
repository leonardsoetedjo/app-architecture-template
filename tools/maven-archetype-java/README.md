# Maven Archetype — Clean Architecture Java

Uses [Maven Archetypes](https://maven.apache.org/archetype/) — the Java community standard for project scaffolding.

## Usage

```bash
# 1. Install archetype locally
cd tools/maven-archetype-java
mvn install

# 2. Generate project from archetype
mvn archetype:generate \
  -DarchetypeGroupId=com.example.architecture \
  -DarchetypeArtifactId=clean-architecture-archetype \
  -DarchetypeVersion=1.0.0-SNAPSHOT \
  -DgroupId=com.example \
  -DartifactId=my-service \
  -Dversion=0.1.0-SNAPSHOT \
  -DinteractiveMode=false
```

## Properties

| Property | Default | Description |
|----------|---------|-------------|
| `groupId` | `com.example` | Maven group ID |
| `artifactId` | *(required)* | Maven artifact ID |
| `version` | `0.1.0-SNAPSHOT` | Project version |
| `package` | `${groupId}` | Base package |
| `javaVersion` | `21` | Target Java version |
| `useFlyway` | `true` | Include Flyway migrations |
| `useTestcontainers` | `true` | Include Testcontainers setup |

## Template Structure

```
__rootArtifactId__/
├── src/main/java/__packageInPathFormat__/
│   ├── domain/
│   │   ├── models/
│   │   ├── ports/
│   │   └── events/
│   ├── application/
│   │   ├── usecases/
│   │   └── dtos/
│   └── infrastructure/
│       ├── api/
│       ├── persistence/
│       └── config/
├── src/test/java/
│   ├── unit/
│   ├── integration/
│   └── archunit/
├── pom.xml
├── Dockerfile
├── docker-compose.yml
├── lefthook.yml
└── README.md
```

## File Processing

- `__rootArtifactId__` → replaced with project artifact ID
- `__packageInPathFormat__` → `com/example` from groupId
- `${javaVersion}` → interpolated in pom.xml
- `@{useFlyway}` → conditional file inclusion

## Governance

- Based on `boilerplate/java/order-service/`
- Enforces: DDD-DOMAIN-PURITY-JAVA, DDD-CONSTRUCTOR-INJECTION, DDD-DTO-BOUNDARY
- Pre-commit: `mvn test -Dtest=CleanArchitectureLayersTest` + `mvn compile`

## TODO

- [ ] Add `src/main/resources/archetype-resources/` with full template tree
- [ ] Add `src/main/resources/META-INF/maven/archetype-metadata.xml`
- [ ] Wire property filtering for conditional features (Flyway, Testcontainers)
- [ ] Add ArchUnit test template
