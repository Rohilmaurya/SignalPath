export type TelemetryLevel = "debug" | "info" | "warn" | "error" | "fatal";

export type TelemetryRecord = {
  timestamp: string; // ISO UTC
  service: string;
  level: TelemetryLevel;
  message: string;
  metrics: {
    latencyMs?: number;
    errorRate?: number; // normalized 0..1
    cpuPct?: number; // normalized 0..100
  };
  sourceRow: number;
};

export type DependencyEdge = {
  from: string; // dependent service
  to: string;   // upstream dependency
};

export type DependencyFile = {
  services: string[];
  dependencies: DependencyEdge[];
};

export type RiskBand = "low" | "medium" | "high" | "critical";

export type MetricPoint = {
  timestamp: string;
  value: number;
};

export type ServiceMetricSummary = {
  name: "latency_ms" | "error_rate" | "cpu_pct";
  points: MetricPoint[];
  trend: "rising" | "stable" | "falling";
  avg: number;
  max: number;
  anomalyDetected: boolean;
};

export type ServiceAnalysis = {
  id: string;
  riskScore: number; // 0..100
  riskBand: RiskBand;
  riskFactors: string[];
  metrics: ServiceMetricSummary[];
  logCount: number;
  severeLogCount: number;
};

export type EvidenceItem = {
  id: string; // e.g., 'M-orders-latency-1' or 'L-12'
  kind: "log" | "metric";
  serviceId: string;
  timestamp: string;
  label: string;
  value: string;
  sourceRow: number | null;
  severity?: "warn" | "error" | "fatal" | "info";
};

export type SymptomItem = {
  label: string;
  evidenceIds: string[];
};

export type PredictionResult = {
  available: boolean;
  serviceId: string | null;
  riskScore: number;
  riskBand?: RiskBand;
  confidence: "low" | "medium" | "high";
  horizonMinutes: number;
  causeSummary: string;
  symptoms: SymptomItem[];
  evidenceIds: string[];
  explanations: {
    engineer: string;
    executive: string;
  };
  explanationSource: "gemini" | "deterministic" | "unavailable";
};

export type CascadePath = {
  serviceIds: string[];
  reason: string;
  estimatedImpact: "low" | "medium" | "high" | "critical";
};

export type CascadeResult = {
  available: boolean;
  affectedServiceIds: string[];
  paths: CascadePath[];
};

export type RecoveryScenario = {
  id: string;
  label: string;
  simulated: true;
  remainingSystemRisk: number; // 0..100
  recoveryMinutes: number;
  rank: number;
  description: string;
  tradeoffs: string;
  affectedServices: string[];
};

export type DataQuality = {
  sufficientForForecast: boolean;
  windowStart: string | null;
  windowEnd: string | null;
  durationSeconds: number;
  recordCount: number;
  serviceCount: number;
  warnings: string[];
};

export type AnalysisResponse = {
  schemaVersion: "1";
  analysisId: string;
  source: "sample" | "upload";
  status: "complete" | "insufficient_data";
  dataQuality: DataQuality;
  services: ServiceAnalysis[];
  dependencies: DependencyEdge[];
  prediction: PredictionResult;
  cascade: CascadeResult;
  scenarios: RecoveryScenario[];
  evidence: EvidenceItem[];
  notices: string[];
};

export type AnalysisErrorIssue = {
  file: "telemetry" | "dependencies" | "request";
  row: number | null;
  field: string | null;
  message: string;
};

export type AnalysisError = {
  schemaVersion: "1";
  status: "error";
  error: {
    code: "INVALID_TELEMETRY" | "INVALID_DEPENDENCIES" | "FILE_TOO_LARGE" | "UNSUPPORTED_MEDIA" | "ANALYSIS_FAILED";
    message: string;
    issues: AnalysisErrorIssue[];
  };
};

export type AskContext = {
  status: "complete" | "insufficient_data";
  dataQuality?: {
    sufficientForForecast: boolean;
    windowStart?: string | null;
    windowEnd?: string | null;
    recordCount?: number;
    serviceCount?: number;
  };
  prediction: {
    serviceId: string | null;
    riskScore: number;
    riskBand: string;
    confidence: string;
    causeSummary?: string;
    evidenceIds: string[];
  };
  dependencies: Array<{ from: string; to: string }>;
  cascadePaths: Array<{ serviceIds: string[]; reason?: string; evidenceIds?: string[] }>;
  scenarios: Array<{
    id: string;
    label?: string;
    remainingSystemRisk: number;
    recoveryMinutes: number | null;
    simulated: boolean;
    rank?: number;
    tradeoffs?: string;
  }>;
  evidence: Array<{
    id: string;
    kind: string;
    serviceId: string;
    value: string;
    timestamp?: string;
    label?: string;
  }>;
};

export type AskRequest = {
  schemaVersion: "1";
  analysisId: string;
  question: string;
  context: AskContext;
};

export type AskResponse = {
  schemaVersion: "1";
  analysisId: string;
  status: "answered" | "insufficient_context" | "unavailable";
  answer: string;
  evidenceIds: string[];
  uncertainty?: string;
  suggestions?: string[];
  source: "gemini" | "deterministic";
};

