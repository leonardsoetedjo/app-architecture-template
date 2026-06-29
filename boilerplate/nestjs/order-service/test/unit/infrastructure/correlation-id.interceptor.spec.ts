import { ExecutionContext, CallHandler } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';

import { CorrelationIdInterceptor } from '../../src/infrastructure/logging/correlation-id.interceptor';

describe('CorrelationIdInterceptor', () => {
  let interceptor: CorrelationIdInterceptor;

  beforeEach(() => {
    interceptor = new CorrelationIdInterceptor();
  });

  it('should inject x-correlation-id when absent', (done) => {
    const req = { headers: {} };
    const res = { setHeader: jest.fn(), getHeader: jest.fn() };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of(true) } as CallHandler).subscribe({
      next: () => {
        expect(req).toHaveProperty('correlationId');
        expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', expect.any(String));
        done();
      },
    });
  });

  it('should propagate existing x-correlation-id', (done) => {
    const req = { headers: { 'x-correlation-id': 'existing-123' } };
    const res = { setHeader: jest.fn(), getHeader: jest.fn() };

    const context = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ExecutionContext;

    interceptor.intercept(context, { handle: () => of(true) } as CallHandler).subscribe({
      next: () => {
        expect(req.correlationId).toBe('existing-123');
        expect(res.setHeader).toHaveBeenCalledWith('x-correlation-id', 'existing-123');
        done();
      },
    });
  });
});
