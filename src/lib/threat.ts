import { applyGrowth, findUnit, gradeOf, nationalStats, percentile } from "./scoring";
import { ensemblePredict } from "./predictor";
import type { Grade, Unit } from "./types";

export const THREAT_STEPS = [0, 20, 50, 100, 200] as const;

function topicParticle(name: string) {
  const ch = name.charCodeAt(name.length - 1);
  if (ch < 0xac00 || ch > 0xd7a3) return `${name}는`;
  return (ch - 0xac00) % 28 ? `${name}은` : `${name}는`;
}

/** Soft risk in 0–100. Not a failure probability — inspection urgency. */
export function threatIndex(score: number) {
  const p = 1 / (1 + Math.exp(-(score - 70) / 12));
  return Math.round(p * 1000) / 10;
}

export function growthToReach(unit: Unit, target: number): number | null {
  if (applyGrowth(unit, 0).score >= target) return 0;
  if (applyGrowth(unit, 500).score < target) return null;
  let lo = 0;
  let hi = 500;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (applyGrowth(unit, mid).score >= target) hi = mid;
    else lo = mid;
  }
  return Math.round(hi);
}

export type SweepPoint = {
  g: number;
  score: number;
  grade: Grade;
  p: number;
  ensemble: number;
};

export type ThreatReport = {
  name: string;
  sidoName: string;
  kind: Unit["kind"];
  growth: number;
  currentScore: number;
  currentGrade: Grade;
  grownScore: number;
  grownGrade: Grade;
  delta: number;
  pNow: number;
  pGrown: number;
  elasticity: number;
  crossCaution: number | null;
  crossWarn: number | null;
  crossOver: number | null;
  series: SweepPoint[];
  driver: "G" | "P" | "R";
  driverShare: number;
  percentileNow: number;
  percentileGrown: number;
  summary: string;
  bullets: string[];
  label: string;
};

function driverOf(unit: Unit, growth: number): { key: "G" | "P" | "R"; share: number } {
  const pred = ensemblePredict(unit, growth);
  const entries = [
    ["G", pred.contrib.G],
    ["P", pred.contrib.P],
    ["R", pred.contrib.R],
  ] as const;
  const top = [...entries].sort((a, b) => b[1] - a[1])[0];
  return { key: top[0], share: top[1] };
}

