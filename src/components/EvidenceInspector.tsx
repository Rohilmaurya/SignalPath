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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-[#E4E4E7] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-5 border-b border-[#E4E4E7] flex items-center justify-between bg-[#FAFAFA]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] flex items-center justify-center text-[#18181B]">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-[#18181B] text-sm font-sans">
                Grounded Telemetry & Evidence Ledger
              </h3>
              <p className="text-[11px] text-[#52525B]">
                {selectedServiceId
                  ? `Filtered for service: ${selectedServiceId}`
                  : "All collected telemetry anomalies & severe log traces"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white hover:bg-zinc-100 text-[#52525B] hover:text-[#18181B] border border-[#E4E4E7] transition-colors"
            aria-label="Close evidence inspector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-[#E4E4E7] bg-white flex flex-wrap items-center justify-between gap-3">
          {/* Service Picker */}
          <div className="flex items-center gap-2">
            <span className="text-[#71717A] text-[11px]">Service:</span>
            <select
              value={selectedServiceId || "all"}
              onChange={(e) => onSelectService(e.target.value === "all" ? null : e.target.value)}
              className="bg-[#FAFAFA] border border-[#E4E4E7] rounded-full px-3 py-1 text-[#18181B] text-xs outline-none focus:border-[#18181B]"
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
          <div className="flex items-center gap-1 rounded-full bg-[#F4F4F5] p-1 border border-[#E4E4E7]">
            <button
              onClick={() => setFilterKind("all")}
              className={`px-3 py-0.5 rounded-full text-[11px] transition-all ${
                filterKind === "all" ? "bg-[#18181B] text-white font-medium" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterKind("metric")}
              className={`px-3 py-0.5 rounded-full text-[11px] transition-all ${
                filterKind === "metric" ? "bg-[#18181B] text-white font-medium" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              Metrics
            </button>
            <button
              onClick={() => setFilterKind("log")}
              className={`px-3 py-0.5 rounded-full text-[11px] transition-all ${
                filterKind === "log" ? "bg-[#18181B] text-white font-medium" : "text-[#52525B] hover:text-[#18181B]"
              }`}
            >
              Logs
            </button>
          </div>

          {/* Text Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-2 h-3.5 w-3.5 text-[#71717A]" />
            <input
              type="text"
              placeholder="Search evidence or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAFAFA] border border-[#E4E4E7] rounded-full pl-8 pr-3 py-1 text-[#18181B] text-xs outline-none focus:border-[#18181B]"
            />
          </div>
        </div>

        {/* Active Service Risk Factors Summary (if service selected) */}
        {activeService && (
          <div className="p-3 bg-[#FAFAFA] border-b border-[#E4E4E7] text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Server className="h-3.5 w-3.5 text-[#18181B]" />
              <strong className="text-[#18181B]">{activeService.id}</strong>
              <span className="text-[#71717A]">•</span>
              <span className="text-rose-700 font-bold">Risk: {activeService.riskScore}/100</span>
            </div>
            <div className="flex flex-wrap gap-1 text-[10px]">
              {activeService.riskFactors.map((f, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-[#E4E4E7] text-[#52525B]">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Evidence Items Scrollable List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-[#FAFAFA]">
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12 text-[#52525B]">
              <Filter className="h-8 w-8 mx-auto mb-2 text-[#71717A]" />
              <p>No evidence items matching current filter criteria.</p>
            </div>
          ) : (
            filteredEvidence.map((item) => {
              const isHighlighted = item.id === highlightedEvidenceId;
              const isMetric = item.kind === "metric";

              const severityBadge =
                item.severity === "fatal"
                  ? "border-rose-200 bg-rose-50 text-rose-700"
                  : item.severity === "error"
                  ? "border-orange-200 bg-orange-50 text-orange-700"
                  : item.severity === "warn"
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-sky-200 bg-sky-50 text-sky-700";

              return (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isHighlighted
                      ? "bg-white border-[#18181B] ring-2 ring-[#18181B] shadow-md"
                      : "bg-white border-[#E4E4E7] hover:border-zinc-400 shadow-sm"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase font-bold ${severityBadge}`}>
                        {item.kind} {item.severity || ""}
                      </span>

                      <span className="font-bold text-[#18181B]">{item.id}</span>

                      <span className="text-[11px] text-[#71717A]">
                        svc: <strong className="text-[#18181B]">{item.serviceId}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-[#71717A]">
                      <span>{new Date(item.timestamp).toISOString().split("T")[1].replace("Z", " UTC")}</span>
                      {item.sourceRow && <span>Row #{item.sourceRow}</span>}

                      <button
                        onClick={() => handleCopy(item.id)}
                        className="p-1.5 rounded-full bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#52525B] hover:text-[#18181B] transition-colors"
                        title="Copy Evidence ID"
                      >
                        {copiedId === item.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  <h5 className="font-semibold text-[#18181B] mb-1 font-sans">{item.label}</h5>
                  <p className="text-[11px] text-[#52525B] bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7] break-words leading-relaxed font-mono">
                    {item.value}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E4E4E7] bg-white flex items-center justify-between text-[11px] text-[#71717A]">
          <span>Showing {filteredEvidence.length} of {evidenceList.length} evidence items</span>
          <span>Validated against ISO UTC timestamps</span>
        </div>
      </div>
    </div>
  );
};
