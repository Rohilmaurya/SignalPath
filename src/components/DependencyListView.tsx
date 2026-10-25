"use client";

import React from "react";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { Server, AlertOctagon, CornerDownRight, Eye, Layers, FileSpreadsheet } from "lucide-react";

interface DependencyListViewProps {
  services: ServiceAnalysis[];
  dependencies: DependencyEdge[];
  predictedServiceId: string | null;
  affectedServiceIds: string[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  previewResidualRisk?: Record<string, number> | null;
  viewMode: "3d" | "2d" | "list";
  setViewMode: (mode: "3d" | "2d" | "list") => void;
  onOpenLedger: () => void;
  evidenceCount: number;
}

export const DependencyListView: React.FC<DependencyListViewProps> = ({
  services,
  dependencies,
  predictedServiceId,
  affectedServiceIds,
  selectedServiceId,
  onSelectService,
  previewResidualRisk,
  viewMode,
  setViewMode,
  onOpenLedger,
  evidenceCount,
}) => {
  return (
    <div className="space-y-3">
      {/* Topology Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#18181B] tracking-tight text-sm font-sans">
            Service Topology Matrix
          </span>

          <div className="flex items-center rounded-full bg-[#F4F4F5] p-1 border border-[#E4E4E7]" role="group" aria-label="Observatory visualization mode">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                viewMode === "3d" ? "bg-[#18181B] text-white font-medium shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >
              <Layers className="h-3.5 w-3.5 inline mr-1" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                viewMode === "2d" ? "bg-[#18181B] text-white font-medium shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >
              <span>2D Graph</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                viewMode === "list" ? "bg-[#18181B] text-white font-medium shadow-sm" : "text-[#71717A] hover:text-[#18181B]"
              }`}
            >
              <span>Table</span>
            </button>
          </div>
        </div>

        <button
          onClick={onOpenLedger}
          className="text-xs text-[#18181B] hover:text-[#FC4778] flex items-center gap-1.5 font-medium transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Evidence Ledger ({evidenceCount})</span>
        </button>
      </div>

      <div className="w-full bg-white border border-[#E4E4E7] rounded-3xl p-5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse" role="table">
            <thead>
              <tr className="border-b border-[#E4E4E7] text-[#71717A] text-[11px] uppercase tracking-wider font-mono">
                <th className="py-2.5 px-3">Service</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Risk Index</th>
                <th className="py-2.5 px-3">Alerts / Warnings</th>
                <th className="py-2.5 px-3">Upstream Dependencies</th>
                <th className="py-2.5 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7]">
              {services.map((service) => {
                const isPredicted = service.id === predictedServiceId;
                const isCascade = affectedServiceIds.includes(service.id);
                const isSelected = service.id === selectedServiceId;

                let effectiveScore = service.riskScore;
                if (previewResidualRisk && previewResidualRisk[service.id] !== undefined) {
                  effectiveScore = previewResidualRisk[service.id];
                }

                const upstreams = dependencies
                  .filter((d) => d.from === service.id)
                  .map((d) => d.to);

                const badgeColor =
                  effectiveScore >= 80
                    ? "bg-rose-50 border-rose-200 text-rose-700"
                    : effectiveScore >= 55
                    ? "bg-orange-50 border-orange-200 text-orange-700"
                    : effectiveScore >= 25
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-emerald-50 border-emerald-200 text-emerald-700";

                return (
                  <tr
                    key={service.id}
                    onClick={() => onSelectService(service.id)}
                    className={`hover:bg-zinc-50 transition-colors cursor-pointer ${
                      isSelected ? "bg-zinc-50/80 border-l-4 border-l-[#18181B]" : ""
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-[#18181B]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{service.id}</span>
                        {isSelected && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#18181B] text-white font-mono">
                            active
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {isPredicted ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                          <AlertOctagon className="h-3 w-3" />
                          Primary Culprit
                        </span>
                      ) : isCascade ? (
                        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-medium">
                          <CornerDownRight className="h-3 w-3" />
                          In Blast Radius
                        </span>
                      ) : (
                        <span className="text-xs text-[#059669] font-medium">Nominal</span>
                      )}
                    </td>

                    <td className="py-3 px-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold ${badgeColor}`}>
                        {effectiveScore} / 100
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#52525B]">
                      {service.severeLogCount > 0 ? (
                        <span className="text-rose-700 font-medium">{service.severeLogCount} severe events</span>
                      ) : (
                        <span className="text-[#71717A]">0 warnings</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[#71717A] text-xs">
                      {upstreams.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {upstreams.map((u) => (
                            <span
                              key={u}
                              className="px-2.5 py-0.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#52525B] text-[11px] font-mono"
                            >
                              {u}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-[11px] text-[#71717A]">None (Data tier)</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectService(service.id);
                        }}
                        className="px-3 py-1 rounded-full bg-white hover:bg-zinc-100 border border-[#E4E4E7] text-[#18181B] text-xs flex items-center gap-1.5 ml-auto transition-colors font-medium shadow-sm"
                      >
                        <Eye className="h-3.5 w-3.5" />
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
    </div>
  );
};
