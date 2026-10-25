# SignalPath — Incident Observatory

**SignalPath** is an AI-assisted operations observatory for simulated server telemetry. It detects metric drift, estimates which service is most at risk of failing next, traces downstream cascading impact through directed dependencies, explains root cause evidence with engineer and executive summaries, and compares simulated recovery strategies against a do-nothing baseline.

Built for **Orcathon Hackathon (Track 1: Software & AI)** following the **Master Engineering Workflow**.

---

## Key Features

1. **Deterministic Telemetry & Risk Engine**:
   - Parses telemetry CSV (`timestamp`, `service`, `level`, `message`, optional `latency_ms`, `error_rate`, `cpu_pct`).
   - Evaluates temporal sufficiency (minimum 3 records across &ge;30s).
   - Extracts metric anomalies, trends, and severe log events with stable Evidence IDs (`M-...` for metrics, `L-...` for logs).
   - Computes transparent 0–100 heuristic risk scores and categorizes into `low`, `medium`, `high`, and `critical` bands.

2. **Cycle-Safe Cascading Blast Radius Traversal**:
   - Evaluates directed dependencies (`from` depends on `to`: when `to` degrades, `from` may suffer cascading failures).
   - Implements depth-limited recursion and visited-set cycle prevention.
   - Visualizes downstream failure ripple paths with impact severity ratings.

3. **Simulated Recovery Strategy Matrix**:
   - Compares mitigation options against the **Do Nothing (Baseline)**.
   - Ranked deterministically: lowest residual system risk first, then shortest recovery horizon.
   - Every scenario has `simulated: true`; does not execute real infrastructure actions.
   - Interactive 3D preview: selecting a scenario simulates risk reduction on the live topology.

4. **Evidence-Linked Explanations & Provenance**:
   - Dual audience modes: **Engineer** (metrics, log IDs, mechanics) and **Executive** (operational consequence, urgency).
   - Server-side **Gemini 3.8 Flash** integration via `@google/genai` with strict JSON schema validation.
   - **Evidence Citation Validation & Hallucination Filtering**: All cited evidence IDs in structured fields and free-form text are verified against generated telemetry items; any unrecognized IDs are filtered out.
   - **Deterministic Fallback**: If no API key is provided or the provider is unreachable, SignalPath provides a verified deterministic explanation and clearly flags the provenance badge (`DETERMINISTIC FALLBACK`).

5. **Multi-Modal Visualizations**:
   - **3D Incident Observatory**: Interactive Three.js WebGL 2 canvas with dynamic risk halos, cascading energy pulses (traveling from failing dependency to affected dependents), camera orbit/focus, unified touch/mouse pointer support, pinch-to-zoom, keyboard navigation, and projected HTML tactical badges updated via direct DOM transforms (0 React re-renders per frame).
   - **2D Vector Blast Map**: Scalable, accessible SVG dependency graph.
   - **Tabular Matrix**: High-density accessible list for screen readers and narrow screens.
   - Full `prefers-reduced-motion` and keyboard navigation support.

---

## Quickstart

### Prerequisites
- Node.js `v20+` or `v24+`
- npm

### Installation
```bash
# Clone or navigate to folder
cd Orcathon

# Install dependencies
npm install
```

### Environment Configuration (Optional)
SignalPath runs 100% out-of-the-box using the deterministic fallback engine without an API key. To enable live Gemini explanations:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Set your Google Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   *(The key is strictly accessed in server runtimes and is never exposed to client-side code).*

### Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build & Typecheck
```bash
npm run typecheck
npm run build
npm start
```

---

## Verification & Demonstrations

### 1. Replay Sample Incident
Click **Replay Sample** in the top navigation bar to load the built-in 6-service e-commerce topology:
- `inventory-db` develops disk I/O saturation and connection pool exhaustion (Risk: 92/100, Critical).
- Downstream cascade propagates to `orders-service`, `checkout-service`, and `api-gateway`.
- Mitigation scenarios compare **Isolate & Reroute to Standby** (Rank #1) against **Do Nothing**.

### 2. Test Insufficient Temporal History Gate
Click **Test Insufficient State** in the top navigation bar:
- Loads a 2-record sparse dataset (duration: 10s).
- The Data Sufficiency Gate withholds failure predictions and cascade extrapolations.
- Explains the violation and provides a 1-click button to restore the verified incident.

### 3. Upload Custom Datasets
Click **Upload Data** to upload custom telemetry CSV and dependency JSON:
- Telemetry CSV headers: `timestamp,service,level,message` (optional: `latency_ms,error_rate,cpu_pct`).
- Dependency JSON: `{"services": ["..."], "dependencies": [{"from": "a", "to": "b"}]}`.
- Real-time client and server validation with field-level error messages.

---

## Architecture Boundaries

| Layer | Responsibility | Security & Constraints |
|---|---|---|
| `src/lib/telemetry-parser.ts` | CSV parsing, timestamp UTC ISO conversion, 0-1 error rate normalization | 5MB file limit, max 5000 rows |
| `src/lib/risk-engine.ts` | Anomaly detection, 0-100 heuristic risk scoring, cycle-safe cascade, scenario ranking | Pure deterministic TypeScript; no untrusted model math |
| `src/lib/gemini-client.ts` | Gemini 3.8 Flash structured JSON invocation | Server runtime only; evidence citation sanitization |
| `src/app/api/analyze/route.ts` | Multipart form data intake, Zod validation, error responses | Safe JSON error contract; no stack traces or secrets exposed |
| `src/components/ObservatoryScene.tsx` | Interactive 3D WebGL scene with HTML projection | Full GPU resource disposal; automatic WebGL failure fallback |

---

## Prototype Scope & Limitations
- **Simulated Predictions**: Heuristic risk scores are not calibrated probabilities.
- **Local Storage**: Analyses are held in browser memory and local server runtime; no external database is required.
- **Non-Executable Scenarios**: All recovery options are decision-support simulations; no production cloud or orchestrator commands are executed.
