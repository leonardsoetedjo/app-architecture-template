// test/unit/application/place-order.use-case.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { PlaceOrderUseCaseImpl } from '../../../src/application/usecases/place-order.use-case.impl';
import { PlaceOrderUseCase } from '../../../src/application/usecases/place-order.use-case.interface';
import { OrderRepositoryPort } from '../../../src/domain/ports/order-repository.port';
import { DomainException } from '../../../src/domain/exceptions/domain.exception';

const mockRepo: jest.Mocked<OrderRepositoryPort> = {
  save: jest.fn().mockResolvedValue(undefined),
  findById: jest.fn().mockResolvedValue(null),
  findAll: jest.fn().mockResolvedValue([]),
};

describe('PlaceOrderUseCase', () => {
  let useCase: PlaceOrderUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaceOrderUseCaseImpl,
        { provide: OrderRepositoryPort, useValue: mockRepo },
      ],
    }).compile();

    useCase = module.get<PlaceOrderUseCase>(PlaceOrderUseCaseImpl);
    jest.clearAllMocks();
  });

  it('should place an order with valid items', async () => {
    const dto = {
      items: [{ productId: 'p-1', quantity: 1, unitPrice: '10.00' }],
    };

    const result = await useCase.execute(dto);

    expect(result.status).toBe('CONFIRMED');
    expect(mockRepo.save).toHaveBeenCalledTimes(1);
  });

  it('should throw on invalid quantity', () => {
    const dto = {
      items: [{ productId: 'p-1', quantity: -1, unitPrice: '10.00' }],
    };

    return expect(useCase.execute(dto)).rejects.toBeInstanceOf(DomainException);
  });
});
