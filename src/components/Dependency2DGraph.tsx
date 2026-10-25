"use client";

import React, { useMemo } from "react";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { computeGraphLayout } from "@/lib/graph-layout";
import { AlertCircle, Layers, FileSpreadsheet } from "lucide-react";

interface Dependency2DGraphProps {
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

export const Dependency2DGraph: React.FC<Dependency2DGraphProps> = ({
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
  // Procedural, topology-aware 2D coordinates for arbitrary graphs
  const { positions2D } = useMemo(
    () => computeGraphLayout(services, dependencies),
    [services, dependencies]
  );

  const getNodePos = (id: string, index: number) => {
    const pos = positions2D.get(id);
    if (pos) return pos;
    const total = services.length;
    const angle = (index / (total || 1)) * Math.PI * 2;
    return {
      x: 400 + Math.cos(angle) * 260,
      y: 240 + Math.sin(angle) * 170,
    };
  };

  const getNodeColor = (score: number, isPredicted: boolean, isCascade: boolean) => {
    if (isPredicted) {
      return { fill: "#fff1f2", stroke: "#ef4444", text: "#991b1b", accent: "#ef4444" };
    }
    if (isCascade) {
      return { fill: "#faf5ff", stroke: "#a855f7", text: "#6b21a8", accent: "#a855f7" };
    }
    if (score >= 55) {
      return { fill: "#fff7ed", stroke: "#f97316", text: "#9a3412", accent: "#f97316" };
    }
    return { fill: "#f0fdf4", stroke: "#10b981", text: "#065f46", accent: "#10b981" };
  };

  return (
    <div className="space-y-3">
      {/* Topology Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#18181B] tracking-tight text-sm font-sans">
            Service Topology & Blast Radius (2D Graph)
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

      <div className="w-full bg-white border border-[#E4E4E7] rounded-3xl p-5 relative overflow-hidden shadow-sm">
        <div className="w-full overflow-x-auto">
          <svg
            viewBox="0 0 800 480"
            className="w-full min-w-[700px] h-[460px] select-none"
            role="img"
            aria-label="2D dependency topology diagram with full service names"
          >
            <defs>
              <marker
                id="arrow-std"
                viewBox="0 0 10 10"
                refX="20"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
              </marker>

              <marker
                id="arrow-cascade-2d"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
              </marker>
            </defs>

            {/* Dependency Edges */}
            {dependencies.map((edge, index) => {
              const fromIndex = services.findIndex((s) => s.id === edge.from);
              const toIndex = services.findIndex((s) => s.id === edge.to);
              const fromPos = getNodePos(edge.from, fromIndex >= 0 ? fromIndex : 0);
              const toPos = getNodePos(edge.to, toIndex >= 0 ? toIndex : 0);

              const isCascade =
                (edge.to === predictedServiceId && affectedServiceIds.includes(edge.from)) ||
                (affectedServiceIds.includes(edge.to) && affectedServiceIds.includes(edge.from));

              const dx = toPos.x - fromPos.x;
              const dy = toPos.y - fromPos.y;
              const cx = (fromPos.x + toPos.x) / 2 - dy * 0.12;
              const cy = (fromPos.y + toPos.y) / 2 + dx * 0.12;

              return (
                <path
                  key={`edge-${index}`}
                  d={`M ${fromPos.x} ${fromPos.y} Q ${cx} ${cy} ${toPos.x} ${toPos.y}`}
                  fill="none"
                  stroke={isCascade ? "#a855f7" : "#334155"}
                  strokeWidth={isCascade ? "2.5" : "1.25"}
                  strokeDasharray={isCascade ? "5,3" : "none"}
                  markerEnd={isCascade ? "url(#arrow-cascade-2d)" : "url(#arrow-std)"}
                  opacity={isCascade ? 0.9 : 0.4}
                />
              );
            })}

            {/* Service Nodes with COMPLETE, UNCLIPPED NAMES */}
            {services.map((service, index) => {
              const pos = getNodePos(service.id, index);
              const isPredicted = service.id === predictedServiceId;
              const isCascade = affectedServiceIds.includes(service.id);
              const isSelected = service.id === selectedServiceId;

              let effectiveScore = service.riskScore;
              if (previewResidualRisk && previewResidualRisk[service.id] !== undefined) {
                effectiveScore = previewResidualRisk[service.id];
              }

              const colors = getNodeColor(effectiveScore, isPredicted, isCascade);
              const pillW = 150;
              const pillH = 46;

              return (
                <g
                  key={service.id}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  onClick={() => onSelectService(service.id)}
                  className="cursor-pointer group"
                  tabIndex={0}
                  role="button"
                  aria-label={`Service ${service.id}, Risk ${effectiveScore}/100, ${isPredicted ? "Primary failure culprit" : isCascade ? "In cascade blast radius" : "Nominal"}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      onSelectService(service.id);
                    }
                  }}
                >
                  {/* Selection Ring */}
                  {isSelected && (
                    <rect
                      x={-pillW / 2 - 4}
                      y={-pillH / 2 - 4}
                      width={pillW + 8}
                      height={pillH + 8}
                      rx="10"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                  )}

                  {/* Main Pill Card */}
                  <rect
                    x={-pillW / 2}
                    y={-pillH / 2}
                    width={pillW}
                    height={pillH}
                    rx="8"
                    fill={colors.fill}
                    stroke={colors.stroke}
                    strokeWidth={isPredicted ? "2.5" : isCascade ? "2" : "1.2"}
                    className="transition-transform group-hover:scale-105"
                  />

                  {/* Indicator Dot */}
                  <circle
                    cx={-pillW / 2 + 14}
                    cy="-3"
                    r="4"
                    fill={colors.accent}
                  />

                  {/* Complete Full Service Name */}
                  <text
                    x={-pillW / 2 + 25}
                    y="1"
                    fill="#ffffff"
                    fontSize="11.5"
                    fontFamily="sans-serif"
                    fontWeight="600"
                    className="pointer-events-none"
                  >
                    {service.id}
                  </text>

                  {/* Risk & Role Metadata */}
                  <text
                    x={-pillW / 2 + 25}
                    y="15"
                    fill={colors.text}
                    fontSize="9.5"
                    fontFamily="monospace"
                    className="pointer-events-none"
                  >
                    Risk: {effectiveScore}/100 {isPredicted ? "• Culprit" : isCascade ? "• Impact" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Bottom Legend */}
        <div className="flex items-center gap-4 text-xs text-obs-textMuted pt-2 border-t border-obs-border/50">
          <span className="flex items-center gap-1.5 text-rose-300">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Culprit Node
          </span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Cascading Blast Radius
          </span>
          <span className="flex items-center gap-1.5 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nominal
          </span>
        </div>
      </div>
    </div>
  );
};
