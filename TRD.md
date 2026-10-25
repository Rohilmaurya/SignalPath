# Technical requirements: SignalPath

**Revision:** 2026-10-25 — story-led, upload-first architecture  
**Status:** Supersedes prior sample-first dashboard and hardcoded topology requirements.

## Architecture

Keep the existing Next.js App Router + TypeScript application unless inspection finds a concrete blocker. The current one-project boundary already supports the story UI, upload route, deterministic analysis, and server-only Gemini calls. Do not change stack for novelty.

- Browser serves a story-led landing experience and an upload-first analysis workspace.
- Browser submits telemetry CSV and dependency JSON to POST /api/analyze as multipart/form-data only after the user selects Analyze.
- Server parses and validates uploads, normalizes records, assesses sufficiency, selects evidence, runs deterministic analysis, optionally requests a Gemini explanation, and returns a validated response.
- Browser retains the current analysis in memory only. Follow-up questions send a bounded analysis context to POST /api/ask; do not add database, server memory store, or durable log retention for this prototype.
- TypeScript owns parsing, sufficiency, risk, graph traversal, scenario estimates, citation validation, and response contracts. Gemini owns explanation and grounded Q&A only.
- Remove any default server module, hardcoded operational dataset, sample auto-analysis, and service-specific sample assumptions from the normal product path.

## Stack and visual runtime

