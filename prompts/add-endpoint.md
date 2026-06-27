---
prompt_id: "PROMPT-004"
name: "Add REST Endpoint"
type: "Task Prompt"
version: "1.0.0"
stack: "all"
standard: "Standard 27"
sop_reference: "SOP-02"
validated: false
---

# Task: Add REST Endpoint

## Prompt Template

### Role
You are a senior backend engineer adding a REST endpoint to an existing Clean Architecture service. You produce layered code: router/controller, use case, DTO, and repository port — never mixing layers.

### Context
The project uses Clean Architecture with layers: domain/ (pure), application/ (use cases, DTOs), infrastructure/ (controllers, persistence). Stack is determined by the boilerplate AGENTS.md the agent is reading.

### Task
Add a REST `{METHOD} /{resource}` endpoint for the `{EntityName}` entity.

### Constraints
- Controller/router imports from `application/` only, never from `domain/` directly
- Use case receives a command/query DTO, returns a result DTO
- Repository is referenced via interface/port in `domain/ports/`, never concrete impl
- Domain entity has no framework imports (FastAPI, SQLAlchemy, Spring, etc.)
- No raw ORM in controller/router (no `db.add`, `db.commit`, `session.save`)
- Endpoint follows existing naming: `{resource}` plural kebab-case
- Include OpenAPI/Swagger annotation (if supported by stack)
- Include validation at boundary (DTO, not entity)

### Output Format
Return a code block for each file created or modified:
```
File: path/to/file.ext
```
// code here
```
List files in dependency order: router → use case → DTOs → entity (if new).

## Few-Shot Examples

### Example 1: Python FastAPI — Create Order

#### Input
Add POST /orders endpoint for Order entity. Fields: customer_id, items[], total.

#### Output
```
File: src/infrastructure/api/order_router.py
```python
from fastapi import APIRouter, Depends
from src.application.order_usecases import CreateOrderUseCase
from src.application.dtos.create_order_command import CreateOrderCommand

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("", status_code=201, response_model=OrderResponse)
def create_order(cmd: CreateOrderCommand, usecase: CreateOrderUseCase = Depends()):
    return usecase.execute(cmd)
```

File: src/application/order_usecases.py
```python
from dataclasses import dataclass
from decimal import Decimal
from typing import List
from src.domain.models.order import Order
from src.domain.ports.order_repository import OrderRepository

class CreateOrderUseCase:
    def __init__(self, repo: OrderRepository):
        self.repo = repo

    def execute(self, cmd: CreateOrderCommand) -> OrderResult:
        order = Order.create(customer_id=cmd.customer_id, items=cmd.items, total=cmd.total)
        self.repo.save(order)
        return OrderResult(order_id=order.id)
```

File: src/application/dtos/create_order_command.py
```python
from pydantic import BaseModel, Field
from decimal import Decimal
from typing import List

class CreateOrderCommand(BaseModel):
    customer_id: str = Field(min_length=1)
    items: List[str]
    total: Decimal = Field(gt=0)
```

### Example 2: NestJS — Get User by ID

#### Input
Add GET /users/:id endpoint for User entity.

#### Output
File: src/infrastructure/controllers/user.controller.ts
```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { GetUserByIdUseCase } from '../../application/usecases/get-user-by-id.usecase';
import { UserResponseDto } from '../../application/dtos/user.response.dto';

@Controller('users')
export class UserController {
    constructor(private readonly usecase: GetUserByIdUseCase) {}

    @Get(':id')
    async getUser(@Param('id') id: string): Promise<UserResponseDto> {
        return this.usecase.execute(id);
    }
}
```

File: src/application/usecases/get-user-by-id.usecase.ts
```typescript
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../domain/ports/user.repository';
import { UserResponseDto } from '../dtos/user.response.dto';

@Injectable()
export class GetUserByIdUseCase {
    constructor(private readonly repo: UserRepository) {}

    async execute(userId: string): Promise<UserResponseDto> {
        const user = await this.repo.findById(userId);
        if (!user) throw new NotFoundException();
        return UserResponseDto.fromEntity(user);
    }
}
```

## Stack-Specific Notes

| Stack | Router | Controller DI | Validation | OpenAPI |
|-------|--------|-------------|------------|---------|
| Python | FastAPI router | `Depends()` | Pydantic DTOs | `response_model=` |
| NestJS | @Controller | Constructor inject | class-validator DTOs | @ApiResponse |
| Java | @RestController | Constructor inject | Jakarta Bean Validation | @Operation |
