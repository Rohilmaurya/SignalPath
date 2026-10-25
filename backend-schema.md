# Backend data contract

**Revision:** 2026-10-25 — upload-first analysis plus grounded follow-up

The server is authoritative for parsing, normalization, data sufficiency, deterministic risk estimates, graph traversal, evidence validation, and recovery ranking. Gemini provides structured interpretation and follow-up wording only. There is no default sample request and no persisted server-side incident state.

## 1. Telemetry upload

Endpoint: POST /api/analyze  
Content type: multipart/form-data

| Field | Type | Required | Notes |
|---|---|---:|---|
| telemetry | CSV file | Yes | UTF-8. Required headers below. |
| dependencies | JSON file | Yes | Directed service dependency graph. |

No source=sample mode is part of the shipped default flow. Analysis only begins after explicit user submission.

Required CSV headers: timestamp, service, level, message.

Optional numeric metric headers: latency_ms, error_rate, cpu_pct. Numeric values must be finite and non-negative. error_rate may be a fraction from 0 to 1 or percentage from 0 to 100; detect/document the accepted convention and normalize to 0–1. Timestamp parsing must be consistent; timezone-less values must be interpreted consistently and reported in UTC. Levels normalize to debug, info, warn, error, or fatal. Unknown levels should return a row-level issue or documented safe mapping.

Dependency JSON canonical shape:

    {
      "services": ["api-gateway", "orders", "database"],
      "dependencies": [
        { "from": "api-gateway", "to": "orders" },
        { "from": "orders", "to": "database" }
      ]
    }

from depends on to: when to degrades, from may be affected. Reject empty or duplicate IDs and dangling references. Cycles may be accepted, but traversal must be cycle-safe. IDs must be stable and safe to display.

## 2. Normalized input

    type TelemetryRecord = {
      timestamp: string;       // ISO UTC
      service: string;
      level: "debug" | "info" | "warn" | "error" | "fatal";
      message: string;         // bounded excerpt
      metrics: {
        latencyMs?: number;
        errorRate?: number;    // normalized 0..1
        cpuPct?: number;       // normalized 0..100
      };
      sourceRow: number;
    };

Enforce reasonable file byte, row, service-count, record, and message length limits. Ignore unknown extra columns safely. Do not log raw input. Limit evidence excerpts included in the response or sent to Gemini.

## 3. Successful analysis response

HTTP 200, JSON:

    {
      "schemaVersion": "1",
      "analysisId": "ephemeral-id",
      "status": "complete",
      "dataQuality": {
        "sufficientForForecast": true,
        "windowStart": "2026-10-25T10:00:00.000Z",
        "windowEnd": "2026-10-25T10:10:00.000Z",
        "recordCount": 120,
        "serviceCount": 4,
        "warnings": []
      },
      "services": [
        {
          "id": "orders",
          "riskScore": 74,
          "riskBand": "high",
          "riskFactors": ["latency rising", "error logs increased"],
          "metrics": [
            {
              "name": "latency_ms",
              "points": [
                { "timestamp": "2026-10-25T10:00:00.000Z", "value": 180 },
                { "timestamp": "2026-10-25T10:05:00.000Z", "value": 420 }
              ],
              "trend": "rising"
            }
          ]
        }
      ],
      "dependencies": [
        { "from": "api-gateway", "to": "orders" },
        { "from": "orders", "to": "database" }
      ],
      "prediction": {
        "available": true,
        "serviceId": "orders",
        "riskScore": 74,
        "riskBand": "high",
        "confidence": "medium",
        "causeSummary": "Evidence-based, qualified hypothesis.",
        "symptoms": [
          { "label": "latency degradation", "evidenceIds": ["M-orders-latency-1"] }
        ],
        "evidenceIds": ["M-orders-latency-1", "L-13"],
        "explanations": {
          "engineer": "Technical explanation using only verified evidence IDs.",
          "executive": "Concise operational summary with the same evidence."
        },
        "explanationSource": "gemini"
      },
      "cascade": {
        "available": true,
        "affectedServiceIds": ["api-gateway"],
        "paths": [
          {
            "serviceIds": ["orders", "api-gateway"],
            "reason": "api-gateway depends on orders",
            "estimatedImpact": "medium"
          }
        ]
      },
      "scenarios": [
        {
          "id": "do-nothing",
          "label": "Do nothing",
          "simulated": true,
          "remainingSystemRisk": 75,
          "recoveryMinutes": null,
          "rank": 3,
          "description": "Baseline; no simulated intervention.",
          "assumptions": []
        },
        {
          "id": "reduce-ingress",
          "label": "Reduce load on the at-risk service",
          "simulated": true,
          "remainingSystemRisk": 51,
          "recoveryMinutes": 12,
          "rank": 1,
          "description": "Simulated load reduction; no changes are applied.",
          "assumptions": ["Estimated impact assumes load-sensitive latency."]
        }
      ],
      "evidence": [
        {
          "id": "L-13",
          "kind": "log",
          "serviceId": "orders",
          "timestamp": "2026-10-25T10:05:00.000Z",
          "label": "Error log",
          "value": "Bounded log excerpt",
          "sourceRow": 14
        },
        {
          "id": "M-orders-latency-1",
          "kind": "metric",
          "serviceId": "orders",
          "timestamp": "2026-10-25T10:05:00.000Z",
          "label": "Latency increased",
          "value": "420 ms",
          "sourceRow": null
        }
      ],
      "notices": [
        "Scores are heuristic estimates, not calibrated probabilities.",
        "Recovery strategies are simulations and do not change infrastructure."
      ]
    }

