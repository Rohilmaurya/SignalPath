import { DependencyEdge } from "./types";

export type Position3D = { x: number; y: number; z: number };
export type Position2D = { x: number; y: number };

export interface GraphLayoutResult {
  positions3D: Map<string, Position3D>;
  positions2D: Map<string, Position2D>;
  boundingRadius: number;
}

/**
 * Computes deterministic, collision-free 3D and 2D spatial positions
 * for any arbitrary service dependency graph based on topological depth.
 *
 * Semantic convention: `from` depends on `to`.
 * Lower tiers (tier 0) = deepest dependencies (storage, core DBs).
 * Higher tiers = callers & ingress gateways.
 */
export function computeGraphLayout(
  services: Array<{ id: string }>,
  dependencies: DependencyEdge[]
): GraphLayoutResult {
  const positions3D = new Map<string, Position3D>();
  const positions2D = new Map<string, Position2D>();

  const serviceIds = services.map((s) => s.id);
  const total = serviceIds.length;

  if (total === 0) {
    return { positions3D, positions2D, boundingRadius: 10 };
  }

  // Build dependency adjacency
  const dependsOn = new Map<string, string[]>();
  const callersOf = new Map<string, string[]>();

  for (const id of serviceIds) {
    dependsOn.set(id, []);
    callersOf.set(id, []);
  }

  for (const edge of dependencies) {
    if (dependsOn.has(edge.from) && dependsOn.has(edge.to)) {
      dependsOn.get(edge.from)?.push(edge.to);
      callersOf.get(edge.to)?.push(edge.from);
    }
  }

  // Calculate topological tier (0 = deepest dependency, higher = upstream caller)
  const tiers = new Map<string, number>();
  for (const id of serviceIds) {
    tiers.set(id, 0);
  }

  // Relaxation passes (capped to prevent infinite loops on cyclic dependencies)
  const maxPasses = Math.min(serviceIds.length, 10);
  for (let pass = 0; pass < maxPasses; pass++) {
    let changed = false;
    for (const id of serviceIds) {
      const deps = dependsOn.get(id) || [];
      for (const dep of deps) {
        const currentTier = tiers.get(id) || 0;
        const depTier = tiers.get(dep) || 0;
        if (currentTier <= depTier) {
          tiers.set(id, depTier + 1);
          changed = true;
        }
      }
    }
    if (!changed) break;
  }

  // Group services by tier
  const tierGroups = new Map<number, string[]>();
  let maxTier = 0;

  for (const id of serviceIds) {
    const t = tiers.get(id) || 0;
    maxTier = Math.max(maxTier, t);
    if (!tierGroups.has(t)) {
      tierGroups.set(t, []);
    }
    tierGroups.get(t)?.push(id);
  }

  let maxRadius = 10;

  // Assign 3D coordinates
  // Z-axis: from -10 (tier 0) to +12 (maxTier)
  // Y-axis: from -2.5 (tier 0) to +5.5 (maxTier)
  // X-axis: distributed evenly in tier with large separation (>= 10 units)
  for (let t = 0; t <= maxTier; t++) {
    const group = tierGroups.get(t) || [];
    const countInTier = group.length;

    const zBase = maxTier > 0 ? -10 + (t / maxTier) * 22 : 0;
    const yBase = maxTier > 0 ? -2.5 + (t / maxTier) * 8 : 1;

    group.forEach((id, idx) => {
      const xSpacing = Math.max(10, Math.min(16, 32 / (countInTier || 1)));
      const x = (idx - (countInTier - 1) / 2) * xSpacing;
      // Stagger slightly across adjacent nodes to prevent collinear alignment
      const yStagger = (idx % 2 === 1 ? 1.2 : -0.6);
      const zStagger = (idx % 2 === 1 ? 1.5 : -1.0);

      const pos3D: Position3D = {
        x,
        y: yBase + yStagger,
        z: zBase + zStagger,
      };

      positions3D.set(id, pos3D);

      const r = Math.sqrt(pos3D.x * pos3D.x + pos3D.y * pos3D.y + pos3D.z * pos3D.z);
      if (r > maxRadius) maxRadius = r;
    });
  }

  // Assign 2D SVG coordinates (Canvas 800 x 500)
  // Y: tier 0 at y=420 (bottom), maxTier at y=75 (top)
  // X: centered at 400
  for (let t = 0; t <= maxTier; t++) {
    const group = tierGroups.get(t) || [];
    const countInTier = group.length;

    const y = maxTier > 0 ? 420 - (t / maxTier) * 340 : 250;

    group.forEach((id, idx) => {
      const xSpacing = Math.min(180, 680 / (countInTier + 0.5));
      const x = 400 + (idx - (countInTier - 1) / 2) * xSpacing;

      positions2D.set(id, {
        x: Math.max(90, Math.min(710, x)),
        y,
      });
    });
  }

  return {
    positions3D,
    positions2D,
    boundingRadius: maxRadius,
  };
}
