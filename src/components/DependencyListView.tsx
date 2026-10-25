"use client";

import React from "react";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { Server, AlertOctagon, CornerDownRight, Eye } from "lucide-react";

interface DependencyListViewProps {
  services: ServiceAnalysis[];
  dependencies: DependencyEdge[];
  predictedServiceId: string | null;
  affectedServiceIds: string[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  previewResidualRisk?: Record<string, number> | null;
}

export const DependencyListView: React.FC<DependencyListViewProps> = ({
  services,
  dependencies,
  predictedServiceId,
  affectedServiceIds,
  selectedServiceId,
  onSelectService,
  previewResidualRisk,
}) => {
  return (
    <div className="w-full bg-obs-bg border border-obs-border rounded-xl p-4 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-3 text-xs font-mono text-obs-textMuted border-b border-obs-border pb-2">
        <span className="flex items-center gap-1.5 text-obs-accent font-semibold">
          <Server className="h-4 w-4" />
          Tabular Service Topology & Heuristic Matrix
        </span>
        <span className="text-[11px] text-obs-textDim">
          {services.length} services tracked
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse" role="table">
          <thead>
            <tr className="border-b border-obs-border bg-obs-surfaceElevated/50 text-obs-textMuted text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-3">Service</th>
              <th className="py-2.5 px-3">Role / Status</th>
              <th className="py-2.5 px-3">Risk Index</th>
              <th className="py-2.5 px-3">Severe Events</th>
              <th className="py-2.5 px-3">Direct Upstream Dependencies</th>
              <th className="py-2.5 px-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obs-border/40">
            {services.map((service) => {
              const isPredicted = service.id === predictedServiceId;
              const isCascade = affectedServiceIds.includes(service.id);
              const isSelected = service.id === selectedServiceId;

              let effectiveScore = service.riskScore;
              if (previewResidualRisk && previewResidualRisk[service.id] !== undefined) {
                effectiveScore = previewResidualRisk[service.id];
              }

              // Direct dependencies: which services does this service depend on?
              // "from depends on to", so where from === service.id
              const upstreams = dependencies
                .filter((d) => d.from === service.id)
                .map((d) => d.to);

              const badgeColor =
                effectiveScore >= 80
                  ? "bg-rose-500/10 border-rose-500/40 text-rose-400"
                  : effectiveScore >= 55
                  ? "bg-orange-500/10 border-orange-500/40 text-orange-400"
                  : effectiveScore >= 25
                  ? "bg-amber-500/10 border-amber-500/40 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/40 text-emerald-400";

              return (
                <tr
                  key={service.id}
                  onClick={() => onSelectService(service.id)}
                  className={`hover:bg-obs-surfaceElevated/60 transition-colors cursor-pointer ${
                    isSelected ? "bg-obs-surfaceElevated border-l-2 border-l-obs-accent" : ""
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-white">
                    <div className="flex items-center gap-1.5">
                      <span className="text-obs-accent font-mono">{service.id}</span>
                      {isSelected && (
                        <span className="text-[10px] px-1 py-0.2 rounded bg-obs-accent/20 text-obs-accent border border-obs-accent/40">
                          active
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-2.5 px-3">
                    {isPredicted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 font-semibold animate-pulse">
                        <AlertOctagon className="h-3 w-3" />
                        Predicted Culprit
                      </span>
                    ) : isCascade ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/50">
                        <CornerDownRight className="h-3 w-3" />
                        In Blast Radius
                      </span>
                    ) : (
                      <span className="text-[11px] text-emerald-400">Nominal</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3">
                    <span className={`inline-block px-2 py-0.5 rounded border text-[11px] font-bold ${badgeColor}`}>
                      {effectiveScore} / 100
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-obs-textMuted">
                    {service.severeLogCount > 0 ? (
                      <span className="text-rose-400 font-semibold">{service.severeLogCount} alerts</span>
                    ) : (
                      <span className="text-obs-textDim">0 warnings</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-obs-textDim text-[11px]">
                    {upstreams.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {upstreams.map((u) => (
                          <span
                            key={u}
                            className="px-1.5 py-0.5 rounded bg-obs-surface border border-obs-border text-obs-textMuted"
                          >
                            {u}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span>None (Root tier)</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectService(service.id);
                      }}
                      className="px-2 py-1 rounded bg-obs-surfaceElevated hover:bg-obs-border border border-obs-border text-obs-accent text-[11px] flex items-center gap-1 ml-auto transition-colors"
                      title={`Inspect telemetry details for ${service.id}`}
                    >
                      <Eye className="h-3 w-3" />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
