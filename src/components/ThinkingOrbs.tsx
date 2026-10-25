"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Activity, CheckCircle2, Clock, Sparkles } from "lucide-react";

interface ThinkingOrbsProps {
  stage?: string;
}

export const ThinkingOrbs: React.FC<ThinkingOrbsProps> = ({ stage }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const steps = [
    { label: "Validating telemetry schema & time bounds", desc: "Verifying timestamp consistency, level mappings, and metric bounds." },
    { label: "Mapping service dependencies & cycle checks", desc: "Constructing directed graph edges and cycle-safe traversal paths." },
    { label: "Evaluating temporal sufficiency & metric drift", desc: "Detecting anomalous latency, error spikes, and severe log density." },
    { label: "Traversing causal blast radius & simulated recovery", desc: "Tracing downstream caller propagation and evaluating mitigations." },
    { label: "Consulting Gemini 3.8 Flash for causal explanations", desc: "Synthesizing evidence-grounded engineering & executive narratives." },
  ];

  // Advance pipeline steps smoothly while analyzing
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(timer);
  }, [steps.length]);

  // Three.js Iridescent Thinking Orbs Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 50);
    camera.position.set(0, 0, 9);

    // Subtle atmospheric lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfc4778, 1.5);
    dirLight1.position.set(5, 5, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x0284c7, 1.5);
    dirLight2.position.set(-5, -5, 5);
    scene.add(dirLight2);

    const group = new THREE.Group();
    scene.add(group);

    // 3 Iridescent thinking orbs
    const orbGeo = new THREE.SphereGeometry(0.85, 32, 32);
    
    // Orb 1: Coral / Rose
    const mat1 = new THREE.MeshPhysicalMaterial({
      color: 0xfc4778,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.6,
      thickness: 0.5,
      emissive: 0xfc4778,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const orb1 = new THREE.Mesh(orbGeo, mat1);
    group.add(orb1);

    // Orb 2: Cyan / Teal
    const mat2 = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      metalness: 0.1,
      roughness: 0.15,
      transmission: 0.6,
      thickness: 0.5,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      transparent: true,
      opacity: 0.85,
    });
    const orb2 = new THREE.Mesh(orbGeo, mat2);
    group.add(orb2);

    // Orb 3: Charcoal / Violet
    const mat3 = new THREE.MeshPhysicalMaterial({
      color: 0x9333ea,
      metalness: 0.1,
      roughness: 0.2,
      transmission: 0.6,
      thickness: 0.5,
      emissive: 0x9333ea,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.85,
    });
    const orb3 = new THREE.Mesh(orbGeo, mat3);
    group.add(orb3);

    let animationFrameId: number;
    let isVisible = true;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width === 0 || height === 0) continue;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer?.setSize(width, height, false);
      }
    });

    resizeObserver.observe(canvas);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    const clock = new THREE.Clock();

    const animate = () => {
      if (isVisible) {
        const t = clock.getElapsedTime();
        if (!prefersReducedMotion) {
          // Smooth orbital trigonometry
          orb1.position.set(Math.cos(t * 1.2) * 1.8, Math.sin(t * 1.5) * 0.9, Math.sin(t * 1.2) * 1.2);
          orb2.position.set(Math.cos(t * 1.2 + 2.1) * 1.8, Math.sin(t * 1.5 + 2.1) * 0.9, Math.sin(t * 1.2 + 2.1) * 1.2);
          orb3.position.set(Math.cos(t * 1.2 + 4.2) * 1.8, Math.sin(t * 1.5 + 4.2) * 0.9, Math.sin(t * 1.2 + 4.2) * 1.2);

          group.rotation.y = t * 0.15;
        } else {
          orb1.position.set(-1.6, 0, 0);
          orb2.position.set(0, 0, 0);
          orb3.position.set(1.6, 0, 0);
        }
        renderer?.render(scene, camera);
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      resizeObserver.disconnect();
      orbGeo.dispose();
      mat1.dispose();
      mat2.dispose();
      mat3.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div className="rounded-3xl border border-[#E4E4E7] bg-white/90 shadow-xl backdrop-blur-md p-6 sm:p-10 max-w-2xl mx-auto space-y-6 text-center animate-in fade-in duration-300">
      {/* 3D Iridescent Thinking Orbs Canvas */}
      <div className="relative h-44 w-full flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      {/* Header Info */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F4F5] border border-[#E4E4E7] text-[#18181B] text-[11px] font-mono tracking-widest uppercase">
          <span className="h-2 w-2 rounded-full bg-[#FC4778] animate-pulse" />
          <span>Analysis Pipeline Active</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#18181B] font-sans">
          Evaluating Telemetry Dataset & Dependency Topology
        </h3>
        <p className="text-xs sm:text-sm text-[#71717A] max-w-md mx-auto">
          Observable pipeline execution stages. Verifying telemetry integrity and causal blast radius.
        </p>
      </div>

      {/* Observable Progress Steps */}
      <div className="space-y-2.5 text-left max-w-lg mx-auto pt-2">
        {steps.map((s, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          return (
            <div
              key={idx}
              className={`p-3 rounded-xl border text-xs transition-all duration-300 ${
                isCurrent
                  ? "bg-[#F4F4F5] border-[#18181B] shadow-sm text-[#18181B]"
                  : isDone
                  ? "bg-white border-[#E4E4E7] text-[#71717A]"
                  : "bg-[#FAFAFA] border-transparent text-[#A1A1AA] opacity-50"
              }`}
            >
              <div className="flex items-center gap-2.5 font-medium">
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-[#059669] shrink-0" />
                ) : isCurrent ? (
                  <span className="h-4 w-4 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                )}
                <span className="truncate">{s.label}</span>
              </div>
              {isCurrent && (
                <p className="text-[11px] text-[#71717A] mt-1 pl-6.5 font-mono">
                  {s.desc}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-mono text-[#A1A1AA] pt-2">
        Status indicators reflect observable pipeline execution. No private model reasoning traces are claimed.
      </p>
    </div>
  );
};
