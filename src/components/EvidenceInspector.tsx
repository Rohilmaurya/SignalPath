"use client";

import React, { useState } from "react";
import { EvidenceItem, ServiceAnalysis } from "@/lib/types";
import { 
  X, 
  Search, 
  FileText, 
  Activity, 
  Copy, 
  Check, 
  Filter, 
  AlertTriangle,
  Server
} from "lucide-react";

interface EvidenceInspectorProps {
  evidenceList: EvidenceItem[];
  services: ServiceAnalysis[];
  selectedServiceId: string | null;
  highlightedEvidenceId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectService: (serviceId: string | null) => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  evidenceList,
  services,
  selectedServiceId,
  highlightedEvidenceId,
  isOpen,
  onClose,
  onSelectService,
}) => {
  const [filterKind, setFilterKind] = useState<"all" | "metric" | "log">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvidence = evidenceList.filter((item) => {
    if (selectedServiceId && item.serviceId !== selectedServiceId) return false;
    if (filterKind !== "all" && item.kind !== filterKind) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.serviceId.toLowerCase().includes(q) ||
        item.label.toLowerCase().includes(q) ||
        item.value.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeService = services.find((s) => s.id === selectedServiceId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-obs-surface border border-obs-border rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-obs-border flex items-center justify-between bg-obs-surfaceElevated">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-obs-accent/10 border border-obs-accent/30 flex items-center justify-center text-obs-accent">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Grounded Telemetry & Evidence Ledger
              </h3>
              <p className="text-[11px] text-obs-textMuted">
                {selectedServiceId
                  ? `Filtered for service: ${selectedServiceId}`
                  : "All collected telemetry anomalies & severe log traces"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-obs-surface hover:bg-obs-border text-obs-textMuted hover:text-white transition-colors"
            aria-label="Close evidence inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 border-b border-obs-border/70 bg-obs-surface/80 flex flex-wrap items-center justify-between gap-2">
          {/* Service Picker */}
          <div className="flex items-center gap-2">
            <span className="text-obs-textDim text-[11px]">Service:</span>
            <select
              value={selectedServiceId || "all"}
              onChange={(e) => onSelectService(e.target.value === "all" ? null : e.target.value)}
              className="bg-obs-surfaceElevated border border-obs-border rounded px-2 py-1 text-white text-xs outline-none focus:border-obs-accent"
            >
              <option value="all">All Services ({evidenceList.length})</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.id} (Risk: {s.riskScore})
                </option>
              ))}
            </select>
          </div>

          {/* Kind Filter (All, Metrics, Logs) */}
          <div className="flex items-center gap-1 rounded bg-obs-surfaceElevated p-0.5 border border-obs-border">
            <button
              onClick={() => setFilterKind("all")}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filterKind === "all" ? "bg-obs-accent text-black font-semibold" : "text-obs-textMuted hover:text-white"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterKind("metric")}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filterKind === "metric" ? "bg-obs-accent text-black font-semibold" : "text-obs-textMuted hover:text-white"
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setFilterKind("log")}
              className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                filterKind === "log" ? "bg-obs-accent text-black font-semibold" : "text-obs-textMuted hover:text-white"
              }`}
            >
              Logs
            </button>
          </div>

          {/* Text Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-obs-textDim" />
            <input
              type="text"
              placeholder="Search evidence or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-obs-surfaceElevated border border-obs-border rounded pl-8 pr-3 py-1 text-white text-xs outline-none focus:border-obs-accent"
            />
          </div>
        </div>

        {/* Active Service Risk Factors Summary (if service selected) */}
        {activeService && (
          <div className="p-3 bg-obs-surfaceElevated/50 border-b border-obs-border text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-obs-accent" />
              <strong className="text-white">{activeService.id}</strong>
              <span className="text-obs-textDim">•</span>
              <span className="text-rose-400 font-semibold">Risk: {activeService.riskScore}/100</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {activeService.riskFactors.map((f, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-obs-surface border border-obs-border text-obs-textMuted">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Items Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12 text-obs-textMuted">
              <Filter className="h-8 w-8 mx-auto mb-2 text-obs-textDim" />
              <p>No evidence items matching current filter criteria.</p>
            </div>
          ) : (
            filteredEvidence.map((item) => {
              const isHighlighted = item.id === highlightedEvidenceId;
              const isMetric = item.kind === "metric";

              const severityBadge =
                item.severity === "fatal"
                  ? "border-rose-500 bg-rose-950/60 text-rose-300"
                  : item.severity === "error"
                  ? "border-orange-500 bg-orange-950/60 text-orange-300"
                  : item.severity === "warn"
                  ? "border-amber-500 bg-amber-950/60 text-amber-300"
                  : "border-sky-500 bg-sky-950/60 text-sky-300";

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border transition-all ${
                    isHighlighted
                      ? "bg-obs-surfaceElevated border-obs-accent ring-1 ring-obs-accent shadow-[0_0_15px_rgba(56,189,248,0.25)]"
                      : "bg-obs-surfaceElevated/50 border-obs-border hover:border-obs-borderLight"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${severityBadge}`}>
                        {item.kind} {item.severity || ""}
                      </span>

                      <span className="font-bold text-obs-accent">{item.id}</span>

                      <span className="text-[11px] text-obs-textDim">
                        svc: <strong className="text-white">{item.serviceId}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-obs-textDim">
                      <span>{new Date(item.timestamp).toISOString().split("T")[1].replace("Z", " UTC")}</span>
                      {item.sourceRow && <span>Row #{item.sourceRow}</span>}

                      <button
                        onClick={() => handleCopy(item.id)}
                        className="p-1 rounded bg-obs-surface hover:bg-obs-border text-obs-textMuted hover:text-white transition-colors"
                        title="Copy Evidence ID"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h5 className="font-semibold text-white mb-1">{item.label}</h5>
                  <p className="text-[11px] text-obs-textMuted bg-obs-surface/80 p-2 rounded border border-obs-border/50 break-words leading-relaxed">
                    {item.value}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-obs-border bg-obs-surfaceElevated flex items-center justify-between text-[11px] text-obs-textDim">
          <span>Showing {filteredEvidence.length} of {evidenceList.length} evidence items</span>
          <span>Validated against ISO UTC timestamps</span>
        </div>
      </div>
    </div>
  );
};
