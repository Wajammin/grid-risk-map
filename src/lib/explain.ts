import { ALL_SGG, WEIGHTS, applyGrowth, compositeScore, gradeOf, percentile } from "./scoring";
import type { Unit } from "./types";

export type Reason = {
  title: string;
  detail: string;
  share: number;
};

export type Explanation = {
  headline: string;
  grade: string;
  percentile: number;
  reasons: Reason[];
  action: string;
  vsAvg: { gap: number; peak: number; res: number };
};

export function explain(unit: Unit, growth: number): Explanation {
  const u = applyGrowth(unit, growth);
  const scored = compositeScore(u.gap, u.peak, u.res);
  const avgGap = ALL_SGG.reduce((s, x) => s + x.gap, 0) / ALL_SGG.length;
  const avgPeak = ALL_SGG.reduce((s, x) => s + x.peak, 0) / ALL_SGG.length;
  const avgRes = ALL_SGG.reduce((s, x) => s + x.res, 0) / ALL_SGG.length;
  const pct = percentile(u.score, growth);
  const rankShare = Math.max(0.4, pct === 0 ? 0.4 : pct);
  const reasons: Reason[] = [
    {
      title: "수요·설비 격차 G",
      detail: `격차 ${u.gap.toFixed(2)} (전국 평균 ${avgGap.toFixed(2)}, 차이 ${(((u.gap - avgGap) / avgGap) * 100).toFixed(0)}%)`,
      share: scored.contrib.G,
    },
    {
      title: "여름 피크비 P",
      detail: `7·8월/연평균 ${u.peak.toFixed(2)} (전국 평균 ${avgPeak.toFixed(2)})`,
      share: scored.contrib.P,
    },
    {
      title: "주택용 비중 R",
      detail: `주택용 ${u.res}% (전국 평균 ${avgRes.toFixed(0)}%)`,
      share: scored.contrib.R,
    },
  ].sort((a, b) => b.share - a.share);

  const grade = gradeOf(u.score);
  let action = "현재 우선순위는 낮습니다. 정기 점검 주기를 유지하세요.";
  if (u.score >= 100) {
    action =
      "보정 범위를 초과했습니다. 변압기 용량 증설과 부하 분산을 즉시 검토하세요.";
  } else if (u.score >= 80) {
    action = "최우선 점검 대상입니다. 변압기 용량 증설 또는 부하 분산을 검토하세요.";
  } else if (u.score >= 60) {
    action = "경계 구간입니다. 여름 피크 전 부하율·노후 설비를 확인하세요.";
  } else if (u.score >= 40) {
    action = "주의 구간입니다. 수요 증가 속도와 설비 증설 계획을 맞춰 보세요.";
  }

  const where = unit.kind === "sgg" ? `${unit.name} · ${unit.sidoName}` : unit.name;
  return {
    headline: `${where}의 우선점검 점수는 ${u.score.toFixed(1)}점(${grade})이며 전국 상위 ${rankShare}%입니다.`,
    grade,
    percentile: pct,
    reasons,
    action,
    vsAvg: {
      gap: u.gap - avgGap,
      peak: u.peak - avgPeak,
      res: u.res - avgRes,
    },
  };
}

export function weightLabel() {
  return `wG ${WEIGHTS.G} · wP ${WEIGHTS.P} · wR ${WEIGHTS.R}`;
}
