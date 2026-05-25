---
name: "SOLID Software Principles Standard"
type: "SOP"
version: "2.0"
status: "Active"
owner: "@architecture-team"
---

# SOLID Software Principles Standard

This document defines how the five SOLID principles are applied across all microservices in this project. Adherence to these principles is mandatory for all new features and refactors to ensure long-term maintainability and deterministic AI-assisted development.

## 1. Single Responsibility Principle (SRP)
**Definition**: A class should have one, and only one, reason to change.

### 🛠️ Application in this Project
- **Domain Models**: Handle only state and internal semantic invariants.
- **Domain Services**: Handle complex business logic that spans multiple entities.
- **Application Use Cases**: Handle orchestration, transaction boundaries, and DTO mapping.
- **Infrastructure Adapters**: Handle external technology concerns (HTTP, SQL, Kafka).

**Violation Example**: Putting SQL queries inside a `UseCase` or putting HTTP status codes inside a `Domain Model`.

---

## 2. Open/Closed Principle (OCP)
**Definition**: Software entities should be open for extension, but closed for modification.

### 🛠️ Application in this Project
- **Port & Adapter Pattern**: By depending on interfaces (Ports) rather than concrete classes, we can add new infrastructure (e.g., switching from PostgreSQL to MongoDB) without modifying the Application or Domain layers.
- **Strategy Pattern**: Use strategy interfaces for varying business rules (e.g., different tax calculation strategies for different regions) instead of large `if/else` blocks.

---

## 3. Liskov Substitution Principle (LSP)
**Definition**: Objects of a superclass should be replaceable with objects of its subclasses without breaking the application.

### 🛠️ Application in this Project
- **Repository Consistency**: All `OrderRepository` implementations must behave consistently. If `findById` returns `Optional.empty()` for a missing record in Jpa, it must do the same in the Mock/In-Memory implementation.
- **Interface Contracts**: Do not throw unexpected exceptions in implementations that are not declared in the interface.

---

## 4. Interface Segregation Principle (ISP)
**Definition**: No client should be forced to depend on methods it does not use.

### 🛠️ Application in this Project
- **Lean Interfaces**: Keep repository and service interfaces narrow. Instead of one giant `OrderService` interface, split them into specific use-case interfaces (e.g., `PlaceOrderUseCase`, `CancelOrderUseCase`).
- **Avoid "Fat" Adapters**: Don't create a single "InfrastructureClient" that handles 10 different external APIs. Create specific clients for each API.

---

## 5. Dependency Inversion Principle (DIP)
**Definition**: High-level modules should not depend on low-level modules. Both should depend on abstractions.

### 🛠️ Application in this Project
- **Dependency Flow**: All dependencies must point inward toward the Domain layer.
- **Constructor Injection**: Mandate constructor injection. No field injection (`@Autowired` on fields).
- **Abstractions over Implementations**:
    - `UseCase` $\rightarrow$ depends on $\rightarrow$ `OrderRepository` (Interface)
    - `JpaOrderRepository` (Implementation) $\rightarrow$ implements $\rightarrow$ `OrderRepository` (Interface)

---

## 🤖 AI Agent Directive
When proposing a design or reviewing code, AI agents **MUST** verify the change against this checklist:
1. [ ] Does this class have more than one reason to change? (SRP)
2. [ ] Can I add this new behavior without modifying existing core logic? (OCP)
3. [ ] Does the implementation strictly follow the interface contract? (LSP)
4. [ ] Is the interface focused, or is it too "fat"? (ISP)
5. [ ] Does the high-level logic depend on a concrete infrastructure class? (DIP)