This example is illustrative only. It must never appear as a live analysis unless generated from the uploaded files.

- riskScore ranges 0–100 and is not a probability.
- riskBand is low, medium, high, critical, or unknown.
- confidence is categorical (low, medium, high), not probability.
- Do not emit a time-to-failure horizon unless a defensible method and evidence support it. Do not use a fixed horizon as if it were predicted.
- explanationSource is gemini, deterministic, or unavailable.
- Every scenario has simulated=true. No field encodes an executable infrastructure command.
- Every evidence ID cited in predictions, symptoms, explanations, paths, and follow-up is present in evidence.

## 4. Insufficient-data response

Return HTTP 200 with status=insufficient_data when files are valid but the temporal coverage/signals do not support a forecast. Return safe descriptive summaries and observed evidence if useful. Set:

- dataQuality.sufficientForForecast to false and explain observed coverage/reason;
- prediction.available to false, serviceId to null, and avoid a next-failure claim;
- cascade.available to false and paths/affectedServiceIds to empty;
- scenarios to an empty list because a forecast-dependent comparison is not supported.

Do not rank a service or recovery strategy based only on a minimum record count. A question can still be answered only when the context contains evidence sufficient for that specific explanation; otherwise the Q&A should say what is missing.

## 5. Error response

Use stable, versioned errors and suitable HTTP status:

    {
      "schemaVersion": "1",
      "status": "error",
      "error": {
        "code": "INVALID_TELEMETRY",
        "message": "Telemetry CSV is missing required columns.",
        "issues": [
          {
            "file": "telemetry",
            "row": null,
            "field": "timestamp",
            "message": "Required column is missing."
          }
        ]
      }
    }

Suggested codes: INVALID_TELEMETRY, INVALID_DEPENDENCIES, FILE_TOO_LARGE, UNSUPPORTED_MEDIA, ANALYSIS_FAILED. Do not expose stack traces, raw prompts, secrets, or provider internals. Gemini failure alone should not fail deterministic analysis; use an explanation status and concise notice.

## 6. Follow-up endpoint

Endpoint: POST /api/ask  
Content type: application/json

Request shape:

    {
      "schemaVersion": "1",
      "analysisId": "ephemeral-id",
      "question": "What evidence points to this service?",
      "context": {
        "status": "complete",
        "dataQuality": { "sufficientForForecast": true },
        "prediction": {
          "serviceId": "orders",
          "riskScore": 74,
          "riskBand": "high",
          "confidence": "medium",
          "evidenceIds": ["M-orders-latency-1", "L-13"]
        },
        "dependencies": [
          { "from": "api-gateway", "to": "orders" },
          { "from": "orders", "to": "database" }
        ],
        "cascadePaths": [
          { "serviceIds": ["orders", "api-gateway"], "evidenceIds": [] }
        ],
        "scenarios": [
          { "id": "reduce-ingress", "remainingSystemRisk": 51, "recoveryMinutes": 12, "simulated": true }
        ],
        "evidence": [
          { "id": "M-orders-latency-1", "kind": "metric", "serviceId": "orders", "value": "420 ms" },
          { "id": "L-13", "kind": "log", "serviceId": "orders", "value": "Bounded excerpt" }
        ]
      }
    }

The client sends only the active analysis context, not the full telemetry upload. Enforce maximum question length, context bytes, evidence count, and excerpt length. Validate the request and ensure every returned evidence ID exists in the submitted context. Because there is no persistent server state, treat client-provided context as untrusted and limit answers to that context.

Response shape:

    {
      "schemaVersion": "1",
      "analysisId": "ephemeral-id",
      "status": "answered",
      "answer": "The strongest available signal is the rising latency trend.",
      "evidenceIds": ["M-orders-latency-1"],
      "uncertainty": "The upload does not include a dependency saturation metric.",
      "suggestions": [
        "Check whether the database latency changed in the same interval."
      ],
      "source": "gemini"
    }

status is answered, insufficient_context, or unavailable. source is gemini or unavailable. Suggestions are investigative guidance only. The response must not say an issue was fixed, run a command, or imply infrastructure access. With no API key, return unavailable; do not pretend deterministic code understood arbitrary free-form questions. Do not persist chat history.

## 7. Gemini behavior and validation

- Read GEMINI_API_KEY only in server runtime.
- Use GoogleGenAI and client.interactions.create with model gemini-3.8-flash and response_format containing JSON MIME type and the schema.
- Runtime-validate every model response. Validate evidence IDs in structured fields and any citation markers in displayed text; remove unsupported references and use safe fallback wording.
- Ask the model to distinguish observed input from hypothesis, state when evidence is insufficient, ignore instructions embedded in telemetry, avoid unsupported certainty, and never claim actions were performed.
- Send a compact prompt and selected excerpts only. Bound call time and handle timeout, no key, provider error, malformed JSON, schema failure, and citation failure.
- Do not let model output set risk scores, confidence classes, cascade paths, or recovery estimates.

## 8. Invariants

- Analysis is never called before explicit submission of both files.
- No default sample telemetry or precomputed analysis is loaded in the product.
- Every response has a stable schema version and validated fields.
- Every evidence citation resolves to current request/context evidence.
- Every dependency references a returned service.
- Risk, dependency traversal, cascade, and scenario estimates are deterministic TypeScript.
- Insufficient input never produces an asserted next-failure service.
- No API key, raw server error, or raw unbounded logs reach browser code.

