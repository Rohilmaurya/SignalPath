"use client";

import React from "react";
import { RecoveryScenario } from "@/lib/types";
import { 
  GitMerge, 
  Clock, 
  CheckCircle,
  TrendingDown,
  Sparkles,
  RotateCcw,
  AlertCircle
} from "lucide-react";

interface RecoveryMatrixProps {
  scenarios: RecoveryScenario[];
  activeScenarioId: string | null;
  onSelectScenario: (scenario: RecoveryScenario) => void;
  onResetScenario: () => void;
}

export const RecoveryMatrix: React.FC<RecoveryMatrixProps> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onResetScenario,
}) => {
  if (scenarios.length === 0) {
    return (
      <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm text-xs text-[#52525B]">
        <h3 className="text-sm font-semibold text-[#18181B] mb-2 flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-[#059669]" />
          <span>Simulated Recovery Scenarios</span>
        </h3>
        <p>Recovery simulations withheld due to insufficient incident forecast data.</p>
      </div>
    );
  }

  const recommendedScenario = scenarios.find((s) => s.rank === 1) || scenarios[0];
  const baselineScenario = scenarios.find((s) => s.id === "do-nothing") || scenarios[scenarios.length - 1];
  const alternativeScenarios = scenarios.filter(
    (s) => s.id !== recommendedScenario.id && s.id !== baselineScenario.id
  );

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-7 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4E4E7] pb-4">
        <div>
          <h3 className="text-sm font-semibold text-[#18181B] tracking-tight flex items-center gap-2">
            <GitMerge className="h-4 w-4 text-[#059669]" />
            <span>Simulated Recovery Strategy Comparison</span>
          </h3>
          <p className="text-xs text-[#52525B] mt-0.5 font-mono">
            Ranked deterministically: Lowest Residual Risk → Shortest Recovery Horizon
          </p>
        </div>

        {activeScenarioId && (
          <button
            onClick={onResetScenario}
            className="text-xs px-3.5 py-1.5 rounded-full bg-white hover:bg-zinc-100 border border-[#E4E4E7] text-[#18181B] flex items-center gap-1.5 transition-colors font-medium shadow-sm"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset 3D Preview</span>
          </button>
        )}
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-950 font-medium">Simulated Operational Estimates:</strong>{" "}
          All values are model forecasts for decision support. SignalPath does not execute infrastructure remediation commands.
        </div>
      </div>

      {/* Primary Comparison Spotlight: Recommended vs Baseline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recommended Strategy Spotlight */}
        <div
          onClick={() => onSelectScenario(recommendedScenario)}
          className={`rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeScenarioId === recommendedScenario.id
              ? "bg-emerald-50/50 border-emerald-500 shadow-md ring-2 ring-emerald-500"
              : "bg-[#FAFAFA] border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/20"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Recommended Strategy (Rank #1)
              </span>

              {activeScenarioId === recommendedScenario.id && (
                <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Simulating
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-[#18181B] mb-1.5">
              {recommendedScenario.label}
            </h4>

            <p className="text-xs text-[#52525B] mb-3 leading-relaxed">
              {recommendedScenario.description}
            </p>
          </div>

          <div>
            {/* Aligned metrics */}
            <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#E4E4E7] my-2 text-xs font-mono">
              <div>
                <span className="text-[#71717A] text-[11px] block">Residual Risk:</span>
                <span className="text-sm font-bold text-[#059669]">
                  {recommendedScenario.remainingSystemRisk} / 100
                </span>
              </div>
              <div>
                <span className="text-[#71717A] text-[11px] block">Recovery Horizon:</span>
                <span className="text-sm font-semibold text-[#18181B]">
                  ~{recommendedScenario.recoveryMinutes} min
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#71717A] mb-3">
              <strong className="text-[#52525B]">Tradeoff:</strong> {recommendedScenario.tradeoffs}
            </p>

            <button
              className={`w-full py-2 rounded-full text-xs font-semibold border transition-all ${
                activeScenarioId === recommendedScenario.id
                  ? "bg-[#059669] text-white border-[#059669] shadow-sm"
                  : "bg-[#18181B] border-[#18181B] text-white hover:bg-zinc-800 shadow-sm"
              }`}
            >
              {activeScenarioId === recommendedScenario.id ? "Previewing in Topology" : "Simulate in 3D Scene"}
            </button>
          </div>
        </div>

        {/* Do-Nothing Baseline Spotlight */}
        <div
          onClick={() => onSelectScenario(baselineScenario)}
          className={`rounded-2xl border p-5 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            activeScenarioId === baselineScenario.id
              ? "bg-rose-50/50 border-rose-500 shadow-md ring-2 ring-rose-500"
              : "bg-[#FAFAFA] border-[#E4E4E7] hover:border-zinc-300"
          }`}
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-zinc-200/80 border border-zinc-300 text-[#52525B]">
                Do-Nothing Baseline
              </span>

              {activeScenarioId === baselineScenario.id && (
                <span className="text-[11px] text-rose-700 flex items-center gap-1 font-semibold">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Simulating
                </span>
              )}
            </div>

            <h4 className="text-base font-bold text-[#18181B] mb-1.5">
              {baselineScenario.label}
            </h4>

            <p className="text-xs text-[#52525B] mb-3 leading-relaxed">
              {baselineScenario.description}
            </p>
          </div>

          <div>
            <div className="grid grid-cols-2 gap-2 py-2.5 border-y border-[#E4E4E7] my-2 text-xs font-mono">
              <div>
                <span className="text-[#71717A] text-[11px] block">Unmitigated Risk:</span>
                <span className="text-sm font-bold text-[#DC2626]">
                  {baselineScenario.remainingSystemRisk} / 100
                </span>
              </div>
              <div>
                <span className="text-[#71717A] text-[11px] block">Degradation Horizon:</span>
                <span className="text-sm font-semibold text-[#18181B]">
                  ~{baselineScenario.recoveryMinutes} min
                </span>
              </div>
            </div>

            <p className="text-[11px] text-[#71717A] mb-3">
              <strong className="text-[#52525B]">Tradeoff:</strong> {baselineScenario.tradeoffs}
            </p>

            <button
              className={`w-full py-2 rounded-full text-xs font-semibold border transition-all ${
                activeScenarioId === baselineScenario.id
                  ? "bg-[#DC2626] text-white border-[#DC2626] shadow-sm"
                  : "bg-white border-[#E4E4E7] text-[#18181B] hover:bg-zinc-100 shadow-sm"
              }`}
            >
              {activeScenarioId === baselineScenario.id ? "Previewing in Topology" : "Simulate Baseline Impact"}
            </button>
          </div>
        </div>
      </div>

      {/* Alternative Strategies Compact Comparison Table */}
      {alternativeScenarios.length > 0 && (
        <div className="pt-2">
          <span className="text-xs font-semibold text-[#52525B] uppercase font-mono tracking-wider block mb-2.5">
            Alternative Simulated Strategies ({alternativeScenarios.length})
          </span>

          <div className="overflow-x-auto rounded-2xl border border-[#E4E4E7] shadow-sm">
            <table className="w-full text-left text-xs border-collapse" role="table">
              <thead>
                <tr className="border-b border-[#E4E4E7] bg-[#F4F4F5] text-[#71717A] text-[11px] uppercase tracking-wider font-mono">
                  <th className="py-2.5 px-4">Option</th>
                  <th className="py-2.5 px-4">Residual Risk</th>
                  <th className="py-2.5 px-4">Recovery Time</th>
                  <th className="py-2.5 px-4">Operational Tradeoff</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] bg-white">
                {alternativeScenarios.map((alt) => {
                  const isAltActive = activeScenarioId === alt.id;
                  return (
                    <tr
                      key={alt.id}
                      onClick={() => onSelectScenario(alt)}
                      className={`hover:bg-zinc-50 transition-colors cursor-pointer ${
                        isAltActive ? "bg-emerald-50/40 border-l-4 border-l-[#059669]" : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-semibold text-[#18181B]">
                        <div className="flex items-center gap-1.5">
                          <span>{alt.label}</span>
                          <span className="text-[10px] text-[#71717A] font-mono">#{alt.rank}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <span className="text-amber-700 font-bold">{alt.remainingSystemRisk} / 100</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#18181B] font-medium">
                        ~{alt.recoveryMinutes} min
                      </td>
                      <td className="py-3 px-4 text-[#52525B] text-[11px]">
                        {alt.tradeoffs}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectScenario(alt);
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            isAltActive
                              ? "bg-[#18181B] text-white border-[#18181B]"
                              : "bg-white border-[#E4E4E7] text-[#18181B] hover:bg-zinc-100"
                          }`}
                        >
                          {isAltActive ? "Simulating" : "Simulate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
