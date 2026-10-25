"use client";

import React, { useState } from "react";
import { PredictionResult, EvidenceItem } from "@/lib/types";
import { 
  Sparkles, 
  Cpu, 
  FileText, 
  Tag, 
  ExternalLink, 
  Info,
  ChevronDown,
  ChevronUp,
  UserCheck
} from "lucide-react";

interface PredictionPanelProps {
  prediction: PredictionResult;
  audienceMode: "engineer" | "executive";
  setAudienceMode: (mode: "engineer" | "executive") => void;
  evidenceList: EvidenceItem[];
  onSelectEvidence: (evidenceId: string) => void;
  onOpenLedger: () => void;
}

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  prediction,
  audienceMode,
  setAudienceMode,
  evidenceList,
  onSelectEvidence,
  onOpenLedger,
}) => {
  const [showAllSymptoms, setShowAllSymptoms] = useState(false);

  if (!prediction.available) {
    return (
      <div className="bg-amber-50/50 border border-amber-200 rounded-3xl p-6 text-xs text-amber-800 shadow-sm">
        <h3 className="font-semibold text-sm text-amber-900 mb-2 flex items-center gap-1.5">
          <Info className="h-4 w-4 text-amber-600" />
          Predictive Analysis Withheld
        </h3>
        <p className="leading-relaxed text-[#52525B]">
          Telemetry data coverage is insufficient to compute statistical drift or extrapolate failure horizons.
          {prediction.explanations[audienceMode]}
        </p>
      </div>
    );
  }

  const activeExplanation = prediction.explanations[audienceMode];
  const isGemini = prediction.explanationSource === "gemini";
  const displayedSymptoms = showAllSymptoms ? prediction.symptoms : prediction.symptoms.slice(0, 2);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header with Contextual Audience Switcher (Engineer vs Executive) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B] tracking-tight flex items-center gap-2">
              <span>Root Cause & Hypothesis</span>
              <span className="text-xs text-[#71717A] font-normal">
                (target: <strong className="text-[#DC2626]">{prediction.serviceId}</strong>)
              </span>
            </h3>
            <div className="flex items-center gap-2 mt-0.5 font-mono">
              <span className="text-[11px] text-[#52525B]">
                Confidence: <strong className="text-[#18181B] capitalize">{prediction.confidence}</strong>
              </span>
              <span className="text-[#71717A]">•</span>
              <span className="text-[11px] text-[#52525B]">
                Source: {isGemini ? "Gemini 3.8 Flash (Live)" : "Deterministic Heuristic"}
              </span>
            </div>
          </div>

          {/* Audience Switcher */}
          <div className="flex items-center rounded-full bg-[#F4F4F5] p-1 border border-[#E4E4E7]" role="group" aria-label="Audience explanation mode">
            <button
              onClick={() => setAudienceMode("engineer")}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-all ${
                audienceMode === "engineer"
                  ? "bg-[#18181B] text-white font-medium shadow-sm"
                  : "text-[#52525B] hover:text-[#18181B]"
              }`}
              title="Technical explanation with metric IDs and mechanisms"
            >
              <Cpu className="h-3 w-3" />
              <span>Engineer</span>
            </button>
            <button
              onClick={() => setAudienceMode("executive")}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-all ${
                audienceMode === "executive"
                  ? "bg-[#18181B] text-white font-medium shadow-sm"
                  : "text-[#52525B] hover:text-[#18181B]"
              }`}
              title="Operational summary with business consequences"
            >
              <UserCheck className="h-3 w-3" />
              <span>Executive</span>
            </button>
          </div>
        </div>

        {/* Narrative Explanation Block */}
        <div className="mb-4">
          <p className="text-xs text-[#18181B] leading-relaxed bg-[#FAFAFA] border border-[#E4E4E7] p-4 rounded-2xl">
            {activeExplanation}
          </p>
        </div>

        {/* Symptom Classifications with Cited Evidence */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#52525B] mb-2 font-mono">
            <span className="font-semibold uppercase tracking-wider text-[11px]">Observed Symptoms & Citations</span>
            {prediction.symptoms.length > 2 && (
              <button
                onClick={() => setShowAllSymptoms(!showAllSymptoms)}
                className="text-[11px] text-[#18181B] hover:text-[#FC4778] font-medium flex items-center gap-0.5"
              >
                <span>{showAllSymptoms ? "Show fewer" : `All ${prediction.symptoms.length}`}</span>
                {showAllSymptoms ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {displayedSymptoms.map((symptom, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <Tag className="h-3.5 w-3.5 text-[#18181B] shrink-0" />
                  <span className="text-[#18181B] font-medium">{symptom.label}</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {symptom.evidenceIds.map((eid) => {
                    const isMetric = eid.startsWith("M-");
                    return (
                      <button
                        key={eid}
                        onClick={() => onSelectEvidence(eid)}
                        className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-all ${
                          isMetric
                            ? "bg-sky-50 border-sky-200 text-sky-800 hover:bg-sky-100"
                            : "bg-rose-50 border-rose-200 text-rose-800 hover:bg-rose-100"
                        }`}
                        title={`Inspect evidence ${eid}`}
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

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-[#E4E4E7] text-[11px] text-[#71717A] flex items-center justify-between">
        <span>Grounded in telemetry observations</span>
        <button
          onClick={onOpenLedger}
          className="text-[#18181B] hover:text-[#FC4778] font-medium flex items-center gap-1"
        >
          View all {evidenceList.length} evidence items
        </button>
      </div>
    </div>
  );
};
