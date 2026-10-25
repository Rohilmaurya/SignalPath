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

## Application to the Orcathon SignalPath project

Current user-defined collaboration split: **Codex is planner/reviewer; Antigravity is executor/code writer.** Preserve that explicit split even though Antigravity's general Master workflow may normally include execution. Antigravity authors code and progress in `execution log.md`; Codex maintains `review.md` and the plan documents.

Relevant skill/agent selection for this three-hour Next.js + TypeScript operations dashboard:

1. Start with Master Engineering Workflow and inspect the global hub plus this project's docs.
2. Use Software Architecture Planning for the architecture/API/data-flow requirements already documented.
3. Use Frontend Design for a distinctive but information-dense operations interface; use Frontend Engineer to implement it.
4. Use Engineering & Coding for integration, validation, tests and review.
5. Use Security Engineer proportionately because the project accepts uploads, calls an external model API, and handles secrets.
6. Use UI/UX Judge for independent review of actual rendered experience.
7. After first complete visual pass, invoke official `hallmark` only if installed/discoverable in Antigravity. Current config lists it but lacks its skill file; `hallmark-inspired` is available as a separate custom option. Record which actually ran.
8. UI Motion Designer is optional only for meaningful micro-interactions. Immersive Web, Advanced Web Motion, Immersive 3D, and Immersive Experience Engineer are out of scope unless the product design adds meaningful narrative motion or real 3D. Don't add motion/3D as decoration.

The project planning documents remain the source of product and technical requirements. This memory adds process guidance and does not replace or rewrite those documents.
