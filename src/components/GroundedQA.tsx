"use client";

import React, { useState } from "react";
import { AnalysisResponse, AskResponse } from "@/lib/types";
import { 
  Sparkles, 
  Send, 
  HelpCircle, 
  ShieldAlert, 
  ExternalLink, 
  Lightbulb,
  CheckCircle2,
  Clock
} from "lucide-react";

interface GroundedQAProps {
  analysis: AnalysisResponse;
  onSelectEvidence: (evidenceId: string) => void;
}

interface QAMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  evidenceIds?: string[];
  uncertainty?: string;
  suggestions?: string[];
  source?: "gemini" | "deterministic";
  timestamp: string;
}

export const GroundedQA: React.FC<GroundedQAProps> = ({
  analysis,
  onSelectEvidence,
}) => {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<QAMessage[]>(() => [
    {
      id: "initial-assistant-greeting",
      sender: "assistant",
      text: `Investigation context active for ${analysis.prediction.serviceId || "uploaded dataset"}. Ask about specific evidence, cascade risk, or recovery comparisons. All answers are strictly grounded in this run's evidence ledger.`,
      evidenceIds: analysis.prediction.evidenceIds.slice(0, 2),
      source: analysis.prediction.explanationSource === "gemini" ? "gemini" : "deterministic",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const quickPrompts = [
    "Why is the recommended recovery ranked first?",
    "What evidence points to this service?",
    "Which downstream callers face cascade risk?",
    "What telemetry signals are missing?",
  ];

  const handleAsk = async (queryText?: string) => {
    const q = (queryText || question).trim();
    if (!q || isLoading) return;

    const userMsg: QAMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1",
          analysisId: analysis.analysisId,
          question: q,
          context: {
            status: analysis.status,
            dataQuality: analysis.dataQuality,
            prediction: {
              serviceId: analysis.prediction.serviceId,
              riskScore: analysis.prediction.riskScore,
              riskBand: analysis.prediction.riskBand || analysis.services.find(s => s.id === analysis.prediction.serviceId)?.riskBand || "unknown",
              confidence: analysis.prediction.confidence,
              causeSummary: analysis.prediction.causeSummary,
              evidenceIds: analysis.prediction.evidenceIds,
            },
            dependencies: analysis.dependencies,
            cascadePaths: analysis.cascade.paths,
            scenarios: analysis.scenarios,
            evidence: analysis.evidence.slice(0, 30),
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data: AskResponse = await res.json();
      const assistantMsg: QAMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: data.answer,
        evidenceIds: data.evidenceIds,
        uncertainty: data.uncertainty,
        suggestions: data.suggestions,
        source: data.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Ask query failed:", err);
      const errorMsg: QAMessage = {
        id: `asst-${Date.now()}`,
        sender: "assistant",
        text: "Could not retrieve an answer for this query. The telemetry analysis remains accessible in the panels above.",
        source: "deterministic",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-white border border-[#E4E4E7] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E4E4E7] gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-1">
            <Sparkles className="h-3 w-3 text-[#FC4778]" />
            <span>AI Investigation Assistant</span>
          </div>
          <h3 className="text-xl font-bold text-[#18181B] tracking-tight font-sans">
            Grounded Incident Follow-Up
          </h3>
          <p className="text-xs text-[#52525B] mt-0.5">
            Ask targeted questions about evidence citations, downstream cascade paths, or recovery tradeoffs.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#71717A] self-start sm:self-center">
          <span className="flex items-center gap-1.5 bg-[#F4F4F5] px-3 py-1 rounded-full border border-[#E4E4E7]">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669]" />
            <span>Strict Evidence Grounding</span>
          </span>
        </div>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-mono text-[#71717A] py-1 flex items-center gap-1">
          <Lightbulb className="h-3.5 w-3.5 text-[#D97706]" /> Suggested:
        </span>
        {quickPrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleAsk(p)}
            disabled={isLoading}
            className="text-xs bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] px-3.5 py-1.5 rounded-full border border-[#E4E4E7] transition-all disabled:opacity-50"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Conversation Thread */}
      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-4 rounded-2xl text-xs leading-relaxed ${
              m.sender === "user"
                ? "bg-[#18181B] text-white ml-8 sm:ml-12"
                : "bg-[#FAFAFA] border border-[#E4E4E7] text-[#18181B] mr-4 sm:mr-8 shadow-sm"
            }`}
          >
            <div className={`flex items-center justify-between text-[10px] font-mono mb-2 ${
              m.sender === "user" ? "text-zinc-400" : "text-[#71717A]"
            }`}>
              <span className="font-semibold uppercase tracking-wider">
                {m.sender === "user" ? "Operator Query" : `SignalPath Assistant (${m.source || "Grounded"})`}
              </span>
              <span>{m.timestamp}</span>
            </div>

            <p className="text-[13px] leading-relaxed font-sans">
              {m.text}
            </p>

            {/* Cited Evidence Pills */}
            {m.evidenceIds && m.evidenceIds.length > 0 && (
              <div className="mt-3 pt-2.5 border-t border-[#E4E4E7] flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-mono text-[#71717A]">Cited Evidence:</span>
                {m.evidenceIds.map((eid) => (
                  <button
                    key={eid}
                    onClick={() => onSelectEvidence(eid)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono bg-white hover:bg-[#F4F4F5] text-[#18181B] px-2.5 py-0.5 rounded-full border border-[#D4D4D8] transition-colors shadow-sm"
                  >
                    <span>{eid}</span>
                    <ExternalLink className="h-2.5 w-2.5 text-[#71717A]" />
                  </button>
                ))}
              </div>
            )}

            {/* Uncertainty Box */}
            {m.uncertainty && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] text-[11px] text-[#92400E] font-mono">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#D97706] block mb-0.5">
                  Analysis Boundary / Uncertainty:
                </span>
                {m.uncertainty}
              </div>
            )}

            {/* Suggestions */}
            {m.suggestions && m.suggestions.length > 0 && (
              <div className="mt-2.5 space-y-1">
                <span className="text-[10px] font-mono text-[#71717A] uppercase tracking-wider block">
                  Safe Investigation Suggestions:
                </span>
                <ul className="list-disc list-inside text-[11px] text-[#52525B] space-y-0.5 font-sans">
                  {m.suggestions.map((s, idx) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="p-4 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7] text-xs text-[#71717A] flex items-center gap-2.5 font-mono">
            <span className="h-4 w-4 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" />
            <span>Consulting evidence ledger and generating grounded response...</span>
          </div>
        )}
      </div>

      {/* Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk();
        }}
        className="flex items-center gap-2 pt-1"
      >
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question grounded in this incident (e.g., 'Why is the recommended recovery ranked first?')"
          maxLength={500}
          disabled={isLoading}
          className="flex-1 bg-[#FAFAFA] focus:bg-white border border-[#E4E4E7] focus:border-[#18181B] rounded-full px-5 py-3 text-xs text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none transition-colors font-sans shadow-inner"
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="inline-flex items-center gap-1.5 bg-[#18181B] text-white font-medium px-6 py-3 rounded-full text-xs hover:bg-black transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span>Ask</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </form>

      {/* Operational Disclaimer */}
      <div className="text-[11px] font-mono text-[#A1A1AA] flex items-center gap-1.5 pt-1">
        <ShieldAlert className="h-3.5 w-3.5 text-[#71717A] shrink-0" />
        <span>Advisory simulation only. Assistant will never execute commands or alter live infrastructure.</span>
      </div>
    </section>
  );
};
