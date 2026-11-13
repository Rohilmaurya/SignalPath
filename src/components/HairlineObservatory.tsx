"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Radio, Activity, ShieldCheck, AlertTriangle } from "lucide-react";

interface ServiceNode {
  id: string;
  label: string;
  type: "ingress" | "service" | "database" | "cache";
  x: number;
  y: number;
  z: number;
  status: "nominal" | "degrading" | "critical" | "standby";
  metric: string;
}

interface Edge {
  from: string;
  to: string;
  critical?: boolean;
}

const NODES: ServiceNode[] = [
  { id: "api-gateway", label: "api-gateway", type: "ingress", x: -160, y: 0, z: 20, status: "nominal", metric: "p50: 18ms | err: 0.1%" },
  { id: "auth-service", label: "auth-service", type: "service", x: -60, y: -70, z: 15, status: "nominal", metric: "p95: 35ms | auth: ok" },
  { id: "orders-service", label: "orders-service", type: "service", x: -50, y: 50, z: 25, status: "degrading", metric: "queue: 412 | retry: 4x" },
  { id: "payment-service", label: "payment-service", type: "service", x: 60, y: -60, z: 10, status: "nominal", metric: "tps: 140 | ok" },
  { id: "inventory-db", label: "inventory-db", type: "database", x: 80, y: 60, z: 40, status: "critical", metric: "p99: 2420ms | lock: 98%" },
  { id: "inventory-replica", label: "standby-replica", type: "database", x: 190, y: 50, z: 15, status: "standby", metric: "lag: 20ms | ready" },
  { id: "redis-cache", label: "redis-cache", type: "cache", x: 170, y: -50, z: 10, status: "nominal", metric: "hit: 96% | mem: 42%" },
];

const EDGES: Edge[] = [
  { from: "api-gateway", to: "auth-service" },
  { from: "api-gateway", to: "orders-service", critical: true },
  { from: "orders-service", to: "payment-service" },
  { from: "orders-service", to: "inventory-db", critical: true },
  { from: "payment-service", to: "inventory-db" },
  { from: "payment-service", to: "redis-cache" },
  { from: "inventory-db", to: "inventory-replica" },
];

