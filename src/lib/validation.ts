import { ALL_SGG, applyGrowth } from "./scoring";

export type CaseKind = "설비" | "외인";

export type CaseRow = {
  region: string;
  sidoId: string;
  name: string;
  date: string;
  event: string;
  households?: string;
  url: string;
  org: string;
  cause: string;
  kind: CaseKind;
};

export const INCIDENT_CASES: CaseRow[] = [
  {
    region: "경기 남양주",
    sidoId: "경기도",
    name: "남양주시",
    date: "2025.07.10",
    event: "화도읍 아파트 지하주차장 화재로 약 370가구 정전",
    households: "약 370가구",
    url: "https://www.yna.co.kr/view/AKR20250710053300060",
    org: "연합뉴스",
    cause: "화재(공급 중단)",
    kind: "외인",
  },
  {
    region: "경기 군포",
    sidoId: "경기도",
    name: "군포시",
    date: "2025.08.12",
    event: "당동 버스가 변압기 추돌, 아파트 2,255세대 정전",
    households: "2,255세대",
    url: "https://www.yna.co.kr/view/AKR20250812008600061",
    org: "연합뉴스",
    cause: "변압기 충돌",
    kind: "외인",
  },
  {
    region: "인천 연수구",
    sidoId: "인천광역시",
    name: "연수구",
    date: "2026.05.22",
    event: "송도·동춘·연수 일대 약 1,900세대 정전",
    households: "약 1,900세대",
    url: "https://www.yna.co.kr/view/AKR20260522007600065",
    org: "연합뉴스",
    cause: "아파트 설비 고장",
    kind: "설비",
  },
  {
    region: "인천 남동구",
    sidoId: "인천광역시",
    name: "남동구",
    date: "2025.07.06",
    event: "아파트 약 1,200가구 정전, 승강기 갇힘",
    households: "약 1,200가구",
    url: "https://www.kyeonggi.com/article/20250706580017",
    org: "경기일보",
    cause: "아파트 정전",
    kind: "설비",
  },
  {
    region: "광주 동구",
    sidoId: "전남광주",
    name: "동구",
    date: "2023.06.22",
    event: "산수동 아파트 변압기 고장, 약 950세대",
    households: "약 950세대",
    url: "https://news.ikbc.co.kr/article/view/kbc202306230013",
    org: "kbc 광주방송",
    cause: "변압기 고장",
    kind: "설비",
  },
  {
    region: "대구 달서구",
    sidoId: "대구광역시",
    name: "달서구",
    date: "2025.08.08",
    event: "도원동 피뢰기 파손, 약 2,900세대 정전",
    households: "약 2,900세대",
    url: "https://www.yna.co.kr/view/AKR20250808064800053",
    org: "연합뉴스",
    cause: "피뢰기 파손",
    kind: "설비",
  },
];

function rankOf(sidoId: string, name: string, growth: number) {
  const scored = ALL_SGG.map((u) => applyGrowth(u, growth)).sort(
    (a, b) => b.score - a.score,
  );
  const i = scored.findIndex((u) => u.sidoId === sidoId && u.name === name);
  const unit = scored[i];
  return {
    rank: i + 1,
    n: scored.length,
    score: unit?.score ?? 0,
    pct: Math.round(((i + 1) / scored.length) * 1000) / 10,
  };
}

export function validationTable(growth: number) {
  const rows = INCIDENT_CASES.map((c) => {
    const r = rankOf(c.sidoId, c.name, growth);
    const hit = r.pct <= 20;
    return { ...c, ...r, hit };
  });
  const hits = rows.filter((r) => r.hit).length;
  const equip = rows.filter((r) => r.kind === "설비");
  const equipHits = equip.filter((r) => r.hit).length;
  const x = rows.map((_, i) => i + 1);
  const y = rows.map((r) => r.rank);
  const spearman = spearmanRho(x, y);
  return {
    rows,
    hits,
    spearman,
    n: rows.length,
    equipHits,
    equipN: equip.length,
    extN: rows.length - equip.length,
  };
}

function spearmanRho(x: number[], y: number[]) {
  const n = x.length;
  const rx = ranks(x);
  const ry = ranks(y);
  const mx = mean(rx);
  const my = mean(ry);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const a = rx[i] - mx;
    const b = ry[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : Math.round((num / den) * 100) / 100;
}

function ranks(arr: number[]) {
  const order = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const r = Array(arr.length).fill(0);
  order.forEach((o, idx) => {
    r[o.i] = idx + 1;
  });
  return r;
}

function mean(a: number[]) {
  return a.reduce((s, v) => s + v, 0) / a.length;
}
