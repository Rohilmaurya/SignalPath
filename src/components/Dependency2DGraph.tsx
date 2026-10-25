"use client";

import React from "react";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { AlertCircle, ArrowRight } from "lucide-react";

interface Dependency2DGraphProps {
  services: ServiceAnalysis[];
  dependencies: DependencyEdge[];
  predictedServiceId: string | null;
  affectedServiceIds: string[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  previewResidualRisk?: Record<string, number> | null;
}

export const Dependency2DGraph: React.FC<Dependency2DGraphProps> = ({
  services,
  dependencies,
  predictedServiceId,
  affectedServiceIds,
  selectedServiceId,
  onSelectService,
  previewResidualRisk,
}) => {
  // 2D Layout coordinates
  const layoutPositions: Record<string, { x: number; y: number }> = {
    "api-gateway": { x: 400, y: 50 },
    "checkout-service": { x: 240, y: 160 },
    "payment-service": { x: 560, y: 160 },
    "orders-service": { x: 240, y: 280 },
    "inventory-db": { x: 240, y: 400 },
    "notification-worker": { x: 440, y: 340 },
  };

  // Provide fallback coordinate generation for unknown services
  const getNodePos = (id: string, index: number) => {
    if (layoutPositions[id]) return layoutPositions[id];
    const total = services.length;
    const angle = (index / total) * Math.PI * 2;
    return {
      x: 400 + Math.cos(angle) * 220,
      y: 240 + Math.sin(angle) * 160,
    };
  };

  const getNodeColor = (score: number) => {
    if (score >= 80) return { fill: "#450a0a", stroke: "#ef4444", text: "#fca5a5" };
    if (score >= 55) return { fill: "#431407", stroke: "#f97316", text: "#fdba74" };
    if (score >= 25) return { fill: "#451a03", stroke: "#f59e0b", text: "#fde68a" };
    return { fill: "#064e3b", stroke: "#10b981", text: "#6ee7b7" };
  };

  return (
    <div className="w-full bg-obs-bg border border-obs-border rounded-xl p-4 relative overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between mb-3 text-xs font-mono text-obs-textMuted border-b border-obs-border pb-2">
        <span className="flex items-center gap-1.5 text-obs-accent font-semibold">
          <AlertCircle className="h-4 w-4" />
          2D Vector Blast Radius Map
        </span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Culprit Root
          </span>
          <span className="flex items-center gap-1 text-[11px]">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Downstream Impact
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 800 480"
          className="w-full min-w-[650px] h-[440px] select-none"
          role="img"
          aria-label="2D dependency topology diagram"
        >
          <defs>
            {/* Standard edge marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="24"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
            </marker>

            {/* Cascade edge marker */}
            <marker
              id="arrow-cascade"
              viewBox="0 0 10 10"
              refX="26"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#a855f7" />
            </marker>

            {/* Pulsing beacon glow filter */}
            <filter id="glow-rose" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Render dependency edges */}
          {dependencies.map((edge, index) => {
            const fromIndex = services.findIndex((s) => s.id === edge.from);
            const toIndex = services.findIndex((s) => s.id === edge.to);
            const fromPos = getNodePos(edge.from, fromIndex >= 0 ? fromIndex : 0);
            const toPos = getNodePos(edge.to, toIndex >= 0 ? toIndex : 0);

            const isCascade =
              (edge.to === predictedServiceId && affectedServiceIds.includes(edge.from)) ||
              (affectedServiceIds.includes(edge.to) && affectedServiceIds.includes(edge.from));

            // Curve path
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const cx = (fromPos.x + toPos.x) / 2 - dy * 0.15;
            const cy = (fromPos.y + toPos.y) / 2 + dx * 0.15;

            return (
              <g key={`edge-${index}`}>
                <path
                  d={`M ${fromPos.x} ${fromPos.y} Q ${cx} ${cy} ${toPos.x} ${toPos.y}`}
                  fill="none"
                  stroke={isCascade ? "#a855f7" : "#334155"}
                  strokeWidth={isCascade ? "3" : "1.5"}
                  strokeDasharray={isCascade ? "5,3" : "none"}
                  markerEnd={isCascade ? "url(#arrow-cascade)" : "url(#arrow)"}
                  opacity={isCascade ? 0.95 : 0.5}
                />
              </g>
            );
          })}

          {/* Render Service Nodes */}
          {services.map((service, index) => {
            const pos = getNodePos(service.id, index);
            const isPredicted = service.id === predictedServiceId;
            const isCascade = affectedServiceIds.includes(service.id);
            const isSelected = service.id === selectedServiceId;

            let effectiveScore = service.riskScore;
            if (previewResidualRisk && previewResidualRisk[service.id] !== undefined) {
              effectiveScore = previewResidualRisk[service.id];
            }

            const colors = getNodeColor(effectiveScore);

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
                {/* Predicted outer beacon aura */}
                {isPredicted && (
                  <circle
                    r="44"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                    className="animate-spin"
                    opacity="0.7"
                  />
                )}

                {/* Selected highlight ring */}
                {isSelected && (
                  <circle
                    r="38"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                  />
                )}

                {/* Main Node Body */}
                <circle
                  r="30"
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={isPredicted ? "3" : isCascade ? "2.5" : "1.5"}
                  filter={isPredicted ? "url(#glow-rose)" : undefined}
                  className="transition-all duration-200 group-hover:scale-105"
                />

                {/* Node Service Name */}
                <text
                  textAnchor="middle"
                  dy="-4"
                  fill="#ffffff"
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {service.id.length > 12 ? service.id.slice(0, 10) + ".." : service.id}
                </text>

                {/* Risk Score Pill */}
                <rect
                  x="-16"
                  y="6"
                  width="32"
                  height="14"
                  rx="4"
                  fill="#000000"
                  opacity="0.8"
                />
                <text
                  textAnchor="middle"
                  dy="16"
                  fill={colors.text}
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight="bold"
                  className="pointer-events-none"
                >
                  {effectiveScore}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
