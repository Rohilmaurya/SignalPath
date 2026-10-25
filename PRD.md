# Product requirements: SignalPath

**Revision:** 2026-10-25 — story-led, upload-first product direction  
**Status:** Supersedes prior dashboard-first and auto-loaded sample requirements.

## Product summary

SignalPath is a telemetry analysis product introduced through a cinematic, editorial, scroll-led story. The story explains how weak signals become service failures and how dependency chains spread their impact. It then leads into the actual tool: an upload-first analysis workspace.

The application has no built-in live telemetry, preselected server module, or default incident. It waits for the user to provide a telemetry CSV and dependency JSON, then analyzes those files. A sample package may be offered only as an explicit, clearly labeled demo choice. It must never load automatically or be presented as the user's environment.

The tool returns a concise, evidence-grounded prediction, traces likely downstream impact in a bespoke, data-driven 3D topology, compares simulated recovery recommendations, and answers follow-up questions about the submitted incident. It does not connect to or alter real infrastructure.

## Product goal and audience

Build a polished, solo hackathon prototype for Track 1: Software & AI. The product is for engineers investigating possible service failure and for technical decision makers who need a clear summary. The landing experience should feel like a carefully art-directed digital product story, with the craft and narrative pacing of [Shopify Editions Winter '26](https://www.shopify.com/editions/winter2026) as inspiration. Do not copy Shopify's exact layout, brand, assets, text, or interactions.

## User outcomes

1. Understand what SignalPath does through a short, purposeful scroll story.
2. Reach the actual tool at the end of the story without navigating through a cluttered marketing site.
3. Upload a telemetry CSV and service-dependency JSON; no analysis runs before a user submits their files.
4. See the service most at risk, the actual evidence behind that estimate, and the likely path of cascading impact.
5. Compare a small number of simulated recovery strategies with a do-nothing baseline.
6. Ask a follow-up question about the uploaded analysis and receive a grounded answer with evidence citations and clear limits.
7. Reveal technical detail only when requested; the default analysis view is concise and calm.

## Experience principles

- **Story first, tool at the end:** a linear scroll narrative introduces signals, dependencies, cascades, and recovery. A clear skip-to-tool action is available without dominating the story.
- **This remains an operations product, not a game:** no avatars, collectibles, score-chasing, or game loops. The scroll narrative is there to explain the product and its analysis.
- **Upload is the start of analysis:** empty state is intentional. No seeded dataset, fake live telemetry, or hidden sample request runs on page load.
- **One answer, then useful depth:** first show the most-at-risk service, the strongest observed signals, the main cascade path, and the leading simulated recovery comparison. Put secondary evidence, other paths, assumptions, and alternatives behind deliberate expand/focus actions.
- **3D carries meaning:** authored 3D scenes explain the system and the uploaded dependency graph. A generic circle-on-grid topology, floating decorative spheres, or a video pretending to be live topology does not satisfy the requirement.
- **Evidence over certainty:** risk values are heuristic estimates, not calibrated probabilities. Observations, AI hypotheses, missing data, and simulation assumptions have distinct visual treatments.
- **Recommendations are not actions:** recovery strategies and follow-up guidance are advisory simulations. No command is run and no infrastructure is changed.
- **Respect user data:** process uploads for the current analysis and follow-up only. Do not persist raw telemetry or logs by default.

## Story and interaction

### Scroll-led introduction

Create a sequence of visually distinct chapters that each make one point:

1. **Opening:** state the operational promise in one short headline and one supporting sentence. Show a crafted, restrained 3D system scene, not a generic dashboard mockup.
2. **Signals:** reveal how latency, error rate, CPU, and logs can form an early warning. Use clearly marked illustrative data if any values are shown.
3. **Dependencies:** show a service depending on another through a spatial model that communicates direction and structure.
4. **Cascade:** show one failure path propagating to dependent services. Use guided camera/framing and restrained motion.
5. **Recovery:** briefly compare a simulated response with doing nothing; make clear that the comparison is estimated.
6. **Handoff into the tool:** transition to the upload workspace and explain exactly which two files the user provides.

The narrative must work without motion, on narrow screens, with reduced-motion settings, and when WebGL is unavailable. Use keyboard-operable navigation and a skip-to-analysis link. Avoid excessive pinned sections, long scroll traps, constant camera movement, and UI text rendered into video.

### Upload and analysis

- Required inputs are one telemetry CSV and one dependency JSON.
- The upload view explains required fields, file size limits, what will be analyzed, and that analysis is limited to the files selected for this run.
- The user explicitly selects Analyze before any model call or prediction.
- Show compact progress and helpful validation errors. A failed upload must not replace the last valid result unless the user confirms a fresh run.
- If there is not enough usable history, show the observed coverage and the reason; do not make a next-failure prediction.

### Results workspace

The result opens with one compact summary and one prominent topology view. Default-visible content:

- the most at-risk component, risk band/score and confidence category, with estimate disclaimer;
- a short evidence-grounded cause hypothesis and the few strongest observed signals;
- the primary dependency cascade path, clearly distinguished from observed failure;
- the best-ranked simulated recovery option compared directly with do nothing;
- a focused follow-up question input.

Expandable or on-demand content:

- full selected evidence and metric trend detail;
- additional cascade paths and affected services;
- alternative recovery simulations and assumptions;
- detailed technical explanation.

The engineer/executive switch changes language, not evidence, risk calculations, or conclusions. Keep the page free of repeated values and incidental status panels. Do not use a dense dashboard grid of equal-weight cards.

### Follow-up support

The user may ask about the current uploaded run, evidence, or a proposed issue. Answer only within the supplied analysis context, explain what evidence supports the answer, flag missing information, and offer safe investigation or remediation guidance. Do not claim to have fixed an issue, invent system access, or execute commands. If the question needs unavailable infrastructure context, ask for the specific information required. Follow-up answers are not a substitute for an authorized operational change.

## Data requirements

Telemetry CSV required headers: timestamp, service, level, message. Optional numeric metrics: latency_ms, error_rate, cpu_pct. Accept additional columns without failure. Dependency JSON uses the canonical shape in backend-schema.md.

An optional demo may reuse clearly marked sample assets. Users must opt in by clicking a deliberate “Load demo files” action; it must not populate the workspace or trigger analysis on initial visit. Never describe sample-derived content as user telemetry.

## AI and analysis behavior

- TypeScript parses and normalizes data, evaluates temporal sufficiency, chooses stable evidence IDs, computes risk estimates, traverses dependencies, and ranks recovery simulations.
- Gemini interprets selected log/metric evidence and dependency context, classifies symptoms, writes concise engineering and executive explanations, and answers grounded follow-up questions.
- The AI is not trained on historical outages and does not own risk calculations or simulate actions.
- Every model citation is checked against the submitted run's evidence set. Distinguish direct observation from model interpretation.
- If Gemini is unavailable, the deterministic result may still show verified descriptive signals and heuristic risk. Clearly label explanation provenance; do not create unsupported causal certainty.
- Suppress the forecast, cascade forecast, and recovery ranking when data is insufficient.

## Visual design and 3D acceptance

- Art direction is bespoke, editorial, restrained, and cinematic; visual references are inspiration, not templates.
- Use high-quality modeled forms and materials that read as service infrastructure or a coherent system. The topology must be generated from the submitted dependency graph; do not hardcode the current sample services or positions as if they were arbitrary user data.
- Keep the public story's illustrative scenes distinct from the uploaded run's real topology.
- Show service names, dependency direction, risk, predicted service, and cascade legibly at first view. Selection reveals additional details. Provide an equivalent semantic list for accessibility and 3D failure.
- Use motion to explain the story or move attention to meaningful evidence. Respect reduced-motion preferences and pause expensive rendering when hidden.
- Keep primary actions obvious, labels readable, colors restrained, and content density low. Avoid repeated cards, decorative labels, wall-to-wall badges, unnecessary controls, and generic AI-generated dashboard styling.

## Success criteria

1. First visit shows the introduction and an intentional empty workspace, not a preloaded incident.
2. User can scroll through the story or skip to upload, and understands the analysis before choosing files.
3. Valid uploads produce a result derived only from those files; analysis does not run until explicit submission.
4. Risk topology reflects uploaded services and dependency edges, uses a crafted 3D treatment, and has a usable accessible alternative.
5. The concise result explains the top at-risk service and main cascade while allowing the user to request detail.
6. Recovery options are visibly labeled estimates, include do nothing, and never execute.
7. Follow-up answers remain grounded in the current analysis and cite available evidence.
8. Invalid and insufficient files produce truthful, actionable states without inventing a forecast.
9. No credential or sensitive raw input is logged, persisted by default, or exposed to the browser.
10. Responsive, keyboard, reduced-motion, and WebGL-failure behavior are verified in a real browser and reported accurately.

## Scope boundaries

In scope: one Next.js + TypeScript app, scroll-led product story, upload-first analysis workspace, CSV and JSON intake, deterministic TypeScript risk/cascade/recovery logic, Gemini structured explanations and grounded follow-up, dynamic 3D dependency topology, helpful empty/error/insufficient-data states.

Out of scope: default or continuously simulated telemetry, production monitoring integrations, authentication, persistent incident storage, model training, streaming ingestion, autonomous infrastructure changes, production prediction accuracy claims, deployment, or multi-tenant controls.

## Timebox priority

1. Remove auto-loaded/hardcoded operational data and make upload the only normal analysis trigger.
2. Deliver a clean story-to-upload flow and high-quality, accessible visual direction.
3. Preserve and adapt the working parser/risk/cascade/API foundations for arbitrary uploads.
4. Implement dynamic topology and concise results with evidence, recovery comparison, and follow-up.
5. Verify the actual rendered story and workflow, then record limitations and follow-ups.

Keep existing working analysis logic where it fits. Do not rewrite the backend or change frameworks without a concrete reason recorded in the execution log.



