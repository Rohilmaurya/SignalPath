import Papa from "papaparse";
import { TelemetryRecord, TelemetryLevel, AnalysisErrorIssue } from "./types";

export type ParseTelemetryResult = {
  success: true;
  records: TelemetryRecord[];
  services: string[];
} | {
  success: false;
  issues: AnalysisErrorIssue[];
};

const VALID_LEVELS: Set<string> = new Set(["debug", "info", "warn", "error", "fatal"]);

export function parseAndNormalizeTelemetry(csvContent: string): ParseTelemetryResult {
  const issues: AnalysisErrorIssue[] = [];

  if (!csvContent || csvContent.trim().length === 0) {
    return {
      success: false,
      issues: [{ file: "telemetry", row: null, field: null, message: "Telemetry CSV file is empty" }],
    };
  }

  const parsed = Papa.parse<Record<string, string>>(csvContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  if (parsed.errors && parsed.errors.length > 0) {
    for (const err of parsed.errors) {
      issues.push({
        file: "telemetry",
        row: err.row !== undefined ? err.row + 2 : null,
        field: null,
        message: err.message,
      });
    }
  }

  const headers = parsed.meta.fields || [];
  const requiredHeaders = ["timestamp", "service", "level", "message"];
  for (const req of requiredHeaders) {
    if (!headers.includes(req)) {
      issues.push({
        file: "telemetry",
        row: 1,
        field: req,
        message: `Missing required column '${req}' in CSV header`,
      });
    }
  }

  if (issues.length > 0) {
    return { success: false, issues };
  }

  const MAX_ROWS = 5000;
  if (parsed.data.length > MAX_ROWS) {
    return {
      success: false,
      issues: [
        {
          file: "telemetry",
          row: null,
          field: null,
          message: `CSV row count (${parsed.data.length}) exceeds demo safety limit of ${MAX_ROWS} rows`,
        },
      ],
    };
  }

  const records: TelemetryRecord[] = [];
  const serviceSet = new Set<string>();

  parsed.data.forEach((row, index) => {
    const rowNum = index + 2; // header is row 1
    const rawTimestamp = row["timestamp"]?.trim();
    const rawService = row["service"]?.trim();
    const rawLevel = row["level"]?.trim()?.toLowerCase();
    const rawMessage = row["message"]?.trim();

    if (!rawTimestamp) {
      issues.push({ file: "telemetry", row: rowNum, field: "timestamp", message: "Timestamp is required" });
      return;
    }

    const date = new Date(rawTimestamp);
    if (isNaN(date.getTime())) {
      issues.push({ file: "telemetry", row: rowNum, field: "timestamp", message: `Invalid timestamp format: "${rawTimestamp}"` });
      return;
    }
    const isoUtc = date.toISOString();

    if (!rawService) {
      issues.push({ file: "telemetry", row: rowNum, field: "service", message: "Service identifier cannot be empty" });
      return;
    }
    const service = rawService.toLowerCase();
    serviceSet.add(service);

    let level: TelemetryLevel = "info";
    if (rawLevel && VALID_LEVELS.has(rawLevel)) {
      level = rawLevel as TelemetryLevel;
    } else if (rawLevel) {
      if (rawLevel === "warning") level = "warn";
      else if (rawLevel === "err") level = "error";
      else if (rawLevel === "crit" || rawLevel === "critical") level = "fatal";
      else {
        issues.push({
          file: "telemetry",
          row: rowNum,
          field: "level",
          message: `Unrecognized log level "${rawLevel}". Must be debug, info, warn, error, or fatal`,
        });
        return;
      }
    }

    const message = rawMessage || "(no message)";

    // Parse optional metrics
    const metrics: TelemetryRecord["metrics"] = {};

    if (row["latency_ms"] !== undefined && row["latency_ms"] !== "") {
      const lat = parseFloat(row["latency_ms"]);
      if (isNaN(lat) || !isFinite(lat) || lat < 0) {
        issues.push({ file: "telemetry", row: rowNum, field: "latency_ms", message: "latency_ms must be a non-negative finite number" });
      } else {
        metrics.latencyMs = Math.round(lat * 100) / 100;
      }
    }

    if (row["error_rate"] !== undefined && row["error_rate"] !== "") {
      let errRate = parseFloat(row["error_rate"]);
      if (isNaN(errRate) || !isFinite(errRate) || errRate < 0) {
        issues.push({ file: "telemetry", row: rowNum, field: "error_rate", message: "error_rate must be a non-negative finite number" });
      } else {
        if (errRate > 1 && errRate <= 100) {
          errRate = errRate / 100;
        }
        if (errRate > 1) {
          issues.push({ file: "telemetry", row: rowNum, field: "error_rate", message: "error_rate exceeds 1.0 (or 100%)" });
        } else {
          metrics.errorRate = Math.round(errRate * 1000) / 1000;
        }
      }
    }

    if (row["cpu_pct"] !== undefined && row["cpu_pct"] !== "") {
      const cpu = parseFloat(row["cpu_pct"]);
      if (isNaN(cpu) || !isFinite(cpu) || cpu < 0 || cpu > 100) {
        issues.push({ file: "telemetry", row: rowNum, field: "cpu_pct", message: "cpu_pct must be between 0 and 100" });
      } else {
        metrics.cpuPct = Math.round(cpu * 10) / 10;
      }
    }

    records.push({
      timestamp: isoUtc,
      service,
      level,
      message: message.slice(0, 500), // bounded length
      metrics,
      sourceRow: rowNum,
    });
  });

  if (issues.length > 0) {
    return { success: false, issues };
  }

  // Sort chronological
  records.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return {
    success: true,
    records,
    services: Array.from(serviceSet),
  };
}
