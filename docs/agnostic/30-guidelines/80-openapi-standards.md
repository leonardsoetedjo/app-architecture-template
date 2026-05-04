# OpenAPI Annotation Standards

This document defines how to document OpenAPI specifications for both Java (Spring Boot) and Python (FastAPI) services.

## Java (Spring Boot + SpringDoc)

### Required Annotations
Every endpoint **must** have these annotations:

```java
@RestController
@RequestMapping("/api/v1/orders")
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {
    
    @Operation(
        summary = "Create a new order",
        description = "Creates a new order with the provided items"
    )
    @ApiResponse(
        responseCode = "201", 
        description = "Order created successfully",
        content = @Content(schema = @Schema(implementation = OrderResult.class))
    )
    @ApiResponse(responseCode = "422", description = "Validation error")
    @PostMapping
    public ResponseEntity<OrderResult> createOrder(@Valid @RequestBody CreateOrderCommand command) {
        // implementation
    }
}
```

### Controller-Level Annotations
- `@Tag`: Group endpoints by resource (e.g., "Orders", "Payments")
- `@SecurityRequirement`: Define authentication schemes

### Method-Level Annotations
- `@Operation`: Summary and description
- `@ApiResponse`: Document all possible responses (2xx, 4xx, 5xx)
- `@Parameter`: Document query params and path variables

## Python (FastAPI + Pydantic)

### Automatic Documentation
FastAPI automatically generates OpenAPI from Pydantic models.

```python
from pydantic import BaseModel
from fastapi import FastAPI

app = FastAPI(
    title="Order Service API",
    version="1.0.0",
    description="Order management endpoints"
)

class CreateOrderCommand(BaseModel):
    customer_id: UUID
    items: List[OrderItemDTO]

class OrderResult(BaseModel):
    order_id: UUID
    status: str
    created_at: str

@app.post(
    "/api/v1/orders",
    response_model=OrderResult,
    status_code=201,
    summary="Create a new order",
    responses={
        201: {"description": "Order created"},
        422: {"description": "Validation error"}
    }
)
async def create_order(command: CreateOrderCommand):
    # implementation
    pass
```

### Pydantic Model Documentation
```python
class OrderItemDTO(BaseModel):
    """Represents an item in an order."""
    product_id: UUID = Field(..., description="The product ID")
    quantity: int = Field(..., gt=0, description="Quantity must be positive")
    unit_price: float = Field(..., gt=0, description="Price must be positive")
```

## Specification File Location
- Store in `docs/architecture/api-specs/v1/{service-name}.yaml`
- Example: `docs/architecture/api-specs/v1/order-service.yaml`
