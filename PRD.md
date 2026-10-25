# Product requirements: SignalPath

## Product summary

SignalPath is a live operations analysis dashboard for exploring simulated server telemetry. It estimates which service is most at risk of failing next, explains the likely cause using evidence, traces possible downstream impact through service dependencies, and compares simulated recovery strategies. It is an operations tool; a sample incident replay is its demonstration, not a game.

## Goal and audience

Build a polished, solo-developer, three-hour hackathon prototype for Track 1: Software & AI. The primary user is an engineer or technical judge investigating an emerging incident. An executive explanation mode makes the same evidence understandable to non-specialists.

## User outcomes

1. Load the included sample incident immediately, or upload a telemetry CSV and dependency JSON.
2. Identify the next likely service failure and understand the confidence/uncertainty and evidence behind the estimate.
3. See the dependency paths and services that could be affected if the predicted service degrades.
4. Compare recovery scenarios with a do-nothing baseline using remaining system risk and estimated recovery time.
5. Switch between engineering and executive wording without changing the underlying evidence.

## Core experience

- A dashboard header communicates that this is a simulated, AI-assisted analysis, with sample replay/load and upload controls.
- A concise system overview shows current incident state, top predicted service, risk, and data sufficiency.
- A dependency graph shows services as nodes colored by computed risk. The predicted service and plausible cascade path are visually emphasized. Nodes/edges must be legible, with a list-based fallback on narrow screens.
- A prediction/evidence panel shows the likely root cause, symptom classifications, cited evidence IDs mapped to actual metric/log evidence, and an engineer/executive explanation toggle.
- A cascade panel shows downstream services and why each dependency path matters.
- A recovery comparison includes a do-nothing baseline and a small set of simulated options. Clearly label recommendations and numbers as estimates. Never show executable remediation commands or imply that the app changes real infrastructure.
- Loading, parse/validation errors, no-data, and insufficient-history states are designed rather than left blank. Insufficient data must say there is not enough history for a reliable forecast; never invent a forecast.

## Input requirements

Telemetry CSV required columns: `timestamp`, `service`, `level`, `message`. Optional numeric columns: `latency_ms`, `error_rate`, `cpu_pct`. Accept additional columns without failing. Dependency JSON represents named services and directed dependency relationships; the chosen shape is specified in `backend-schema.md`.

The sample must include a meaningful time series, multiple services, logs with severity and context, metrics that trend into an incident, and a dependency chain capable of showing cascade and recovery differences. Include a sample dependency file alongside the sample telemetry.

## AI and analysis behavior

- Backend selects compact, relevant log evidence around metric anomalies, retaining nearby context and severe events.
- Gemini classifies symptoms and explains likely causes in engineering and executive language. The prompt must distinguish observed facts from hypotheses and must not claim a certainty unsupported by the input.
- TypeScript owns risk calculation, evidence ID validation, dependency traversal, cascade estimates, and scenario ranking. The model does not calculate authoritative scores or invent evidence.
- The app is an AI-assisted predictive prototype, not a model trained on historical outages. Make that limitation visible in product copy.

## Demo and acceptance criteria

- On first load, a user can load the sample without configuring an API key and see a complete, coherent dashboard. If Gemini is unavailable or unconfigured, the sample still runs through a clearly labeled deterministic demo explanation/fallback; do not misrepresent fallback as live AI output.
- Uploading valid telemetry and dependencies produces a normalized analysis response and dashboard update.
- Invalid files produce actionable validation errors and do not crash the interface.
- Too-short or unusable histories show why no forecast is returned.
- The risk-highlighted graph makes the predicted service and cascade understandable, including a non-graph fallback.
- Engineer/executive toggle changes explanation wording while preserving citations.
- Recovery comparison includes a do-nothing baseline and ranks options first by remaining system risk, then by recovery time; all values are explicitly simulated estimates.
- No API key or sensitive server configuration is shipped to client code.
- README/setup instructions explain how to run the prototype and configure Gemini for live analysis.

## Scope boundaries

In scope: one local Next.js application, sample replay, CSV and JSON upload, single analysis endpoint, rule-based metric/risk and dependency calculations, Gemini structured explanation, visual dashboard, scenario comparison, graceful error/fallback states.

Out of scope: production monitoring integrations, authentication, persistent incident storage, streaming ingestion, training a predictive model, real remediation, deployment, multi-tenant controls, and claims of production-grade prediction accuracy.

## Three-hour priority order

1. End-to-end sample path and dashboard shell.
2. Stable input normalization/validation and deterministic risk/cascade/scenario calculations.
3. Gemini server integration with validated structured response and safe fallback.
4. File upload, evidence details, responsive polish, and run instructions.

If time is short, preserve a reliable demo and clearly mark deferred behavior in the execution log rather than adding superficial features.
