# Antigravity engineering system — persistent reference

**Source:** User-provided `Antigravity_Engineering_System_Guide.md` and installed files under `%USERPROFILE%\.gemini\config`.
**Read on:** 2026-10-25.

This file records the user's Antigravity setup for future work in this shared project. It is a reference, not application requirements. The user's explicit request and this project's role split take precedence over generic system defaults.

## System layout and precedence

- Antigravity skills are reusable methods; agents are specialist workers; **Master Engineering Workflow** is the normal entry point for substantial app/site work; the **Engineering Orchestrator** decomposes and coordinates implementation.
- Global hub: `%USERPROFILE%\.gemini\config\antigravity-system\`.
- Read `registry/START-HERE.md`, `registry/components.json`, applicable `extensions/shared/` files, applicable `extensions/components/<component-id>/` files, and any project overlay under `.agents/engineering-system/extensions/`.
- Extension hub is the place for evolving tools, references, requirements, workflows, examples, and project-specific overlays. Keep core skill files stable. Entries should include scope/date/source/status/limitations as applicable; never store secrets.
- Explicit user requirements and security/accessibility floors take precedence, then approved project requirements, component guidance, shared preferences, and agent defaults.

## Installed inventory

Skills: `master-engineering-workflow`, `software-architecture-planning`, `frontend-design`, `immersive-web-experience-designer`, `ui-motion-designer`, `advanced-web-motion-designer`, `immersive-3d-motion-designer`, and custom `hallmark-inspired`.

Agents: `engineering-orchestrator`, `engineering-coding`, `frontend-engineer`, `immersive-experience-engineer`, `security-engineer`, and `ui-ux-judge`.

Third-party `hallmark` appears in the registry and its extension directory exists, but `%USERPROFILE%\.gemini\config\skills\hallmark\SKILL.md` is absent. Do not claim the official Hallmark skill ran. `hallmark-inspired` is a separate installed custom skill and may be used when suitable.

## What each role does

- **Master Engineering Workflow:** routes a substantial task through inspection, scope, architecture, design, implementation, security, validation, UI review, Hallmark gate, and handoff; consults extension hub first.
- **Software Architecture Planning:** inspect actual repo and constraints; define requirements/assumptions, architecture and tradeoffs, boundaries, data flow, risks, milestones, acceptance criteria, and validation.
- **Frontend Design:** establish product-specific visual direction, hierarchy, components, tokens, responsive and accessibility behavior; avoid interchangeable AI-template patterns and fabricated claims.
- **Immersive Web Experience Designer:** narrative/scroll design for genuinely immersive sites. Not needed for a conventional operations dashboard.
- **UI Motion Designer:** purposeful microinteraction specs, including trigger, states, timing, interruption, keyboard behavior, and reduced-motion alternative.
- **Advanced Web Motion Designer:** complex timelines, ScrollTrigger, pinned/scroll-linked choreography and lifecycle/performance concerns.
- **Immersive 3D Motion Designer:** actual 3D scenes, camera paths, assets, GPU budget and fallbacks; avoid 3D when SVG/CSS/data visualization is clearer.
- **Hallmark-Inspired:** custom build/audit/redesign/polish workflow; audit mode reports ranked findings without edits. It is not the upstream Hallmark package.
- **Engineering Orchestrator:** task graph, dependencies, owners, acceptance criteria, non-overlapping file ownership, and integration order; delegate only useful independent work.
- **Engineering & Coding:** inspect, reproduce/characterize, implement minimal maintainable code, run real checks, review diffs, report exact outcomes.
- **Frontend Engineer:** implements approved UI and behavior with responsive, accessible states; preserve working behavior and avoid dead controls/dependencies without cause.
- **Immersive Experience Engineer:** implements meaningful motion/3D; pair concurrently with frontend engineering when such motion is actually in scope.
- **Security Engineer:** threat-models and reviews input, uploads, APIs, secrets, dependencies, auth/data and configuration; evidence-based findings, safe scoped fixes and re-tests.
- **UI/UX Judge:** independent critique of actual UI/browser output; ranked evidence-based usability, visual, responsive, accessibility, interaction and performance findings.

## Global working principles

- Default substantial workflow: inspect → clarify/record assumptions → plan → implement → test → proportionate security/quality checks → report actual result.
- Use relevant specialists only; don't invoke motion/3D skill families merely because they exist.
- When meaningful motion is in scope, frontend and motion engineering coordinate from planning through integration, with explicit APIs, reduced-motion rules and non-overlapping ownership. One integrator owns final checks.
- For new/redesigned UI, run the available Hallmark audit after the first complete visual pass. Audit before targeted fixes; preserve product behavior and requirements.
- Validate at actual project commands. Never state a test, browser check, deployment or fix passed unless performed and observed. Report failures and unverified areas distinctly.
- Avoid speculative dependencies, destructive changes, overwriting working functionality, exposing secrets, or sending project data to external services without good reason/authorization.
- UI should have responsive behavior, keyboard operation, visible focus, contrast, semantic controls, meaningful loading/empty/error/success states, and reduced-motion behavior where relevant. Don't invent metrics, endorsements or capabilities.
- Handoffs report changed files, actual checks/results, setup, limitations, unresolved risks and next steps.

## Current application direction — Orcathon SignalPath

This direction supersedes the previous sample-first dashboard project guidance. The user explicitly set the roles: **Codex plans and reviews; Antigravity executes and writes code.** Codex maintains requirements and review.md; Antigravity writes execution log.md.

The product is now a scroll-led, editorial, high-craft story that ends in an upload-first operations analysis workspace. No preloaded sample logs, hardcoded server module, default analysis, or bundled telemetry fixture is part of the normal product path. The user submits a telemetry CSV and dependency JSON and explicitly selects Analyze. The tool returns a concise, evidence-grounded at-risk service, dynamic 3D topology based on the uploaded dependency graph, a possible cascade, simulated recovery comparisons, and grounded follow-up Q&A. No real infrastructure is changed.

### Required Antigravity workflow for this redesign

Start with Master Engineering Workflow and inspect %USERPROFILE%/.gemini/config/antigravity-system/ registry, applicable extensions, and any project overlay. Use the user-requested Antigravity skills for the current scroll/3D redesign: Master Engineering Workflow, Software Architecture Planning, Frontend Design, Immersive Web Experience Designer, UI Motion Designer, Advanced Web Motion Designer, Immersive 3D Motion Designer, and the custom hallmark-inspired skill. Use specialist agents Engineering Orchestrator, Engineering & Coding, Frontend Engineer, Immersive Experience Engineer, Security Engineer, and UI/UX Judge. Antigravity records actual skill/agent use and actual check outcomes; never claim work that did not happen.

The earlier environment inspection found no installed upstream hallmark/SKILL.md. Recheck the current Antigravity environment before using it. Use the custom hallmark-inspired workflow and state the limitation if the upstream skill is still unavailable.

### Product and architecture guidance

- Preserve the existing Next.js + TypeScript app unless an actual blocker justifies a change; it already combines UI and server routes in one language and can keep Gemini credentials on the server.
- Use the existing Three.js runtime for the authored interactive story scene and the uploaded-data topology; no paid scene editor is required. Blender is an optional free asset-authoring tool, with editable .blend sources and optimized GLB exports. Keep the uploaded-data topology derived from arbitrary input.
- Google Flow may supply an offline, decorative story asset. It is not a runtime analysis dependency and cannot carry live labels/evidence/results. Provide a static poster and reduced-motion fallback.
- Keep analysis details progressive: likely service, key evidence, primary cascade, best recovery-vs-baseline comparison first; secondary paths, details, assumptions, and alternative scenarios on request.
- Gemini interprets bounded selected evidence and answers current-run questions; TypeScript remains authoritative for validation, risk, dependency traversal, citation checks, and scenario estimates.
- Follow-up answers are evidence-grounded investigation/recovery guidance, not infrastructure execution or a claim to have fixed the incident.
- No raw telemetry persistence by default. User data and logs are untrusted input, bounded, and never treated as model instructions.
- Keep the story informative without scroll traps, and provide keyboard, touch, narrow-screen, reduced-motion, and non-WebGL alternatives.

The authoritative product requirements are PRD.md, TRD.md, app-flow.md, backend-schema.md, and plan.md. ANTIGRAVITY_TASK.md holds current executor instructions; review.md is Codex-owned; execution log.md is Antigravity-owned.




