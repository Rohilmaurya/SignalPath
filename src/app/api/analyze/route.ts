import { NextRequest, NextResponse } from "next/server";
import { parseAndNormalizeTelemetry } from "@/lib/telemetry-parser";
import { DependencyFileSchema } from "@/lib/schema";
import { analyzeIncident } from "@/lib/risk-engine";
import { generateGeminiExplanation } from "@/lib/gemini-client";
import { AnalysisError, AnalysisResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_JSON_SIZE = 1 * 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const telemetryFile = formData.get("telemetry") as File | null;
    const dependenciesFile = formData.get("dependencies") as File | null;
    const source = (formData.get("source") as string) === "sample" ? "sample" : "upload";

    if (!telemetryFile) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_TELEMETRY",
          message: "Telemetry CSV file is required.",
          issues: [{ file: "telemetry", row: null, field: "telemetry", message: "Missing telemetry file in multipart request" }],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!dependenciesFile) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_DEPENDENCIES",
          message: "Dependencies JSON file is required.",
          issues: [{ file: "dependencies", row: null, field: "dependencies", message: "Missing dependencies file in multipart request" }],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Size checks
    if (telemetryFile.size > MAX_CSV_SIZE) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "FILE_TOO_LARGE",
          message: `Telemetry CSV exceeds max limit of ${MAX_CSV_SIZE / (1024 * 1024)}MB.`,
          issues: [{ file: "telemetry", row: null, field: null, message: "File exceeds 5MB limit" }],
        },
      };
      return NextResponse.json(errorResponse, { status: 413 });
    }

    if (dependenciesFile.size > MAX_JSON_SIZE) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "FILE_TOO_LARGE",
          message: `Dependencies JSON exceeds max limit of ${MAX_JSON_SIZE / (1024 * 1024)}MB.`,
          issues: [{ file: "dependencies", row: null, field: null, message: "File exceeds 1MB limit" }],
        },
      };
      return NextResponse.json(errorResponse, { status: 413 });
    }

    // Read contents
    const csvText = await telemetryFile.text();
    const jsonText = await dependenciesFile.text();

    // 1. Parse CSV
    const csvResult = parseAndNormalizeTelemetry(csvText);
    if (!csvResult.success) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_TELEMETRY",
          message: "Telemetry CSV failed validation.",
          issues: csvResult.issues,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 2. Parse JSON
    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(jsonText);
    } catch {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_DEPENDENCIES",
          message: "Dependencies file is not valid JSON.",
          issues: [{ file: "dependencies", row: null, field: null, message: "Syntax error in JSON string" }],
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const jsonValidation = DependencyFileSchema.safeParse(parsedJson);
    if (!jsonValidation.success) {
      const issues = jsonValidation.error.issues.map((issue) => ({
        file: "dependencies" as const,
        row: null,
        field: issue.path.join("."),
        message: issue.message,
      }));

      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_DEPENDENCIES",
          message: "Dependencies JSON failed schema validation.",
          issues,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const dependenciesData = jsonValidation.data;

    // Check for unknown service references in dependencies
    const knownServices = new Set([
      ...dependenciesData.services,
      ...csvResult.services,
    ]);

    const unknownServiceIssues: AnalysisError["error"]["issues"] = [];
    for (const dep of dependenciesData.dependencies) {
      if (!knownServices.has(dep.from)) {
        unknownServiceIssues.push({
          file: "dependencies",
          row: null,
          field: "dependencies.from",
          message: `Unknown service '${dep.from}' referenced in dependencies`,
        });
      }
      if (!knownServices.has(dep.to)) {
        unknownServiceIssues.push({
          file: "dependencies",
          row: null,
          field: "dependencies.to",
          message: `Unknown service '${dep.to}' referenced in dependencies`,
        });
      }
    }

    if (unknownServiceIssues.length > 0) {
      const errorResponse: AnalysisError = {
        schemaVersion: "1",
        status: "error",
        error: {
          code: "INVALID_DEPENDENCIES",
          message: "Dependencies reference unknown services not present in service list or telemetry.",
          issues: unknownServiceIssues,
        },
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // 3. Deterministic Analysis
    const baseAnalysis: AnalysisResponse = analyzeIncident({
      records: csvResult.records,
      dependencies: dependenciesData,
      source,
    });

    // 4. Gemini AI Explanation (Server-side, only if forecast is available)
    if (baseAnalysis.dataQuality.sufficientForForecast && baseAnalysis.prediction.serviceId) {
      const geminiResult = await generateGeminiExplanation({
        predictedServiceId: baseAnalysis.prediction.serviceId,
        riskScore: baseAnalysis.prediction.riskScore,
        services: baseAnalysis.services,
        evidence: baseAnalysis.evidence,
        cascadeAffectedServices: baseAnalysis.cascade.affectedServiceIds,
      });

      if (geminiResult.success && geminiResult.explanations) {
        baseAnalysis.prediction.explanations = geminiResult.explanations;
        baseAnalysis.prediction.explanationSource = "gemini";
        if (geminiResult.causeSummary) {
          baseAnalysis.prediction.causeSummary = geminiResult.causeSummary;
        }
        if (geminiResult.confidence) {
          baseAnalysis.prediction.confidence = geminiResult.confidence;
        }
        if (geminiResult.symptoms && geminiResult.symptoms.length > 0) {
          baseAnalysis.prediction.symptoms = geminiResult.symptoms;
        }
        if (geminiResult.citedEvidenceIds && geminiResult.citedEvidenceIds.length > 0) {
          baseAnalysis.prediction.evidenceIds = geminiResult.citedEvidenceIds;
        }
      }

      if (geminiResult.notice) {
        baseAnalysis.notices.push(geminiResult.notice);
      }
    }

    return NextResponse.json(baseAnalysis, { status: 200 });
  } catch (err) {
    console.error("Unhandled analysis error:", err);
    const errorResponse: AnalysisError = {
      schemaVersion: "1",
      status: "error",
      error: {
        code: "ANALYSIS_FAILED",
        message: "An unexpected error occurred while analyzing the telemetry dataset.",
        issues: [],
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
