"use client";

import React from "react";
import { PredictionResult, EvidenceItem } from "@/lib/types";
import { 
  Sparkles, 
  Cpu, 
  FileText, 
  Tag, 
  ExternalLink, 
  Info,
  Clock,
  Gauge
} from "lucide-react";

interface PredictionPanelProps {
  prediction: PredictionResult;
  audienceMode: "engineer" | "executive";
  evidenceList: EvidenceItem[];
  onSelectEvidence: (evidenceId: string) => void;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  audienceMode,
  evidenceList,
  onSelectEvidence,
}) => {
  if (!prediction.available) {
    return (
      <div className="bg-obs-surface border border-amber-600/30 rounded-xl p-5 text-xs font-mono text-amber-200">
        <h3 className="font-bold text-sm text-amber-400 mb-2 flex items-center gap-1.5">
          <Info className="h-4 w-4" />
          Predictive Analysis Withheld
        </h3>
        <p className="leading-relaxed text-obs-textMuted">
          The telemetry data coverage is insufficient to compute statistical drift or extrapolate failure horizons.
          {prediction.explanations[audienceMode]}
        </p>
      </div>
    );
  }

  const activeExplanation = prediction.explanations[audienceMode];
  const isGemini = prediction.explanationSource === "gemini";

  return (
    <div className="bg-obs-surface/80 border border-obs-border rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
      <div>
        {/* Header & Source Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obs-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                Root-Cause Hypothesis & Symptoms
              </h3>
              <p className="text-[11px] text-obs-textDim">
                Target: <span className="text-rose-400 font-mono font-semibold">{prediction.serviceId}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${
                isGemini
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                  : "bg-obs-accent/10 border-obs-accent/40 text-obs-accent"
              }`}
            >
              {isGemini ? <Sparkles className="h-3 w-3" /> : <Cpu className="h-3 w-3" />}
              <span>{isGemini ? "Gemini 3.8 Flash (Live)" : "Deterministic Heuristic Engine"}</span>
            </span>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obs-surfaceElevated border border-obs-border text-obs-textMuted uppercase flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{prediction.horizonMinutes}m horizon
            </span>
          </div>
        </div>

        {/* Narrative Explanation Block */}
        <div className="mb-4">
          <div className="text-[11px] font-mono text-obs-textDim uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>
              {audienceMode === "engineer" ? "Engineering Mechanics & Evidence" : "Executive Operational Impact"}
            </span>
            <span className="text-[10px] text-obs-accent font-normal lowercase">
              aud: {audienceMode}
            </span>
          </div>

          <div className="p-3.5 rounded-lg bg-obs-surfaceElevated/80 border border-obs-border text-xs font-mono leading-relaxed text-obs-text space-y-2">
            <p className="text-white/95">{activeExplanation}</p>
          </div>
        </div>

        {/* Symptom Classification & Cited Evidence IDs */}
        <div>
          <span className="text-[11px] font-mono text-obs-textDim uppercase tracking-wider block mb-2">
            Observed Symptom Classifications
          </span>

          <div className="space-y-2">
            {prediction.symptoms.map((symptom, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded bg-obs-surfaceElevated/50 border border-obs-border/70 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-obs-accent shrink-0" />
                  <span className="text-obs-text font-medium">{symptom.label}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-obs-textDim">Cites:</span>
                  {symptom.evidenceIds.map((eid) => {
                    const evidenceItem = evidenceList.find((e) => e.id === eid);
                    const isMetric = eid.startsWith("M-");

                    return (
                      <button
                        key={eid}
                        onClick={() => onSelectEvidence(eid)}
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all ${
                          isMetric
                            ? "bg-sky-950/70 border-sky-600/50 text-sky-300 hover:bg-sky-800/70"
                            : "bg-rose-950/70 border-rose-600/50 text-rose-300 hover:bg-rose-800/70"
                        }`}
                        title={evidenceItem ? `${evidenceItem.label}: ${evidenceItem.value}` : `Inspect ${eid}`}
                      >
                        <FileText className="h-2.5 w-2.5" />
                        <span>{eid}</span>
                        <ExternalLink className="h-2.5 w-2.5 opacity-60" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grounding Disclaimer */}
      <div className="mt-4 pt-3 border-t border-obs-border/40 text-[10px] font-mono text-obs-textDim flex items-center justify-between">
        <span>Grounded in verifiable telemetry data windows</span>
        <span className="italic">Hypothesis subject to telemetry fidelity</span>
      </div>
    </div>
  );
};
