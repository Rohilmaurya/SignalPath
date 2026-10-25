"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { SystemOverview } from "@/components/SystemOverview";
import { ObservatoryScene } from "@/components/ObservatoryScene";
import { Dependency2DGraph } from "@/components/Dependency2DGraph";
import { DependencyListView } from "@/components/DependencyListView";
import { PredictionPanel } from "@/components/PredictionPanel";
import { CascadePanel } from "@/components/CascadePanel";
import { RecoveryMatrix } from "@/components/RecoveryMatrix";
import { EvidenceInspector } from "@/components/EvidenceInspector";
import { UploadModal } from "@/components/UploadModal";
import { InsufficientDataState } from "@/components/InsufficientDataState";
import { getInitialSampleAnalysis, SAMPLE_DEPENDENCIES_DATA } from "@/lib/sample-data";
import { parseAndNormalizeTelemetry } from "@/lib/telemetry-parser";
import { analyzeIncident } from "@/lib/risk-engine";
import { AnalysisResponse, RecoveryScenario } from "@/lib/types";
import { Info, Sparkles, Activity, FileSpreadsheet } from "lucide-react";

export default function SignalPathDashboard() {
  const [analysis, setAnalysis] = useState<AnalysisResponse>(() => getInitialSampleAnalysis());
  const [viewMode, setViewMode] = useState<"3d" | "2d" | "list">("3d");
  const [audienceMode, setAudienceMode] = useState<"engineer" | "executive">("engineer");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeScenario, setActiveScenario] = useState<RecoveryScenario | null>(null);

  // Compute preview residual risk map when a recovery scenario is selected
  const previewResidualRisk = useMemo(() => {
    if (!activeScenario) return null;
    const map: Record<string, number> = {};

    analysis.services.forEach((s) => {
      if (activeScenario.id === "do-nothing") {
        // Baseline: keep current or worse
        map[s.id] = s.riskScore;
      } else if (activeScenario.affectedServices.includes(s.id) || s.id === analysis.prediction.serviceId) {
        // Target service risk drops to scenario's remaining risk
        map[s.id] = activeScenario.remainingSystemRisk;
      } else if (analysis.cascade.affectedServiceIds.includes(s.id)) {
        // Cascading services recover proportionally
        map[s.id] = Math.max(12, Math.round(s.riskScore * 0.35));
      } else {
        map[s.id] = s.riskScore;
      }
    });

    return map;
  }, [activeScenario, analysis]);

  // Reset to verified sample incident
  const handleResetSample = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysis(getInitialSampleAnalysis());
      setActiveScenario(null);
      setSelectedServiceId(null);
      setIsAnalyzing(false);
    }, 200);
  }, []);

  // Trigger Insufficient Temporal History Demo
  const handleLoadInsufficientSample = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const sparseCsv = `timestamp,service,level,message,latency_ms,error_rate,cpu_pct
2026-10-25T10:00:00.000Z,api-gateway,info,Starting health ping,10,0.00,12.0
2026-10-25T10:00:10.000Z,api-gateway,info,Second ping,11,0.00,12.5`;

      const parsed = parseAndNormalizeTelemetry(sparseCsv);
      if (parsed.success) {
        const sparseAnalysis = analyzeIncident({
          records: parsed.records,
          dependencies: SAMPLE_DEPENDENCIES_DATA,
          source: "sample",
        });
        setAnalysis(sparseAnalysis);
        setActiveScenario(null);
        setSelectedServiceId(null);
      }
      setIsAnalyzing(false);
    }, 200);
  }, []);

  // Service selection handler
  const handleSelectService = useCallback((serviceId: string | null) => {
    setSelectedServiceId(serviceId);
    if (serviceId) {
      setIsEvidenceOpen(true);
    }
  }, []);

  // Evidence citation click handler
  const handleSelectEvidence = useCallback((evidenceId: string) => {
    setHighlightedEvidenceId(evidenceId);
    const item = analysis.evidence.find((e) => e.id === evidenceId);
    if (item) {
      setSelectedServiceId(item.serviceId);
    }
    setIsEvidenceOpen(true);
  }, [analysis.evidence]);

  return (
    <div className="min-h-screen flex flex-col bg-obs-bg text-obs-text font-sans antialiased selection:bg-obs-accent selection:text-black">
      {/* Top Tactical Navigation Header */}
      <Header
        analysis={analysis}
        viewMode={viewMode}
        setViewMode={setViewMode}
        audienceMode={audienceMode}
        setAudienceMode={setAudienceMode}
        onResetSample={handleResetSample}
        onOpenUpload={() => setIsUploadOpen(true)}
        onLoadInsufficientSample={handleLoadInsufficientSample}
        isAnalyzing={isAnalyzing}
      />

      {/* Main Observatory Canvas & Dashboard Deck */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* System Overview HUD */}
        <SystemOverview
          analysis={analysis}
          onFocusPredictedService={(sId) => setSelectedServiceId(sId)}
        />

        {/* Insufficient Temporal Data State (if sufficiency gate fails) */}
        {!analysis.dataQuality.sufficientForForecast && (
          <InsufficientDataState
            dataQuality={analysis.dataQuality}
            onResetSample={handleResetSample}
          />
        )}

        {/* Central Visualization Section: 3D Scene vs 2D Graph vs Matrix */}
        <section className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-obs-textMuted px-1">
            <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold text-white">
              <Activity className="h-4 w-4 text-obs-accent" />
              Service Dependency Topology & Blast Radius Observatory
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsEvidenceOpen(true)}
                className="text-[11px] text-obs-accent hover:underline flex items-center gap-1 font-mono"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Open Evidence Ledger ({analysis.evidence.length})</span>
              </button>
            </div>
          </div>

          {viewMode === "3d" ? (
            <ObservatoryScene
              services={analysis.services}
              dependencies={analysis.dependencies}
              predictedServiceId={analysis.prediction.serviceId}
              affectedServiceIds={analysis.cascade.affectedServiceIds}
              selectedServiceId={selectedServiceId}
              onSelectService={handleSelectService}
              onWebGLFailure={() => setViewMode("2d")}
              previewResidualRisk={previewResidualRisk}
            />
          ) : viewMode === "2d" ? (
            <Dependency2DGraph
              services={analysis.services}
              dependencies={analysis.dependencies}
              predictedServiceId={analysis.prediction.serviceId}
              affectedServiceIds={analysis.cascade.affectedServiceIds}
              selectedServiceId={selectedServiceId}
              onSelectService={handleSelectService}
              previewResidualRisk={previewResidualRisk}
            />
          ) : (
            <DependencyListView
              services={analysis.services}
              dependencies={analysis.dependencies}
              predictedServiceId={analysis.prediction.serviceId}
              affectedServiceIds={analysis.cascade.affectedServiceIds}
              selectedServiceId={selectedServiceId}
              onSelectService={handleSelectService}
              previewResidualRisk={previewResidualRisk}
            />
          )}
        </section>

        {/* Mid Deck: Prediction / Evidence Panel & Downstream Cascade Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PredictionPanel
            prediction={analysis.prediction}
            audienceMode={audienceMode}
            evidenceList={analysis.evidence}
            onSelectEvidence={handleSelectEvidence}
          />

          <CascadePanel
            cascade={analysis.cascade}
            predictedServiceId={analysis.prediction.serviceId}
            onFocusService={(sId) => setSelectedServiceId(sId)}
          />
        </div>

        {/* Bottom Deck: Simulated Recovery Strategy Matrix */}
        <RecoveryMatrix
          scenarios={analysis.scenarios}
          activeScenarioId={activeScenario ? activeScenario.id : null}
          onSelectScenario={(sc) => setActiveScenario(sc)}
          onResetScenario={() => setActiveScenario(null)}
        />

        {/* Compliance and Simulation Disclaimers */}
        <div className="p-3 rounded-lg bg-obs-surface/40 border border-obs-border text-[11px] font-mono text-obs-textDim flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Info className="h-3.5 w-3.5 text-obs-accent shrink-0" />
            <span>
              All incident failure forecasts and recovery scenarios are simulated heuristic evaluations. No production infrastructure commands are dispatched.
            </span>
          </div>
          <span className="shrink-0 text-obs-textMuted">
            Antigravity Track 1 Prototype
          </span>
        </div>
      </main>

      {/* Slide-over Evidence Ledger Drawer */}
      <EvidenceInspector
        evidenceList={analysis.evidence}
        services={analysis.services}
        selectedServiceId={selectedServiceId}
        highlightedEvidenceId={highlightedEvidenceId}
        isOpen={isEvidenceOpen}
        onClose={() => {
          setIsEvidenceOpen(false);
          setHighlightedEvidenceId(null);
        }}
        onSelectService={(sId) => setSelectedServiceId(sId)}
      />

      {/* CSV & JSON Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAnalysisSuccess={(newAnalysis) => {
          setAnalysis(newAnalysis);
          setActiveScenario(null);
          setSelectedServiceId(null);
        }}
      />
    </div>
  );
}
