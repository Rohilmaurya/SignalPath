import { GoogleGenAI } from "@google/genai";
import { EvidenceItem, ServiceAnalysis } from "./types";
import { GeminiExplanationResponseSchema } from "./schema";

export type GeminiExplanationResult = {
  success: boolean;
  explanations?: {
    engineer: string;
    executive: string;
  };
  causeSummary?: string;
  confidence?: "low" | "medium" | "high";
  symptoms?: Array<{ label: string; evidenceIds: string[] }>;
  citedEvidenceIds?: string[];
  source: "gemini" | "deterministic" | "unavailable";
  notice?: string;
};

// Documented JSON Schema specification for Gemini Structured Output
const EXPLANATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    causeSummary: {
      type: "string",
      description: "A concise 1-2 sentence evidence-based hypothesis.",
    },
    confidence: {
      type: "string",
      enum: ["low", "medium", "high"],
      description: "Confidence rating based strictly on evidence clarity.",
    },
    symptoms: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          evidenceIds: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["label", "evidenceIds"],
      },
    },
    citedEvidenceIds: {
      type: "array",
      items: { type: "string" },
      description: "List of all cited Evidence IDs from the provided ledger.",
    },
    explanations: {
      type: "object",
      properties: {
        engineer: {
          type: "string",
          description: "Technical root-cause explanation citing specific evidence IDs (e.g., M-... or L-...).",
        },
        executive: {
          type: "string",
          description: "Operational summary explaining business impact and mitigation urgency without deep jargon.",
        },
      },
      required: ["engineer", "executive"],
    },
  },
  required: [
    "causeSummary",
    "confidence",
    "symptoms",
    "citedEvidenceIds",
    "explanations",
  ],
};

export async function generateGeminiExplanation(params: {
  predictedServiceId: string;
  riskScore: number;
  services: ServiceAnalysis[];
  evidence: EvidenceItem[];
  cascadeAffectedServices: string[];
}): Promise<GeminiExplanationResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return {
      success: false,
      source: "deterministic",
      notice: "GEMINI_API_KEY is not configured on the server. Showing deterministic evidence-grounded fallback.",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const availableEvidenceIds = new Set(params.evidence.map((e) => e.id));

    // Prepare bounded evidence excerpts for prompt
    const compactEvidence = params.evidence.slice(0, 20).map((e) => ({
      id: e.id,
      kind: e.kind,
      service: e.serviceId,
      label: e.label,
      value: e.value,
      timestamp: e.timestamp,
    }));

    const systemPrompt = `You are SignalPath AI, an expert site reliability and systems observability intelligence engine.
Analyze the provided simulated telemetry evidence and dependencies for an emerging incident.
RULES:
1. Ground all hypotheses strictly on the provided Evidence IDs.
2. Every cited ID in symptoms or explanations MUST exactly match one of the provided Evidence IDs. Do not invent IDs.
3. Distinguish observed facts from hypotheses. Do not claim certainty unsupported by the input. Avoid absolute terms like "guaranteed" or "certain".
4. Provide both an "engineer" explanation (technical metrics, mechanisms, cited evidence IDs) and an "executive" explanation (business consequence, affected user flows, non-technical clarity).
5. Output valid JSON adhering strictly to the provided response schema.`;

    const userPrompt = `INCIDENT SUMMARY:
Predicted at-risk service: ${params.predictedServiceId}
Calculated Risk Score: ${params.riskScore}/100
Downstream cascading services affected: ${params.cascadeAffectedServices.join(", ") || "none"}

AVAILABLE EVIDENCE ITEMS (You may ONLY cite IDs from this list):
${JSON.stringify(compactEvidence, null, 2)}`;

    // Direct generateContent call with responseSchema and strict timeout to prevent UI hangs
    const callGeminiWithTimeout = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: EXPLANATION_JSON_SCHEMA,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });
      return response.text;
    };

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini API call timed out after 10s")), 10000)
    );

    const rawText = await Promise.race([callGeminiWithTimeout(), timeoutPromise]);

    if (!rawText) {
      throw new Error("Empty response received from Gemini API");
    }

    // Strip markdown code fences if model enclosed JSON in ```json ... ```
    let cleanJson = rawText.trim();
    if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    }

    const parsedJson = JSON.parse(cleanJson);
    const validated = GeminiExplanationResponseSchema.parse(parsedJson);

    // P1 Fix: Filter cited evidence IDs in fields
    const sanitizedCitedIds = validated.citedEvidenceIds.filter((id) =>
      availableEvidenceIds.has(id)
    );

    const sanitizedSymptoms = validated.symptoms.map((s) => ({
      label: s.label,
      evidenceIds: s.evidenceIds.filter((id) => availableEvidenceIds.has(id)),
    }));

    // P1 Fix: Validate and sanitize citation IDs in free-form explanation text
    const sanitizeFreeTextCitations = (text: string): string => {
      // Matches patterns like M-service-latency-1 or L-14
      return text.replace(/\b([ML]-[A-Za-z0-9_-]+)\b/g, (match) => {
        if (availableEvidenceIds.has(match)) {
          return match;
        }
        // If hallucinated ID, omit or replace with verified note
        return `[evidence ref omitted: unverified ID]`;
      });
    };

    const sanitizedExplanations = {
      engineer: sanitizeFreeTextCitations(validated.explanations.engineer),
      executive: sanitizeFreeTextCitations(validated.explanations.executive),
    };

    return {
      success: true,
      source: "gemini",
      causeSummary: validated.causeSummary,
      confidence: validated.confidence,
      symptoms: sanitizedSymptoms,
      citedEvidenceIds:
        sanitizedCitedIds.length > 0
          ? sanitizedCitedIds
          : Array.from(availableEvidenceIds).slice(0, 4),
      explanations: sanitizedExplanations,
      notice: "Live explanation generated by Gemini 3.8 Flash via server runtime with schema validation.",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("Gemini API invocation error:", errorMsg);

    return {
      success: false,
      source: "deterministic",
      notice: `Gemini live call encountered an issue (${errorMsg}). Falling back to deterministic evidence-grounded analysis.`,
    };
  }
}

