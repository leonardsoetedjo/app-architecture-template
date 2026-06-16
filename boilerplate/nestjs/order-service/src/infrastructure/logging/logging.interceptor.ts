import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * Request/response logging interceptor.
 *
 * Logs HTTP method, path, status code and duration.
 * Does NOT touch domain layer.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const ms = Date.now() - start;
        console.log(
          `${req.method} ${req.url} — ${res.statusCode} — ${ms}ms [${req.correlationId || 'no-cid'}]`,
        );
      }),
    );
  }
}