export function assessThreat(unit: Unit, growth: number): ThreatReport {
  const g = Math.min(500, Math.max(0, growth));
  const now = applyGrowth(unit, 0);
  const grown = applyGrowth(unit, g);
  const plus20 = applyGrowth(unit, 20);
  const elasticity = Math.round(((plus20.score - now.score) / 2) * 10) / 10;
  const series: SweepPoint[] = THREAT_STEPS.map((step) => {
    const u = applyGrowth(unit, step);
    const pred = ensemblePredict(unit, step);
    return {
      g: step,
      score: u.score,
      grade: gradeOf(u.score),
      p: threatIndex(u.score),
      ensemble: pred.ensemble,
    };
  });
  const drv = driverOf(unit, g);
  const crossCaution = growthToReach(unit, 60);
  const crossWarn = growthToReach(unit, 80);
  const crossOver = growthToReach(unit, 100);
  const pctNow = percentile(now.score, 0);
  const pctGrown = percentile(grown.score, g);
  const where = topicParticle(unit.name);
  const label = unit.kind === "sgg" ? `${unit.name} · ${unit.sidoName}` : unit.name;

  const bullets: string[] = [];
  bullets.push(
    `현재 ${now.score.toFixed(1)}점(${gradeOf(now.score)}), 전국 상위 ${pctNow}%.`,
  );
  if (g > 0) {
    bullets.push(
      `수요 +${g}% 시 ${grown.score.toFixed(1)}점(${gradeOf(grown.score)}), ${
        grown.score - now.score >= 0 ? "+" : ""
      }${(grown.score - now.score).toFixed(1)}점 · 상위 ${pctGrown}%.`,
    );
  } else {
    bullets.push(`수요 10% 증가마다 점수가 약 ${elasticity.toFixed(1)}점 올라갑니다.`);
  }
  if (crossWarn === 0) bullets.push("이미 위험 구간(80점)에 있습니다. 최우선 점검 대상입니다.");
  else if (crossWarn != null)
    bullets.push(`위험 구간(80점) 진입은 수요 약 +${crossWarn}% 시점입니다.`);
  else bullets.push("수요 +500%까지도 위험 구간(80점)에 들어가지 않습니다.");
  if (crossOver === 0) bullets.push("이미 보정 상한(100점)을 넘었습니다.");
  else if (crossOver != null)
    bullets.push(`초과(100점+)는 수요 약 +${crossOver}%에서 발생합니다.`);
  const driverName = drv.key === "G" ? "수요·설비 격차 G" : drv.key === "P" ? "여름 피크 P" : "주택용 비중 R";
  bullets.push(`점수를 끌어올리는 주원인은 ${driverName}(기여 ${drv.share.toFixed(1)})입니다.`);

  let summary = `${where} 현재 ${now.score.toFixed(1)}점(${gradeOf(now.score)})입니다.`;
  if (g > 0) {
    summary += ` 수요가 ${g}% 늘면 ${grown.score.toFixed(1)}점(${gradeOf(grown.score)})이 됩니다.`;
  }
  if (crossWarn != null && crossWarn > 0 && (g === 0 || grown.score < 80)) {
    summary += ` 변압기 여유를 이 모형으로 보면, 수요가 약 ${crossWarn}% 늘 때 위험 구간에 들어갑니다.`;
  } else if (grown.score >= 80) {
    summary += " 지금 시나리오만으로도 우선점검 상위권입니다.";
  } else {
    summary += ` 수요 충격에 대한 민감도는 10%당 ${elasticity.toFixed(1)}점입니다.`;
  }
  summary += " 이 숫자는 고장 확률이 아니라 점검 순서입니다.";

  return {
    name: unit.name,
    sidoName: unit.sidoName,
    kind: unit.kind,
    growth: g,
    currentScore: now.score,
    currentGrade: gradeOf(now.score),
    grownScore: grown.score,
    grownGrade: gradeOf(grown.score),
    delta: Math.round((grown.score - now.score) * 10) / 10,
    pNow: threatIndex(now.score),
    pGrown: threatIndex(grown.score),
    elasticity,
    crossCaution,
    crossWarn,
    crossOver,
    series,
    driver: drv.key,
    driverShare: drv.share,
    percentileNow: pctNow,
    percentileGrown: pctGrown,
    summary,
    bullets,
    label,
  };
}

export function compactThreat(r: ThreatReport) {
  return {
    name: r.label,
    now: `${r.currentScore} ${r.currentGrade} p${r.pNow}`,
    atGrowth: `+${r.growth}% → ${r.grownScore} ${r.grownGrade} p${r.pGrown}`,
    elasticityPer10: r.elasticity,
    enterCaution: r.crossCaution,
    enterDanger: r.crossWarn,
    enterOver: r.crossOver,
    driver: r.driver,
    pct: [r.percentileNow, r.percentileGrown],
    series: r.series.map((s) => ({ g: s.g, score: s.score, grade: s.grade })),
  };
}

export function nationalBrief(growth: number) {
  const s = nationalStats(growth);
  return {
    n: s.n,
    avg: Math.round(s.avg * 10) / 10,
    urgent: s.urgent,
    top: s.scored.slice(0, 5).map((u) => ({
      name: `${u.name} · ${u.sidoName}`,
      score: u.score,
      grade: gradeOf(u.score),
    })),
  };
}

export function unitFromIds(sidoId: string | null, sggName: string | null): Unit | null {
  if (!sidoId) return null;
  return findUnit(sidoId, sggName);
}
