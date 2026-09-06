import { applyGrowth, compositeScore } from "./scoring";
import type { Unit } from "./types";

/** Lightweight ensemble: three deterministic 'trees' blending gap/peak/res. */
export function ensemblePredict(unit: Unit, growth: number) {
  const u = applyGrowth(unit, growth);
  const t1 = 100 * (0.55 * u.nG + 0.3 * u.nP + 0.15 * u.nR);
  const t2 = 100 * (0.35 * u.nG + 0.45 * u.nP + 0.2 * u.nR);
  const t3 = 100 * (0.4 * u.nG + 0.25 * u.nP + 0.35 * u.nR);
  const pred = (t1 + t2 + t3) / 3;
  const scored = compositeScore(u.gap, u.peak, u.res);
  return {
    current: unit.score,
    grown: u.score,
    ensemble: Math.round(pred * 10) / 10,
    trees: [round1(t1), round1(t2), round1(t3)],
    delta: Math.round((u.score - unit.score) * 10) / 10,
    contrib: scored.contrib,
  };
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

export const GROWTH_PRESETS = [0, 20, 50, 100, 200] as const;
