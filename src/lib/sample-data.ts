import { parseAndNormalizeTelemetry } from "./telemetry-parser";
import { analyzeIncident } from "./risk-engine";
import { AnalysisResponse, DependencyFile } from "./types";

export const SAMPLE_CSV_CONTENT = `timestamp,service,level,message,latency_ms,error_rate,cpu_pct
2026-10-25T10:00:00.000Z,api-gateway,info,Ingress request received /health,12,0.00,14.2
2026-10-25T10:00:15.000Z,checkout-service,info,Checkout cart verified for session c-901,45,0.00,22.1
2026-10-25T10:00:30.000Z,orders-service,info,Order ORD-4801 created pending payment,55,0.00,31.4
2026-10-25T10:00:45.000Z,inventory-db,info,Connection pool healthy: 4/50 active connections,8,0.00,18.0
2026-10-25T10:01:00.000Z,payment-service,info,Payment charge authorized for ORD-4801,110,0.00,24.5
2026-10-25T10:01:30.000Z,api-gateway,info,Ingress request POST /checkout 200 OK,35,0.00,16.8
2026-10-25T10:02:00.000Z,inventory-db,info,Periodic checkpoint write completed,12,0.00,21.5
2026-10-25T10:02:30.000Z,orders-service,info,Order ORD-4802 state updated to confirmed,60,0.00,28.2
2026-10-25T10:03:00.000Z,inventory-db,warn,Slow query detected on order_reservations (duration: 320ms),120,0.01,48.0
2026-10-25T10:03:15.000Z,inventory-db,warn,Connection pool utilization reached 78% (39/50),210,0.02,62.3
2026-10-25T10:03:30.000Z,orders-service,warn,Database query latency elevated: waiting on lock acquire,280,0.03,55.1
2026-10-25T10:04:00.000Z,inventory-db,error,Connection pool exhausted: max limit 50 reached. Queued clients: 24,750,0.12,89.4
2026-10-25T10:04:15.000Z,inventory-db,fatal,Disk I/O saturated: WAL buffer flush timeout after 5000ms,1420,0.25,98.2
2026-10-25T10:04:30.000Z,orders-service,error,Write timeout communicating with inventory-db,890,0.18,78.5
2026-10-25T10:04:45.000Z,orders-service,fatal,Transaction rollback: LockWaitTimeout in table order_items,1150,0.32,84.1
2026-10-25T10:05:00.000Z,checkout-service,error,Downstream order creation failed: 503 Service Unavailable,920,0.22,65.0
2026-10-25T10:05:15.000Z,api-gateway,warn,Upstream checkout latency > 800ms threshold,680,0.08,42.0
2026-10-25T10:05:30.000Z,checkout-service,fatal,Checkout circuit breaker tripped open for orders-service,1350,0.48,72.4
2026-10-25T10:05:45.000Z,api-gateway,error,Gateway 504 Gateway Timeout returned to client for /api/checkout,1210,0.35,51.2
2026-10-25T10:06:00.000Z,notification-worker,info,Queue processor heartbeat ok,25,0.00,12.0
2026-10-25T10:06:15.000Z,inventory-db,fatal,Deadlock detected between trans 89201 and trans 89204 on inventory_sku,1650,0.40,99.1
2026-10-25T10:06:30.000Z,orders-service,fatal,Circuit breaker OPEN: fast-failing order creation requests,1400,0.65,88.0
2026-10-25T10:06:45.000Z,checkout-service,fatal,Cascading failure: 72% of customer checkouts failing,1500,0.72,75.3
2026-10-25T10:07:00.000Z,api-gateway,error,High volume of 504 errors on edge route /checkout,1300,0.45,59.8`;

export const SAMPLE_DEPENDENCIES_DATA: DependencyFile = {
  services: [
    "api-gateway",
    "checkout-service",
    "orders-service",
    "payment-service",
    "inventory-db",
    "notification-worker",
  ],
  dependencies: [
    { from: "api-gateway", to: "checkout-service" },
    { from: "api-gateway", to: "orders-service" },
    { from: "checkout-service", to: "orders-service" },
    { from: "checkout-service", to: "payment-service" },
    { from: "orders-service", to: "inventory-db" },
    { from: "orders-service", to: "notification-worker" },
  ],
};

export function getInitialSampleAnalysis(): AnalysisResponse {
  const parsed = parseAndNormalizeTelemetry(SAMPLE_CSV_CONTENT);
  if (!parsed.success) {
    throw new Error("Embedded sample telemetry failed parsing");
  }
  return analyzeIncident({
    records: parsed.records,
    dependencies: SAMPLE_DEPENDENCIES_DATA,
    source: "sample",
  });
}
