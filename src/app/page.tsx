"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Header } from "@/components/Header";
import { StorySection } from "@/components/StorySection";
import { UploadWorkspace } from "@/components/UploadWorkspace";
import { SystemOverview } from "@/components/SystemOverview";
import { ObservatoryScene } from "@/components/ObservatoryScene";
import { Dependency2DGraph } from "@/components/Dependency2DGraph";
import { DependencyListView } from "@/components/DependencyListView";
import { PredictionPanel } from "@/components/PredictionPanel";
import { CascadePanel } from "@/components/CascadePanel";
import { RecoveryMatrix } from "@/components/RecoveryMatrix";
import { GroundedQA } from "@/components/GroundedQA";
import { EvidenceInspector } from "@/components/EvidenceInspector";
import { InsufficientDataState } from "@/components/InsufficientDataState";
import { AnalysisResponse, RecoveryScenario, AnalysisError, AnalysisErrorIssue } from "@/lib/types";
import { Info, ArrowLeft, RotateCcw } from "lucide-react";

export default function SignalPathDashboard() {
  // P0 Invariant: Initial load must NOT load sample telemetry or run auto-analysis
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [validationError, setValidationError] = useState<{
    message: string;
    issues?: AnalysisErrorIssue[];
  } | null>(null);

  const [viewMode, setViewMode] = useState<"3d" | "2d" | "list">("3d");
  const [audienceMode, setAudienceMode] = useState<"engineer" | "executive">("engineer");
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [highlightedEvidenceId, setHighlightedEvidenceId] = useState<string | null>(null);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState<RecoveryScenario | null>(null);

  // Compute preview residual risk map when a recovery scenario is selected
  const previewResidualRisk = useMemo(() => {
    if (!analysis || !activeScenario) return null;
    const map: Record<string, number> = {};

    analysis.services.forEach((s) => {
      if (activeScenario.id === "do-nothing") {
        map[s.id] = s.riskScore;
      } else if (activeScenario.affectedServices.includes(s.id) || s.id === analysis.prediction.serviceId) {
        map[s.id] = activeScenario.remainingSystemRisk;
      } else if (analysis.cascade.affectedServiceIds.includes(s.id)) {
        map[s.id] = Math.max(12, Math.round(s.riskScore * 0.35));
      } else {
        map[s.id] = s.riskScore;
      }
    });

    return map;
  }, [activeScenario, analysis]);

  // Primary analysis submission handler
  const handleAnalyze = async (telemetryFile: File, dependenciesFile: File) => {
    setIsAnalyzing(true);
    setValidationError(null);

    try {
      const formData = new FormData();
      formData.append("telemetry", telemetryFile);
      formData.append("dependencies", dependenciesFile);
      formData.append("source", "upload");

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData: AnalysisError = await res.json();
        setValidationError({
          message: errData.error?.message || "Analysis failed to process dataset.",
          issues: errData.error?.issues || [],
        });
        return;
      }

      const resultData: AnalysisResponse = await res.json();
      setAnalysis(resultData);
      setActiveScenario(null);
      setSelectedServiceId(null);

      // Scroll smoothly to results
      setTimeout(() => {
        const el = document.getElementById("results");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      console.error("Analysis network error:", err);
      setValidationError({
        message: "Network or server failure while analyzing upload. Please retry.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset to empty story & upload workspace
  const handleNewAnalysis = useCallback(() => {
    setAnalysis(null);
    setActiveScenario(null);
    setSelectedServiceId(null);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Service selection handler
  const handleSelectService = useCallback((serviceId: string | null) => {
    setSelectedServiceId(serviceId);
    if (serviceId) {
      setIsEvidenceOpen(true);
    }
  }, []);

  // Evidence citation click handler
  const handleSelectEvidence = useCallback(
    (evidenceId: string) => {
      setHighlightedEvidenceId(evidenceId);
      if (analysis) {
        const item = analysis.evidence.find((e) => e.id === evidenceId);
        if (item) {
          setSelectedServiceId(item.serviceId);
        }
      }
      setIsEvidenceOpen(true);
    },
    [analysis]
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] text-[#18181B] dotted-grid font-sans antialiased selection:bg-[#FC4778] selection:text-white">
      {/* Top Navigation Header */}
      <Header
        analysis={analysis}
        onNewAnalysis={handleNewAnalysis}
        isAnalyzing={isAnalyzing}
      />

      {/* RENDER MODE A: Story-Led Landing & Empty Upload Workspace */}
      {!analysis && (
        <main className="flex-1 w-full mx-auto pb-16">
          <StorySection />
          <UploadWorkspace
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            validationError={validationError}
            onClearError={() => setValidationError(null)}
          />
        </main>
      )}

      {/* RENDER MODE B: Active Analysis Results Observatory */}
      {analysis && (
        <main id="results" className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
          {/* Active Run Breadcrumb / Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewAnalysis}
                className="inline-flex items-center gap-2 text-xs font-mono text-[#52525B] hover:text-[#18181B] px-3.5 py-1.5 rounded-full bg-white border border-[#E4E4E7] hover:border-zinc-400 shadow-sm transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Story & Upload Workspace</span>
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono text-[#71717A]">
              <span>Run ID: <code className="text-[#18181B] font-semibold">{analysis.analysisId.slice(0, 8)}</code></span>
              <span>•</span>
              <span>Services: <strong className="text-[#18181B]">{analysis.services.length}</strong></span>
              <span>•</span>
              <span>Evidence Ledger: <strong className="text-[#FC4778]">{analysis.evidence.length} items</strong></span>
            </div>
          </div>

          {/* System Overview HUD */}
          <SystemOverview
            analysis={analysis}
            onFocusPredictedService={(sId) => setSelectedServiceId(sId)}
          />

          {/* Insufficient Temporal Data State (if sufficiency gate fails) */}
          {!analysis.dataQuality.sufficientForForecast && (
            <InsufficientDataState
              dataQuality={analysis.dataQuality}
              onResetSample={handleNewAnalysis}
            />
          )}

          {/* Central Visualization Section: 3D Scene vs 2D Graph vs Table */}
          <section>
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
                viewMode={viewMode}
                setViewMode={setViewMode}
                onOpenLedger={() => setIsEvidenceOpen(true)}
                evidenceCount={analysis.evidence.length}
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
                viewMode={viewMode}
                setViewMode={setViewMode}
                onOpenLedger={() => setIsEvidenceOpen(true)}
                evidenceCount={analysis.evidence.length}
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
                viewMode={viewMode}
                setViewMode={setViewMode}
                onOpenLedger={() => setIsEvidenceOpen(true)}
                evidenceCount={analysis.evidence.length}
              />
            )}
          </section>

          {/* Mid Deck: Prediction / Evidence Panel & Downstream Cascade Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <PredictionPanel
              prediction={analysis.prediction}
              audienceMode={audienceMode}
              setAudienceMode={setAudienceMode}
              evidenceList={analysis.evidence}
              onSelectEvidence={handleSelectEvidence}
              onOpenLedger={() => setIsEvidenceOpen(true)}
            />

            <CascadePanel
              cascade={analysis.cascade}
              predictedServiceId={analysis.prediction.serviceId}
              onFocusService={(sId) => setSelectedServiceId(sId)}
            />
          </div>

          {/* Simulated Recovery Strategy Matrix */}
          <RecoveryMatrix
            scenarios={analysis.scenarios}
            activeScenarioId={activeScenario ? activeScenario.id : null}
            onSelectScenario={(sc) => setActiveScenario(sc)}
            onResetScenario={() => setActiveScenario(null)}
          />

          {/* Grounded Follow-Up Q&A Assistant */}
          <GroundedQA
            analysis={analysis}
            onSelectEvidence={handleSelectEvidence}
          />

          {/* Compliance and Simulation Disclaimers */}
          <div className="p-4 rounded-2xl bg-white border border-[#E4E4E7] text-xs font-mono text-[#71717A] flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#FC4778] shrink-0" />
              <span>
                All incident failure forecasts and recovery scenarios are simulated heuristic evaluations. No production infrastructure commands are dispatched.
              </span>
            </div>
            <span className="shrink-0 text-[#52525B] font-medium">
              SignalPath Operations Platform
            </span>
          </div>

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
        </main>
      )}
    </div>
  );
}
