# Antigravity implementation handoff

## Roles and decision rights

- **Antigravity is the executor and code writer.** Implement the experience and application changes in this shared project. Read the product/technical requirements and reviewer notes before each pass.
- **Codex is the planner and reviewer.** Codex maintains plan and requirements documents, owns review.md, and reviews Antigravity's implementation through the shared workspace and execution log.md. Do not ask Codex to write application code.
- **The human owns final product decisions.** Keep decisions, tradeoffs, deferred work, and evidence reviewable.

## Current product direction — supersedes earlier dashboard-first handoff

Build a scroll-led, editorial, high-craft introduction that leads into a genuinely upload-first operations analysis workspace. The application does not start from sample logs, a preselected server module, or an auto-analysis. It has no default dataset. Analysis begins only after the user provides a telemetry CSV plus dependency JSON and deliberately selects Analyze.

After upload, show a concise, evidence-grounded prediction of the component most at risk, a dynamic crafted 3D topology based on the actual uploaded dependencies, the primary possible cascade, a small comparison of simulated recovery estimates with do nothing, and a focused way to ask questions about the current run. Reveal secondary evidence and assumptions on request. No real infrastructure changes are executed.

The story may show explicitly labeled illustrations, but they are not telemetry or a live result. The uploaded-data topology must not be a static scene or a hardcoded sample graph. The detailed requirements in PRD.md, TRD.md, app-flow.md, and backend-schema.md are authoritative.

## Required skill and agent workflow

1. Start with **Master Engineering Workflow**. Read the current project Git state and actual implementation. Consult the configured registry and applicable extension files under %USERPROFILE%/.gemini/config/antigravity-system/, plus any project overlay under .agents/engineering-system/extensions/. Read ANTIGRAVITY_ENGINEERING_MEMORY.md.
2. Use the full Antigravity skill set relevant to this explicit scroll-story, motion, 3D, and application redesign:
   - Master Engineering Workflow
   - Software Architecture Planning
   - Frontend Design
   - Immersive Web Experience Designer
   - UI Motion Designer
   - Advanced Web Motion Designer
   - Immersive 3D Motion Designer
   - hallmark-inspired (the installed custom skill)
3. Coordinate applicable specialist agents:
   - Engineering Orchestrator to establish dependencies, work ownership, and integration order.
   - Engineering & Coding for implementation review, maintenance, and actual checks.
   - Frontend Engineer for the responsive product UI.
   - Immersive Experience Engineer for the authored narrative and data-driven 3D experience. Coordinate with Frontend Engineer on clear ownership and integration.
   - Security Engineer for upload boundaries, secrets, log handling, model prompt injection, Q&A, and data lifecycle.
   - UI/UX Judge to independently inspect the complete rendered site, not just source code or screenshots of design intent.
4. Before implementation, record the design/architecture decision: chapter sequence, visual language, motion triggers and reduced-motion alternative, Three.js/Blender/Flow responsibilities, upload/result state machine, Q&A contract, file ownership, and acceptance checks.
5. The configured official upstream hallmark skill was absent in the last recorded environment inspection. Recheck Antigravity's current registry. Run the official hallmark gate only if its actual skill file is installed and runnable; otherwise run hallmark-inspired and record the exact limitation. Never claim one ran when it did not.
6. Record every skill/agent actually used and every check actually run in execution log.md. The list above is a required workflow selection for this redesign; report any unavailable capability rather than simulating it.

## Implementation guidance

- Inspect the existing Next.js + TypeScript implementation and preserve functioning analysis logic where sound. Remove initial calls to sample data, sample server state and hardcoded topology data from the shipped user path. Do not rewrite the stack without an evidence-based reason recorded in the log.
- Use the existing Three.js runtime for the scroll-story scene and the uploaded-data topology. Build scroll-linked transitions and interactions in the app. No paid scene editor is required. Blender is optional if a custom model asset materially improves the scene; retain the .blend source and export an optimized GLB.
- Google Flow may create an offline cinematic asset for the story only. It must not be needed for core behavior, load analysis data, carry essential text, or masquerade as live topology. If a Flow artifact is unavailable, complete a graceful native scene/poster fallback.
- Update README.md and remove stale replay-sample/auto-loaded dashboard instructions.
- Keep the Gemini credential server-only. Validate upload size and contents, select only bounded evidence for model requests, and treat telemetry and user questions as untrusted input.
- Q&A can explain the current upload and provide evidence-grounded diagnostic or recovery guidance. It cannot claim to change systems or execute a fix. Recovery scenarios stay labeled simulations.
- Keep the product visually calm: one idea per story chapter; one dominant analysis scan path; sparse persistent controls; readable topology labels; purposeful color; no decorative badge/card clutter.
- Provide accessible non-WebGL and reduced-motion alternatives. Avoid scroll traps, constant movement, hidden keyboard controls, and important content encoded only in images/video.

## Execution and shared log

- You may edit application code and supporting project files needed for the implementation.
- Antigravity owns execution log.md. Append dated entries with decisions, changed files/features, exact commands/checks and observed results, known limitations, and next step.
- Codex owns review.md. Read it before each implementation pass; do not edit or delete planner review entries. Append any executor response only under the existing clearly labeled Executor responses section.
- Do not deploy, publish, or change external systems unless the human explicitly asks.
- Do not stop at a partial visual mock. Deliver a working upload-to-analysis path and the complete story-to-tool flow, or clearly record why a requirement is blocked and the closest complete fallback.

## Completion handoff

The final execution-log entry must summarize the actual product flow, controls, analysis limitations, Three.js and Blender asset usage, plus Flow usage or why Flow was not used, setup and environment variables, commands/checks actually run with outcomes, known issues, and deferred work. Do not state any unchecked item as passed.





