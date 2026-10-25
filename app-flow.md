# App flow

## Primary path: sample incident replay

1. **Open dashboard.** Show the product name, “simulated telemetry” context, sample-load control, and optional upload controls. Load a coherent sample analysis by default or make it one obvious click away.
2. **Analyze.** Show progress and the current stage in plain language. Keep the UI responsive.
3. **System overview.** Show incident time range, number of services, data sufficiency, predicted next-at-risk service, and heuristic risk band/score.
4. **Blast Radius.** Render service dependency nodes with risk labels and directed edges. Emphasize the predicted service and traversed downstream cascade. Clicking/focusing a service reveals its score factors and dependencies. On small screens or graph failure, show the same information as an ordered dependency list.
5. **Prediction and evidence.** Show root-cause hypothesis and symptom labels with evidence citations. Each citation opens or scrolls to the associated metric window or log excerpt. Keep observed signal and model interpretation visually distinct.
6. **Explanation audience.** Toggle Engineer / Executive. Engineer mode uses service names, metric changes, log IDs, and dependency mechanics. Executive mode summarizes operational consequence and confidence limits. Citations and underlying facts remain identical.
7. **Cascade.** List likely affected dependents in path order, with the edge/reason and estimated severity contribution.
8. **Recovery comparison.** Compare “Do nothing” to a few simulated options. Show residual system risk and estimated recovery time side by side, sort by lower risk then shorter recovery, and label all as simulations. No action button executes changes.

## Upload path

1. User selects one CSV and one dependency JSON, or drops both into clearly labeled controls.
2. Client checks basic file types and submits them to `POST /api/analyze` as multipart form data.
3. Server validates contents. If invalid, return specific guidance (file, row/field when possible), preserve the sample dashboard, and allow correction.
4. On valid analysis, replace dashboard data with the uploaded run and show its filename/time range.
5. If the data has too little usable history, show data coverage and missing requirements. Display any safely computed descriptive signals, but withhold next-failure prediction, cascade forecast, and scenario ranking dependent on it.

## AI availability states

- **Live explanation:** API key configured and Gemini returned schema-valid output; show “Gemini-assisted explanation.”
- **Sample fallback:** sample has a deterministic illustrative explanation when Gemini is unavailable; label it as demo/fallback, not model output.
- **Uploaded fallback:** show deterministic symptom/evidence summary if suitable; clearly state AI explanation is unavailable and do not fabricate a rich root-cause claim.
- **Provider error:** preserve deterministic risk/cascade/scenarios and show a small, non-blocking explanation status. Do not expose keys, stack traces, or raw provider errors.

## Empty, invalid, and narrow-screen states

- Empty: make sample replay the obvious first action.
- Invalid: explain what to fix, avoid clearing the previous valid result.
- Insufficient history: explicitly state “not enough usable history for a forecast,” identify the observed window/required fields, and offer the sample replay.
- Narrow screen: stack overview, prediction, cascade, and recovery cards; allow graph scrolling or show list fallback; retain readable labels and keyboard operation.