export const HairlineObservatory: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<ServiceNode | null>(NODES.find(n => n.id === "inventory-db") || null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Pointer tracking for tactile isometric answering gesture (hairline-create Rule 01 & 08)
  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1 to 1
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1; // -1 to 1

    // Smooth tilt angle limits (-10deg to 10deg)
    setTilt({
      x: -ny * 7,
      y: nx * 10,
    });
  }, [reducedMotion]);

  const handlePointerLeave = useCallback(() => {
    // Return gracefully to designed rest pose (hairline-create Rule 05)
    setTilt({ x: 0, y: 0 });
  }, []);

  // Isometric projection helper: 3D world (x, y, z) -> 2D screen (u, v)
  // Standard isometric angle: cos(30°)=0.866, sin(30°)=0.5
  const project = (x: number, y: number, z: number) => {
    const u = (x - y) * 0.866;
    const v = (x + y) * 0.5 - z;
    return { u: 280 + u * 0.85, v: 170 + v * 0.85 };
  };

  const activeNode = hoveredNode || NODES.find(n => n.id === "inventory-db")!;

  return (
    <div 
      ref={containerRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="w-full rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-8 shadow-sm craft-card select-none overflow-hidden relative"
    >
      {/* Header bar with tactile indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-1 flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#FC4778] animate-pulse" />
            <span>Interactive Isometric Causal DAG</span>
          </div>
          <h3 className="text-lg font-bold text-[#18181B] font-sans">
            Directed Fault Propagation Field
          </h3>
        </div>

        {/* Dynamic telemetry readout pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-3 py-1 rounded-full bg-[#FAFAFA] border border-[#E4E4E7] text-xs font-mono flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${
              activeNode.status === "critical" ? "bg-[#DC2626] animate-ping" :
              activeNode.status === "degrading" ? "bg-[#D97706]" :
              activeNode.status === "standby" ? "bg-[#7C3AED]" : "bg-[#059669]"
            }`} />
            <strong className="text-[#18181B]">{activeNode.label}</strong>
            <span className="text-[#71717A] hidden md:inline">| {activeNode.metric}</span>
          </div>
        </div>
      </div>

      {/* Isometric Canvas Body */}
      <div 
        className="w-full h-72 sm:h-80 flex items-center justify-center relative mt-3"
        style={{
          perspective: "1000px",
        }}
      >
        <div 
          className="w-full h-full max-w-xl transition-transform duration-300 ease-out"
          style={{
            transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <svg 
            viewBox="0 0 560 320" 
            className="w-full h-full overflow-visible"
            role="img"
            aria-label="Isometric distributed service dependency DAG showing causal degradation from inventory-db"
          >
            <defs>
              {/* Hairline subtle shadow filter */}
              <filter id="hairline-drop" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#18181B" floodOpacity="0.05" />
              </filter>
            </defs>

            {/* Ground grid / reference plane (honest construction back-to-front) */}
            <g stroke="#E4E4E7" strokeWidth="0.75" strokeDasharray="3 3">
              {[-120, -40, 40, 120].map((coord, i) => {
                const p1 = project(coord, -140, 0);
                const p2 = project(coord, 140, 0);
                return <line key={`gx-${i}`} x1={p1.u} y1={p1.v} x2={p2.u} y2={p2.v} />;
              })}
              {[-120, -40, 40, 120].map((coord, i) => {
                const p1 = project(-140, coord, 0);
                const p2 = project(140, coord, 0);
                return <line key={`gy-${i}`} x1={p1.u} y1={p1.v} x2={p2.u} y2={p2.v} />;
              })}
            </g>

            {/* Telemetry Conduits / Edges */}
            <g>
              {EDGES.map((edge, i) => {
                const source = NODES.find(n => n.id === edge.from)!;
                const target = NODES.find(n => n.id === edge.to)!;
                const pA = project(source.x, source.y, source.z);
                const pB = project(target.x, target.y, target.z);
                const isCriticalPath = edge.critical || (activeNode.id === edge.from || activeNode.id === edge.to);

                return (
                  <g key={`edge-${i}`}>
                    {/* Background shadow stroke */}
                    <line 
                      x1={pA.u} 
                      y1={pA.v} 
                      x2={pB.u} 
                      y2={pB.v} 
                      stroke={edge.critical ? "#FECACA" : "#E4E4E7"} 
                      strokeWidth={edge.critical ? "2.5" : "1.5"} 
                      strokeLinecap="round"
                    />
                    {/* Active pulse trace */}
                    {edge.critical && (
                      <line 
                        x1={pA.u} 
                        y1={pA.v} 
                        x2={pB.u} 
                        y2={pB.v} 
                        stroke="#DC2626" 
                        strokeWidth="2" 
                        strokeDasharray="6 8"
                        strokeLinecap="round"
                        className={reducedMotion ? "" : "animate-pulse"}
                      />
                    )}
                  </g>
                );
              })}
            </g>

            {/* Isometric Solid Service Nodes (back-to-front rendering) */}
            <g>
              {NODES.map((node) => {
                const pt = project(node.x, node.y, node.z);
                const isSelected = activeNode.id === node.id;
                const isCulprit = node.id === "inventory-db";

                return (
                  <g 
                    key={node.id} 
                    transform={`translate(${pt.u}, ${pt.v})`}
                    className="cursor-pointer transition-transform duration-150"
                    onPointerEnter={() => setHoveredNode(node)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Service ${node.label}, status ${node.status}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setHoveredNode(node);
                      }
                    }}
                  >
                    {/* Drop shadow pin on ground */}
                    <ellipse cx={0} cy={node.z * 0.85} rx={14} ry={6} fill="#E4E4E7" opacity={0.6} />

                    {/* Pedestal guide line */}
                    <line x1={0} y1={0} x2={0} y2={node.z * 0.85} stroke="#D4D4D8" strokeWidth="1" strokeDasharray="2 2" />

                    {/* Isometric Diamond / Box Body */}
                    <g className={isSelected ? "scale-110 transition-transform duration-200" : ""}>
                      {/* Top diamond plate */}
                      <polygon 
                        points="0,-16 20,-6 0,4 -20,-6" 
                        fill={isCulprit ? "#FEF2F2" : isSelected ? "#F4F4F5" : "#FFFFFF"}
                        stroke={isCulprit ? "#DC2626" : isSelected ? "#18181B" : "#A1A1AA"}
                        strokeWidth={isSelected || isCulprit ? "2" : "1.25"}
                        filter="url(#hairline-drop)"
                      />
                      {/* Left face */}
                      <polygon 
                        points="-20,-6 0,4 0,16 -20,6" 
                        fill={isCulprit ? "#FEE2E2" : "#F4F4F5"}
                        stroke={isCulprit ? "#DC2626" : isSelected ? "#18181B" : "#A1A1AA"}
                        strokeWidth={isSelected || isCulprit ? "2" : "1.25"}
                      />
                      {/* Right face */}
                      <polygon 
                        points="0,4 20,-6 20,6 0,16" 
                        fill={isCulprit ? "#FECACA" : "#E4E4E7"}
                        stroke={isCulprit ? "#DC2626" : isSelected ? "#18181B" : "#A1A1AA"}
                        strokeWidth={isSelected || isCulprit ? "2" : "1.25"}
                      />

                      {/* Accent Status Dot (Single stroke highlight per Rule 04) */}
                      <circle 
                        cx={0} 
                        cy={-6} 
                        r={isCulprit ? 4.5 : 3} 
                        fill={
                          isCulprit ? "#DC2626" :
                          node.status === "degrading" ? "#D97706" :
                          node.status === "standby" ? "#7C3AED" : "#059669"
                        }
                      />
                    </g>

                    {/* High-legibility HTML-like text label */}
                    <text 
                      x={0} 
                      y={-24} 
                      textAnchor="middle" 
                      className={`text-[11px] font-mono tracking-tight font-medium ${
                        isCulprit ? "fill-[#DC2626] font-bold" : isSelected ? "fill-[#18181B] font-bold" : "fill-[#52525B]"
                      }`}
                    >
                      {node.label}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Explanatory Caption Footer */}
      <div className="pt-4 border-t border-[#E4E4E7] flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#71717A] font-mono gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#DC2626]">
            <span className="h-2 w-2 rounded-full bg-[#DC2626]" />
            <span>Root Culprit</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#D97706]">
            <span className="h-2 w-2 rounded-full bg-[#D97706]" />
            <span>Cascade Path</span>
          </span>
          <span className="flex items-center gap-1.5 text-[#7C3AED]">
            <span className="h-2 w-2 rounded-full bg-[#7C3AED]" />
            <span>Standby Node</span>
          </span>
        </div>
        <div>
          <span>Hover or tilt to inspect DAG fault propagation</span>
        </div>
      </div>
    </div>
  );
};
