"use client";

import React from "react";
import { 
  Activity, 
  RotateCcw, 
  Sparkles, 
  Cpu, 
  ArrowRight,
  BookOpen
} from "lucide-react";
import { AnalysisResponse } from "@/lib/types";

interface HeaderProps {
  analysis: AnalysisResponse | null;
  onNewAnalysis: () => void;
  isAnalyzing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  analysis,
  onNewAnalysis,
  isAnalyzing,
}) => {
  const explanationSource = analysis?.prediction.explanationSource;

  return (
    <header className="border-b border-[#E4E4E7] bg-white/85 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 py-3.5 transition-all">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <div className="h-8 w-8 rounded-xl bg-[#18181B] flex items-center justify-center text-white shadow-sm">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#18181B] tracking-tight text-sm font-sans">
                  SignalPath
                </span>
                <span className="text-[11px] text-[#A1A1AA]">/</span>
                <span className="text-xs text-[#71717A] font-normal hidden sm:inline font-sans">
                  Incident Observatory
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] uppercase">
                  sim
                </span>
              </div>
            </div>
          </a>
        </div>

        {/* Navigation & Actions */}
        <div className="flex items-center gap-3">
          {analysis ? (
            <>
              {/* Active Analysis Status */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-xs text-[#52525B] font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-[#059669]" />
                <span>Uploaded Run Active</span>
              </div>

              {/* AI / Heuristic badge */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E4E4E7] text-xs text-[#18181B] shadow-sm">
                {explanationSource === "gemini" ? (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-[#FC4778]" />
                    <span className="font-medium text-[#18181B]">Gemini 3.8 Flash</span>
                  </>
                ) : (
                  <>
                    <Cpu className="h-3.5 w-3.5 text-[#0284C7]" />
                    <span className="font-medium text-[#52525B]">Deterministic Fallback</span>
                  </>
                )}
              </div>

              {/* Action: New Analysis */}
              <button
                onClick={onNewAnalysis}
                className="px-4 py-2 rounded-full bg-[#18181B] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black transition-all shadow-sm active:scale-95"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Analysis</span>
              </button>
            </>
          ) : (
            <>
              <a
                href="#signals"
                className="text-xs text-[#52525B] hover:text-[#18181B] px-3 py-1.5 rounded-full hover:bg-[#F4F4F5] transition-colors hidden sm:flex items-center gap-1.5 font-medium"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Story</span>
              </a>

              <a
                href="#upload"
                className="px-5 py-2 rounded-full bg-[#18181B] text-white text-xs font-medium flex items-center gap-1.5 hover:bg-black transition-all shadow-sm active:scale-95"
              >
                <span>Upload Telemetry</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
