"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { ServiceAnalysis, DependencyEdge } from "@/lib/types";
import { 
  RotateCcw, 
  HelpCircle, 
  Crosshair, 
  Eye,
  Keyboard,
  Compass
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const badgesContainerRef = useRef<HTMLDivElement>(null);
  const badgeDomRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [controlsHelp, setControlsHelp] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // References to keep Three.js state across renders
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
    targetCameraPos: new THREE.Vector3(0, 16, 28),
    targetLookAt: new THREE.Vector3(0, 0, 0),
    currentLookAt: new THREE.Vector3(0, 0, 0),
    reqId: null,
  });

  // Calculate clean layered coordinates based on dependency topology
  const computeNodeLayout = useCallback((): NodePosition[] => {
    const layout: NodePosition[] = [];
    const count = services.length;
    if (count === 0) return layout;

    services.forEach((service, index) => {
      const isPredicted = service.id === predictedServiceId;
      const isCascade = affectedServiceIds.includes(service.id);

      // Hierarchical layered placement:
      // Data/Storage tiers at rear
      // Internal services in center
      // Ingress / gateways in front
      let x = 0;
      let y = 0;
      let z = 0;

      if (service.id.includes("db") || service.id.includes("inventory") || service.id.includes("store")) {
        x = -4;
        y = -2;
        z = -8;
      } else if (service.id.includes("gateway") || service.id.includes("ingress") || service.id.includes("edge")) {
        x = 0;
        y = 5;
        z = 10;
      } else if (service.id.includes("checkout") || service.id.includes("web") || service.id.includes("api")) {
        x = -6;
        y = 2;
        z = 2;
      } else if (service.id.includes("order") || service.id.includes("core")) {
        x = -2;
        y = 0;
        z = -2;
      } else if (service.id.includes("payment") || service.id.includes("billing")) {
        x = 7;
        y = 1;
        z = 1;
      } else if (service.id.includes("worker") || service.id.includes("notification") || service.id.includes("queue")) {
        x = 6;
        y = -3;
        z = -6;
      } else {
        const angle = (index / count) * Math.PI * 2;
        const radius = 12;
        x = Math.cos(angle) * radius;
        z = Math.sin(angle) * radius;
        y = Math.sin(index) * 2;
      }

      layout.push({
        id: service.id,
        x,
        y,
        z,
        service,
        isPredicted,
        isCascadeAffected: isCascade,
      });
    });

    return layout;
  }, [services, predictedServiceId, affectedServiceIds]);

  // Focus camera smoothly on specific node
  const focusOnNode = useCallback((nodeId: string) => {
    const pos = sceneState.current.nodePositions.get(nodeId);
    if (!pos) return;
    sceneState.current.targetLookAt.copy(pos);
    sceneState.current.targetCameraPos.set(pos.x, pos.y + 6, pos.z + 14);
  }, []);

  // Reset camera view
  const resetCamera = useCallback(() => {
    sceneState.current.targetLookAt.set(0, 0, 0);
    sceneState.current.targetCameraPos.set(0, 16, 28);
  }, []);

  // React to external selectedServiceId changes
  useEffect(() => {
    if (selectedServiceId) {
      focusOnNode(selectedServiceId);
      const idx = services.findIndex((s) => s.id === selectedServiceId);
      if (idx !== -1) setFocusedIndex(idx);
    }
  }, [selectedServiceId, focusOnNode, services]);

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 480;

    // P1 Fix: Safely instantiate Three.js WebGLRenderer directly.
    // Three.js r163+ requires WebGL 2. We do NOT call canvas.getContext('webgl') beforehand
    // because that permanently locks the canvas to WebGL 1 and breaks WebGL 2 initialization.
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
    } catch (renderInitErr) {
      console.warn("Three.js WebGLRenderer initialization failed:", renderInitErr);
      onWebGLFailure?.();
      return;
    }

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x080c14, 0.015);
    sceneState.current.scene = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 16, 28);
    camera.lookAt(0, 0, 0);
    sceneState.current.camera = camera;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight.position.set(10, 20, 15);
    scene.add(dirLight);

    const redBeaconLight = new THREE.PointLight(0xef4444, 2.5, 40);
    redBeaconLight.position.set(0, 0, 0);
    scene.add(redBeaconLight);

    // Grid Floor
    const gridHelper = new THREE.GridHelper(50, 25, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -6;
    scene.add(gridHelper);

    // Nodes Creation
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

      const size = item.isPredicted ? 1.5 : item.isCascadeAffected ? 1.2 : 0.9;
      const sphereGeo = new THREE.SphereGeometry(size, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.8,
        emissive: colorHex,
        emissiveIntensity: item.isPredicted ? 0.6 : item.isCascadeAffected ? 0.35 : 0.15,
      });

      const mesh = new THREE.Mesh(sphereGeo, sphereMat);
      mesh.position.copy(pos);
      mesh.userData = { id: item.id };
      scene.add(mesh);
      nodeMeshes.set(item.id, mesh);

      // Pulsing beacon ring for predicted root failure
      if (item.isPredicted) {
        redBeaconLight.position.copy(pos);
        const ringGeo = new THREE.RingGeometry(2.0, 2.3, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xef4444,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
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

    // P1 Fix: Dependency Conduits & Cascade Pulses
    // Edge direction: 'from' depends on 'to'.
    // Failure spreads FROM 'to' (the failing upstream) TO 'from' (the dependent)!
    const pulsePositions: { points: THREE.Points; curve: THREE.CatmullRomCurve3; progress: number }[] = [];

    dependencies.forEach((edge) => {
      const fromPos = nodePositions.get(edge.from);
      const toPos = nodePositions.get(edge.to);
      if (!fromPos || !toPos) return;

      const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
      mid.y += 1.8;

      // Conduit line from dependent to dependency
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
        opacity: isCascadeEdge ? 0.85 : 0.4,
      });

      const line = new THREE.Line(lineGeo, lineMat);
      scene.add(line);

      // Animated energy pulse along cascading edges:
      // Travels FROM 'to' (failure source) TO 'from' (affected dependent)!
      if (isCascadeEdge) {
        const pulseCurve = new THREE.CatmullRomCurve3([toPos, mid, fromPos]);
        const pulseGeo = new THREE.BufferGeometry();
        const pulsePos = new Float32Array([0, 0, 0]);
        pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
        const pulseMat = new THREE.PointsMaterial({
          color: 0xd946ef,
          size: 0.9,
          transparent: true,
          opacity: 0.95,
        });
        const pulse = new THREE.Points(pulseGeo, pulseMat);
        scene.add(pulse);
        pulsePositions.push({ points: pulse, curve: pulseCurve, progress: Math.random() });
      }
    });

    sceneState.current.pulsePositions = pulsePositions;

    // P1 Fix: Unified Pointer & Touch & Gestures Handling
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
        // Pinch zoom start
        const pts = Array.from(activePointers.values());
        prevPinchDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      }
    };

    const handlePointerMove = (e: PointerEvent) => {
      if (activePointers.has(e.pointerId)) {
        activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      // Multi-touch pinch zoom
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

      // Single pointer orbit drag
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

      // Raycast for hover state
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
        const id = hit.userData.id;
        setHoveredNodeId(id);
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
        // ignore if already released
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
        const id = intersects[0].object.userData.id;
        onSelectService(id);
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

    // P1 Fix: Keyboard Navigation on Canvas
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
        const newRadius = Math.max(10, radius - 2);
        offset.setLength(newRadius);
        camera.position.copy(sceneState.current.currentLookAt).add(offset);
        sceneState.current.targetCameraPos.copy(camera.position);
        handled = true;
      } else if (e.key === "-" || e.key === "_") {
        const newRadius = Math.min(50, radius + 2);
        offset.setLength(newRadius);
        camera.position.copy(sceneState.current.currentLookAt).add(offset);
        sceneState.current.targetCameraPos.copy(camera.position);
        handled = true;
      } else if (e.key === "Tab") {
        // Cycle focused node
        e.preventDefault();
        const nextIdx = e.shiftKey
          ? (focusedIndex - 1 + services.length) % services.length
          : (focusedIndex + 1) % services.length;
        setFocusedIndex(nextIdx);
        const nextService = services[nextIdx];
        if (nextService) focusOnNode(nextService.id);
        handled = true;
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const curr = services[focusedIndex];
        if (curr) onSelectService(curr.id);
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

    // Handle Resize
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 480;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    // P2 Fix: Animation loop updates HTML node overlays via direct DOM style transforms,
    // avoiding React reconciliation overhead and 60 rerenders per second!
    const clock = new THREE.Clock();

    const animate = () => {
      sceneState.current.reqId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Smooth camera interpolation
      sceneState.current.currentLookAt.lerp(sceneState.current.targetLookAt, 0.08);
      camera.position.lerp(sceneState.current.targetCameraPos, 0.06);
      camera.lookAt(sceneState.current.currentLookAt);

      // Beacon ring expansion
      scene.children.forEach((child) => {
        if (child.userData.isBeaconRing) {
          const s = 1 + (Math.sin(elapsed * 3) + 1) * 0.25;
          child.scale.set(s, s, s);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (child as any).material.opacity = 0.8 - (s - 1) * 1.5;
        }
      });

      // Cascade pulse packet animation
      pulsePositions.forEach((pulse) => {
        pulse.progress += delta * 0.45;
        if (pulse.progress > 1) pulse.progress = 0;
        const pt = pulse.curve.getPoint(pulse.progress);
        const attr = pulse.points.geometry.getAttribute("position") as THREE.BufferAttribute;
        attr.setXYZ(0, pt.x, pt.y, pt.z);
        attr.needsUpdate = true;
      });

      renderer.render(scene, camera);

      // P2 Fix: Direct DOM style transform update (0 React rerenders per frame)
      const curW = container.clientWidth;
      const curH = container.clientHeight || 480;

      nodePositions.forEach((pos, id) => {
        const badgeEl = badgeDomRefs.current.get(id);
        if (!badgeEl) return;

        const v = pos.clone().project(camera);
        const isBehind = v.z > 1;
        const screenX = ((v.x + 1) * curW) / 2;
        const screenY = ((-v.y + 1) * curH) / 2;

        if (isBehind || screenX < -60 || screenX > curW + 60 || screenY < -60 || screenY > curH + 60) {
          badgeEl.style.opacity = "0";
          badgeEl.style.pointerEvents = "none";
        } else {
          badgeEl.style.opacity = "1";
          badgeEl.style.pointerEvents = "auto";
          badgeEl.style.transform = `translate3d(${screenX}px, ${screenY - 36}px, 0) translate(-50%, -100%)`;
        }
      });
    };

    animate();

    // Resource Cleanup
    return () => {
      if (sceneState.current.reqId) cancelAnimationFrame(sceneState.current.reqId);
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
    <div
      ref={containerRef}
      className="relative w-full h-[480px] bg-obs-bg border border-obs-border rounded-xl overflow-hidden shadow-2xl focus-within:ring-2 focus-within:ring-obs-accent"
    >
      {/* 3D WebGL Canvas with unified pointer & keyboard navigation */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-grab active:cursor-grabbing outline-none touch-none"
        tabIndex={0}
        aria-label="Interactive 3D incident dependency map. Use mouse, touch, or arrow keys to orbit; tab to cycle nodes; enter to inspect."
      />

      {/* HTML Tactical Overlay Tags (Direct DOM transform manipulation, zero React rerenders) */}
      <div ref={badgesContainerRef} className="absolute inset-0 pointer-events-none">
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

          const badgeColor =
            effectiveScore >= 80
              ? "border-rose-500 bg-rose-950/85 text-rose-300"
              : effectiveScore >= 55
              ? "border-orange-500 bg-orange-950/85 text-orange-300"
              : effectiveScore >= 25
              ? "border-amber-500 bg-amber-950/85 text-amber-300"
              : "border-emerald-500 bg-emerald-950/85 text-emerald-300";

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
                isHovered || isSelected || isKeyboardFocused ? "scale-110 z-20" : "scale-100 z-10"
              }`}
            >
              <button
                onClick={() => onSelectService(service.id)}
                className={`px-2 py-1 rounded-md border font-mono text-[11px] font-semibold flex items-center gap-1.5 backdrop-blur-md shadow-lg transition-all ${badgeColor} ${
                  isSelected || isKeyboardFocused ? "ring-2 ring-obs-accent ring-offset-2 ring-offset-black" : ""
                } ${isPredicted ? "animate-pulse" : ""}`}
                title={`Inspect ${service.id} telemetry (Risk: ${effectiveScore}/100)`}
              >
                {isPredicted && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
                {isCascade && !isPredicted && <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />}
                <span>{service.id}</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-black/60 text-white font-mono">
                  {effectiveScore}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Floating HUD Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-20">
        {predictedServiceId && (
          <button
            onClick={() => focusOnNode(predictedServiceId)}
            className="px-2.5 py-1 text-xs font-mono rounded bg-obs-surfaceElevated/90 hover:bg-obs-border border border-rose-500/50 text-rose-300 flex items-center gap-1 backdrop-blur-md transition-colors"
            title="Focus camera on predicted primary failure node"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span>Focus Culprit</span>
          </button>
        )}

        <button
          onClick={resetCamera}
          className="p-1.5 rounded bg-obs-surfaceElevated/90 hover:bg-obs-border border border-obs-border text-obs-textMuted hover:text-white backdrop-blur-md transition-colors"
          title="Reset camera viewpoint (Home / R)"
          aria-label="Reset camera"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          onClick={() => setControlsHelp(!controlsHelp)}
          className="p-1.5 rounded bg-obs-surfaceElevated/90 hover:bg-obs-border border border-obs-border text-obs-textMuted hover:text-white backdrop-blur-md transition-colors"
          title="Observatory navigation and accessibility controls"
          aria-label="Controls help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>

      {/* Controls Help Overlay Modal */}
      {controlsHelp && (
        <div className="absolute top-12 right-3 w-72 bg-obs-surfaceElevated/95 border border-obs-border rounded-lg p-3 text-xs font-mono text-obs-textMuted z-30 shadow-2xl backdrop-blur-md">
          <div className="font-bold text-white mb-2 flex items-center gap-1.5">
            <Compass className="h-3.5 w-3.5 text-obs-accent" />
            <span>Observatory Controls & Accessibility</span>
          </div>
          <ul className="space-y-1.5 text-[11px]">
            <li>• <strong className="text-white">Mouse / Pointer Drag:</strong> Orbit camera</li>
            <li>• <strong className="text-white">Scroll / Touch Pinch:</strong> Zoom in & out</li>
            <li>• <strong className="text-white">Arrow Keys [← → ↑ ↓]:</strong> Orbit camera via keyboard</li>
            <li>• <strong className="text-white">Tab / Shift+Tab:</strong> Cycle node focus</li>
            <li>• <strong className="text-white">Enter / Space:</strong> Inspect focused node</li>
            <li>• <strong className="text-white">R / Home:</strong> Reset camera view</li>
            <li>• <strong className="text-purple-400">Magenta Pulses:</strong> Direction of cascading failure</li>
            <li>• <strong className="text-rose-400">Red Beacon:</strong> Predicted culprit root cause</li>
          </ul>
        </div>
      )}

      {/* Bottom Status Ticker */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-2">
        <div className="px-2.5 py-1 rounded bg-obs-surfaceElevated/90 border border-obs-border text-[11px] font-mono text-obs-textMuted backdrop-blur-md flex items-center gap-2">
          <span className="flex items-center gap-1 text-rose-400">
            <span className="h-2 w-2 rounded-full bg-rose-500 inline-block" />
            Failure Vector
          </span>
          <span className="text-obs-textDim">•</span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block" />
            Cascading Impact
          </span>
          <span className="text-obs-textDim">•</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            Nominal
          </span>
          <span className="text-obs-textDim">•</span>
          <span className="flex items-center gap-1 text-obs-accent text-[10px]">
            <Keyboard className="h-3 w-3" />
            Keyboard / Pointer Ready
          </span>
        </div>
      </div>
    </div>
  );
};
