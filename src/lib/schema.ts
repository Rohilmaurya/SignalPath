import { z } from "zod";

export const DependencyEdgeSchema = z.object({
  from: z.string().min(1, "Dependency 'from' service name cannot be empty"),
  to: z.string().min(1, "Dependency 'to' service name cannot be empty"),
});

export const DependencyFileSchema = z.object({
  services: z.array(z.string().min(1)).min(1, "At least one service required"),
  dependencies: z.array(DependencyEdgeSchema),
});

export const GeminiExplanationResponseSchema = z.object({
  causeSummary: z.string(),
  confidence: z.enum(["low", "medium", "high"]),
  symptoms: z.array(
    z.object({
      label: z.string(),
      evidenceIds: z.array(z.string()),
    })
  ),
  citedEvidenceIds: z.array(z.string()),
  explanations: z.object({
    engineer: z.string(),
    executive: z.string(),
  }),
});

export type GeminiExplanationParsed = z.infer<typeof GeminiExplanationResponseSchema>;
