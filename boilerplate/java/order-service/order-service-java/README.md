# Order Service (Java) - Reference Implementation

## Architecture Overview
This service implements a a strict Clean Architecture approach to ensure total isolation between business logic and infrastructure.

### Class Diagram
```plantuml
@startuml
skinparam componentStyle rectangle

package "Infrastructure Layer" {
    class OrderController <<<RestControllerRestController>> {
        - PlaceOrderUseCase useCase
        + createOrder(CreateOrderCommand)
    }
    class JpaOrderRepository <<<RepositoryRepository>> {
        - OrderJpaRepository jpaRepository
        + save(Order)
        + findById(OrderId)
    }
    class OrderEntity <<<EntityEntity>> {
        + UUID id
        + UUID customerId
        + String status
    }
}

package "Application Layer" {
    interface PlaceOrderUseCase <<<InterfaceInterface>> {
        + execute(CreateOrderCommand) : OrderResult
    }
    class PlaceOrderUseCaseImpl <<<ServiceService>> {
        - OrderPlacementService domainService
        + execute(CreateOrderCommand)
    }
}

package "Domain Layer" {
    class OrderPlacementService <<<DomainDomainService>> {
        - OrderRepository repo
        + placeOrder(UUID, List<<OrderItemOrderItem>) : Order
    }
    interface OrderRepository <<<PortPort>> {
        + save(Order) : Order
        + findById(OrderId) : Optional<<OrderOrder>
    }
    class Order <<<RecordRecord>> {
        + OrderId id
        + List<<OrderItemOrderItem> items
        + String status
    }
    class OrderId <<<ValueValueObject>> {
        + UUID value
    }
}

OrderController --> PlaceOrderUseCase : calls
PlaceOrderUseCaseImpl ..|> PlaceOrderUseCase : implements
PlaceOrderUseCaseImpl --> OrderPlacementService : delegates
OrderPlacementService --> OrderRepository : uses
JpaOrderRepository ..|> OrderRepository : implements
JpaOrderRepository --> OrderEntity : maps
OrderPlacementService --> Order : creates
@enduml
```

## Component Mapping
- **Controller**: Entry point, handles HTTP and DTO mapping.
- **UseCase**: Orchestrates the flow, manages transactions.
- **Domain Service**: Pure business logic, agnostic of any framework.
- **Port**: Interface defining how the domain needs to persist data.
- **Adapter**: Concrete JPA implementation of the repository.
