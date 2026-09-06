import socioRaw from "@/data/socio.json";
import { ALL_SGG, SIDO_LIST } from "./scoring";
import type { Unit } from "./types";

type SocioRec = {
  pop: number;
  salesGwh: number;
  kwhCap: number;
  indPct: number;
  resPct: number;
  genPct: number;
  mapNote?: string;
};

const DATA = socioRaw as {
  popDate: string;
  popSource: string;
  units: Record<string, SocioRec>;
};

export const SOCIO_POP_DATE = DATA.popDate;

function keyOf(unit: Unit) {
  return unit.kind === "sgg" ? `${unit.sidoId}|${unit.name}` : unit.sidoId;
}

export function socioOf(unit: Unit): SocioRec | null {
  return DATA.units[keyOf(unit)] ?? DATA.units[unit.sidoId] ?? null;
}

export function formatPop(n: number) {
  return n.toLocaleString("ko-KR");
}

export type DemandProfile = {
  pop: number;
  popShare: number;
  salesGwh: number;
  kwhCap: number;
  sidoKwhCap: number;
  indPct: number;
  resPct: number;
  genPct: number;
  localRes: number;
  localInd: number;
  localGen: number;
  mapNote?: string;
  character: "주거밀집" | "산업집적" | "혼합";
  headline: string;
  bullets: string[];
};

export function analyzeDemand(unit: Unit): DemandProfile | null {
  const rec = socioOf(unit);
  const sido = DATA.units[unit.sidoId];
  if (!rec || !sido) return null;
  const sidoPop = sido.pop || 1;
  const popShare = Math.round((rec.pop / sidoPop) * 1000) / 10;
  const localRes = unit.res;
  const nonRes = Math.max(8, 100 - localRes);
  const sidoNonRes = Math.max(8, 100 - sido.resPct);
  const localInd = Math.round(
    Math.min(88, Math.max(5, (sido.indPct * nonRes) / sidoNonRes)),
  );
  const localGen = Math.max(0, Math.round(nonRes - localInd));
  const character: DemandProfile["character"] =
    localInd >= 55 ? "산업집적" : localRes >= 55 ? "주거밀집" : "혼합";

  const vsCap = rec.kwhCap - sido.kwhCap;
  const natPop = SIDO_LIST.reduce((s, x) => s + (DATA.units[x.id]?.pop ?? 0), 0);
  const popNat = Math.round((rec.pop / natPop) * 10000) / 100;

  const bullets = [
    `주민등록 인구 ${formatPop(rec.pop)}명 (${SOCIO_POP_DATE.replace("-", ".")} 기준, 전국의 ${popNat}%).`,
    unit.kind === "sgg"
      ? `${unit.sidoName} 인구의 ${popShare}%를 차지합니다.`
      : `산하 시·군·구 ${SIDO_LIST.find((s) => s.id === unit.sidoId)?.children.length ?? 0}곳의 합입니다.`,
    `추정 전력판매 ${rec.salesGwh.toLocaleString("ko-KR")} GWh, 1인당 약 ${rec.kwhCap.toLocaleString("ko-KR")} kWh.`,
    `광역 용도 구조는 산업 ${sido.indPct}% · 주택 ${sido.resPct}% · 일반 ${sido.genPct}%입니다.`,
    `이 지역 주택용 지수 ${localRes}%를 반영하면 산업 부하 추정 ${localInd}%, 일반·업무 ${localGen}%입니다.`,
  ];
  if (vsCap > 1500) {
    bullets.push("1인당 전력이 광역보다 높아 산업·대규모 부하가 설비 여유를 빨리 잠식합니다.");
  } else if (character === "주거밀집") {
    bullets.push("주거 밀집 지역이라 여름 냉방 피크가 오르면 주택용 변압기 과부하 위험이 커집니다.");
  } else {
    bullets.push("주거와 산업이 섞여 있어 피크와 기저 부하를 함께 봐야 합니다.");
  }
  if (rec.mapNote) bullets.push(`인구 대응: ${rec.mapNote}.`);

  const where = unit.name;
  let headline = "";
  if (character === "산업집적") {
    headline = `${where}는 산업용 부하 비중이 약 ${localInd}%로 추정됩니다. 공장·대규모 수요가 변압기 용량 대비 격차(G)를 키우는 유형입니다.`;
  } else if (character === "주거밀집") {
    headline = `${where}는 인구 ${formatPop(rec.pop)}명의 주거 밀집 지역입니다. 주택용 지수 ${localRes}%라 여름 피크(P)와 주택 비중(R)에 점수가 민감합니다.`;
  } else {
    headline = `${where}는 인구 ${formatPop(rec.pop)}명, 산업 추정 ${localInd}% · 주택 지수 ${localRes}%의 혼합 수요 구조입니다.`;
  }

  return {
    pop: rec.pop,
    popShare,
    salesGwh: rec.salesGwh,
    kwhCap: rec.kwhCap,
    sidoKwhCap: sido.kwhCap,
    indPct: sido.indPct,
    resPct: sido.resPct,
    genPct: sido.genPct,
    localRes,
    localInd,
    localGen,
    mapNote: rec.mapNote,
    character,
    headline,
    bullets,
  };
}

export function socioCoverage() {
  const ok = ALL_SGG.filter((u) => socioOf(u)).length;
  return { ok, n: ALL_SGG.length };
}
