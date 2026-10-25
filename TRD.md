# Technical requirements: SignalPath

## Architecture

- One Next.js + TypeScript project contains the UI and backend route handlers.
- Browser submits telemetry CSV and dependency JSON to `POST /api/analyze` as `multipart/form-data`; server parses, validates, normalizes, analyzes, and returns JSON.
- Keep boundaries explicit: parsing/normalization, metric-window analysis, evidence selection, deterministic risk and graph calculations, optional Gemini explanation, recovery evaluation, and response serialization.
- Include sample telemetry and dependency data as local project assets. The sample path should be usable without uploading files.

## Stack

- Next.js App Router and TypeScript.
- Google `@google/genai` SDK.
- Gemini model ID `gemini-3.8-flash` through the Interactions API with JSON schema response format.
- A schema validator (Zod recommended) for API input/output boundaries.
- A lightweight graph visualization approach suitable for the timebox; provide a semantic textual/list representation as fallback. Avoid adding a large graph dependency unless it materially accelerates the demo.
- Use the installed package manager inferred from the lockfile; if the project is empty, choose a common package manager and record it.

## Backend processing sequence

1. Enforce reasonable upload size, file type, row count, and field limits for a local demo.
2. Parse CSV and JSON; return field-level validation errors for missing columns, invalid timestamps/numbers/levels, malformed dependency data, or unknown dependency references.
3. Normalize timestamps to ISO UTC, service names consistently, severity levels, and optional metrics. Preserve original messages as evidence, with bounded lengths.
4. Group metrics into time windows and calculate trend/anomaly signals per service. Do not require every optional metric. Normalize only metrics that exist.
5. Determine sufficiency based on usable temporal coverage and observations, with thresholds documented in code/UI. If insufficient, return an explicit no-forecast analysis while still summarizing available data.
6. Select log evidence near anomalous windows, including severe entries and bounded neighboring context. Give every selected log/metric signal a stable evidence ID.
7. Build a compact prompt with evidence IDs, summary, and dependency graph. Call Gemini only on the server when a key exists and live analysis is enabled.
8. Validate the returned structure and ensure every cited evidence ID belongs to the submitted evidence set. Drop invalid references or use a safe deterministic fallback; never show uncited model text as grounded fact.
9. Calculate per-service risk from deterministic metric and log signals plus dependency context. Return score, band, and concise signal factors.
10. Traverse directed dependency edges to estimate downstream cascade, preventing cycles and limiting traversal depth.
11. Evaluate a small fixed set of simulated recovery scenarios and the do-nothing baseline. Rank by remaining system risk, then estimated recovery time.
12. Return a versioned JSON response. Keep stack traces, prompts, secrets, and raw server errors out of public responses.

## Risk and scenario design

Risk is a transparent heuristic, not a calibrated probability. Use a bounded 0–100 score and map scores to named bands. Combine available metric trend/anomaly signals and severity-weighted log signals; missing metrics are neutral rather than treated as healthy. Add dependency propagation conservatively and disclose this is an estimate. Keep weights centralized and documented.

Recovery scenarios should be few, understandable, and deterministic (for example: isolate the predicted service, shift load to a healthy dependency peer, or scale capacity where supported by the scenario model). Simulate changes to risk factors and recovery time; do not execute infrastructure actions. The do-nothing case is the baseline. Sort primarily by lower residual system risk and secondarily by shorter estimated recovery time.

## Gemini integration

- Read `GEMINI_API_KEY` only in server runtime. Never prefix it with `NEXT_PUBLIC_`, return it, or log it.
- Use `GoogleGenAI` and `client.interactions.create` with `model: "gemini-3.8-flash"`, `input`, and `response_format` containing JSON mime type and the schema.
- Validate parsed output at runtime. Handle no key, timeout, provider failure, malformed output, and invalid citations distinctly in logs/internal state, while returning safe user-visible statuses.
- Mark generated explanations with source/status metadata (`live` versus `fallback`) so the UI cannot present deterministic fallback as live Gemini output.
- Set bounded input sizes and select a compact evidence set. Avoid sending full unbounded uploads to the model.
- Do not use model output for scores, dependency traversal, or scenario calculations.

## Frontend requirements

- Maintain accessible labels, keyboard-accessible controls, readable color contrast, and status text beyond color alone.
- Provide drag/drop or file picker only if quick; ensure upload controls expose accepted formats and validation feedback.
- Display loading/progress state during analysis. Keep the previous valid dashboard visible or clearly indicate the new analysis is pending.
- Render graph labels and risk state, prediction summary, evidence details, cascade list, explanation toggle, and recovery comparison.
- Present sample/fallback/live AI provenance and simulation disclaimers.
- Do not represent estimates as probabilities unless the underlying semantics are explicitly explained.

## Configuration and local operation

- `.env.local` is local-only and ignored; provide `.env.example` with an empty placeholder, never a real key.
- Provide setup, run, sample demo, and Gemini configuration guidance in README.
- No database or external services are required beyond Gemini for optional live explanation.
- Keep implementation deployable as a standard Next.js app, but deployment is not part of this deliverable.

## Verification

The executor should run the available typecheck/lint/build or project checks that fit the timebox and report actual outcomes in `execution log.md`. At minimum manually verify sample flow, invalid input, insufficient history, Gemini-unconfigured fallback, both explanation modes, graph/list accessibility, and recovery baseline ordering where feasible. Do not state unrun checks as passed.
