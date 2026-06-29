import { Injectable, Controller, Get } from "@nestjs/common";
import { register } from "prom-client";

/**
 * Prometheus metrics controller.
 *
 * Exposes /metrics endpoint for scraping.
 * Maps to Java Micrometer + actuator/prometheus and Python prometheus_client.
 *
 * Counter patterns:
 *   http_requests_total{method,path,status}
 *   orders_created_total
 *   orders_failed_total
 */
@Controller("metrics")
@Injectable()
export class MetricsController {
  @Get()
  async getMetrics(): Promise<string> {
    return register.metrics();
  }
}
