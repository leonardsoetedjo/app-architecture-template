# Backend Standards
... [Keep existing sections 1-2] ...

## 3. Spring Boot Specifics

- **DI**: Constructor injection only. No `@Autowired` on fields. Mandate **coding against interfaces** for all Application Services (Use Cases) to facilitate mocking, AOP, and decoupled implementation.
- **Configuration**: `@Configuration` classes for beans. Externalize in `application.yml`.
- **Observability**: Every service **must** have Spring Boot Actuator enabled.
- **Validation**: Bean Validation (`@Valid`, `@NotNull`) on controller input DTOs. 
  - **Validation Hierarchy**: `infrastructure` handles *syntactic* validation; `domain` handles *semantic* validation.
- **Exception Handling**: Centralize with `@ControllerAdvice`. Map domain exceptions to HTTP codes consistently.
- **Transactions**: `@Transactional` on use case/application service methods.
- **Enterprise Logic**: For complex business logic, use a **Domain Service** (e.g., `OrderPlacementService`) to separate business rules from application orchestration.
- **Logging**: Use Log4j2. INFO (business), DEBUG (details), WARN (recoverable), ERROR (failures).

... [Keep remaining sections] ...
