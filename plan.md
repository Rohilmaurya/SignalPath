# Build plan

Build **SignalPath**, a three-hour Next.js + TypeScript hackathon prototype that analyzes simulated server telemetry and service dependencies, predicts a service at risk, explains its evidence, traces possible cascading impact, and compares simulated recovery strategies.

Use `PRD.md` for product scope and acceptance criteria, `TRD.md` for architecture and implementation constraints, `app-flow.md` for screen and interaction behavior, and `backend-schema.md` for upload and API contracts. Read `ANTIGRAVITY_TASK.md` for the planner/executor roles and shared handoff rules.

## Build order

1. Inspect the shared folder and repository state; establish the smallest viable Next.js + TypeScript project if none exists.
2. Add realistic sample CSV and dependency JSON with enough history to show rising service metrics, severe logs, a clear predicted dependency, and a visible cascade.
3. Implement parsing, normalization, validation, time-window metric trends, evidence selection, risk scoring, dependency traversal, and simulated recovery ranking in TypeScript.
4. Implement `POST /api/analyze`, including schema validation and optional server-side Gemini Interactions API call with structured JSON and cited evidence IDs.
5. Build the dashboard: sample replay, paired uploads, system summary, risk-colored dependency graph/list, prediction/evidence, engineer/executive toggle, cascade, and do-nothing versus recovery comparison.
6. Add insufficiency, invalid upload, loading, and Gemini-unavailable behavior. Ensure the sample remains demoable without an API key and labels deterministic explanation as fallback.
7. Add README setup instructions and perform the most useful checks that fit the timebox; report actual results and limitations.

## Timebox

- First ~30 minutes: project skeleton, sample dataset, dashboard shape.
- Next ~75 minutes: normalization, deterministic analysis, API contract, graph/cascade and scenario logic.
- Next ~45 minutes: Gemini integration and evidence validation/fallback.
- Final ~30 minutes: connect flow, polish failure/insufficient states, README, verification, and handoff.

Adjust based on existing project state. Preserve the end-to-end demo path if time becomes constrained. Do not deploy or build production integrations. Antigravity records progress in `execution log.md`; Codex reviews and records findings in `review.md`.
