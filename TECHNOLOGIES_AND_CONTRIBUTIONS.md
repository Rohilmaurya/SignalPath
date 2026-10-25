# Technologies, AI & Contributions

This document separates SignalPath's implementation stack, AI usage, and project credits from the main [README](README.md).

## Technology stack

| Technology | Use in SignalPath |
| --- | --- |
| Next.js App Router | Application pages and server-side API routes in one project |
| React 19 | Interactive user interface |
| TypeScript | Upload validation, telemetry analysis, risk ranking, dependency traversal, recovery estimates, and UI contracts |
| Tailwind CSS | Responsive interface styling |
| Papa Parse | Telemetry CSV parsing |
| Zod | Dependency and Gemini explanation response validation |
| `@google/genai` | Server-side connection to Google's Gemini API |
| Gemini 3.8 Flash | Optional symptom classification, evidence-based explanations, and grounded follow-up Q&A |
| Three.js | Story scene, uploaded dependency topology, and Thinking Orbs progress visual |
| GSAP + ScrollTrigger | Scroll-linked story reveals and transitions |
| Google Flow | Creation of the included decorative MP4 story asset |

## AI usage

### In the application

Gemini is an optional explanation and question-answering layer. The TypeScript analysis pipeline remains responsible for parsing and validating uploads, checking data sufficiency, detecting metric and log signals, calculating heuristic service risk, tracing dependency paths, and comparing simulated recovery scenarios.

When a Gemini API key is configured on the server and the provider call succeeds, Gemini can classify symptoms, draft a likely-cause hypothesis, and produce engineer- and executive-oriented explanations. The model also answers questions about the active analysis. It receives selected evidence and bounded analysis context, not the full telemetry CSV. Returned evidence references are checked against the active evidence IDs. The API key must remain server-side and must never be committed or exposed in client code.

Without a configured or available Gemini service, the application uses deterministic fallback responses and identifies their provenance. A result should be described as Gemini-generated only when the running application reports Gemini as its source.

Gemini does not calculate the risk score, determine the dependency graph, or execute infrastructure changes. Scores are heuristic rankings—not calibrated probabilities or predictions from a model trained on historical outages. Recovery figures are simulations, not operational guarantees.

### Other AI and visual tools

- **Google Flow** produced the included atmospheric MP4. The clip is decorative and does not analyze telemetry or represent live service state.
- **Thinking Orbs** is a Three.js progress indicator for visible analysis stages. It does not reveal the model's private reasoning.
- When Gemini is enabled, selected telemetry evidence and follow-up context are transmitted from the server to Google's Gemini API. Review Google's applicable data-handling and retention terms before uploading confidential or production data.

### Development assistance

- **Antigravity** acted as the coding executor, implementing the application from the project requirements and design direction.
- **OpenAI Codex** supported planning, architecture and implementation review, documentation, and QA.

These are development tools, not additional human team members.

## Team and contributions

**Team size: one human contributor.** SignalPath was built solo by the project owner.

The project owner led the product concept, requirements, design direction, architecture decisions, Antigravity/Codex orchestration, integration, verification, and demo preparation. AI development tools assisted with implementation and review; the project remained under the direction and ownership of the solo human contributor.