- Next.js App Router and TypeScript.
- Keep Three.js already installed for a dependency topology generated from arbitrary uploaded services and edges.
- Google @google/genai, server-side Gemini Interactions API, JSON schema output, model ID gemini-3.8-flash.
- Zod for request/response boundaries where already used.
- Existing CSV parser and installed dependencies should be preserved if they satisfy validation and performance needs.
- Use the existing Three.js runtime for both the scroll-story scene and the data-driven uploaded topology. Antigravity owns the scroll-linked animation and interaction; no paid scene editor is required.
- Blender is an optional free, open-source authoring tool for custom 3D assets. If used, retain the editable .blend source and export optimized GLB files for Three.js. The web scene and scroll behavior remain in Three.js.
- [Google Flow](https://labs.google/fx/tools/flow/faq) is an offline creative tool, not a runtime analysis dependency. It may produce a short, muted, decorative story clip if a real asset is supplied and performance/accessibility are preserved. Never use generated video to encode changing topology, labels, evidence, or predicted results. Provide a poster and reduced-motion/static fallback.
- No analytics package, database, authentication, or infrastructure integration is required.

## Data lifecycle and privacy

- No bundled telemetry logs or sample analysis are preloaded in the shipped user flow.
- User selection and explicit submission are the only normal start of analysis.
- Process bounded uploads in request memory. Keep the latest result in browser memory for the current page session. Do not persist raw uploads, logs, API prompts, or analysis context by default.
- Send Gemini only a compact summary, bounded selected evidence, dependency context, and a bounded follow-up context. Treat all log text and user questions as untrusted content, not as instructions.
- Never log secrets or raw telemetry. Expose GEMINI_API_KEY to server runtime only. No NEXT_PUBLIC_ keys.
- Return safe validation/provider messages without raw stack traces, prompts, or environment values.

## Upload contract and normalization

Telemetry CSV requires headers: timestamp, service, level, message. Optional numeric metrics: latency_ms, error_rate, cpu_pct. Additional columns may be ignored safely. Dependencies JSON uses the canonical services and dependencies structure in backend-schema.md. Direction remains from depends on to.

Enforce reasonable upload byte, row, message, service, and request limits. Parse UTF-8 CSV and JSON. Return filename/row/field-level issues where possible. Normalize timestamps to ISO UTC, service IDs consistently, severity to the supported set, and error rate to 0–1. Preserve bounded log excerpts solely as evidence for the current analysis.

Do not infer missing metric values as healthy. Determine forecast sufficiency from usable service-level time coverage and signals; document thresholds in code/UI. If history or metrics cannot support a forecast, return insufficient_data with coverage and reasons, and do not return a predicted service, cascade forecast, or ranking of recovery options.

## Analysis processing sequence

1. Validate request size and required uploads.
2. Parse CSV and dependency JSON; validate headers, values, timestamps, service identities, and graph references.
3. Normalize valid records and graph IDs.
4. Aggregate only available metrics into time windows; detect trends or anomalies with documented heuristic thresholds.
5. Evaluate sufficiency per service and overall. Never invent forecasts from record count alone.
6. Select a compact evidence set around meaningful changes; preserve severe logs and bounded context; assign stable evidence IDs.
7. Compute bounded service risk estimates from available metrics, logs, and conservative graph context.
8. Determine the top at-risk service only if sufficient evidence exists. Keep heuristic estimates distinct from calibrated probabilities.
9. Traverse dependents in the documented graph direction with cycle detection and a depth bound.
10. Evaluate a small set of simulated, topology-aware recovery scenarios plus the do-nothing baseline. Never emit executable commands or actions. Sort by remaining estimated system risk, then recovery time.
11. If configured, call Gemini on the server for structured symptom classes, concise cause hypotheses, and engineer/executive explanations based on the selected evidence.
12. Validate all model citations against evidence IDs from this request and fail safely to limited deterministic explanation if provider output is malformed or cites unknown IDs.
13. Return the versioned response contract in backend-schema.md.

## Follow-up question endpoint

Add POST /api/ask for the current uploaded analysis only.

- Request contains analysisId, a user question, and a bounded, versioned context copied from the successful analysis response: data-quality summary, risk/prediction facts, dependency edges and paths, scenarios, and verified evidence excerpts with IDs.
- Do not accept arbitrary full telemetry dumps in this route. Enforce length and count limits.
- Validate that each cited evidence ID exists in the submitted context. The server cannot know facts omitted from a stateless client request; treat this context as untrusted, validate its shape and bounds, and instruct Gemini to answer only from it.
- Gemini response includes concise answer, supported/uncertain status, cited evidence IDs, and optional safe investigation suggestions. Use a structured schema.
- The answer must not claim the system has been changed or that the issue was fixed. If context is insufficient, say what is missing and ask a focused follow-up.
- Without a configured API key, return a clear unavailable state or deterministic contextual answer only when it can be generated without pretending to understand free-form intent.
- Do not persist conversation history. The browser may retain the current conversation in memory until reload.

## Risk, cascade, and recovery semantics

Risk scores use 0–100 but are heuristic rankings, not probabilities. Risk bands and confidence are categorical. Metrics absent from an upload are neutral/unknown, not healthy. Keep weights and sufficiency thresholds centralized, document assumptions, and disclose simulation uncertainty.

For from depends on to, a degrading to may propagate to dependents represented by from. Preserve this direction in prose and visuals. Cycle detection and depth bounds are mandatory.

Recovery scenarios are estimates based on explicit assumptions and available graph/metric context. Include do nothing when a forecast exists. Return simulated=true for each option. Do not label a scenario “recommended” unless the ranking and rationale are present. Never invent healthy peers or failover capacity absent from the uploaded graph/context.

## Story and frontend requirements

- Build a scroll-led introduction with clear narrative chapters: early signals, dependencies, cascade, recovery tradeoff, and upload.
- Story values and visual examples are illustrative and visibly labeled as such; they are not an analysis of a real upload.
- The upload workspace is the end of the narrative and the beginning of the actual tool. It is intentionally empty before upload.
- Provide a skip-to-upload link and a direct navigation route/anchor. Avoid scroll trapping and scroll-linked interaction essential to understanding.
- Dynamic 3D scene must map arbitrary uploaded dependency graphs to legible spatial service representations, directional links, selected service, risk, and primary cascade. Use purposeful modeled forms, materials, scale, and focus; no circle-on-grid placeholder, collisions, or fixed list of sample service IDs.
- Use the 3D view to explain structure, not to replace readable labels or evidence. Provide a semantic service/path list alternative and usable operation without WebGL.
- Main analysis result has one scan path: likely service → strongest evidence → main cascade → leading recovery comparison. Collapse secondary evidence, paths, assumptions, and alternative strategies until asked for them.
- Keep risk color purposeful. Avoid dense global headers, repeated facts, equal-weight card grids, excessive badges, tactical monospace overload, and persistent controls that do not help the current task.
- Show loading progress, invalid-upload feedback, insufficient-data state, no-key/provider state, and reset/new-analysis path.
- Keyboard operations, screen-reader names, contrast, focus visibility, responsive layout, and prefers-reduced-motion behavior are required.
- Pause animation and expensive render loops when offscreen or when the document is hidden. Provide a static poster/fallback.

## Verification and handoff

Antigravity verifies the actual browser experience at desktop and narrow viewport sizes, including story navigation, empty upload state, invalid file feedback, valid upload flow, insufficient history, grounded follow-up state, keyboard navigation, reduced motion, and WebGL/video fallback where feasible. Run project checks appropriate to the code changed and report only observed outcomes in execution log.md. Do not claim unrun checks passed.





