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

export const GRADE_RAMP = [
  { until: 20, name: "안전" as const, color: "#4DA6FF" },
  { until: 40, name: "관심" as const, color: "#3DDC84" },
  { until: 60, name: "주의" as const, color: "#E8DE3C" },
  { until: 80, name: "경계" as const, color: "#F5A02A" },
  { until: 100, name: "위험" as const, color: "#E4453A" },
  { until: Infinity, name: "초과" as const, color: "#8B1520" },
] as const;

/** 범례용. 지도 칸은 단색, 막대만 이 스펙트럼. */
export const GRADE_SPECTRUM =
  "linear-gradient(90deg,#4DA6FF 0%,#3ECFFF 12%,#3DDC84 28%,#E8DE3C 45%,#F5A02A 62%,#E4453A 80%,#8B1520 100%)";

export function gradeOf(score: number): Grade {
  return GRADE_RAMP.find((g) => score < g.until)?.name ?? "초과";
}

export function gradeColor(score: number) {
  return GRADE_RAMP.find((g) => score < g.until)?.color ?? "#8B1520";
}

export function rankOf(sidoId: string, name: string, growth: number) {
  const { scored } = nationalStats(growth);
  const i = scored.findIndex((u) => u.sidoId === sidoId && u.name === name);
  return i < 0 ? null : i + 1;
}

/** 시·군·구 이름 끝자리로 행정 유형을 가른다. */
export function adminKind(name: string): "시" | "군" | "구" {
  if (name.endsWith("구")) return "구";
  if (name.endsWith("군")) return "군";
  return "시";
}

export function rankInKind(sidoId: string, name: string, growth: number) {
  const kind = adminKind(name);
  const rows = ALL_SGG.map((u) => applyGrowth(u, growth))
    .filter((u) => adminKind(u.name) === kind)
    .sort((a, b) => b.score - a.score);
  const i = rows.findIndex((u) => u.sidoId === sidoId && u.name === name);
  return { kind, rank: i < 0 ? null : i + 1, n: rows.length };
}

export function rankOfSido(sidoId: string, growth: number) {
  const rows = SIDO_LIST.map((s) => applyGrowth(findUnit(s.id)!, growth)).sort(
    (a, b) => b.score - a.score,
  );
  const i = rows.findIndex((u) => u.sidoId === sidoId);
  return i < 0 ? null : i + 1;
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
