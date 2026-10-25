# SignalPath build plan

## Source of truth

Build the current product defined by PRD.md, TRD.md, app-flow.md, and backend-schema.md. Those four documents supersede the older sample-first dashboard direction. This file is only the build sequence and handoff map.

SignalPath is an editorial, scroll-led story that ends in an upload-first operations analysis tool. No sample telemetry is loaded by default; only a user's explicitly submitted telemetry CSV and dependency JSON can start analysis. The result is concise by default, uses a bespoke 3D model of the uploaded service graph, explains likely cascade, compares simulated recovery estimates, and supports evidence-grounded follow-up questions.

## Build sequence

1. Read ANTIGRAVITY_TASK.md, ANTIGRAVITY_ENGINEERING_MEMORY.md, review.md, all current requirements, the actual repo, and Git state. Inspect the existing implementation to identify which parts of the current sample-first dashboard need to be removed or redesigned.
2. Start with Master Engineering Workflow; inspect the configured Antigravity registry, relevant extensions, project overlay, skills, and specialist agents. Follow the requested planner/executor boundary.
3. Produce a concise architecture/design plan in execution log.md before changes: product state machine, story chapters, design/art direction, data lifecycle, dynamic graph strategy, motion/accessibility fallback, endpoint changes, and file ownership.
4. Remove initial sample-analysis state, hardcoded service assumptions, and all auto-analysis. Start in the story; end at a truly empty uploader. Do not ship a bundled telemetry fixture in the normal app.
5. Rework the landing experience into a purposeful, polished scroll story. Build the authored interactive story scene in the existing Three.js runtime. Blender is optional for custom GLB assets; do not add a paid scene editor. Use Flow only for an optional cinematic story asset. Neither tool may be required to analyze uploads or substitute for the live uploaded-data graph.
6. Preserve and adapt the existing parser and deterministic analysis foundation for arbitrary uploaded CSV/JSON. Keep backend secrets server-only. Add grounded POST /api/ask within the existing one-language project, as required by the PRD and backend contract.
7. Build an upload submission state machine, concise results workspace, dynamic 3D topology driven by uploaded dependencies, progressive detail disclosure, recovery estimate comparison, and safe follow-up Q&A.
8. Update README.md so setup and first-run instructions match the empty upload-first product; remove replay-sample and seeded-data instructions.
9. Run proportionate security and UI/accessibility reviews. Have UI/UX Judge inspect actual browser output. Use available hallmark-inspired workflow after a complete visual pass; accurately report if the upstream official hallmark skill is missing.
10. Check desktop and narrow layouts, empty/invalid/insufficient/uploaded states, keyboard and reduced-motion behavior, dynamic graph/fallback, citations, and what-if assumptions. Run project checks appropriate to the change. Record exact commands/results, known limits, setup, and next steps in execution log.md.

## Priority and timebox

- **P0 — Product behavior:** no automatic sample, no hidden server module, no fabricated incident; explicit file upload and Analyze action are required.
- **P1 — Story and art direction:** crisp editorial narrative, deliberate scroll transitions, crafted 3D, low clutter, fast path to upload.
- **P1 — Analysis usefulness:** evidence-grounded prediction, actual uploaded dependency graph and cascade, defensible scenario estimates, focused follow-up.
- **P2 — Polish:** responsive motion, asset optimization, error copy, interaction refinement.

Use current Next.js + TypeScript + Three.js unless a concrete technical limitation is found. Keep the three-hour prototype focused. If a feature cannot be done reliably in the timebox, ship the complete primary path first and record a grounded deferral rather than adding shallow decorations.

## Handoff files

- PRD.md — product promise, experience, requirements and acceptance.
- TRD.md — stack, system behavior, processing, security, performance and quality requirements.
- app-flow.md — page states and user interactions.
- backend-schema.md — upload and endpoint contracts, response schemas and invariants.
- ANTIGRAVITY_TASK.md — collaboration roles and executor workflow.
- execution log.md — Antigravity-owned progress and final handoff.
- review.md — Codex-owned findings and review decisions. Antigravity reads it before each implementation pass.





