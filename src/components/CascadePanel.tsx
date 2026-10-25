"use client";

import React, { useState } from "react";
import { CascadeResult } from "@/lib/types";
import { GitFork, ArrowRight, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from "lucide-react";

interface CascadePanelProps {
  cascade: CascadeResult;
  predictedServiceId: string | null;
  onFocusService: (serviceId: string) => void;
}

export const CascadePanel: React.FC<CascadePanelProps> = ({
  cascade,
  predictedServiceId,
  onFocusService,
}) => {
  const [showAllPaths, setShowAllPaths] = useState(false);

  if (!cascade.available || cascade.paths.length === 0) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm">
        <h3 className="text-sm font-semibold text-[#18181B] mb-2 flex items-center gap-2">
          <GitFork className="h-4 w-4 text-[#7C3AED]" />
          <span>Downstream Impact & Blast Radius</span>
        </h3>
        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-xs text-[#52525B] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-[#059669] shrink-0" />
          <span>No cascading downstream dependencies detected. Fault domain is isolated.</span>
        </div>
      </div>
    );
  }

  const displayedPaths = showAllPaths ? cascade.paths : cascade.paths.slice(0, 2);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-[#18181B] tracking-tight flex items-center gap-2">
              <GitFork className="h-4 w-4 text-[#7C3AED]" />
              <span>Downstream Impact & Blast Radius</span>
            </h3>
            <p className="text-xs text-[#52525B] mt-0.5 font-mono">
              {cascade.affectedServiceIds.length} dependent services exposed to upstream degradation
            </p>
          </div>

          <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 font-mono font-medium">
            {cascade.affectedServiceIds.join(", ")}
          </span>
        </div>

        {/* Primary and secondary paths */}
        <div className="space-y-3">
          {displayedPaths.map((path, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-xs transition-all hover:border-purple-300"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {path.serviceIds.map((sId, sIdx) => (
                    <React.Fragment key={sId}>
                      <button
                        onClick={() => onFocusService(sId)}
                        className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border transition-colors ${
                          sId === predictedServiceId
                            ? "bg-rose-50 border-rose-200 text-rose-700 font-semibold hover:bg-rose-100"
                            : "bg-white border-[#E4E4E7] text-[#18181B] hover:border-zinc-400"
                        }`}
                        title={`Locate ${sId} in topology`}
                      >
                        {sId}
                      </button>
                      {sIdx < path.serviceIds.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-purple-500 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <span className="text-[11px] font-mono text-purple-700 uppercase font-semibold">
                  {path.estimatedImpact} impact
                </span>
              </div>

              <p className="text-xs text-[#52525B] leading-relaxed">
                {path.reason}
              </p>
            </div>
          ))}
        </div>

        {cascade.paths.length > 2 && (
          <button
            onClick={() => setShowAllPaths(!showAllPaths)}
            className="mt-3 text-xs text-[#18181B] hover:text-[#FC4778] flex items-center gap-1 font-medium"
          >
            <span>{showAllPaths ? "Show primary paths only" : `View all ${cascade.paths.length} cascade paths`}</span>
            {showAllPaths ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-[#E4E4E7] text-[11px] text-[#71717A] font-mono flex items-center justify-between">
        <span>Cycle-safe directed traversal</span>
        <span>Depth: {cascade.paths[0]?.serviceIds.length || 0} hops</span>
      </div>
    </div>
  );
};
