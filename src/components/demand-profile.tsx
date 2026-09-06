import { analyzeDemand, formatPop, SOCIO_POP_DATE } from "@/lib/socio";
import type { Unit } from "@/lib/types";
import { useMapStore } from "@/lib/store";

export function DemandProfile({ unit }: { unit: Unit }) {
  const setTab = useMapStore((s) => s.setTab);
  const p = analyzeDemand(unit);
  if (!p) return null;
  return (
    <section className="glass-soft mt-4 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          인구 · 산업 수요
        </p>
        <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {p.character}
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground">{p.headline}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Mini label="인구" value={formatPop(p.pop)} hint={`${SOCIO_POP_DATE.replace("-", ".")} 행안부`} />
        <Mini label="추정 판매" value={p.salesGwh.toLocaleString("ko-KR")} hint="GWh / 년" />
        <Mini label="1인당" value={p.kwhCap.toLocaleString("ko-KR")} hint="kWh" />
      </div>
      <p className="mt-3 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
        이 지역 부하 구성 (추정)
      </p>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full">
        <i className="bg-foreground" style={{ width: `${p.localInd}%` }} />
        <i className="bg-primary" style={{ width: `${p.localRes}%` }} />
        <i className="bg-border" style={{ width: `${p.localGen}%` }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>산업 {p.localInd}%</span>
        <span>주택 지수 {p.localRes}%</span>
        <span>일반·업무 {p.localGen}%</span>
      </div>
      <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
        {p.bullets.map((b) => (
          <li key={b}>· {b}</li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        인구는 행정안전부 주민등록 원숫자입니다. 산업용 GWh는 한전 광역 용도 비중을 인구로
        나눈 추정치이며, 변압기 실측이 아닙니다.{" "}
        <button type="button" className="font-medium text-foreground underline" onClick={() => setTab("sources")}>
          출처 보기
        </button>
      </p>
    </section>
  );
}

function Mini({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-card px-2 py-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}
