import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';

export const CORRELATION_ID_HEADER = 'X-Correlation-ID';

/**
 * Interceptor that adds correlation ID to requests and responses.
 * Extracts from header or generates new UUID if not present.
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    let correlationId = request.headers[CORRELATION_ID_HEADER.toLowerCase()];
    
    if (!correlationId) {
      correlationId = uuidv4();
    }

    // Set correlation ID on response header
    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    return next.handle().pipe(
      tap(() => {
        // Log at end of request with correlation ID
        console.log(`[${correlationId}] Request completed`);
      }),
    );
  }
}
