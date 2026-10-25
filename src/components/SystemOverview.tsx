"use client";

import React from "react";
import { 
  AlertOctagon, 
  Clock, 
  Database, 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
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

  const getRiskBandBadge = (band: string) => {
    switch (band) {
      case "critical":
        return "bg-rose-500/10 border-rose-500/40 text-rose-400";
      case "high":
        return "bg-orange-500/10 border-orange-500/40 text-orange-400";
      case "medium":
        return "bg-amber-500/10 border-amber-500/40 text-amber-400";
      default:
        return "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";
    }
  };

  return (
    <section className="bg-obs-surface/60 border border-obs-border rounded-xl p-4 sm:p-5 relative overflow-hidden backdrop-blur-sm">
      {/* Background radar texture */}
      <div className="absolute inset-0 radar-grid opacity-30 pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
        {/* At-Risk Culprit Service Card */}
        <div className="md:col-span-2 bg-obs-surfaceElevated/70 border border-obs-border rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-obs-textMuted flex items-center gap-1.5">
                <AlertOctagon className="h-3.5 w-3.5 text-rose-400" />
                Predicted Primary Failure Vector
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                {prediction.available && prediction.serviceId ? (
                  <>
                    <h2 className="text-xl sm:text-2xl font-mono font-bold text-white tracking-wide">
                      {prediction.serviceId}
                    </h2>
                    <span
                      className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border uppercase ${getRiskBandBadge(
                        predictedService?.riskBand || "critical"
                      )}`}
                    >
                      {predictedService?.riskBand || "critical"} risk
                    </span>
                  </>
                ) : (
                  <h2 className="text-lg font-mono font-bold text-amber-300">
                    Forecast Withheld (Data Sparse)
                  </h2>
                )}
              </div>
            </div>

            {prediction.available && (
              <div className="text-right">
                <span className="text-[10px] font-mono text-obs-textDim uppercase">Risk Index</span>
                <div className="text-2xl font-mono font-bold text-rose-400">
                  {prediction.riskScore}
                  <span className="text-xs text-obs-textMuted font-normal">/100</span>
                </div>
              </div>
            )}
          </div>

          <p className="text-xs text-obs-textMuted leading-relaxed mb-3">
            {prediction.causeSummary}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-obs-border/50 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="text-obs-textDim">
                Confidence:{" "}
                <strong className="text-obs-text uppercase">{prediction.confidence}</strong>
              </span>
              <span className="text-obs-textDim">•</span>
              <span className="text-obs-textDim">
                Horizon:{" "}
                <strong className="text-obs-text">{prediction.horizonMinutes}m estimate</strong>
              </span>
            </div>

            {prediction.available && prediction.serviceId && onFocusPredictedService && (
              <button
                onClick={() => onFocusPredictedService(prediction.serviceId!)}
                className="text-[11px] text-obs-accent hover:underline flex items-center gap-1 font-mono"
              >
                <Radio className="h-3 w-3 animate-ping" />
                Focus 3D Node
              </button>
            )}
          </div>
        </div>

        {/* Temporal Window & Observability Scope */}
        <div className="bg-obs-surfaceElevated/70 border border-obs-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-obs-textMuted flex items-center gap-1.5 mb-2">
              <Clock className="h-3.5 w-3.5 text-obs-accent" />
              Telemetry Window
            </span>
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-obs-textDim">Start:</span>
                <span className="text-white">{formatUtcTime(dataQuality.windowStart)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-obs-textDim">End:</span>
                <span className="text-white">{formatUtcTime(dataQuality.windowEnd)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-obs-textDim">Observed Duration:</span>
                <span className="text-obs-accent font-semibold">{dataQuality.durationSeconds}s</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-obs-border/50 flex items-center justify-between text-xs font-mono text-obs-textDim">
            <div className="flex items-center gap-1">
              <Database className="h-3.5 w-3.5" />
              <span>{dataQuality.recordCount} records</span>
            </div>
            <div className="flex items-center gap-1">
              <Server className="h-3.5 w-3.5" />
              <span>{dataQuality.serviceCount} services</span>
            </div>
          </div>
        </div>

        {/* Data Quality & Sufficiency Gate */}
        <div className="bg-obs-surfaceElevated/70 border border-obs-border rounded-lg p-4 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-obs-textMuted flex items-center gap-1.5 mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-obs-accent" />
              Data Sufficiency Gate
            </span>

            {isSufficient ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">Qualified for Predictive Drift</span>
                </div>
                <p className="text-[11px] text-obs-textMuted leading-relaxed">
                  Time-series span meets the &gt;30s and 3+ record threshold required for anomaly correlation.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono">
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">History Insufficient</span>
                </div>
                <p className="text-[11px] text-amber-300/80 leading-relaxed">
                  Data points too sparse for extrapolation. Failure forecast withheld.
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 pt-2 border-t border-obs-border/50 text-[10px] font-mono text-obs-textDim italic">
            Trace validated against service topology
          </div>
        </div>
      </div>
    </section>
  );
};
