"use client";

import React from "react";
import { CascadeResult } from "@/lib/types";
import { GitFork, ArrowRight, AlertTriangle, ShieldCheck } from "lucide-react";

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
  if (!cascade.available || cascade.paths.length === 0) {
    return (
      <div className="bg-obs-surface/80 border border-obs-border rounded-xl p-5 shadow-xl">
        <h3 className="text-sm font-mono font-bold text-white mb-2 flex items-center gap-2">
          <GitFork className="h-4 w-4 text-purple-400" />
          Cascading Blast Radius Traversal
        </h3>
        <div className="p-4 rounded-lg bg-obs-surfaceElevated border border-obs-border text-xs font-mono text-obs-textMuted flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>No cascading downstream dependencies detected or forecast withheld. Isolated fault domain.</span>
        </div>
      </div>
    );
  }

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case "critical":
        return "bg-rose-500/10 border-rose-500/40 text-rose-300";
      case "high":
        return "bg-orange-500/10 border-orange-500/40 text-orange-300";
      case "medium":
        return "bg-amber-500/10 border-amber-500/40 text-amber-300";
      default:
        return "bg-purple-500/10 border-purple-500/40 text-purple-300";
    }
  };

  return (
    <div className="bg-obs-surface/80 border border-obs-border rounded-xl p-5 shadow-xl backdrop-blur-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-obs-border pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <GitFork className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white tracking-wide">
                Cascading Blast Radius Analysis
              </h3>
              <p className="text-[11px] text-obs-textDim">
                Cycle-safe downstream dependency traversal from <span className="text-rose-400 font-mono font-semibold">{predictedServiceId}</span>
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-950/60 border border-purple-600/40 text-purple-300">
            {cascade.affectedServiceIds.length} dependent services exposed
          </span>
        </div>

        {/* List of Traversal Paths */}
        <div className="space-y-3">
          {cascade.paths.map((path, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-obs-surfaceElevated/60 border border-obs-border/70 hover:border-purple-500/40 transition-colors text-xs font-mono"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-obs-textDim uppercase">Path:</span>
                  {path.serviceIds.map((sId, sIdx) => (
                    <React.Fragment key={sId}>
                      <button
                        onClick={() => onFocusService(sId)}
                        className={`px-1.5 py-0.5 rounded text-[11px] font-semibold border transition-all ${
                          sId === predictedServiceId
                            ? "bg-rose-950/80 border-rose-500 text-rose-300 hover:bg-rose-800"
                            : "bg-obs-surface border-obs-border text-obs-text hover:text-obs-accent hover:border-obs-accent"
                        }`}
                        title={`Inspect node ${sId}`}
                      >
                        {sId}
                      </button>
                      {sIdx < path.serviceIds.length - 1 && (
                        <ArrowRight className="h-3 w-3 text-purple-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <span
                  className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-semibold ${getImpactBadge(
                    path.estimatedImpact
                  )}`}
                >
                  {path.estimatedImpact} impact
                </span>
              </div>

              <p className="text-[11px] text-obs-textMuted leading-relaxed flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>{path.reason}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-obs-border/40 text-[10px] font-mono text-obs-textDim flex items-center justify-between">
        <span>Traversal Depth: Max 8 hops • Cycle-safe visited set</span>
        <span className="italic">Edge semantics: from depends on to</span>
      </div>
    </div>
  );
};
