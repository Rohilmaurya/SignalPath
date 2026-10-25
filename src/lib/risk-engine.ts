import {
  TelemetryRecord,
  DependencyEdge,
  DependencyFile,
  ServiceAnalysis,
  RiskBand,
  ServiceMetricSummary,
  EvidenceItem,
  SymptomItem,
  PredictionResult,
  CascadeResult,
  CascadePath,
  RecoveryScenario,
  DataQuality,
  AnalysisResponse,
} from "./types";

export type AnalysisInput = {
  records: TelemetryRecord[];
  dependencies: DependencyFile;
  source: "sample" | "upload";
};

export function analyzeIncident(input: AnalysisInput): AnalysisResponse {
  const { records, dependencies, source } = input;
  const analysisId = `sp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

  // 1. Data Quality and Sufficiency Evaluation
  const warnings: string[] = [];
  const uniqueServices = Array.from(new Set([
    ...dependencies.services,
    ...records.map((r) => r.service),
  ]));

  let windowStart: string | null = null;
  let windowEnd: string | null = null;
  let durationSeconds = 0;

  if (records.length > 0) {
    windowStart = records[0].timestamp;
    windowEnd = records[records.length - 1].timestamp;
    const startMs = new Date(windowStart).getTime();
    const endMs = new Date(windowEnd).getTime();
    durationSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
  }

  // Sufficiency rule: at least 3 records and >= 30 seconds of temporal coverage
  const MIN_RECORDS = 3;
  const MIN_DURATION_SECONDS = 30;
  const sufficientForForecast =
    records.length >= MIN_RECORDS && durationSeconds >= MIN_DURATION_SECONDS;

  if (!sufficientForForecast) {
    if (records.length < MIN_RECORDS) {
      warnings.push(`Insufficient record count (${records.length} < ${MIN_RECORDS} minimum required for time-series trend analysis).`);
    }
    if (durationSeconds < MIN_DURATION_SECONDS) {
      warnings.push(`Time range too narrow (${durationSeconds}s observed; minimum ${MIN_DURATION_SECONDS}s needed for anomaly detection).`);
    }
  }

  const dataQuality: DataQuality = {
    sufficientForForecast,
    windowStart,
    windowEnd,
    durationSeconds,
    recordCount: records.length,
    serviceCount: uniqueServices.length,
    warnings,
  };

  // Group records by service
  const serviceRecordsMap = new Map<string, TelemetryRecord[]>();
  for (const s of uniqueServices) {
    serviceRecordsMap.set(s, []);
  }
  for (const r of records) {
    const list = serviceRecordsMap.get(r.service) || [];
    list.push(r);
    serviceRecordsMap.set(r.service, list);
  }

  // 2. Metrics & Anomaly Analysis per Service
  const evidenceList: EvidenceItem[] = [];
  const serviceAnalyses: ServiceAnalysis[] = [];

  for (const serviceId of uniqueServices) {
    const sRecords = serviceRecordsMap.get(serviceId) || [];
    const metricSummaries: ServiceMetricSummary[] = [];

    // Latency
    const latencyRecords = sRecords.filter((r) => r.metrics.latencyMs !== undefined);
    if (latencyRecords.length > 0) {
      const points = latencyRecords.map((r) => ({
        timestamp: r.timestamp,
        value: r.metrics.latencyMs!,
      }));
      const avg = Math.round(points.reduce((acc, p) => acc + p.value, 0) / points.length);
      const max = Math.max(...points.map((p) => p.value));
      const trend = computeTrend(points.map((p) => p.value));
      const anomalyDetected = max > 500 || (trend === "rising" && max > 200);

      metricSummaries.push({
        name: "latency_ms",
        points,
        trend,
        avg,
        max,
        anomalyDetected,
      });

      if (anomalyDetected) {
        const peakPoint = points.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), points[0]);
        evidenceList.push({
          id: `M-${serviceId}-latency-${evidenceList.length + 1}`,
          kind: "metric",
          serviceId,
          timestamp: peakPoint.timestamp,
          label: `Latency surge to ${max}ms (${trend})`,
          value: `${max} ms (avg ${avg} ms)`,
          sourceRow: null,
          severity: max > 1000 ? "fatal" : "error",
        });
      }
    }

    // Error Rate
    const errorRecords = sRecords.filter((r) => r.metrics.errorRate !== undefined);
    if (errorRecords.length > 0) {
      const points = errorRecords.map((r) => ({
        timestamp: r.timestamp,
        value: r.metrics.errorRate!,
      }));
      const avg = Math.round((points.reduce((acc, p) => acc + p.value, 0) / points.length) * 1000) / 1000;
      const max = Math.max(...points.map((p) => p.value));
      const trend = computeTrend(points.map((p) => p.value));
      const anomalyDetected = max > 0.05 || (trend === "rising" && max > 0.02);

      metricSummaries.push({
        name: "error_rate",
        points,
        trend,
        avg,
        max,
        anomalyDetected,
      });

      if (anomalyDetected) {
        const peakPoint = points.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), points[0]);
        evidenceList.push({
          id: `M-${serviceId}-error-${evidenceList.length + 1}`,
          kind: "metric",
          serviceId,
          timestamp: peakPoint.timestamp,
          label: `Error rate spike to ${(max * 100).toFixed(1)}% (${trend})`,
          value: `${(max * 100).toFixed(1)}% (avg ${(avg * 100).toFixed(1)}%)`,
          sourceRow: null,
          severity: max > 0.25 ? "fatal" : "error",
        });
      }
    }

    // CPU Pct
    const cpuRecords = sRecords.filter((r) => r.metrics.cpuPct !== undefined);
    if (cpuRecords.length > 0) {
      const points = cpuRecords.map((r) => ({
        timestamp: r.timestamp,
        value: r.metrics.cpuPct!,
      }));
      const avg = Math.round((points.reduce((acc, p) => acc + p.value, 0) / points.length) * 10) / 10;
      const max = Math.max(...points.map((p) => p.value));
      const trend = computeTrend(points.map((p) => p.value));
      const anomalyDetected = max > 85;

      metricSummaries.push({
        name: "cpu_pct",
        points,
        trend,
        avg,
        max,
        anomalyDetected,
      });

      if (anomalyDetected) {
        const peakPoint = points.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), points[0]);
        evidenceList.push({
          id: `M-${serviceId}-cpu-${evidenceList.length + 1}`,
          kind: "metric",
          serviceId,
          timestamp: peakPoint.timestamp,
          label: `CPU saturation at ${max}%`,
          value: `${max}% (avg ${avg}%)`,
          sourceRow: null,
          severity: max > 95 ? "fatal" : "warn",
        });
      }
    }

    // Severe logs as evidence
    const severeLogs = sRecords.filter(
      (r) => r.level === "warn" || r.level === "error" || r.level === "fatal"
    );

    for (const log of severeLogs) {
      evidenceList.push({
        id: `L-${log.sourceRow}`,
        kind: "log",
        serviceId,
        timestamp: log.timestamp,
        label: `${log.level.toUpperCase()} log: ${truncate(log.message, 45)}`,
        value: log.message,
        sourceRow: log.sourceRow,
        severity: log.level as EvidenceItem["severity"],
      });
    }

    // Compute Deterministic Risk Score for Service
    const fatalCount = sRecords.filter((r) => r.level === "fatal").length;
    const errorCount = sRecords.filter((r) => r.level === "error").length;
    const warnCount = sRecords.filter((r) => r.level === "warn").length;

    let score = 5;
    const factors: string[] = [];

    // Metric contributions
    const latSummary = metricSummaries.find((m) => m.name === "latency_ms");
    if (latSummary && latSummary.anomalyDetected) {
      score += latSummary.max > 1000 ? 30 : 20;
      factors.push(`Severe latency surge (${latSummary.max}ms, ${latSummary.trend})`);
    }

    const errSummary = metricSummaries.find((m) => m.name === "error_rate");
    if (errSummary && errSummary.anomalyDetected) {
      score += errSummary.max > 0.2 ? 35 : 20;
      factors.push(`Elevated error rate (${(errSummary.max * 100).toFixed(0)}%)`);
    }

    const cpuSummary = metricSummaries.find((m) => m.name === "cpu_pct");
    if (cpuSummary && cpuSummary.anomalyDetected) {
      score += 15;
      factors.push(`CPU core saturation (${cpuSummary.max}%)`);
    }

    // Log contributions
    if (fatalCount > 0) {
      const added = Math.min(35, fatalCount * 18);
      score += added;
      factors.push(`${fatalCount} fatal system event${fatalCount > 1 ? "s" : ""}`);
    }
    if (errorCount > 0) {
      const added = Math.min(25, errorCount * 8);
      score += added;
      factors.push(`${errorCount} error log${errorCount > 1 ? "s" : ""}`);
    }
    if (warnCount > 0 && fatalCount === 0 && errorCount === 0) {
      score += Math.min(15, warnCount * 4);
      factors.push(`${warnCount} warning event${warnCount > 1 ? "s" : ""}`);
    }

    // Clamp score
    const finalScore = Math.min(100, Math.max(0, score));
    const riskBand: RiskBand =
      finalScore >= 80 ? "critical" : finalScore >= 55 ? "high" : finalScore >= 25 ? "medium" : "low";

    if (factors.length === 0) {
      factors.push("Operating within nominal baseline bounds");
    }

    serviceAnalyses.push({
      id: serviceId,
      riskScore: finalScore,
      riskBand,
      riskFactors: factors,
      metrics: metricSummaries,
      logCount: sRecords.length,
      severeLogCount: fatalCount + errorCount + warnCount,
    });
  }

  // 3. Prediction & Cascade Logic
  if (!sufficientForForecast) {
    // Insufficient data: Withhold prediction, cascade, and scenarios per PRD/TRD
    const insufficientPrediction: PredictionResult = {
      available: false,
      serviceId: null,
      riskScore: 0,
      confidence: "low",
      horizonMinutes: 0,
      causeSummary: "Insufficient temporal or record volume to establish a reliable failure forecast.",
      symptoms: [],
      evidenceIds: [],
      explanations: {
        engineer: "Not enough time-series records were provided to compute statistical drift or extrapolate failure horizons.",
        executive: "Data coverage is currently insufficient for automated incident prediction. Replay the verified sample dataset to inspect system capabilities.",
      },
      explanationSource: "unavailable",
    };

    const emptyCascade: CascadeResult = {
      available: false,
      affectedServiceIds: [],
      paths: [],
    };

    return {
      schemaVersion: "1",
      analysisId,
      source,
      status: "insufficient_data",
      dataQuality,
      services: serviceAnalyses,
      dependencies: dependencies.dependencies,
      prediction: insufficientPrediction,
      cascade: emptyCascade,
      scenarios: [],
      evidence: evidenceList,
      notices: [
        "Analysis halted: insufficient history. At least 3 records spanning >= 30 seconds required.",
      ],
    };
  }

  // Rank services by riskScore desc, severe logs desc
  const sortedServices = [...serviceAnalyses].sort((a, b) => {
    if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
    return b.severeLogCount - a.severeLogCount;
  });

  const predictedService = sortedServices[0];
  const predictedServiceEvidence = evidenceList.filter(
    (e) => e.serviceId === predictedService.id
  );

  // Group symptoms
  const symptoms: SymptomItem[] = [];
  const metricEvidenceIds = predictedServiceEvidence
    .filter((e) => e.kind === "metric")
    .map((e) => e.id);
  const logEvidenceIds = predictedServiceEvidence
    .filter((e) => e.kind === "log")
    .map((e) => e.id);

  if (metricEvidenceIds.length > 0) {
    symptoms.push({
      label: "Telemetry drift & latency surge",
      evidenceIds: metricEvidenceIds,
    });
  }
  if (logEvidenceIds.length > 0) {
    symptoms.push({
      label: "Fatal exhaustion & connection timeout logs",
      evidenceIds: logEvidenceIds.slice(0, 4),
    });
  }

  const allCitedEvidenceIds = Array.from(new Set([
    ...metricEvidenceIds,
    ...logEvidenceIds.slice(0, 6),
  ]));

  // Traverse downstream dependencies (cycle-safe)
  // "from depends on to": so if to is predictedService, services that depend on it are affected!
  const cascadePaths: CascadePath[] = [];
  const affectedServiceSet = new Set<string>();

  function traverseCascade(
    currentService: string,
    currentPath: string[],
    depth: number,
    visited: Set<string>
  ) {
    if (depth > 8) return; // depth limit
    // Find services that depend on currentService: edge where to === currentService
    const dependents = dependencies.dependencies.filter((edge) => edge.to === currentService);

    for (const edge of dependents) {
      const dependentService = edge.from;
      if (visited.has(dependentService)) continue; // cycle guard

      const newPath = [...currentPath, dependentService];
      affectedServiceSet.add(dependentService);

      const impact: CascadePath["estimatedImpact"] =
        depth === 1 ? "critical" : depth === 2 ? "high" : "medium";

      cascadePaths.push({
        serviceIds: newPath,
        reason: `${dependentService} depends directly on ${currentService}, exposing edge traffic to upstream timeouts`,
        estimatedImpact: impact,
      });

      const nextVisited = new Set(visited);
      nextVisited.add(dependentService);
      traverseCascade(dependentService, newPath, depth + 1, nextVisited);
    }
  }

  traverseCascade(
    predictedService.id,
    [predictedService.id],
    1,
    new Set([predictedService.id])
  );

  const cascade: CascadeResult = {
    available: true,
    affectedServiceIds: Array.from(affectedServiceSet),
    paths: cascadePaths,
  };

  // 4. Simulated Recovery Scenarios
  // Must include do-nothing baseline, sorted primarily by lower remainingSystemRisk, secondarily by shorter recoveryMinutes
  const systemBaseRisk = Math.round(
    serviceAnalyses.reduce((acc, s) => acc + s.riskScore, 0) / serviceAnalyses.length
  );

  const rawScenarios: Omit<RecoveryScenario, "rank">[] = [
    {
      id: "do-nothing",
      label: "Do Nothing (Baseline)",
      simulated: true,
      remainingSystemRisk: Math.min(100, Math.max(predictedService.riskScore, systemBaseRisk + 15)),
      recoveryMinutes: 50,
      description: "Passive baseline. Unmitigated resource exhaustion will trigger full cascade to ingress routes.",
      tradeoffs: "Zero operational friction, but guarantees SLA breaches and cascading 504 errors.",
      affectedServices: Array.from(affectedServiceSet),
    },
    {
      id: "isolate-reroute",
      label: "Isolate & Reroute to Standby",
      simulated: true,
      remainingSystemRisk: 18,
      recoveryMinutes: 7,
      description: "Sever traffic to the saturated instance and redirect queries to the read-replica standby pool.",
      tradeoffs: "Causes 5-8s connection resets during drain; instantly terminates the cascading blast radius.",
      affectedServices: [predictedService.id],
    },
    {
      id: "edge-backpressure",
      label: "Apply Upstream Ingress Throttling",
      simulated: true,
      remainingSystemRisk: 34,
      recoveryMinutes: 14,
      description: "Activate rate-limiting on ingress edge gateways to reduce downstream request pressure by 40%.",
      tradeoffs: "Rejects 35% of non-critical incoming checkouts; provides breathing room for connection buffer flush.",
      affectedServices: ["api-gateway", predictedService.id],
    },
    {
      id: "restart-pool-flush",
      label: "Graceful Pool Flush & Node Recycle",
      simulated: true,
      remainingSystemRisk: 46,
      recoveryMinutes: 19,
      description: "Force-recycle idle connection pool threads and execute rolling pod restarts.",
      tradeoffs: "May trigger momentary latency spikes during cold cache warm-up; risk of re-saturation if load persists.",
      affectedServices: [predictedService.id],
    },
  ];

  // Sort by lowest remainingSystemRisk, then shortest recoveryMinutes
  rawScenarios.sort((a, b) => {
    if (a.remainingSystemRisk !== b.remainingSystemRisk) {
      return a.remainingSystemRisk - b.remainingSystemRisk;
    }
    return a.recoveryMinutes - b.recoveryMinutes;
  });

  const scenarios: RecoveryScenario[] = rawScenarios.map((s, index) => ({
    ...s,
    rank: index + 1,
  }));

  // 5. Deterministic Default Explanations (Grounded in Evidence IDs)
  const deterministicExplanation = {
    engineer: `Deterministic analysis indicates ${predictedService.id} has reached a critical failure state (Risk Score: ${predictedService.riskScore}/100). The telemetry exhibits anomalous latency escalation (${metricEvidenceIds.join(", ") || "observed metrics"}) combined with severe failure events (${logEvidenceIds.slice(0, 3).join(", ") || "error logs"}). Downstream dependents ${Array.from(affectedServiceSet).join(", ") || "none"} are experiencing cascading timeout errors.`,
    executive: `The ${predictedService.id} system is under severe strain and is projected to fail within ~10 minutes if unmitigated. This issue is already causing ripple effects across dependent customer services (${Array.from(affectedServiceSet).join(", ") || "dependent nodes"}). Immediate isolation and standby rerouting is recommended to restore stability.`,
  };

  const prediction: PredictionResult = {
    available: true,
    serviceId: predictedService.id,
    riskScore: predictedService.riskScore,
    confidence: predictedService.riskScore > 75 ? "high" : predictedService.riskScore > 50 ? "medium" : "low",
    horizonMinutes: 10,
    causeSummary: `Critical resource exhaustion and connection starvation observed in ${predictedService.id}.`,
    symptoms,
    evidenceIds: allCitedEvidenceIds,
    explanations: deterministicExplanation,
    explanationSource: "deterministic",
  };

  return {
    schemaVersion: "1",
    analysisId,
    source,
    status: "complete",
    dataQuality,
    services: serviceAnalyses,
    dependencies: dependencies.dependencies,
    prediction,
    cascade,
    scenarios,
    evidence: evidenceList,
    notices: [
      "Risk scores and recovery values are simulated heuristic estimates, not calibrated probabilities or production actions.",
    ],
  };
}

// Helpers
function computeTrend(values: number[]): "rising" | "stable" | "falling" {
  if (values.length < 2) return "stable";
  const firstHalf = values.slice(0, Math.floor(values.length / 2));
  const secondHalf = values.slice(Math.floor(values.length / 2));
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  if (avg2 > avg1 * 1.15) return "rising";
  if (avg2 < avg1 * 0.85) return "falling";
  return "stable";
}

function truncate(str: string, len: number): string {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "..." : str;
}
