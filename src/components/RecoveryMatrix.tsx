"use client";

import React from "react";
import { RecoveryScenario } from "@/lib/types";
import { 
  GitMerge, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Sliders, 
  CheckCircle,
  TrendingDown
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
      <div className="bg-obs-surface/80 border border-obs-border rounded-xl p-5 shadow-xl text-xs font-mono text-obs-textMuted">
        <h3 className="text-sm font-mono font-bold text-white mb-2 flex items-center gap-2">
          <GitMerge className="h-4 w-4 text-emerald-400" />
          Simulated Recovery Scenarios
        </h3>
        <p>Recovery simulations withheld due to insufficient incident forecast data.</p>
      </div>
    );
  }

  return (
    <div className="bg-obs-surface/80 border border-obs-border rounded-xl p-5 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-obs-border pb-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <GitMerge className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-mono font-bold text-white tracking-wide">
              Simulated Recovery Tradeoff Matrix
            </h3>
            <p className="text-[11px] text-obs-textDim">
              Ranked deterministically: Lowest Residual Risk → Shortest Recovery Horizon
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeScenarioId && (
            <button
              onClick={onResetScenario}
              className="text-xs font-mono px-2 py-0.5 rounded bg-obs-surfaceElevated hover:bg-obs-border border border-obs-border text-obs-accent flex items-center gap-1 transition-colors"
            >
              <span>Reset Simulation</span>
            </button>
          )}

          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obs-surfaceElevated border border-obs-border text-obs-textMuted uppercase flex items-center gap-1">
            <Sliders className="h-3 w-3 text-obs-accent" />
            4 Scenarios Evaluated
          </span>
        </div>
      </div>

      {/* Safety Notice per PRD/TRD/Codex review */}
      <div className="mb-4 p-2.5 rounded-lg bg-amber-950/30 border border-amber-600/30 flex items-start gap-2 text-[11px] font-mono text-amber-200/90">
        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold">Simulated Operational Estimates:</strong>{" "}
          All values are rule-based model forecasts for decision support. SignalPath does not execute infrastructure remediation commands.
        </div>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {scenarios.map((scenario) => {
          const isSelected = scenario.id === activeScenarioId;
          const isBaseline = scenario.id === "do-nothing";

          const riskBadgeColor =
            scenario.remainingSystemRisk >= 70
              ? "text-rose-400 bg-rose-500/10 border-rose-500/40"
              : scenario.remainingSystemRisk >= 40
              ? "text-amber-400 bg-amber-500/10 border-amber-500/40"
              : "text-emerald-400 bg-emerald-500/10 border-emerald-500/40";

          return (
            <div
              key={scenario.id}
              onClick={() => onSelectScenario(scenario)}
              className={`rounded-lg border p-3.5 flex flex-col justify-between transition-all cursor-pointer text-xs font-mono relative overflow-hidden ${
                isSelected
                  ? "bg-obs-surfaceElevated border-obs-accent shadow-[0_0_20px_rgba(56,189,248,0.2)] ring-1 ring-obs-accent"
                  : "bg-obs-surfaceElevated/60 border-obs-border/70 hover:border-obs-borderLight hover:bg-obs-surfaceElevated"
              }`}
            >
              {/* Rank Badge */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                    isBaseline
                      ? "bg-obs-surface border-obs-border text-obs-textMuted"
                      : scenario.rank === 1
                      ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-300"
                      : "bg-obs-surface border-obs-border text-obs-textMuted"
                  }`}
                >
                  {isBaseline ? "Baseline" : `Rank #${scenario.rank} Recommended`}
                </span>

                {isSelected && (
                  <span className="text-[10px] text-obs-accent flex items-center gap-1 font-semibold">
                    <CheckCircle className="h-3 w-3" />
                    Previewing
                  </span>
                )}
              </div>

              {/* Scenario Title */}
              <h4 className="font-bold text-white text-xs mb-2 leading-snug">
                {scenario.label}
              </h4>

              <p className="text-[11px] text-obs-textMuted mb-3 leading-relaxed">
                {scenario.description}
              </p>

              {/* Residual Metrics */}
              <div className="space-y-1.5 py-2 border-y border-obs-border/50 my-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-obs-textDim uppercase flex items-center gap-1">
                    <TrendingDown className="h-3 w-3" />
                    Residual Risk:
                  </span>
                  <span className={`text-xs font-bold px-1.5 py-0.2 rounded border ${riskBadgeColor}`}>
                    {scenario.remainingSystemRisk} / 100
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-obs-textDim uppercase flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Recovery Horizon:
                  </span>
                  <span className="text-white font-semibold">
                    ~{scenario.recoveryMinutes} min
                  </span>
                </div>
              </div>

              {/* Operational Tradeoffs */}
              <div className="pt-1 text-[10px] text-obs-textDim">
                <strong className="text-obs-textMuted">Tradeoff:</strong> {scenario.tradeoffs}
              </div>

              {/* Action Preview Button */}
              <button
                className={`mt-3 w-full py-1 rounded text-[11px] font-semibold border transition-colors ${
                  isSelected
                    ? "bg-obs-accent text-black border-obs-accent"
                    : "bg-obs-surface border-obs-border text-obs-text hover:bg-obs-border"
                }`}
              >
                {isSelected ? "Simulating in 3D" : "Simulate Impact"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
