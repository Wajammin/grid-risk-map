import type { Filter, Grade, Sido, Unit } from "./types";
import raw from "@/data/regions.json";

const WEIGHTS = { G: 0.45, P: 0.35, R: 0.2 } as const;

type Raw = {
  min: { gap: number; peak: number; res: number };
  max: { gap: number; peak: number; res: number };
  weights: { G: number; P: number; R: number };
  sido: Sido[];
};

const DATA = raw as Raw;

export const MIN = DATA.min;
export const MAX = DATA.max;
export const SIDO_LIST: Sido[] = DATA.sido;

export function minMax(value: number, min: number, max: number) {
  const d = max - min;
  if (d === 0) return 0.5;
  // 하한만 0. 상한은 열어둠 — 시나리오에서 보정 범위(max)를 넘으면 1을 초과한다.
  return Math.max(0, (value - min) / d);
}

export function compositeScore(gap: number, peak: number, res: number) {
  const nG = minMax(gap, MIN.gap, MAX.gap);
  const nP = minMax(peak, MIN.peak, MAX.peak);
  const nR = minMax(res, MIN.res, MAX.res);
  const s = 100 * (WEIGHTS.G * nG + WEIGHTS.P * nP + WEIGHTS.R * nR);
  return {
    score: Math.round(s * 10) / 10,
    nG,
    nP,
    nR,
    contrib: {
      G: WEIGHTS.G * nG * 100,
      P: WEIGHTS.P * nP * 100,
      R: WEIGHTS.R * nR * 100,
    },
  };
}

export function gradeOf(score: number): Grade {
  if (score < 20) return "안전";
  if (score < 40) return "관심";
  if (score < 60) return "주의";
  if (score < 80) return "경계";
  if (score < 100) return "위험";
  return "초과";
}

export function gradeColor(score: number) {
  if (score < 20) return "#A7F3D0";
  if (score < 40) return "#6EE7B7";
  if (score < 60) return "#FCD34D";
  if (score < 80) return "#FB923C";
  if (score < 100) return "#F87171";
  return "#B91C1C";
}

export function flattenSgg(): Unit[] {
  const out: Unit[] = [];
  for (const s of SIDO_LIST) {
    for (const c of s.children) {
      out.push({
        kind: "sgg",
        sidoId: s.id,
        sidoName: s.name,
        name: c.name,
        lat: c.lat,
        lng: c.lng,
        gap: c.gap,
        peak: c.peak,
        res: c.res,
        score: c.score,
        nG: c.nG,
        nP: c.nP,
        nR: c.nR,
      });
    }
  }
  return out;
}

export const ALL_SGG = flattenSgg();

export function applyGrowth(unit: Unit, growth: number): Unit {
  const g = growth / 100;
  const gap = unit.gap * (1 + g * 0.85);
  const peak = unit.peak * (1 + g * 0.45);
  const scored = compositeScore(gap, peak, unit.res);
  return {
    ...unit,
    gap: Math.round(gap * 1000) / 1000,
    peak: Math.round(peak * 1000) / 1000,
    score: scored.score,
    nG: scored.nG,
    nP: scored.nP,
    nR: scored.nR,
  };
}

export function nationalStats(growth: number) {
  const scored = ALL_SGG.map((u) => applyGrowth(u, growth)).sort(
    (a, b) => b.score - a.score,
  );
  const n = scored.length;
  const avg = scored.reduce((s, u) => s + u.score, 0) / n;
  const counts = [0, 0, 0, 0, 0, 0];
  for (const u of scored) {
    if (u.score < 20) counts[0] += 1;
    else if (u.score < 40) counts[1] += 1;
    else if (u.score < 60) counts[2] += 1;
    else if (u.score < 80) counts[3] += 1;
    else if (u.score < 100) counts[4] += 1;
    else counts[5] += 1;
  }
  const urgent = scored.filter((u) => u.score >= 60).length;
  return { scored, n, avg, counts, urgent, top: scored[0] };
}

export function percentile(score: number, growth: number) {
  const { scored } = nationalStats(growth);
  const better = scored.filter((u) => u.score > score).length;
  return Math.round((better / scored.length) * 1000) / 10;
}

export function passesFilter(score: number, filter: Filter) {
  if (filter === "high") return score >= 60;
  if (filter === "mid") return score >= 40 && score < 60;
  if (filter === "low") return score < 40;
  return true;
}

export function findUnit(sidoId: string, name?: string | null): Unit | null {
  const s = SIDO_LIST.find((x) => x.id === sidoId);
  if (!s) return null;
  if (!name) {
    return {
      kind: "sido",
      sidoId: s.id,
      sidoName: s.name,
      name: s.name,
      short: s.short,
      lat: s.lat,
      lng: s.lng,
      gap: s.gap,
      peak: s.peak,
      res: s.res,
      score: s.score,
      nG: s.nG,
      nP: s.nP,
      nR: s.nR,
    };
  }
  const c = s.children.find((x) => x.name === name);
  if (!c) return null;
  return {
    kind: "sgg",
    sidoId: s.id,
    sidoName: s.name,
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    gap: c.gap,
    peak: c.peak,
    res: c.res,
    score: c.score,
    nG: c.nG,
    nP: c.nP,
    nR: c.nR,
  };
}

export { WEIGHTS };
