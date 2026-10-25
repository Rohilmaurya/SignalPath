"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  Activity, 
  ArrowDown, 
  ArrowRight, 
  Cpu, 
  Database, 
  GitFork, 
  Layers, 
  ShieldCheck, 
  Sparkles, 
  Zap,
  Radio,
  Server,
  TrendingUp,
  AlertOctagon,
  Clock,
  ShieldAlert,
  SlidersHorizontal
} from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export const StorySection: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // GSAP ScrollTrigger Animations for editorial section reveals
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || !containerRef.current) return;

    const sections = containerRef.current.querySelectorAll(".story-chapter");
    const triggers: ScrollTrigger[] = [];

    sections.forEach((sec) => {
      const anim = gsap.fromTo(
        sec,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sec,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );
      if (anim.scrollTrigger) triggers.push(anim.scrollTrigger);
    });

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="space-y-32 py-16">
      {/* CHAPTER 1: Hero Section (Incredibles.dev oversized typography & calm restraint) */}
      <section className="relative min-h-[85vh] flex flex-col justify-center items-center text-center px-4 sm:px-6 max-w-5xl mx-auto space-y-8">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#E4E4E7] text-[#18181B] text-[11px] font-mono tracking-widest uppercase shadow-sm">
          <span className="h-2 w-2 rounded-full bg-[#FC4778] animate-pulse" />
          <span>Distributed Systems Causal Observatory</span>
        </div>

        {/* Oversized Centered Headline */}
        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-[#18181B] leading-[1.04] max-w-4xl mx-auto font-sans">
          See the cascade <br />
          <span className="text-[#71717A] font-light">before callers collapse.</span>
        </h1>

        {/* Authoritative Domain Lead */}
        <p className="text-base sm:text-lg text-[#52525B] max-w-2xl mx-auto font-normal leading-relaxed">
          Modern cloud architectures fail in silent, non-linear domino chains. SignalPath correlates multi-dimensional telemetry drift against directed service dependency graphs to isolate the root culprit, predict downstream blast radiuses, and simulate recovery tradeoffs before the first P0 alert fires.
        </p>

        {/* High-Contrast Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <a
            href="#upload"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#18181B] text-white font-medium text-sm hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span>Upload Telemetry & Analyze</span>
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href="#signals"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-white text-[#18181B] border border-[#E4E4E7] hover:bg-[#F4F4F5] text-sm font-medium transition-all shadow-sm"
          >
            <span>Read Causal Breakdown</span>
            <ArrowDown className="h-4 w-4 text-[#71717A]" />
          </a>
        </div>

        {/* Clean Architectural Causal Flow Card (Replaces the clunky 3D canvas) */}
        <div className="w-full mt-10 rounded-3xl bg-white border border-[#E4E4E7] p-6 sm:p-8 shadow-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E4E4E7] gap-3">
            <div>
              <div className="text-[11px] font-mono uppercase tracking-widest text-[#71717A] mb-1 flex items-center gap-2">
                <Radio className="h-3.5 w-3.5 text-[#FC4778]" />
                <span>Observatory Causal Pipeline</span>
              </div>
              <h3 className="text-lg font-bold text-[#18181B] font-sans">
                Predictive Fault Domain Isolation
              </h3>
            </div>
            <span className="text-xs font-mono text-[#059669] bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 font-semibold self-start sm:self-center">
              Active Analytical Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <div className="space-y-2 p-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <Activity className="h-3.5 w-3.5 text-[#FC4778]" />
                <span>01. Signal Drift</span>
              </div>
              <h4 className="text-sm font-semibold text-[#18181B]">Multi-Signal Inflection</h4>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Correlates p95/p99 latency acceleration, database connection starvation, and error spikes across raw time series.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <GitFork className="h-3.5 w-3.5 text-[#7C3AED]" />
                <span>02. DAG Blast Radius</span>
              </div>
              <h4 className="text-sm font-semibold text-[#18181B]">Directed Propagation</h4>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Traverses cycle-safe service dependencies (<code className="text-[#18181B] font-mono text-[11px]">from → to</code>) to map which upstream callers will time out first.
              </p>
            </div>

            <div className="space-y-2 p-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
              <div className="flex items-center gap-2 text-xs font-mono text-[#71717A]">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#059669]" />
                <span>03. Mitigation Sandbox</span>
              </div>
              <h4 className="text-sm font-semibold text-[#18181B]">Simulated Recovery</h4>
              <p className="text-xs text-[#52525B] leading-relaxed">
                Ranks failover and isolation playbooks against the do-nothing baseline, projecting residual risk without executing infrastructure commands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ATMOSPHERIC FLOW VIDEO MODULE */}
      <section className="story-chapter max-w-6xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl border border-[#E4E4E7] bg-white p-8 sm:p-12 shadow-sm space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-[#FC4778] uppercase tracking-wider font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Dynamic Topology Dynamics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#18181B] tracking-tight font-sans">
                How Microservice Topologies Quietly Unravel
              </h2>
              <p className="text-xs sm:text-sm text-[#52525B] leading-relaxed">
                In high-throughput distributed ecosystems, failure rarely begins at the edge. A subtle query lock in an internal state tier holds worker threads hostage. Upstream message queues begin backing up, intermediate service worker pools deplete, and within minutes, edge ingress gateways start throwing HTTP 504 Gateway Timeouts across all user traffic.
              </p>
              <div className="text-[11px] font-mono text-[#71717A] bg-[#FAFAFA] p-3 rounded-xl border border-[#E4E4E7]">
                SignalPath watches the weak signals where the fault domain actually begins—hours before customer-facing alerts trigger.
              </div>
            </div>

            <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-[#E4E4E7] bg-[#18181B] aspect-video flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                src="/media/architecture_story.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 2: Telemetry Signals */}
      <section id="signals" className="story-chapter max-w-5xl mx-auto px-4 sm:px-6 space-y-10 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-mono text-[#FC4778] uppercase tracking-widest font-semibold block">
            Chapter 01 / Multi-Signal Drift
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight font-sans">
            Degradation Whispers Long Before Failure
          </h2>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Single-metric threshold alerts only fire when damage is done. Real degradation leaves a multi-dimensional fingerprint across metrics and severe log streams minutes before catastrophic downtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
          <div className="p-7 rounded-2xl bg-white border border-[#E4E4E7] space-y-3 shadow-sm hover:border-[#D4D4D8] transition-all">
            <div className="h-9 w-9 rounded-xl bg-[#FFFBEB] border border-[#FDE68A] flex items-center justify-center text-[#D97706]">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-[#18181B] font-sans">Percentile Divergence</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              p95 and p99 response times spike sharply while median p50 remains nominal. This tail-variance delta is the hallmark signature of thread pool starvation and unindexed query queueing.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E4E4E7] space-y-3 shadow-sm hover:border-[#D4D4D8] transition-all">
            <div className="h-9 w-9 rounded-xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-center text-[#DC2626]">
              <AlertOctagon className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-[#18181B] font-sans">Socket & Error Velocity</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Clusters of TCP connection resets, HTTP 503s, and read timeouts signal that upstream caller circuit breakers have failed to trip, driving backend socket pools into exhaustion.
            </p>
          </div>

          <div className="p-7 rounded-2xl bg-white border border-[#E4E4E7] space-y-3 shadow-sm hover:border-[#D4D4D8] transition-all">
            <div className="h-9 w-9 rounded-xl bg-[#FAF5FF] border border-[#E9D5FF] flex items-center justify-center text-[#9333EA]">
              <Cpu className="h-4 w-4" />
            </div>
            <h3 className="text-base font-semibold text-[#18181B] font-sans">Log Entropy Clustering</h3>
            <p className="text-xs text-[#52525B] leading-relaxed">
              FATAL and ERROR log density concentrates at inflection points. Correlating log event timestamps against metric anomalies isolates ground truth from ambient noise.
            </p>
          </div>
        </div>
      </section>

      {/* CHAPTER 3: Directed Dependencies */}
      <section className="story-chapter max-w-5xl mx-auto px-4 sm:px-6 space-y-10 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-mono text-[#0284C7] uppercase tracking-widest font-semibold block">
            Chapter 02 / Directed Topology (DAG)
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight font-sans">
            Dependencies Determine The Domino Effect
          </h2>
          <p className="text-sm text-[#52525B] leading-relaxed">
            In microservice graphs, callers depend on upstream dependencies (<code className="text-[#18181B] font-mono bg-[#F4F4F5] px-1.5 py-0.5 rounded border border-[#E4E4E7]">from → to</code>). When a core dependency degrades, caller queues back up rapidly until edge gateways fail.
          </p>
        </div>

        <div className="p-8 rounded-3xl bg-white border border-[#E4E4E7] space-y-6 shadow-sm text-left">
          <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
            <span className="text-[#18181B] font-semibold flex items-center gap-2 text-sm">
              <GitFork className="h-4 w-4 text-[#9333EA]" />
              <span>Directed Failure Propagation Chain</span>
            </span>
            <span className="text-[#71717A] text-[11px] font-mono">Cycle-Safe DAG Traversal</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-center">
            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
              <span className="text-[10px] text-[#71717A] uppercase tracking-wider block mb-1 font-mono">Customer Edge</span>
              <span className="font-semibold text-[#18181B] text-sm">api-gateway</span>
              <p className="text-[11px] text-[#52525B] mt-1">Suffers 504 Gateway Timeouts</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FAFAFA] border border-[#E4E4E7]">
              <span className="text-[10px] text-[#71717A] uppercase tracking-wider block mb-1 font-mono">Intermediate Caller</span>
              <span className="font-semibold text-[#18181B] text-sm">checkout-service</span>
              <p className="text-[11px] text-[#52525B] mt-1">Worker thread pool exhaustion</p>
            </div>

            <div className="p-5 rounded-2xl bg-[#FEF2F2] border border-[#FECACA]">
              <span className="text-[10px] text-[#DC2626] uppercase tracking-wider block mb-1 font-mono">Root Dependency</span>
              <span className="font-semibold text-[#991B1B] text-sm">inventory-db</span>
              <p className="text-[11px] text-[#DC2626] mt-1 font-medium">Row-lock contention (Risk: 100/100)</p>
            </div>
          </div>
        </div>
      </section>

      {/* CHAPTER 4: Simulated Recovery Tradeoffs */}
      <section className="story-chapter max-w-5xl mx-auto px-4 sm:px-6 space-y-10 text-center">
        <div className="max-w-2xl mx-auto space-y-3">
          <span className="text-[11px] font-mono text-[#059669] uppercase tracking-widest font-semibold block">
            Chapter 03 / Mitigation Decision Support
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#18181B] tracking-tight font-sans">
            Evaluate Recovery Tradeoffs Without Guessing
          </h2>
          <p className="text-sm text-[#52525B] leading-relaxed">
            Under incident pressure, human operators guess mitigation actions with partial visibility. SignalPath simulates and ranks recovery scenarios directly against the unmitigated baseline, projecting remaining risk and recovery horizons before touching production infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-left">
          <div className="p-6 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#059669] font-semibold block">
              Recommended Strategy (Rank #1)
            </span>
            <h4 className="text-base font-semibold text-[#18181B]">Isolate Component & Route to Standby</h4>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Cuts downstream traffic immediately, projecting residual system risk drop from 100 to 23 within ~11 minutes. Tradeoff: Brief connection resets during traffic drain.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] space-y-2 shadow-sm">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#DC2626] font-semibold block">
              Baseline Inaction (Rank #4)
            </span>
            <h4 className="text-base font-semibold text-[#18181B]">Do Nothing (Unmitigated Failure)</h4>
            <p className="text-xs text-[#52525B] leading-relaxed">
              Connection pools exhaust, guaranteeing cascade propagation across all callers with 95–100 residual risk and persistent gateway outage.
            </p>
          </div>
        </div>

        <div className="pt-8">
          <a
            href="#upload"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#18181B] text-white font-medium text-sm hover:bg-black transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <span>Proceed to Upload Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>
    </div>
  );
};
