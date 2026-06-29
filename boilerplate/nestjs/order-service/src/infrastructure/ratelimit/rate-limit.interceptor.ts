import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Observable } from "rxjs";

import { SecurityAuditLogger } from "../logging/security-audit-logger.service";

interface RateLimitRule {
  pathPrefix: string;
  windowMs: number;
  maxRequests: number;
}

/**
 * Tiered rate-limiting interceptor.
 *
 * Matches Java RateLimitFilter and Python rate_limit middleware.
 * In-memory bucket (per-instance). For distributed: swap to Redis backend.
 *
 * Tiers:
 *   auth   — 10 req/min
 *   write  — 60 req/min
 *   export — 5 req/min
 *   public — 30 req/min
 *   default — 100 req/min
 */
@Injectable()
export class RateLimitInterceptor implements NestInterceptor {
  private readonly buckets = new Map<string, number[]>();

  private readonly rules: RateLimitRule[] = [
    { pathPrefix: "/auth", windowMs: 60_000, maxRequests: 10 },
    { pathPrefix: "/export", windowMs: 60_000, maxRequests: 5 },
    { pathPrefix: "/orders", windowMs: 60_000, maxRequests: 60 },
    { pathPrefix: "/health", windowMs: 60_000, maxRequests: 30 },
  ];

  private readonly defaultWindow = 60_000;
  private readonly defaultMax = 100;

  constructor(private readonly auditLogger: SecurityAuditLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const path: string = req.url;
    const ip = this.getClientIp(req);

    const rule = this.findRule(path);
    const key = `${ip}:${rule.pathPrefix || "default"}`;

    const now = Date.now();
    const timestamps = this.buckets.get(key) || [];
    const valid = timestamps.filter((t) => now - t < rule.windowMs);

    if (valid.length >= rule.maxRequests) {
      this.auditLogger.logRateLimitExceeded(ip, path);
      throw new HttpException(
        {
          error: "Too Many Requests",
          retryAfter: Math.ceil(rule.windowMs / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    valid.push(now);
    this.buckets.set(key, valid);

    return next.handle();
  }

  private findRule(path: string): RateLimitRule {
    for (const r of this.rules) {
      if (path.startsWith(r.pathPrefix)) return r;
    }
    return {
      pathPrefix: "",
      windowMs: this.defaultWindow,
      maxRequests: this.defaultMax,
    };
  }

  private getClientIp(req: any): string {
    const fwd = req.headers["x-forwarded-for"];
    if (fwd) return String(fwd).split(",")[0].trim();
    return req.ip || req.connection?.remoteAddress || "unknown";
  }
}
