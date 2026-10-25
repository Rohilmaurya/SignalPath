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

    let rawText: string | undefined;

    // P1 Fix: Pass structured JSON schema to Interactions API or generateContent
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interactionsApi = (ai as any).interactions;
      if (interactionsApi && typeof interactionsApi.create === "function") {
        const response = await interactionsApi.create({
          model: "gemini-3.8-flash",
          input: userPrompt,
          system_instruction: systemPrompt,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "incident_explanation",
              schema: EXPLANATION_JSON_SCHEMA,
            },
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawText = (response as any).output_text || (response as any).text || (response as any).content;
        if (!rawText && response) {
          rawText = typeof response === "string" ? response : JSON.stringify(response);
        }
      }
    } catch (interactionErr) {
      console.warn("Interactions API call with schema failed, falling back to generateContent:", interactionErr instanceof Error ? interactionErr.message : "unknown");
    }

    if (!rawText) {
      // Fallback to generateContent with responseSchema
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: "application/json",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          responseSchema: EXPLANATION_JSON_SCHEMA as any,
        },
      });
      rawText = response.text;
    }

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