// Structured schema for Grounded Q&A
const ASK_JSON_SCHEMA = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "A concise, factual answer strictly grounded in the provided incident context and evidence ledger. Must not claim to have resolved the incident or run infrastructure commands.",
    },
    evidenceIds: {
      type: "array",
      items: { type: "string" },
      description: "List of evidence IDs from the context ledger that directly support this answer.",
    },
    uncertainty: {
      type: "string",
      description: "Any missing telemetry metrics, unmonitored dependencies, or bounds of the analysis that leave uncertainty.",
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
      description: "1-3 safe, investigative next steps or verification recommendations. Do NOT state that actions were executed.",
    },
  },
  required: ["answer", "evidenceIds"],
};

export async function answerGroundedQuestion(params: {
  analysisId: string;
  question: string;
  context: import("./types").AskContext;
}): Promise<import("./types").AskResponse> {
  const { analysisId, question, context } = params;
  const availableEvidenceMap = new Map(context.evidence.map((e) => [e.id, e]));
  const validEvidenceIds = new Set(context.evidence.map((e) => e.id));

  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback deterministic responder
  const buildDeterministicAnswer = (): import("./types").AskResponse => {
    const qLower = question.toLowerCase();
    const predService = context.prediction.serviceId || "Unknown Service";
    const predEvidence = context.prediction.evidenceIds
      .filter((id) => validEvidenceIds.has(id))
      .slice(0, 3);

    let answer = "";
    let evidenceIds: string[] = [];
    let uncertainty = "Answers generated from available in-memory evidence ledger.";
    const suggestions: string[] = [];

    // 1. Recovery / Mitigation / Ranking queries FIRST to resolve bug where "why" hijacked recovery questions
    if (
      qLower.includes("recovery") ||
      qLower.includes("rank") ||
      qLower.includes("recommend") ||
      qLower.includes("scenario") ||
      qLower.includes("mitigat") ||
      qLower.includes("baseline") ||
      qLower.includes("do-nothing")
    ) {
      const topScenario = context.scenarios.find((s) => s.id !== "do-nothing") || context.scenarios[0];
      const baseline = context.scenarios.find((s) => s.id === "do-nothing");
      if (topScenario && baseline) {
        answer = `Simulated scenario '${topScenario.label || topScenario.id}' is ranked #1 because it projects an estimated residual system risk of ${topScenario.remainingSystemRisk}/100 with recovery in ~${topScenario.recoveryMinutes ?? 8}m, compared to the unmitigated 'Do Nothing' baseline of ${baseline.remainingSystemRisk}/100 where cascade failure spreads unchecked. Tradeoffs: ${topScenario.tradeoffs || "Targeted service traffic shedding"}. Note: All recovery options are analytical heuristic simulations; no infrastructure commands are executed.`;
        suggestions.push("Review runbook prerequisites before executing manual failover procedures.");
      } else if (topScenario) {
        answer = `Simulated scenario '${topScenario.label || topScenario.id}' projects residual system risk of ${topScenario.remainingSystemRisk}/100. Note: This is an analytical heuristic simulation; no infrastructure commands are dispatched.`;
      } else {
        answer = "No recovery scenarios could be evaluated due to insufficient data coverage.";
      }
    } else if (qLower.includes("cascade") || qLower.includes("downstream") || qLower.includes("impact") || qLower.includes("blast")) {
      if (context.cascadePaths.length > 0) {
        const primary = context.cascadePaths[0];
        answer = `If ${predService} degrades, failure propagates to dependent callers: ${primary.serviceIds.join(" → ")} (${primary.reason || "upstream caller dependency"}).`;
        suggestions.push("Verify whether upstream callers have active circuit breakers configured.");
      } else {
        answer = `No cascading downstream blast radius was identified. The fault domain appears isolated to ${predService}.`;
      }
    } else if (qLower.includes("evidence") || qLower.includes("signal") || qLower.includes("why") || qLower.includes("cause")) {
      const evidenceDetails = predEvidence
        .map((id) => {
          const item = availableEvidenceMap.get(id);
          return item ? `${id} (${item.label}: ${item.value})` : id;
        })
        .join("; ");
      answer = `The highest-risk component is ${predService} (heuristic risk ${context.prediction.riskScore}/100, ${context.prediction.confidence} confidence). Primary observed signals include: ${evidenceDetails || "anomalous drift in metrics"}.`;
      evidenceIds = predEvidence;
      suggestions.push(`Inspect active thread pool and resource utilization on ${predService}.`);
    } else {
      answer = `Analysis summary for ${predService}: ${context.prediction.causeSummary || "Observed telemetry indicates localized service degradation."} (Risk: ${context.prediction.riskScore}/100).`;
      evidenceIds = predEvidence;
      suggestions.push("Cross-reference telemetry time window with recent deployments.");
    }

    return {
      schemaVersion: "1",
      analysisId,
      status: "answered",
      answer,
      evidenceIds,
      uncertainty,
      suggestions,
      source: "deterministic",
    };
  };

  if (!apiKey || apiKey.trim() === "") {
    return buildDeterministicAnswer();
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are SignalPath's incident investigation assistant.
A user has submitted multi-service telemetry and dependency graphs. Answer their question strictly based on the provided JSON context.

CRITICAL INVARIANTS:
1. Ground your answer ONLY in the facts and evidence ledger provided.
2. If asked why a recovery scenario is recommended or ranked first, compare its projected residual risk and recovery horizon directly against the 'do-nothing' baseline and explain the trade-offs based on the provided scenarios.
3. If evidence is missing, state what is unobserved or uncertain.
4. Every ID in 'evidenceIds' MUST exist in the provided evidence list.
5. DO NOT claim that infrastructure was changed, commands were run, or the incident was fixed in production.
6. All recovery options are SIMULATED estimates.
7. Keep the answer concise (2-4 sentences).

QUESTION: "${question.slice(0, 500)}"

INCIDENT CONTEXT:
${JSON.stringify({
  prediction: context.prediction,
  dependencies: context.dependencies,
  cascadePaths: context.cascadePaths,
  scenarios: context.scenarios,
  evidence: context.evidence.slice(0, 20),
}, null, 2)}`;

    const callAskWithTimeout = async () => {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: ASK_JSON_SCHEMA,
          thinkingConfig: {
            thinkingBudget: 0,
          },
        },
      });
      return response.text;
    };

    const timeoutPromise = new Promise<string | undefined>((_, reject) =>
      setTimeout(() => reject(new Error("Gemini Q&A call timed out after 10s")), 10000)
    );

    const text = await Promise.race([callAskWithTimeout(), timeoutPromise]);
    if (!text) {
      return buildDeterministicAnswer();
    }

    const parsed = JSON.parse(text);
    const sanitizedEvidenceIds = (Array.isArray(parsed.evidenceIds) ? parsed.evidenceIds : []).filter(
      (id: string) => validEvidenceIds.has(id)
    );

    // Sanitize any IDs in answer text
    const sanitizedAnswer = String(parsed.answer || "").replace(/\b([ML]-[A-Za-z0-9_-]+)\b/g, (match) => {
      return validEvidenceIds.has(match) ? match : "[evidence ref omitted: unverified]";
    });

    return {
      schemaVersion: "1",
      analysisId,
      status: "answered",
      answer: sanitizedAnswer,
      evidenceIds: sanitizedEvidenceIds,
      uncertainty: parsed.uncertainty ? String(parsed.uncertainty) : undefined,
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.map(String) : undefined,
      source: "gemini",
    };
  } catch (error) {
    console.error("Gemini Q&A invocation error:", error);
    return buildDeterministicAnswer();
  }
}

