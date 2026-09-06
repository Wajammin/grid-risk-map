import { ALL_SGG, SIDO_LIST, findUnit } from "@/lib/scoring";
import { assessThreat, compactThreat, nationalBrief, unitFromIds } from "@/lib/threat";
import type { Unit } from "@/lib/types";

type Hit = { unit: Unit; nlen: number };

function indexNeedles(): { needle: string; sidoId: string; name: string | null }[] {
  const out: { needle: string; sidoId: string; name: string | null }[] = [];
  for (const s of SIDO_LIST) {
    out.push({ needle: s.name, sidoId: s.id, name: null });
    out.push({ needle: s.short, sidoId: s.id, name: null });
    const stripped = s.name.replace(/특별자치시|특별자치도|광역시|특별시|도$/g, "");
    if (stripped.length >= 2) out.push({ needle: stripped, sidoId: s.id, name: null });
    if (s.id === "전남광주") {
      for (const n of ["광주광역시", "전라남도", "광주", "전남"]) {
        out.push({ needle: n, sidoId: s.id, name: null });
      }
    }
    for (const c of s.children) {
      out.push({ needle: c.name, sidoId: s.id, name: c.name });
      const bare = c.name.replace(/[시군구]$/g, "");
      if (bare.length >= 2) out.push({ needle: bare, sidoId: s.id, name: c.name });
    }
  }
  return out.sort((a, b) => b.needle.length - a.needle.length);
}

const NEEDLES = indexNeedles();

export function findMentionedUnits(question: string): Unit[] {
  const t = question.replace(/\s+/g, "");
  const hits: Hit[] = [];
  const seen = new Set<string>();
  for (const n of NEEDLES) {
    if (n.needle.length < 2) continue;
    if (!t.includes(n.needle)) continue;
    const key = `${n.sidoId}::${n.name ?? ""}`;
    if (seen.has(key)) continue;
    const unit = findUnit(n.sidoId, n.name);
    if (!unit) continue;
    seen.add(key);
    hits.push({ unit, nlen: n.needle.length });
  }
  const sgg = hits.filter((h) => h.unit.kind === "sgg");
  const pick = (sgg.length ? sgg : hits).slice(0, 5);
  return pick.map((h) => h.unit);
}

export function packFacts(opts: {
  question: string;
  sidoId: string | null;
  sggName: string | null;
  growth: number;
}) {
  const mentioned = findMentionedUnits(opts.question);
  const selected = unitFromIds(opts.sidoId, opts.sggName);
  const units: Unit[] = [];
  const seen = new Set<string>();
  for (const u of [selected, ...mentioned]) {
    if (!u) continue;
    const key = `${u.sidoId}::${u.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    units.push(u);
    if (units.length >= 6) break;
  }
  const reports = units.map((u) => assessThreat(u, opts.growth));
  const payload = {
    growthPct: opts.growth,
    national: nationalBrief(opts.growth),
    selected: selected ? compactThreat(assessThreat(selected, opts.growth)) : null,
    units: reports.map(compactThreat),
    method:
      "Score=100*(0.45*nG+0.35*nP+0.20*nR). G grows with 0.85g, P with 0.45g. Score is inspection order, not outage probability. Prototype uses public-pattern indicators where transformer stats are unpublished.",
  };
  return { text: JSON.stringify(payload), units, reports };
}

export function answerLocally(question: string, facts: ReturnType<typeof packFacts>): string {
  const q = question.replace(/\s+/g, "");
  const aboutScore =
    /점수|산출|공식|어떻게|확률|고장|의미|TOPSIS|AHP|정규화/.test(question);
  const aboutTop = /가장\s*위|최악|위험.*곳|TOP|탑|전국/.test(question) && !facts.units.length;
  const nat = JSON.parse(facts.text) as {
    national: { avg: number; urgent: number; n: number; top: { name: string; score: number; grade: string }[] };
    growthPct: number;
  };

  if (aboutScore && !facts.reports.length) {
    return [
      "점수는 고장 확률이 아닙니다. 변압기·배전 설비를 어떤 순서로 볼지 정하는 우선점검 점수입니다.",
      "G(수요 대비 설비 격차) 45%, P(여름 피크) 35%, R(주택용 비중) 20%를 Min–Max 정규화한 뒤 100을 곱합니다.",
      "수요가 늘면 G는 증가율의 85%, P는 45%만큼 민감하게 오르고, 보정 최댓값을 넘으면 100점을 초과할 수 있습니다.",
      "지역 이름을 넣으면 그곳의 수요 증가 위협을 숫자로 풀어 드립니다. 예: 창원시 수요 50% 늘면?",
    ].join("\n");
  }

  if (facts.reports.length) {
    const r = facts.reports[0];
    const extra = facts.reports
      .slice(1)
      .map((x) => `· ${x.label}: 현재 ${x.currentScore.toFixed(1)} → +${x.growth}% ${x.grownScore.toFixed(1)} (${x.grownGrade})`)
      .join("\n");
    return [
      r.summary,
      ...r.bullets.map((b) => `· ${b}`),
      extra ? `\n다른 언급 지역\n${extra}` : "",
      q.includes("확률") ? "다시 강조하면, 위협 지수와 점수는 정전 확률이 아닙니다." : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (aboutTop || /전국|상황/.test(question)) {
    const top = nat.national.top
      .map((t, i) => `${i + 1}. ${t.name} ${t.score}점(${t.grade})`)
      .join("\n");
    return [
      `전국 ${nat.national.n}곳 평균 ${nat.national.avg}점, 위험·경계 ${nat.national.urgent}곳입니다. 시나리오 +${nat.growthPct}%.`,
      "우선 점검 TOP 5",
      top,
      "시·군·구 이름을 말하면 수요 증가가 얼마나 위협적인지 계산합니다.",
    ].join("\n");
  }

  const sample = ALL_SGG.slice()
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((u) => u.name)
    .join(", ");
  return [
    "배전망 우선점검 도우미입니다. 지역을 말하면 현재 점수와 수요 증가 시나리오를 계산합니다.",
    `지금은 ${sample} 등이 상위권입니다.`,
    "예: 남양주시 +50% / 점수는 고장 확률이야? / 지금 제일 위험한 곳",
  ].join("\n");
}
