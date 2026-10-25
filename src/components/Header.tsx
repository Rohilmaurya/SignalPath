"use client";

import React from "react";
import { 
  Activity, 
  RotateCcw, 
  Upload, 
  Layers, 
  Cpu, 
  Sparkles, 
  UserCheck, 
  ShieldAlert,
  AlertTriangle
} from "lucide-react";
import { AnalysisResponse } from "@/lib/types";

interface HeaderProps {
  analysis: AnalysisResponse;
  viewMode: "3d" | "2d" | "list";
  setViewMode: (mode: "3d" | "2d" | "list") => void;
  audienceMode: "engineer" | "executive";
  setAudienceMode: (mode: "engineer" | "executive") => void;
  onResetSample: () => void;
  onOpenUpload: () => void;
  onLoadInsufficientSample: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  viewMode,
  setViewMode,
  audienceMode,
  setAudienceMode,
  onResetSample,
  onOpenUpload,
  onLoadInsufficientSample,
  isAnalyzing,
}) => {
  const isSample = analysis.source === "sample";
  const explanationSource = analysis.prediction.explanationSource;

  return (
    <header className="border-b border-obs-border bg-obs-surface/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand and Status */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-obs-surfaceElevated border border-obs-accent/40 flex items-center justify-center text-obs-accent shadow-[0_0_15px_rgba(56,189,248,0.2)]">
            <Activity className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono font-bold tracking-wider text-lg text-white">
                SIGNAL<span className="text-obs-accent">PATH</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obs-surfaceElevated border border-obs-border text-obs-textMuted tracking-widest uppercase">
                v1.0-sim
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-obs-accent/10 border border-obs-accent/30 text-obs-accent">
                <Sparkles className="h-3 w-3" />
                Incident Observatory
              </span>
            </div>
            <p className="text-xs text-obs-textMuted flex items-center gap-2">
              <span>Predictive failure telemetry & cascading blast radius</span>
              <span className="text-obs-textDim">•</span>
              <span className="text-[11px] text-obs-textDim italic">Simulated estimation only</span>
            </p>
          </div>
        </div>

        {/* Tactical Badges & Source Provenance */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Data Source Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obs-surfaceElevated border border-obs-border text-xs font-mono">
            <span className={`h-2 w-2 rounded-full ${isSample ? "bg-cyan-400" : "bg-emerald-400"} animate-ping`} />
            <span className="text-obs-textMuted">DATA:</span>
            <span className="text-white font-medium">{isSample ? "Sample Replay" : "Uploaded Dataset"}</span>
          </div>

          {/* AI / Fallback Provenance Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obs-surfaceElevated border border-obs-border text-xs font-mono">
            {explanationSource === "gemini" ? (
              <>
                <Sparkles className="h-3 w-3 text-amber-400" />
                <span className="text-amber-300 font-medium">Gemini 3.8 Flash (Live)</span>
              </>
            ) : explanationSource === "deterministic" ? (
              <>
                <Cpu className="h-3 w-3 text-obs-accent" />
                <span className="text-obs-accent font-medium">Deterministic Engine (Fallback)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-3 w-3 text-rose-400" />
                <span className="text-rose-300 font-medium">Forecast Withheld</span>
              </>
            )}
          </div>

          {/* Audience Mode Switcher (Engineer vs Executive) */}
          <div className="flex items-center rounded-lg bg-obs-surfaceElevated p-0.5 border border-obs-border" role="group" aria-label="Audience explanation mode">
            <button
              onClick={() => setAudienceMode("engineer")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
                audienceMode === "engineer"
                  ? "bg-obs-accent text-black font-semibold shadow-sm"
                  : "text-obs-textMuted hover:text-white"
              }`}
              title="Technical telemetry metrics, log IDs, and dependency mechanics"
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Engineer</span>
            </button>
            <button
              onClick={() => setAudienceMode("executive")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1.5 transition-colors ${
                audienceMode === "executive"
                  ? "bg-obs-accent text-black font-semibold shadow-sm"
                  : "text-obs-textMuted hover:text-white"
              }`}
              title="Operational consequences, business risk, and non-technical summary"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Executive</span>
            </button>
          </div>

          {/* View Mode Switcher (3D vs 2D vs List) */}
          <div className="flex items-center rounded-lg bg-obs-surfaceElevated p-0.5 border border-obs-border" role="group" aria-label="Observatory visualization mode">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                viewMode === "3d"
                  ? "bg-obs-accent text-black font-semibold"
                  : "text-obs-textMuted hover:text-white"
              }`}
              title="Interactive 3D WebGL Observatory Scene"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                viewMode === "2d"
                  ? "bg-obs-accent text-black font-semibold"
                  : "text-obs-textMuted hover:text-white"
              }`}
              title="2D Vector Blast Radius Graph"
            >
              <span>2D</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-2.5 py-1 text-xs font-mono rounded flex items-center gap-1 transition-colors ${
                viewMode === "list"
                  ? "bg-obs-accent text-black font-semibold"
                  : "text-obs-textMuted hover:text-white"
              }`}
              title="Accessible Tabular Service Matrix"
            >
              <span>List</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onResetSample}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded bg-obs-surfaceElevated hover:bg-obs-border border border-obs-border text-obs-text text-xs font-mono flex items-center gap-1.5 transition-colors active:scale-95 disabled:opacity-50"
              title="Reload verified sample incident replay"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isAnalyzing ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Replay Sample</span>
            </button>

            <button
              onClick={onOpenUpload}
              disabled={isAnalyzing}
              className="px-3 py-1.5 rounded bg-obs-accent hover:bg-sky-400 text-black text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors active:scale-95 shadow-[0_0_10px_rgba(56,189,248,0.3)] disabled:opacity-50"
              title="Upload custom telemetry CSV and dependency JSON"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Data</span>
            </button>

            {/* Insufficient History Demo Trigger */}
            <button
              onClick={onLoadInsufficientSample}
              disabled={isAnalyzing}
              className="px-2.5 py-1.5 rounded bg-obs-surfaceElevated hover:bg-amber-950/40 border border-amber-600/40 text-amber-300 text-xs font-mono flex items-center gap-1 transition-colors"
              title="Test insufficient temporal history handling (2 records)"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden lg:inline">Test Insufficient State</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
