"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { computeGraphLayout } from "@/lib/graph-layout";
import { 
  RotateCcw, 
  HelpCircle, 
  Crosshair, 
  Layers,
  Compass,
  FileSpreadsheet
} from "lucide-react";

interface NodePosition {
  id: string;
  x: number;
  y: number;
  z: number;
  service: ServiceAnalysis;
  isPredicted: boolean;
  isCascadeAffected: boolean;
}

interface ObservatorySceneProps {
  services: ServiceAnalysis[];
  dependencies: DependencyEdge[];
  predictedServiceId: string | null;
  affectedServiceIds: string[];
  selectedServiceId: string | null;
  onSelectService: (serviceId: string) => void;
  onWebGLFailure?: () => void;
  previewResidualRisk?: Record<string, number> | null;
  viewMode: "3d" | "2d" | "list";
  setViewMode: (mode: "3d" | "2d" | "list") => void;
  onOpenLedger: () => void;
  evidenceCount: number;
}

export const ObservatoryScene: React.FC<ObservatorySceneProps> = ({
  services,
  dependencies,
  predictedServiceId,
  affectedServiceIds,
  selectedServiceId,
  onSelectService,
  onWebGLFailure,
  previewResidualRisk,
  viewMode,
  setViewMode,
  onOpenLedger,
  evidenceCount,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const badgeDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [controlsHelp, setControlsHelp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const sceneState = useRef<{
    renderer: THREE.WebGLRenderer | null;
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    nodes: Map<string, THREE.Mesh>;
    pulsePositions: { points: THREE.Points; curve: THREE.CatmullRomCurve3; progress: number }[];
    nodePositions: Map<string, THREE.Vector3>;
    targetCameraPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    reqId: number | null;
  }>({
    renderer: null,
    scene: null,
    camera: null,
    nodes: new Map(),
    pulsePositions: [],
    nodePositions: new Map(),
    targetCameraPos: new THREE.Vector3(0, 14, 26),
    targetLookAt: new THREE.Vector3(0, 1, 0),
    currentLookAt: new THREE.Vector3(0, 1, 0),
    reqId: null,
  });

  // Procedural, topology-aware 3D node coordinates for arbitrary uploaded dependency graphs
  const computeNodeLayout = useCallback((): NodePosition[] => {
    const layout: NodePosition[] = [];
    if (services.length === 0) return layout;

    const { positions3D } = computeGraphLayout(services, dependencies);

    services.forEach((service) => {
      const isPredicted = service.id === predictedServiceId;
      const isCascade = affectedServiceIds.includes(service.id);
      const pos = positions3D.get(service.id) || { x: 0, y: 0, z: 0 };

      layout.push({
        id: service.id,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        service,
        isPredicted,
        isCascadeAffected: isCascade,
      });
    });

    return layout;
  }, [services, dependencies, predictedServiceId, affectedServiceIds]);

  const focusOnNode = useCallback((nodeId: string) => {
    const pos = sceneState.current.nodePositions.get(nodeId);
    if (!pos) return;
    sceneState.current.targetLookAt.copy(pos);
    sceneState.current.targetCameraPos.set(pos.x, pos.y + 5, pos.z + 13);
  }, []);

  const resetCamera = useCallback(() => {
    sceneState.current.targetLookAt.set(0, 1, 0);
    sceneState.current.targetCameraPos.set(0, 14, 26);
  }, []);

  useEffect(() => {
    if (selectedServiceId) {
      focusOnNode(selectedServiceId);
      const idx = services.findIndex((s) => s.id === selectedServiceId);
      if (idx !== -1) setFocusedIndex(idx);
    }
  }, [selectedServiceId, focusOnNode, services]);

  // Main Three.js setup
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 460;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      sceneState.current.renderer = renderer;
    } catch (err) {
      console.warn("WebGL2 initialization failed:", err);
      onWebGLFailure?.();
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c14, 0.014);
    sceneState.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 14, 26);
    camera.lookAt(0, 1, 0);
    sceneState.current.camera = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    dirLight.position.set(12, 22, 16);
    scene.add(dirLight);

    const redBeaconLight = new THREE.PointLight(0xef4444, 2.5, 40);
    redBeaconLight.position.set(0, 0, 0);
    scene.add(redBeaconLight);

    // Subtle Grid Floor
    const gridHelper = new THREE.GridHelper(50, 25, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // Node Meshes
    const layout = computeNodeLayout();
    const nodeMeshes = new Map<string, THREE.Mesh>();
    const nodePositions = new Map<string, THREE.Vector3>();

    layout.forEach((item) => {
      const pos = new THREE.Vector3(item.x, item.y, item.z);
      nodePositions.set(item.id, pos);

      let effectiveScore = item.service.riskScore;
      if (previewResidualRisk && previewResidualRisk[item.id] !== undefined) {
        effectiveScore = previewResidualRisk[item.id];
      }

      let colorHex = 0x10b981; // green
      if (effectiveScore >= 80) colorHex = 0xef4444; // crimson
      else if (effectiveScore >= 55) colorHex = 0xf97316; // orange
      else if (effectiveScore >= 25) colorHex = 0xf59e0b; // amber

      // Bespoke modular microservice architecture chassis
      const chassisGeo = new THREE.BoxGeometry(
        item.isPredicted ? 2.6 : 2.2,
        item.isPredicted ? 1.4 : 1.1,
        item.isPredicted ? 2.0 : 1.7
      );
      const chassisMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        roughness: 0.25,
        metalness: 0.8,
        emissive: colorHex,
        emissiveIntensity: item.isPredicted ? 0.4 : item.isCascadeAffected ? 0.22 : 0.06,
      });

      const mesh = new THREE.Mesh(chassisGeo, chassisMat);
      mesh.position.copy(pos);
      mesh.userData = { id: item.id };
      scene.add(mesh);
      nodeMeshes.set(item.id, mesh);

      // Front diagnostic status LED strip
      const ledGeo = new THREE.BoxGeometry(item.isPredicted ? 2.2 : 1.8, 0.2, 0.05);
      const ledMat = new THREE.MeshBasicMaterial({ color: colorHex });
      const ledMesh = new THREE.Mesh(ledGeo, ledMat);
      ledMesh.position.set(0, 0.35, item.isPredicted ? 1.02 : 0.87);
      mesh.add(ledMesh);

      if (item.isPredicted) {
        redBeaconLight.position.copy(pos);
        const ringGeo = new THREE.RingGeometry(1.8, 2.1, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.65,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.copy(pos);
        ring.userData = { isBeaconRing: true };
        scene.add(ring);
      }
    });

    sceneState.current.nodes = nodeMeshes;
    sceneState.current.nodePositions = nodePositions;

    // Dependency Conduits & Cascading Pulses
    const pulsePositions: { points: THREE.Points; curve: THREE.CatmullRomCurve3; progress: number }[] = [];

    dependencies.forEach((edge) => {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);
      if (!fromPos || !toPos) return;

      const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
      mid.y += 1.8;

      const conduitCurve = new THREE.CatmullRomCurve3([fromPos, mid, toPos]);
      const points = conduitCurve.getPoints(24);
      const lineGeo = new THREE.BufferGeometry().setFromPoints(points);

      const isCascadeEdge =
        (edge.to === predictedServiceId && affectedServiceIds.includes(edge.from)) ||
        (affectedServiceIds.includes(edge.to) && affectedServiceIds.includes(edge.from));

      const lineMat = new THREE.LineBasicMaterial({
        color: isCascadeEdge ? 0xa855f7 : 0x334155,
        linewidth: isCascadeEdge ? 2 : 1,
        transparent: true,
        opacity: isCascadeEdge ? 0.8 : 0.35,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Pulse traveling from failure source 'to' -> dependent 'from'
      if (isCascadeEdge) {
        const pulseCurve = new THREE.CatmullRomCurve3([toPos, mid, fromPos]);
        const pulseGeo = new THREE.BufferGeometry();
        const pulsePos = new Float32Array([0, 0, 0]);
        pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
          color: 0xd946ef,
          size: 0.8,
          transparent: true,
          opacity: 0.9,
        });
        const pulse = new THREE.Points(pulseGeo, pulseMat);
        scene.add(pulse);
        pulsePositions.push({ points: pulse, curve: pulseCurve, progress: Math.random() });
      }
    });

    sceneState.current.pulsePositions = pulsePositions;

    // Pointer Interaction Handlers
    const activePointers = new Map<number, { x: number; y: number }>();
    let prevPinchDist = 0;
    let isDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    const handlePointerDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1) {
        isDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (activePointers.size === 2) {
        const pts = Array.from(activePointers.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (prevPinchDist > 0) {
          const delta = (prevPinchDist - dist) * 0.05;
          const offset = camera.position.clone().sub(sceneState.current.currentLookAt);
          const newRadius = Math.max(10, Math.min(50, offset.length() + delta));
          offset.setLength(newRadius);
          camera.position.copy(sceneState.current.currentLookAt).add(offset);
          sceneState.current.targetCameraPos.copy(camera.position);
        }
        prevPinchDist = dist;
        return;
      }

      if (isDragging && activePointers.size === 1) {
        const deltaX = (e.clientX - prevPointerX) * 0.006;
        const deltaY = (e.clientY - prevPointerY) * 0.006;

        const offset = camera.position.clone().sub(sceneState.current.currentLookAt);
        const radius = offset.length();

        let theta = Math.atan2(offset.x, offset.z) - deltaX;
        let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius))) - deltaY;
        phi = Math.max(0.15, Math.min(Math.PI / 2 - 0.05, phi));

        camera.position.x = sceneState.current.currentLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = sceneState.current.currentLookAt.y + radius * Math.cos(phi);
        camera.position.z = sceneState.current.currentLookAt.z + radius * Math.sin(phi) * Math.cos(theta);
        sceneState.current.targetCameraPos.copy(camera.position);

        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      }

      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(Array.from(nodeMeshes.values()));
      if (intersects.length > 0) {
        const hit = intersects[0].object;
        setHoveredNodeId(hit.userData.id);
        canvas.style.cursor = "pointer";
      } else {
        setHoveredNodeId(null);
        canvas.style.cursor = isDragging ? "grabbing" : "grab";
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      activePointers.delete(e.pointerId);
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }

      if (activePointers.size === 0) {
        isDragging = false;
        prevPinchDist = 0;
        canvas.style.cursor = "grab";
      }
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(Array.from(nodeMeshes.values()));
      if (intersects.length > 0) {
        onSelectService(intersects[0].object.userData.id);
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY * 0.02;
      const offset = camera.position.clone().sub(sceneState.current.currentLookAt);
      const newRadius = Math.max(10, Math.min(50, offset.length() + zoomFactor));
      offset.setLength(newRadius);
      camera.position.copy(sceneState.current.currentLookAt).add(offset);
      sceneState.current.targetCameraPos.copy(camera.position);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const offset = camera.position.clone().sub(sceneState.current.currentLookAt);
      const radius = offset.length();
      let theta = Math.atan2(offset.x, offset.z);
      let phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));
      let handled = false;

      if (e.key === "ArrowLeft") {
        theta -= 0.08;
        handled = true;
      } else if (e.key === "ArrowRight") {
        theta += 0.08;
        handled = true;
      } else if (e.key === "ArrowUp") {
        phi = Math.max(0.15, phi - 0.08);
        handled = true;
      } else if (e.key === "ArrowDown") {
        phi = Math.min(Math.PI / 2 - 0.05, phi + 0.08);
        handled = true;
      } else if (e.key === "+" || e.key === "=") {
        offset.setLength(Math.max(10, radius - 2));
        camera.position.copy(sceneState.current.currentLookAt).add(offset);
        sceneState.current.targetCameraPos.copy(camera.position);
        handled = true;
      } else if (e.key === "-" || e.key === "_") {
        offset.setLength(Math.min(50, radius + 2));
        camera.position.copy(sceneState.current.currentLookAt).add(offset);
        sceneState.current.targetCameraPos.copy(camera.position);
        handled = true;
      } else if (e.key === "Tab") {
        e.preventDefault();
        const nextIdx = e.shiftKey
          ? (focusedIndex - 1 + services.length) % services.length
          : (focusedIndex + 1) % services.length;
        setFocusedIndex(nextIdx);
        if (services[nextIdx]) focusOnNode(services[nextIdx].id);
        handled = true;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (services[focusedIndex]) onSelectService(services[focusedIndex].id);
        handled = true;
      } else if (e.key.toLowerCase() === "r" || e.key === "Home") {
        resetCamera();
        handled = true;
      }

      if (handled && (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "ArrowUp" || e.key === "ArrowDown")) {
        camera.position.x = sceneState.current.currentLookAt.x + radius * Math.sin(phi) * Math.sin(theta);
        camera.position.y = sceneState.current.currentLookAt.y + radius * Math.cos(phi);
        camera.position.z = sceneState.current.currentLookAt.z + radius * Math.sin(phi) * Math.cos(theta);
        sceneState.current.targetCameraPos.copy(camera.position);
      }
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("keydown", handleKeyDown);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 460;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // WebGL Context Loss Handling per immersive-3d-motion-designer
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      console.warn("WebGL context lost. Triggering graceful fallback to 2D dependency view.");
      if (sceneState.current.reqId) cancelAnimationFrame(sceneState.current.reqId);
      onWebGLFailure?.();
    };
    canvas.addEventListener("webglcontextlost", handleContextLost, false);

    // Performance budget: pause animation loop when canvas is off-screen or tab is backgrounded
    let isVisible = true;
    const intersectionObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        isVisible = entry.isIntersecting && !document.hidden;
      }
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Animation Loop with Direct DOM updates
    const clock = new THREE.Clock();

    const animate = () => {
      sceneState.current.reqId = requestAnimationFrame(animate);
      if (!isVisible) return;

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      sceneState.current.currentLookAt.lerp(sceneState.current.targetLookAt, 0.08);
      camera.position.lerp(sceneState.current.targetCameraPos, 0.06);
      camera.lookAt(sceneState.current.currentLookAt);

      scene.children.forEach((child) => {
        if (child.userData.isBeaconRing) {
          const s = 1 + (Math.sin(elapsed * 2.5) + 1) * 0.2;
          child.scale.set(s, s, s);
          const mat = (child as THREE.Mesh).material;
          if (mat && "opacity" in mat) {
            (mat as { opacity: number }).opacity = 0.7 - (s - 1) * 1.5;
          }
        }
      });

      pulsePositions.forEach((pulse) => {
        pulse.progress += delta * 0.45;
        if (pulse.progress > 1) pulse.progress = 0;
        const pt = pulse.curve.getPoint(pulse.progress);
        const attr = pulse.points.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, pt.x, pt.y, pt.z);
        attr.needsUpdate = true;
      });

      renderer.render(scene, camera);

      // Direct DOM label projection
      const curW = container.clientWidth;
      const curH = container.clientHeight || 460;

      nodePositions.forEach((pos, id) => {
        const badgeEl = badgeDomRefs.current.get(id);
        if (!badgeEl) return;

        const v = pos.clone().project(camera);
        const isBehind = v.z > 1;
        const screenX = ((v.x + 1) * curW) / 2;
        const screenY = ((-v.y + 1) * curH) / 2;

        if (isBehind || screenX < -80 || screenX > curW + 80 || screenY < -80 || screenY > curH + 80) {
          badgeEl.style.opacity = "0";
          badgeEl.style.pointerEvents = "none";
        } else {
          badgeEl.style.opacity = "1";
          badgeEl.style.pointerEvents = "auto";
          badgeEl.style.transform = `translate3d(${screenX}px, ${screenY - 32}px, 0) translate(-50%, -100%)`;
        }
      });
    };

    animate();

    return () => {
      if (sceneState.current.reqId) cancelAnimationFrame(sceneState.current.reqId);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      intersectionObserver.disconnect();
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);

      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
          if (obj.geometry) obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else if (obj.material) {
            obj.material.dispose();
          }
        }
      });

      renderer.dispose();
      sceneState.current.renderer = null;
      sceneState.current.scene = null;
    };
  }, [
    computeNodeLayout,
    dependencies,
    predictedServiceId,
    affectedServiceIds,
    onSelectService,
    onWebGLFailure,
    previewResidualRisk,
    focusedIndex,
    services,
  ]);

  return (
    <div className="space-y-3">
      {/* Topology Toolbar (View switchers, focus actions, evidence ledger) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#18181B] tracking-tight text-sm font-sans">
            Service Topology & Blast Radius
          </span>

          {/* Contextual View Mode Switcher */}
          <div className="flex items-center rounded-full bg-[#F4F4F5] p-1 border border-[#E4E4E7]" role="group" aria-label="Observatory visualization mode">
            <button
              onClick={() => setViewMode("3d")}
              className={`px-3 py-1 text-xs rounded-full flex items-center gap-1.5 transition-all ${
                viewMode === "3d"
                  ? "bg-[#18181B] text-white font-medium shadow-sm"
                  : "text-[#71717A] hover:text-[#18181B]"
              }`}
              title="Interactive 3D WebGL Observatory"
            >
              <Layers className="h-3.5 w-3.5" />
              <span>3D</span>
            </button>
            <button
              onClick={() => setViewMode("2d")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                viewMode === "2d"
                  ? "bg-[#18181B] text-white font-medium shadow-sm"
                  : "text-[#71717A] hover:text-[#18181B]"
              }`}
              title="2D Vector Blast Radius Graph"
            >
              <span>2D Graph</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1 text-xs rounded-full transition-all ${
                viewMode === "list"
                  ? "bg-[#18181B] text-white font-medium shadow-sm"
                  : "text-[#71717A] hover:text-[#18181B]"
              }`}
              title="Accessible Tabular Service Matrix"
            >
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Evidence Ledger trigger button */}
        <button
          onClick={onOpenLedger}
          className="text-xs text-[#18181B] hover:text-[#FC4778] flex items-center gap-1.5 font-medium transition-colors"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          <span>Evidence Ledger ({evidenceCount})</span>
        </button>
      </div>

      {/* 3D Canvas Box */}
      <div
        ref={containerRef}
        className="relative w-full h-[480px] bg-[#080C14] border border-[#E4E4E7] rounded-3xl overflow-hidden shadow-md focus-within:ring-2 focus-within:ring-[#18181B]"
      >
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-grab active:cursor-grabbing outline-none touch-none"
          tabIndex={0}
          aria-label="Interactive 3D dependency topology map. Use pointer or arrow keys to orbit; tab to cycle nodes; enter to inspect."
        />

        {/* Refined Tactical HTML Labels (zero overlap with generous 3D spacing) */}
        <div className="absolute inset-0 pointer-events-none">
          {services.map((service, index) => {
            const isSelected = service.id === selectedServiceId;
            const isPredicted = service.id === predictedServiceId;
            const isCascade = affectedServiceIds.includes(service.id);
            const isHovered = service.id === hoveredNodeId;
            const isKeyboardFocused = index === focusedIndex;

            let effectiveScore = service.riskScore;
            if (previewResidualRisk && previewResidualRisk[service.id] !== undefined) {
              effectiveScore = previewResidualRisk[service.id];
            }

            const badgeStyle = isPredicted
              ? "border-rose-500 bg-rose-950/90 text-rose-200 ring-1 ring-rose-500"
              : isCascade
              ? "border-purple-500/80 bg-purple-950/80 text-purple-200"
              : "border-zinc-700 bg-zinc-900/90 text-zinc-200";

            return (
              <div
                key={service.id}
                ref={(el) => {
                  if (el) badgeDomRefs.current.set(service.id, el);
                  else badgeDomRefs.current.delete(service.id);
                }}
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: "translate3d(0, 0, 0)",
                  opacity: 0,
                  willChange: "transform, opacity",
                }}
                className={`transition-transform duration-75 ${
                  isHovered || isSelected || isKeyboardFocused ? "scale-105 z-20" : "scale-100 z-10"
                }`}
              >
                <button
                  onClick={() => onSelectService(service.id)}
                  className={`px-3 py-1 rounded-full border text-xs font-mono font-medium flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all ${badgeStyle} ${
                    isSelected || isKeyboardFocused ? "ring-2 ring-white ring-offset-2 ring-offset-[#080C14]" : ""
                  }`}
                  title={`Inspect ${service.id} telemetry (Risk: ${effectiveScore}/100)`}
                >
                  {isPredicted && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                  {isCascade && !isPredicted && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                  <span className="font-semibold">{service.id}</span>
                  <span className="text-[11px] font-mono opacity-80">
                    {effectiveScore}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Floating Top Controls */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
          {predictedServiceId && (
            <button
              onClick={() => focusOnNode(predictedServiceId)}
              className="px-3 py-1.5 text-xs rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-rose-500/50 text-rose-300 flex items-center gap-1.5 backdrop-blur-md transition-colors shadow-sm"
              title="Focus camera on predicted primary failure node"
            >
              <Crosshair className="h-3.5 w-3.5" />
              <span>Focus Culprit</span>
            </button>
          )}

          <button
            onClick={resetCamera}
            className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white backdrop-blur-md transition-colors shadow-sm"
            title="Reset camera view (R / Home)"
            aria-label="Reset camera"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          <button
            onClick={() => setControlsHelp(!controlsHelp)}
            className="p-2 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white backdrop-blur-md transition-colors shadow-sm"
            title="Controls guide"
            aria-label="Controls guide"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {/* Controls Guide Drawer */}
        {controlsHelp && (
          <div className="absolute top-14 right-4 w-68 bg-zinc-900/95 border border-zinc-700 rounded-2xl p-4 text-xs text-zinc-300 z-30 shadow-2xl backdrop-blur-md">
            <div className="font-semibold text-white mb-2.5 flex items-center gap-2">
              <Compass className="h-4 w-4 text-[#FC4778]" />
              <span>3D Navigation</span>
            </div>
            <ul className="space-y-1.5 text-[11px] font-mono">
              <li>• <strong className="text-white">Drag / Pointer:</strong> Orbit scene</li>
              <li>• <strong className="text-white">Scroll / Pinch:</strong> Zoom in & out</li>
              <li>• <strong className="text-white">Arrow Keys:</strong> Keyboard camera orbit</li>
              <li>• <strong className="text-white">Tab / Enter:</strong> Cycle & inspect nodes</li>
              <li>• <strong className="text-purple-400">Magenta:</strong> Cascading failure path</li>
              <li>• <strong className="text-rose-400">Crimson:</strong> Predicted failure node</li>
            </ul>
          </div>
        )}

        {/* Clean Bottom Ticker */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-3 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-400 backdrop-blur-md shadow-sm">
          <span className="flex items-center gap-1.5 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Culprit Node
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5 text-purple-400">
            <span className="h-2 w-2 rounded-full bg-purple-500" />
            Downstream Impact
          </span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Nominal
          </span>
        </div>
      </div>
    </div>
  );
};
