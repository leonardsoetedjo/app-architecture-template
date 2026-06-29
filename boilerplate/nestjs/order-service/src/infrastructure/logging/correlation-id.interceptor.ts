import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { v4 as uuidv4 } from "uuid";

/**
 * Correlation ID interceptor.
 *
 * Injects `x-correlation-id` into request / response headers.
 * Logs entry/exit with duration for every inbound HTTP call.
 *
 * Mapped to NestJS ExecutionContext (not domain).
 */
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const cid = req.headers["x-correlation-id"] || uuidv4();
    req.correlationId = cid;
    res.setHeader("x-correlation-id", cid);

    const now = Date.now();
    const cls = context.getClass().name;
    const handler = context.getHandler().name;

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - now;
        console.log(`[${cid}] ${cls}.${handler} — ${ms}ms`);
      }),
    );
  }
}
