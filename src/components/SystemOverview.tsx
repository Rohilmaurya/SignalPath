"use client";

import React from "react";
import { 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Radio
} from "lucide-react";
import { AnalysisResponse } from "@/lib/types";

interface SystemOverviewProps {
  analysis: AnalysisResponse;
  onFocusPredictedService?: (serviceId: string) => void;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({
  analysis,
  onFocusPredictedService,
}) => {
  const { dataQuality, prediction, services } = analysis;
  const isSufficient = dataQuality.sufficientForForecast;
  const predictedService = services.find((s) => s.id === prediction.serviceId);

  const formatUtcTime = (isoString: string | null) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return d.toTimeString().split(" ")[0] + " UTC";
  };

  const getRiskBadge = (band: string) => {
    switch (band) {
      case "critical":
        return "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 font-semibold";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold";
    }
  };

  return (
    <section className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm relative overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Culprit Service Callout */}
        <div className="md:col-span-1 border-b md:border-b-0 md:border-r border-[#E4E4E7] pb-4 md:pb-0 md:pr-6">
          <div className="flex items-center gap-1.5 text-xs text-[#71717A] mb-1 font-mono uppercase tracking-wider">
            <AlertOctagon className="h-3.5 w-3.5 text-[#DC2626]" />
            <span className="font-semibold">Primary Failure Vector</span>
          </div>

          {prediction.available && prediction.serviceId ? (
            <div className="flex items-baseline justify-between gap-3 mt-1.5">
              <div>
                <div className="text-2xl font-bold text-[#18181B] tracking-tight flex items-center gap-2">
                  <span>{prediction.serviceId}</span>
                  <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border uppercase ${getRiskBadge(predictedService?.riskBand || "critical")}`}>
                    {predictedService?.riskBand || "critical"}
                  </span>
                </div>
                <div className="text-xs text-[#52525B] mt-1 flex items-center gap-2">
                  <span>Simulated Risk: <strong className="text-[#DC2626] font-mono font-semibold">{prediction.riskScore}/100</strong></span>
                  <span className="text-[#71717A]">•</span>
                  <span>~{prediction.horizonMinutes}m horizon (heuristic)</span>
                </div>
              </div>

              {onFocusPredictedService && (
                <button
                  onClick={() => onFocusPredictedService(prediction.serviceId!)}
                  className="text-xs bg-[#18181B] text-white hover:bg-zinc-800 px-3 py-1.5 rounded-full flex items-center gap-1.5 shrink-0 font-medium transition-all shadow-sm"
                >
                  <Radio className="h-3 w-3 text-[#FC4778]" />
                  <span>Locate</span>
                </button>
              )}
            </div>
          ) : (
            <div className="text-sm font-medium text-amber-700 mt-1">
              Forecast Withheld (Data Sparse or Baseline)
            </div>
          )}
        </div>

        {/* Telemetry Scope */}
        <div className="border-b md:border-b-0 md:border-r border-[#E4E4E7] pb-4 md:pb-0 md:px-6">
          <div className="flex items-center gap-1.5 text-xs text-[#71717A] mb-1 font-mono uppercase tracking-wider">
            <Clock className="h-3.5 w-3.5 text-[#18181B]" />
            <span className="font-semibold">Observation Window</span>
          </div>

          <div className="flex items-baseline justify-between text-xs mt-1.5">
            <span className="text-[#18181B] font-mono font-semibold">
              {formatUtcTime(dataQuality.windowStart)} – {formatUtcTime(dataQuality.windowEnd)}
            </span>
            <span className="text-[#71717A] font-mono">
              ({dataQuality.durationSeconds}s)
            </span>
          </div>

          <div className="text-xs text-[#52525B] mt-1 flex items-center gap-3">
            <span>{dataQuality.serviceCount} services</span>
            <span className="text-[#71717A]">•</span>
            <span>{dataQuality.recordCount} telemetry records</span>
          </div>
        </div>

        {/* Sufficiency Status */}
        <div className="md:pl-6">
          <div className="text-xs text-[#71717A] mb-1 font-mono uppercase tracking-wider font-semibold">
            Data Quality Gate
          </div>

          {isSufficient ? (
            <div className="flex items-center gap-2 text-xs text-[#059669] mt-1.5">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Sufficient for Drift Analysis</span>
              <span className="text-[11px] text-[#71717A] font-normal hidden lg:inline">(&ge;30s coverage)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-700 mt-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="font-semibold">Sparse Telemetry</span>
              <span className="text-[11px] text-[#71717A] font-normal">(predictions withheld)</span>
            </div>
          )}

          <div className="text-[11px] text-[#71717A] mt-1">
            Simulated estimates for decision support.
          </div>
        </div>
      </div>
    </section>
  );
};
