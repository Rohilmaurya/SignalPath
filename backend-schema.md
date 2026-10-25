# Backend data contract

This document defines the upload format and version 1 `POST /api/analyze` contract. The server is authoritative for parsing, normalization, risk estimates, citations, and scenario ranking.

## Upload format

`POST /api/analyze` with `multipart/form-data`:

| Field | Type | Required | Notes |
|---|---|---:|---|
| `telemetry` | CSV file | Yes | UTF-8 CSV. Required headers below. |
| `dependencies` | JSON file | Yes | Directed service dependency graph. |
| `source` | string | No | `upload` or `sample`, for provenance only. |

Required CSV headers: `timestamp`, `service`, `level`, `message`.

Optional metric headers: `latency_ms`, `error_rate`, `cpu_pct`. Numeric values must be finite and non-negative. `error_rate` may be represented as a fraction from 0 to 1 or percentage from 0 to 100, but normalization must detect/document the accepted convention and convert to a 0–1 fraction. Timestamps must parse as ISO-compatible dates; timezone-less values are interpreted consistently and reported in UTC. Levels normalize to `debug`, `info`, `warn`, `error`, or `fatal`; unrecognized values should produce a validation issue or documented safe mapping.

Dependency file canonical shape:

```json
{
  "services": ["api-gateway", "orders", "database"],
  "dependencies": [
    { "from": "api-gateway", "to": "orders" },
    { "from": "orders", "to": "database" }
  ]
}
```

`from` depends on `to`: when `to` degrades, `from` may be affected. The response should retain this direction and explain cascade traversal. Reject duplicate unknown services and dangling references. Cycles may be accepted but traversal must be cycle-safe.

## Normalized telemetry record

```ts
type TelemetryRecord = {
  timestamp: string; // ISO UTC
  service: string;
  level: "debug" | "info" | "warn" | "error" | "fatal";
  message: string;
  metrics: {
    latencyMs?: number;
    errorRate?: number; // normalized 0..1
    cpuPct?: number; // normalized 0..100
  };
  sourceRow: number;
};
```

## Success response

HTTP 200, JSON:

```json
{
  "schemaVersion": "1",
  "analysisId": "local-generated-id",
  "source": "sample",
  "status": "complete",
  "dataQuality": {
    "sufficientForForecast": true,
    "windowStart": "2026-10-25T10:00:00.000Z",
    "windowEnd": "2026-10-25T10:10:00.000Z",
    "recordCount": 0,
    "serviceCount": 0,
    "warnings": []
  },
  "services": [
    {
      "id": "orders",
      "riskScore": 0,
      "riskBand": "low",
      "riskFactors": ["latency rising", "error logs increased"],
      "metrics": [{ "name": "latency_ms", "points": [{ "timestamp": "2026-10-25T10:00:00.000Z", "value": 0 }], "trend": "rising" }]
    }
  ],
  "dependencies": [{ "from": "api-gateway", "to": "orders" }],
  "prediction": {
    "available": true,
    "serviceId": "orders",
    "riskScore": 0,
    "confidence": "low",
    "horizonMinutes": 10,
    "causeSummary": "Evidence-based concise hypothesis.",
    "symptoms": [{ "label": "latency degradation", "evidenceIds": ["M-orders-latency-1"] }],
    "evidenceIds": ["M-orders-latency-1", "L-12"],
    "explanations": {
      "engineer": "Technical explanation with cited evidence IDs.",
      "executive": "Operational summary with the same evidence IDs."
    },
    "explanationSource": "gemini"
  },
  "cascade": {
    "available": true,
    "affectedServiceIds": ["api-gateway"],
    "paths": [{ "serviceIds": ["orders", "api-gateway"], "reason": "api-gateway depends on orders", "estimatedImpact": "medium" }]
  },
  "scenarios": [
    { "id": "do-nothing", "label": "Do nothing", "simulated": true, "remainingSystemRisk": 0, "recoveryMinutes": 0, "rank": 1, "description": "Baseline; no simulated intervention." }
  ],
  "evidence": [
    { "id": "L-12", "kind": "log", "serviceId": "orders", "timestamp": "2026-10-25T10:05:00.000Z", "label": "Error log", "value": "bounded excerpt", "sourceRow": 13 },
    { "id": "M-orders-latency-1", "kind": "metric", "serviceId": "orders", "timestamp": "2026-10-25T10:05:00.000Z", "label": "Latency increased", "value": "420 ms", "sourceRow": null }
  ],
  "notices": ["Risk and recovery values are simulated estimates, not calibrated probabilities or actions."]
}
```

The example values are illustrative. Implementations may refine optional properties, but keep a single coherent, runtime-validated contract. Risk score ranges 0–100. `confidence` is categorical (`low`, `medium`, `high`) and must not be presented as probability. `explanationSource` is `gemini`, `deterministic`, or `unavailable`. If insufficient data, set `status` to `insufficient_data`, `prediction.available` to false, and avoid fabricated prediction/cascade/scenario conclusions.

## Error response

Use a stable shape and suitable HTTP status:

```json
{
  "schemaVersion": "1",
  "status": "error",
  "error": {
    "code": "INVALID_TELEMETRY",
    "message": "Telemetry CSV is missing required columns.",
    "issues": [{ "file": "telemetry", "row": null, "field": "timestamp", "message": "Required column is missing." }]
  }
}
```

Suggested codes: `INVALID_TELEMETRY`, `INVALID_DEPENDENCIES`, `FILE_TOO_LARGE`, `UNSUPPORTED_MEDIA`, `ANALYSIS_FAILED`. Avoid returning internal stack traces, raw prompts, or secrets. Gemini failure alone should normally not fail deterministic analysis; report it via `explanationSource` and a notice.

## Invariants

- Every evidence ID referenced by symptoms, prediction, cascade, or explanation is present in `evidence`.
- Risk and recovery estimates are computed in TypeScript, not trusted from Gemini.
- Dependency references resolve to returned service IDs.
- Model output is schema-validated and evidence-ID validated before use.
- Every scenario has `simulated: true`; no field encodes an executable infrastructure command.
- Insufficient data never yields an asserted next-failure service.
