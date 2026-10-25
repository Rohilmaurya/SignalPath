"use client";

import React, { useState, useRef } from "react";
import { 
  Upload, 
  FileText, 
  FileJson, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldAlert,
  Database
} from "lucide-react";
import { AnalysisErrorIssue } from "@/lib/types";
import { ThinkingOrbs } from "@/components/ThinkingOrbs";

interface UploadWorkspaceProps {
  onAnalyze: (telemetryFile: File, dependenciesFile: File) => Promise<void>;
  isAnalyzing: boolean;
  validationError: {
    message: string;
    issues?: AnalysisErrorIssue[];
  } | null;
  onClearError: () => void;
}

export const UploadWorkspace: React.FC<UploadWorkspaceProps> = ({
  onAnalyze,
  isAnalyzing,
  validationError,
  onClearError,
}) => {
  const [telemetryFile, setTelemetryFile] = useState<File | null>(null);
  const [dependenciesFile, setDependenciesFile] = useState<File | null>(null);
  const [isDraggingTelemetry, setIsDraggingTelemetry] = useState(false);
  const [isDraggingDeps, setIsDraggingDeps] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);

  const telemetryInputRef = useRef<HTMLInputElement>(null);
  const depsInputRef = useRef<HTMLInputElement>(null);

  const handleTelemetrySelect = (file: File) => {
    onClearError();
    if (file.name.endsWith(".csv")) {
      setTelemetryFile(file);
    } else {
      alert("Please upload a .csv file for telemetry.");
    }
  };

  const handleDepsSelect = (file: File) => {
    onClearError();
    if (file.name.endsWith(".json")) {
      setDependenciesFile(file);
    } else {
      alert("Please upload a .json file for dependencies.");
    }
  };

  const handleLoadDemoTemplate = async () => {
    setIsLoadingDemo(true);
    onClearError();
    try {
      const [csvRes, jsonRes] = await Promise.all([
        fetch("/sample-telemetry.csv"),
        fetch("/sample-dependencies.json"),
      ]);

      if (csvRes.ok && jsonRes.ok) {
        const csvBlob = await csvRes.blob();
        const jsonBlob = await jsonRes.blob();

        const csvFile = new File([csvBlob], "sample-telemetry.csv", { type: "text/csv" });
        const jsonFile = new File([jsonBlob], "sample-dependencies.json", { type: "application/json" });

        setTelemetryFile(csvFile);
        setDependenciesFile(jsonFile);
      }
    } catch (err) {
      console.error("Failed to load demo template:", err);
    } finally {
      setIsLoadingDemo(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telemetryFile || !dependenciesFile || isAnalyzing) return;
    await onAnalyze(telemetryFile, dependenciesFile);
  };

  if (isAnalyzing) {
    return (
      <section id="upload" className="max-w-4xl mx-auto w-full py-16 px-4 sm:px-6">
        <ThinkingOrbs />
      </section>
    );
  }

  return (
    <section id="upload" className="max-w-4xl mx-auto w-full py-16 px-4 sm:px-6">
      <div className="bg-white border border-[#E4E4E7] rounded-3xl p-8 sm:p-12 shadow-sm space-y-8">
        {/* Header */}
        <div className="space-y-3 text-center max-w-2xl mx-auto border-b border-[#E4E4E7] pb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] text-[11px] font-mono tracking-widest uppercase shadow-sm">
            <Database className="h-3.5 w-3.5 text-[#18181B]" />
            <span>Analysis Workspace • Zero Ingestion Latency</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight font-sans">
            Ingest Telemetry Logs & Dependency DAG
          </h2>
          <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
            Upload multi-service telemetry time series and a directed service dependency graph. SignalPath parses raw signals in-memory, executes statistical drift analysis, evaluates cycle-safe cascade paths, and synthesizes grounded recovery tradeoffs.
          </p>
        </div>

        {/* Validation Error Alert */}
        {validationError && (
          <div className="p-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#991B1B] text-xs space-y-2">
            <div className="flex items-center justify-between font-semibold text-[#DC2626]">
              <span className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>Upload Validation Error: {validationError.message}</span>
              </span>
              <button
                onClick={onClearError}
                className="text-[#DC2626] hover:text-[#991B1B] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {validationError.issues && validationError.issues.length > 0 && (
              <ul className="list-disc list-inside space-y-1 font-mono text-[11px] text-[#B91C1C] pl-2">
                {validationError.issues.map((iss, idx) => (
                  <li key={idx}>
                    {iss.field ? `[${iss.field}] ` : ""}
                    {iss.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Telemetry CSV Dropzone */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5 font-sans">
                  <FileText className="h-4 w-4 text-[#18181B]" />
                  <span>1. Telemetry CSV</span>
                </label>
                <span className="text-[11px] font-mono text-[#71717A]">Required (Max 5MB)</span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingTelemetry(true);
                }}
                onDragLeave={() => setIsDraggingTelemetry(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingTelemetry(false);
                  if (e.dataTransfer.files[0]) handleTelemetrySelect(e.dataTransfer.files[0]);
                }}
                onClick={() => telemetryInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingTelemetry
                    ? "border-[#18181B] bg-[#F4F4F5]"
                    : telemetryFile
                    ? "border-[#059669] bg-[#F0FDF4]"
                    : "border-[#E4E4E7] hover:border-[#A1A1AA] bg-[#FAFAFA]"
                }`}
              >
                <input
                  ref={telemetryInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleTelemetrySelect(e.target.files[0]);
                  }}
                />

                {telemetryFile ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-[#059669]" />
                    <div>
                      <p className="text-xs font-semibold text-[#18181B] truncate max-w-[220px]">
                        {telemetryFile.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#71717A]">
                        {(telemetryFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTelemetryFile(null);
                      }}
                      className="text-[11px] text-[#DC2626] hover:underline font-mono"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="h-10 w-10 rounded-full bg-white border border-[#E4E4E7] flex items-center justify-center text-[#71717A] shadow-sm">
                      <Upload className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-[#18181B] font-medium">
                      Drop telemetry <code className="text-[#18181B] font-mono bg-white px-1 py-0.5 rounded border border-[#E4E4E7]">.csv</code> here or browse
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A]">
                      Headers: timestamp, service, level, message
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Dependencies JSON Dropzone */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <label className="font-semibold text-[#18181B] flex items-center gap-1.5 font-sans">
                  <FileJson className="h-4 w-4 text-[#18181B]" />
                  <span>2. Dependencies JSON</span>
                </label>
                <span className="text-[11px] font-mono text-[#71717A]">Required (Max 1MB)</span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingDeps(true);
                }}
                onDragLeave={() => setIsDraggingDeps(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingDeps(false);
                  if (e.dataTransfer.files[0]) handleDepsSelect(e.dataTransfer.files[0]);
                }}
                onClick={() => depsInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDraggingDeps
                    ? "border-[#18181B] bg-[#F4F4F5]"
                    : dependenciesFile
                    ? "border-[#059669] bg-[#F0FDF4]"
                    : "border-[#E4E4E7] hover:border-[#A1A1AA] bg-[#FAFAFA]"
                }`}
              >
                <input
                  ref={depsInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleDepsSelect(e.target.files[0]);
                  }}
                />

                {dependenciesFile ? (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <CheckCircle2 className="h-8 w-8 text-[#059669]" />
                    <div>
                      <p className="text-xs font-semibold text-[#18181B] truncate max-w-[220px]">
                        {dependenciesFile.name}
                      </p>
                      <p className="text-[11px] font-mono text-[#71717A]">
                        {(dependenciesFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDependenciesFile(null);
                      }}
                      className="text-[11px] text-[#DC2626] hover:underline font-mono"
                    >
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2.5">
                    <div className="h-10 w-10 rounded-full bg-white border border-[#E4E4E7] flex items-center justify-center text-[#71717A] shadow-sm">
                      <Upload className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-[#18181B] font-medium">
                      Drop topology <code className="text-[#18181B] font-mono bg-white px-1 py-0.5 rounded border border-[#E4E4E7]">.json</code> here or browse
                    </p>
                    <p className="text-[11px] font-mono text-[#71717A]">
                      Shape: {`{ services: [...], dependencies: [...] }`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#E4E4E7]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadDemoTemplate}
                disabled={isLoadingDemo || isAnalyzing}
                className="text-xs font-mono text-[#52525B] hover:text-[#18181B] underline underline-offset-4 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Sparkles className="h-3 w-3 text-[#FC4778]" />
                <span>{isLoadingDemo ? "Loading demo files..." : "Load demo template files"}</span>
              </button>
              <span className="text-[11px] text-[#A1A1AA] font-mono">(Opt-in template only)</span>
            </div>

            <button
              type="submit"
              disabled={!telemetryFile || !dependenciesFile || isAnalyzing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-medium text-sm bg-[#18181B] text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
            >
              <span>Execute Causal Analysis</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>

        {/* Operational Guardrails */}
        <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-[11px] font-mono text-[#71717A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-[#18181B] shrink-0" />
            <span>
              Evaluated strictly in-memory for this run. Zero persistent data retention, telemetry leaks, or external polling.
            </span>
          </div>
          <span className="text-[#A1A1AA] shrink-0 font-medium">Server Runtime Validation</span>
        </div>
      </div>
    </section>
  );
};
