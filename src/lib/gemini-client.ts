import { GoogleGenAI } from "@google/genai";
import { EvidenceItem, PredictionResult, ServiceAnalysis } from "./types";
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
3. Distinguish observed facts from hypotheses. Do not claim certainty unsupported by the input.
4. Provide both an "engineer" explanation (technical metrics, mechanisms, cited evidence IDs) and an "executive" explanation (business consequence, affected user flows, non-technical clarity).
5. Output valid JSON adhering to the requested schema.`;

    const userPrompt = `INCIDENT SUMMARY:
Predicted at-risk service: ${params.predictedServiceId}
Calculated Risk Score: ${params.riskScore}/100
Downstream cascading services affected: ${params.cascadeAffectedServices.join(", ") || "none"}

AVAILABLE EVIDENCE ITEMS (You may ONLY cite IDs from this list):
${JSON.stringify(compactEvidence, null, 2)}

Provide structured JSON with:
{
  "causeSummary": "A concise 1-2 sentence evidence-based hypothesis",
  "confidence": "low" | "medium" | "high",
  "symptoms": [
    { "label": "Concise symptom label", "evidenceIds": ["Exact ID from list"] }
  ],
  "citedEvidenceIds": ["List of all cited Evidence IDs"],
  "explanations": {
    "engineer": "Technical root cause explanation citing specific evidence IDs (e.g., M-... or L-...)",
    "executive": "Executive summary explaining business impact and mitigation urgency without deep jargon"
  }
}`;

    // Try Interactions API first, fallback to generateContent if needed
    let rawText: string | undefined;

    try {
      // @google/genai interactions API call
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const interactionsApi = (ai as any).interactions;
      if (interactionsApi && typeof interactionsApi.create === "function") {
        const response = await interactionsApi.create({
          model: "gemini-3.8-flash",
          input: userPrompt,
          system_instruction: systemPrompt,
          response_format: {
            type: "json_object",
          },
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rawText = (response as any).output_text || (response as any).text || (response as any).content;
        if (!rawText && response) {
          rawText = typeof response === "string" ? response : JSON.stringify(response);
        }
      }
    } catch (interactionErr) {
      console.warn("Interactions API call failed, attempting fallback to generateContent:", interactionErr instanceof Error ? interactionErr.message : "unknown");
    }

    if (!rawText) {
      // Fallback to generateContent
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] },
        ],
        config: {
          responseMimeType: "application/json",
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

    // CRITICAL: Filter cited evidence IDs to ensure NO hallucinated IDs exist
    const sanitizedCitedIds = validated.citedEvidenceIds.filter((id) =>
      availableEvidenceIds.has(id)
    );

    const sanitizedSymptoms = validated.symptoms.map((s) => ({
      label: s.label,
      evidenceIds: s.evidenceIds.filter((id) => availableEvidenceIds.has(id)),
    }));

    return {
      success: true,
      source: "gemini",
      causeSummary: validated.causeSummary,
      confidence: validated.confidence,
      symptoms: sanitizedSymptoms,
      citedEvidenceIds: sanitizedCitedIds.length > 0 ? sanitizedCitedIds : Array.from(availableEvidenceIds).slice(0, 4),
      explanations: validated.explanations,
      notice: "Live explanation generated by Gemini 3.8 Flash via server runtime.",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown Gemini error";
    console.error("Gemini API invocation error:", errorMsg);

    return {
      success: false,
      source: "deterministic",
      notice: `Gemini live call encountered an error (${errorMsg}). Falling back to deterministic evidence-grounded analysis.`,
    };
  }
}
