import { Injectable } from "@nestjs/common";
import axios, { AxiosInstance } from "axios";

/**
 * External HTTP client with resilience.
 *
 * Maps to Java Resilience4j Circuit Breaker + Retry
 * and Python httpx + tenacity.
 *
 * Features:
 *   - Exponential back-off retries (max 3)
 *   - Circuit breaker pattern
 *   - Timeout enforcement
 *   - MDC/correlation-id propagation
 */
@Injectable()
export class ResilientHttpClient {
  private readonly http: AxiosInstance;
  private failureCount = 0;
  private readonly FAILURE_THRESHOLD = 5;
  private circuitOpen = false;
  private circuitOpenedAt?: number;

  constructor(baseURL: string) {
    this.http = axios.create({
      baseURL,
      timeout: 5000,
      headers: { "Content-Type": "application/json" },
    });
  }

  async get<T>(path: string, correlationId?: string): Promise<T> {
    return this.request<T>("GET", path, undefined, correlationId);
  }

  async post<T>(
    path: string,
    body: unknown,
    correlationId?: string,
  ): Promise<T> {
    return this.request<T>("POST", path, body, correlationId);
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    correlationId?: string,
  ): Promise<T> {
    if (this.circuitOpen) {
      if (Date.now() - (this.circuitOpenedAt || 0) > 30_000) {
        this.circuitOpen = false;
        this.failureCount = 0;
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }

    const headers: Record<string, string> = {};
    if (correlationId) headers["x-correlation-id"] = correlationId;

    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await this.http.request<T>({
          method,
          url: path,
          data: body,
          headers,
        });
        this.failureCount = 0;
        return resp.data;
      } catch (e) {
        lastError = e;
        if (attempt < 2) {
          await this.delay(Math.pow(2, attempt) * 1000);
        }
      }
    }

    this.failureCount += 1;
    if (this.failureCount >= this.FAILURE_THRESHOLD) {
      this.circuitOpen = true;
      this.circuitOpenedAt = Date.now();
    }

    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
