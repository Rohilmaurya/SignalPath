# Antigravity implementation handoff

## Roles

- **You (Antigravity) are the executor and code writer.** Implement the prototype in this shared folder, following `plan.md` and the requirements in `PRD.md`, `TRD.md`, `app-flow.md`, and `backend-schema.md`.
- **Codex is the planner and reviewer.** Codex maintains the requirements and review notes, then reviews your changes through `execution log.md` and the shared project files. Do not treat Codex as the implementation agent.
- The human owns final product decisions. Keep the prototype reviewable and explain material tradeoffs in the execution log.

## Before implementation

1. Read `ANTIGRAVITY_ENGINEERING_MEMORY.md` and all five planning documents listed above, then inspect this folder and its current Git state before creating or changing files.
2. Start with Master Engineering Workflow. Consult `%USERPROFILE%\.gemini\config\antigravity-system\registry\START-HERE.md`, `registry\components.json`, the relevant shared extension files, relevant component extension files, and any project overlay that exists. The persistent project summary is in `ANTIGRAVITY_ENGINEERING_MEMORY.md`.
3. Use only relevant skills and agents: Software Architecture Planning; Frontend Design; Engineering & Coding; Frontend Engineer; proportionate Security Engineer review; and UI/UX Judge. Use UI Motion Designer only if meaningful micro-interactions need a deliberate spec. This dashboard does not call for immersive web, advanced scroll motion, 3D, or immersive motion engineering unless the approved design materially changes.
4. After the first complete visual pass, check whether the official `hallmark` skill is actually installed and runnable. The registry lists it, but the checked config did not contain its `SKILL.md`; `hallmark-inspired` is a separate available custom skill. Record which one actually ran, or state that the official gate was unavailable.
5. Record skill/agent names actually used (or unavailable required skills) in `execution log.md`; do not claim a skill, agent, audit, or check ran if it did not.
6. Deliver a working, focused three-hour hackathon prototype. Prioritize the end-to-end sample incident replay and dashboard; keep optional work out of the critical path.
7. Keep Gemini credentials server-side in an environment variable. Never commit secrets or expose them to browser code.

## Execution and communication

- You may create and edit application code and supporting project files needed to implement the plan.
- Append dated entries to `execution log.md`: decisions, files/features completed, commands or checks run and their outcomes, remaining issues, and next action. This is the shared handoff from executor to planner.
- Read `review.md` before each implementation pass. Codex owns that file; do not rewrite or remove planner review notes. Append executor responses only under a clearly labeled **Executor responses** section if present.
- When a review identifies a defect, fix it and record the resolution in `execution log.md`. If a requirement is ambiguous or infeasible, state the concrete issue and a proposed fallback in the log; continue independent work.
- Avoid expanding scope beyond the three-hour prototype. Do not deploy, publish, or make external changes unless the human specifically asks.

## Completion handoff

In the final execution-log entry, summarize the implemented experience, setup/run instructions, environment variables required, checks actually performed, known limitations, and any work left. Do not claim a check passed unless you ran it and observed success.
