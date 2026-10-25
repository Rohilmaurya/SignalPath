import { NextRequest, NextResponse } from "next/server";
import { answerGroundedQuestion } from "@/lib/gemini-client";
import { AskRequest, AskResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 }
      );
    }

    const { analysisId, question, context, schemaVersion } = body as Partial<AskRequest>;

    if (!question || typeof question !== "string" || question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question string is required" },
        { status: 400 }
      );
    }

    if (question.length > 500) {
      return NextResponse.json(
        { error: "Question exceeds maximum length of 500 characters" },
        { status: 400 }
      );
    }

    if (!context || typeof context !== "object") {
      return NextResponse.json(
        { error: "Bounded analysis context is required" },
        { status: 400 }
      );
    }

    const cleanQuestion = question.trim();
    const cleanAnalysisId = analysisId || "ephemeral-analysis";

    const response: AskResponse = await answerGroundedQuestion({
      analysisId: cleanAnalysisId,
      question: cleanQuestion,
      context: {
        status: context.status || "complete",
        dataQuality: context.dataQuality,
        prediction: context.prediction || {
          serviceId: null,
          riskScore: 0,
          riskBand: "unknown",
          confidence: "low",
          evidenceIds: [],
        },
        dependencies: Array.isArray(context.dependencies) ? context.dependencies : [],
        cascadePaths: Array.isArray(context.cascadePaths) ? context.cascadePaths : [],
        scenarios: Array.isArray(context.scenarios) ? context.scenarios : [],
        evidence: Array.isArray(context.evidence) ? context.evidence.slice(0, 30) : [],
      },
    });

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error in /api/ask:", error);
    return NextResponse.json(
      {
        schemaVersion: "1",
        analysisId: "ephemeral-error",
        status: "unavailable",
        answer: "The assistant could not process your inquiry at this moment.",
        evidenceIds: [],
        uncertainty: "Server error occurred during Q&A processing.",
        source: "deterministic",
      },
      { status: 500 }
    );
  }
}
