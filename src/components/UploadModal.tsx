"use client";

import React, { useState, useRef } from "react";
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  FileCode, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Info
} from "lucide-react";
import { AnalysisErrorIssue, AnalysisResponse } from "@/lib/types";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisSuccess: (response: AnalysisResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onAnalysisSuccess,
}) => {
  const [telemetryFile, setTelemetryFile] = useState<File | null>(null);
  const [dependenciesFile, setDependenciesFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [issues, setIssues] = useState<AnalysisErrorIssue[]>([]);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleCsvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".csv")) {
        setErrorMessage("Telemetry file must be a .csv file");
        return;
      }
      setTelemetryFile(file);
      setErrorMessage(null);
      setIssues([]);
    }
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith(".json")) {
        setErrorMessage("Dependencies file must be a .json file");
        return;
      }
      setDependenciesFile(file);
      setErrorMessage(null);
      setIssues([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telemetryFile) {
      setErrorMessage("Please select a telemetry CSV file");
      return;
    }
    if (!dependenciesFile) {
      setErrorMessage("Please select a dependencies JSON file");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setIssues([]);

    try {
      const formData = new FormData();
      formData.append("telemetry", telemetryFile);
      formData.append("dependencies", dependenciesFile);
      formData.append("source", "upload");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.status === "error") {
        setErrorMessage(data.error?.message || "Analysis request failed.");
        setIssues(data.error?.issues || []);
        setIsSubmitting(false);
        return;
      }

      // Success
      setIsSubmitting(false);
      onAnalysisSuccess(data as AnalysisResponse);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err instanceof Error ? err.message : "Network error during analysis upload");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-obs-surface border border-obs-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-obs-border flex items-center justify-between bg-obs-surfaceElevated">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded bg-obs-accent/10 border border-obs-accent/30 flex items-center justify-center text-obs-accent">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">
                Upload Telemetry & Dependency Topology
              </h3>
              <p className="text-[11px] text-obs-textMuted">
                Ingest custom server logs and directed dependency graphs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-obs-surface hover:bg-obs-border text-obs-textMuted hover:text-white transition-colors"
            aria-label="Close upload modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* CSV File Upload Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-obs-textMuted uppercase font-bold flex items-center justify-between">
              <span>1. Telemetry Time-Series (CSV)</span>
              <span className="text-[10px] text-obs-textDim lowercase">required: timestamp, service, level, message</span>
            </label>

            <div
              onClick={() => csvInputRef.current?.click()}
              className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
                telemetryFile
                  ? "border-emerald-500/60 bg-emerald-950/20"
                  : "border-obs-border hover:border-obs-accent/60 bg-obs-surfaceElevated/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileSpreadsheet className={`h-6 w-6 ${telemetryFile ? "text-emerald-400" : "text-obs-accent"}`} />
                <div>
                  <div className="font-semibold text-white">
                    {telemetryFile ? telemetryFile.name : "Select or Drop Telemetry CSV"}
                  </div>
                  <div className="text-[10px] text-obs-textDim">
                    {telemetryFile
                      ? `${(telemetryFile.size / 1024).toFixed(1)} KB`
                      : "Optional metrics: latency_ms, error_rate, cpu_pct (Max 5MB)"}
                  </div>
                </div>
              </div>

              {telemetryFile && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
            </div>

            <input
              ref={csvInputRef}
              type="file"
              accept=".csv"
              onChange={handleCsvChange}
              className="hidden"
            />
          </div>

          {/* JSON File Upload Box */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-obs-textMuted uppercase font-bold flex items-center justify-between">
              <span>2. Dependency Graph (JSON)</span>
              <span className="text-[10px] text-obs-textDim lowercase">format: &#123; services: [], dependencies: [] &#125;</span>
            </label>

            <div
              onClick={() => jsonInputRef.current?.click()}
              className={`p-4 rounded-lg border-2 border-dashed transition-all cursor-pointer flex items-center justify-between gap-3 ${
                dependenciesFile
                  ? "border-emerald-500/60 bg-emerald-950/20"
                  : "border-obs-border hover:border-obs-accent/60 bg-obs-surfaceElevated/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCode className={`h-6 w-6 ${dependenciesFile ? "text-emerald-400" : "text-obs-accent"}`} />
                <div>
                  <div className="font-semibold text-white">
                    {dependenciesFile ? dependenciesFile.name : "Select or Drop Dependencies JSON"}
                  </div>
                  <div className="text-[10px] text-obs-textDim">
                    {dependenciesFile
                      ? `${(dependenciesFile.size / 1024).toFixed(1)} KB`
                      : "Directed edges: from depends on to (Max 1MB)"}
                  </div>
                </div>
              </div>

              {dependenciesFile && <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />}
            </div>

            <input
              ref={jsonInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonChange}
              className="hidden"
            />
          </div>

          {/* Error & Issues Feedback */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-600/50 text-rose-300 space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="font-semibold">{errorMessage}</span>
              </div>

              {issues.length > 0 && (
                <div className="pl-6 space-y-1 text-[11px] text-rose-200/90">
                  {issues.map((iss, i) => (
                    <div key={i}>
                      • {iss.field ? `[${iss.field}] ` : ""}
                      {iss.row ? `Row ${iss.row}: ` : ""}
                      {iss.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Guidance note */}
          <div className="p-2.5 rounded bg-obs-surfaceElevated/70 border border-obs-border text-[11px] text-obs-textMuted flex items-center gap-2">
            <Info className="h-4 w-4 text-obs-accent shrink-0" />
            <span>Files are normalized in server memory. No records or credentials are persisted.</span>
          </div>

          {/* Submit Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded bg-obs-surfaceElevated hover:bg-obs-border border border-obs-border text-obs-text text-xs transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !telemetryFile || !dependenciesFile}
              className="px-4 py-2 rounded bg-obs-accent hover:bg-sky-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.3)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Analyzing Dataset...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Execute Analysis</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
