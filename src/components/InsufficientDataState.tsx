"use client";

import React from "react";
import { AlertTriangle, Clock, RotateCcw, Database, ShieldAlert } from "lucide-react";
import { DataQuality } from "@/lib/types";

interface InsufficientDataStateProps {
  dataQuality: DataQuality;
  onResetSample: () => void;
}

export const InsufficientDataState: React.FC<InsufficientDataStateProps> = ({
  dataQuality,
  onResetSample,
}) => {
  return (
    <div className="bg-obs-surface border border-amber-500/40 rounded-xl p-6 shadow-2xl font-mono text-xs my-4">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-obs-border pb-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
              Insufficient Temporal Telemetry for Incident Forecasting
            </h3>
            <p className="text-obs-textMuted mt-1 leading-relaxed">
              SignalPath requires a minimum of 3 temporal records spanning &ge;30 seconds to establish statistical rate-of-change drift and evaluate cascading dependency propagation.
            </p>
          </div>
        </div>

        <button
          onClick={onResetSample}
          className="px-3.5 py-2 rounded-lg bg-obs-accent hover:bg-sky-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shrink-0 shadow-[0_0_15px_rgba(56,189,248,0.25)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Replay Verified Sample Incident</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div className="p-3 rounded-lg bg-obs-surfaceElevated border border-obs-border">
          <span className="text-[10px] text-obs-textDim uppercase flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-obs-accent" />
            Observed Duration
          </span>
          <div className="text-lg font-bold text-amber-400">
            {dataQuality.durationSeconds}s
            <span className="text-xs text-obs-textDim font-normal ml-1">/ 30s required</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-obs-surfaceElevated border border-obs-border">
          <span className="text-[10px] text-obs-textDim uppercase flex items-center gap-1 mb-1">
            <Database className="h-3 w-3 text-obs-accent" />
            Record Volume
          </span>
          <div className="text-lg font-bold text-amber-400">
            {dataQuality.recordCount} records
            <span className="text-xs text-obs-textDim font-normal ml-1">/ 3 minimum</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-obs-surfaceElevated border border-obs-border">
          <span className="text-[10px] text-obs-textDim uppercase flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-amber-400" />
            Sufficiency Violations
          </span>
          <div className="text-xs text-amber-300">
            {dataQuality.warnings.length > 0 ? dataQuality.warnings[0] : "Temporal threshold unmet"}
          </div>
        </div>
      </div>

      <div className="p-3 rounded-lg bg-obs-surfaceElevated/50 border border-obs-border text-[11px] text-obs-textDim leading-relaxed">
        <strong>Guaranteed Safety Invariant:</strong> To prevent false alarms in operational dashboards, SignalPath refuses to fabricate a next-failure vector or cascading blast radius when observations are insufficient.
      </div>
    </div>
  );
};
