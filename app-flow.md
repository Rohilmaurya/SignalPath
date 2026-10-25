# App flow: SignalPath

**Revision:** 2026-10-25 — story-led and upload-first

## 1. Landing and story

1. Open the site at the first story chapter. Do not load telemetry, call the analysis API, or show a precomputed incident.
2. Show the product promise, one concise supporting sentence, a restrained authored 3D scene, and two clear paths: continue the story or skip to upload.
3. Scroll through one idea per chapter:
   - **Signals:** show how selected metrics/logs can indicate degradation. Any example values are marked illustrative.
   - **Dependencies:** show how services rely on other services using a crafted model that clearly shows direction.
   - **Cascade:** animate one illustrative failure path to explain downstream impact; make clear it is not a live incident.
   - **Recovery:** show the concept of comparing a simulated response with doing nothing; mark figures illustrative and non-predictive.
4. Each chapter advances the visual story without forcing a scroll trap. Navigation is keyboard-operable. Reduced-motion mode uses stable scene states and simple fades/cuts.
5. The final story chapter transitions into the upload workspace. A persistent “Skip to upload” link is allowed if compact and unobtrusive.

## 2. Empty upload workspace

1. Show an intentional empty state explaining the two inputs:
   - telemetry CSV with timestamp, service, level, and message; optional metric columns may improve analysis;
   - dependency JSON describing services and directed dependency edges.
2. Make what is processed, retention behavior, and forecast limitations concise and discoverable.
3. User selects the files and explicitly submits Analyze. No model request or forecast occurs on file selection alone.
4. Show filenames, size/format checks, remove/replace controls, and one primary Analyze action. No sample file is loaded or offered in the default user flow.
5. If an optional standalone demo exists in a later approved iteration, it must be explicitly user-invoked and visually separated from the upload analysis. The current shipped flow has no bundled log fixture.

## 3. Analysis progress and failures

1. While POST /api/analyze runs, show a short progress state with the current step in plain language.
2. Keep upload state and previous result available. If this is a new run, identify it as pending; do not silently replace the previous result until the response is valid.
3. On invalid files, show the relevant file, row/field, and correction. Preserve the current valid result.
4. On network/server failure, offer retry and keep the uploaded file selection.
5. On insufficient history, show coverage and missing requirements. Do not show a likely-failing service, forecast cascade, or scenario ranking.

## 4. Compact results workspace

On a valid analysis, move focus to the results heading and present a single calm scan path:

1. **Prediction:** one service at risk, categorical risk/confidence and the top supporting signals. Label all scores as heuristic estimates, not probabilities.
2. **Topology:** the uploaded service graph is shown as a purposeful 3D model, laid out from the actual services and dependency edges. Highlight the predicted service and primary possible cascade. Selecting a service reveals only its risk and direct dependency context.
3. **Cause:** one concise hypothesis, visibly separated from direct observations. The engineer/executive control changes wording only and stays beside this explanation.
4. **Cascade:** show the primary affected path first. Other paths and service details are collapsed or exposed by selecting a node.
5. **Recovery:** compare the top-ranked simulated option with doing nothing using residual estimated risk and estimated recovery time. Alternative options and assumptions are in an expandable comparison. No action control executes anything.
6. **Follow-up:** show a focused “Ask about this analysis” input. Answers are grounded in the current run and cite verified evidence. Do not claim real-world access or completed remediation.

Do not repeat the same risk number, service name, or path in multiple panels unless the second display is necessary to understand the graph. Avoid an always-visible toolbox of unrelated controls.

## 5. Evidence and detail requests

- Selecting an evidence citation reveals the corresponding bounded metric window or log excerpt.
- “Show evidence”, “Show all cascade paths”, “Compare all strategies”, and “Technical detail” reveal secondary information only when requested.
- Engineer/executive mode changes explanation language while preserving facts and citations.
- Missing or unknown evidence is stated plainly; it is never generated to fill a visual gap.

## 6. Follow-up Q&A

1. User enters a question about the active analysis.
2. Client sends POST /api/ask with the question and a bounded context from the active response.
3. Display a concise answer with supporting evidence and an uncertainty status. If unavailable, say which context is missing and ask a focused follow-up.
4. The assistant may suggest safe investigative next steps. It never runs a command, changes infrastructure, or claims to have resolved the incident.
5. Keep the conversation only in browser memory for this page session; reloading clears it.

## 7. New run and reset

- “New analysis” clears the current upload/results only after the user's explicit choice and returns to the empty uploader.
- The user can revisit the story without losing current in-memory results; returning to the workspace restores the current analysis until reload.
- Reloading the page clears uploaded data and conversation state.

## 8. Responsive and accessible behavior

- Story remains understandable without scroll-linked motion, WebGL, video, or sound.
- 3D topology has a semantic service/dependency list alternative with identical information.
- Keyboard users can skip, navigate chapters, operate upload controls, focus/select services, expand details, toggle explanation style, and ask questions.
- Touch interactions are explicit and do not require hover.
- Honor reduced-motion preferences. Pause hidden/offscreen animation and provide static fallbacks.
- Narrow layouts keep the upload action and top prediction visible; avoid horizontally dense recovery tables and clipped service labels.

