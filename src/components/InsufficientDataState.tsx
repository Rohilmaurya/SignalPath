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
    <div className="bg-white border border-amber-300 rounded-3xl p-6 sm:p-7 shadow-sm font-mono text-xs my-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[#E4E4E7] pb-5 mb-5">
        <div className="flex items-start gap-3.5">
          <div className="h-10 w-10 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-amber-900 font-sans flex items-center gap-2">
              Insufficient Temporal Telemetry for Incident Forecasting
            </h3>
            <p className="text-[#52525B] mt-1 leading-relaxed">
              SignalPath requires a minimum of 3 temporal records spanning &ge;30 seconds to establish statistical rate-of-change drift and evaluate cascading dependency propagation.
            </p>
          </div>
        </div>

        <button
          onClick={onResetSample}
          className="px-4 py-2 rounded-full bg-[#18181B] hover:bg-zinc-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0 shadow-sm"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Replay Verified Sample Incident</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
          <span className="text-[10px] text-[#71717A] uppercase flex items-center gap-1 mb-1">
            <Clock className="h-3 w-3 text-[#18181B]" />
            Observed Duration
          </span>
          <div className="text-lg font-bold text-amber-900">
            {dataQuality.durationSeconds}s
            <span className="text-xs text-[#71717A] font-normal ml-1">/ 30s required</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
          <span className="text-[10px] text-[#71717A] uppercase flex items-center gap-1 mb-1">
            <Database className="h-3 w-3 text-[#18181B]" />
            Record Volume
          </span>
          <div className="text-lg font-bold text-amber-900">
            {dataQuality.recordCount} records
            <span className="text-xs text-[#71717A] font-normal ml-1">/ 3 minimum</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
          <span className="text-[10px] text-[#71717A] uppercase flex items-center gap-1 mb-1">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            Sufficiency Violations
          </span>
          <div className="text-xs text-amber-800">
            {dataQuality.warnings.length > 0 ? dataQuality.warnings[0] : "Temporal threshold unmet"}
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200 text-[11px] text-[#52525B] leading-relaxed">
        <strong className="text-amber-950">Guaranteed Safety Invariant:</strong> To prevent false alarms in operational dashboards, SignalPath refuses to fabricate a next-failure vector or cascading blast radius when observations are insufficient.
      </div>
    </div>
  );
};
