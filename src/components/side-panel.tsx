import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import {
  SIDO_LIST,
  applyGrowth,
  findUnit,
  gradeColor,
  gradeOf,
  nationalStats,
} from "@/lib/scoring";
import { explain } from "@/lib/explain";
import { ensemblePredict, GROWTH_PRESETS } from "@/lib/predictor";
import { validationTable } from "@/lib/validation";
import { ThreatAi } from "@/components/threat-ai";
import { DemandProfile } from "@/components/demand-profile";
import { SourcesView } from "@/components/sources-view";
import { ContestBrief } from "@/components/contest-brief";
import { useMapStore } from "@/lib/store";
import { DEFAULT_KAKAO_JS_KEY } from "@/lib/kakao-key";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const TABS = [
  { id: "board", label: "상황판" },
  { id: "region", label: "지역" },
  { id: "detail", label: "상세" },
  { id: "method", label: "방법" },
  { id: "sources", label: "출처" },
] as const;

export function SidePanel() {
  const tab = useMapStore((s) => s.tab);
  const setTab = useMapStore((s) => s.setTab);
  return (
    <aside className="glass flex h-full min-h-0 min-w-0 flex-col border-t md:rounded-2xl md:border">
      <div className="flex h-11 shrink-0 overflow-x-auto border-b border-border sm:h-12">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "min-w-0 flex-1 border-b-2 px-1.5 text-[11px] font-medium whitespace-nowrap transition-colors sm:min-w-12 sm:px-2 sm:text-xs",
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {tab === "board" && <BoardView />}
        {tab === "region" && <RegionView />}
        {tab === "detail" && <DetailView />}
        {tab === "method" && (
          <div className="space-y-8">
            <ContestBrief />
            <MethodView />
            <ValidView />
          </div>
        )}
        {tab === "sources" && (
          <div className="space-y-8">
            <SourcesView />
            <ApiView />
          </div>
        )}
      </div>
    </aside>
  );
}

function BoardView() {
  const growth = useMapStore((s) => s.growth);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const stats = useMemo(() => nationalStats(growth), [growth]);
  const labels = ["안전", "관심", "주의", "경계", "위험", "초과"];
  const cols = ["#A7F3D0", "#6EE7B7", "#FCD34D", "#FB923C", "#F87171", "#B91C1C"];
  return (
    <div>
      <p className="text-xs text-muted-foreground">즉시 점검이 필요한 지역</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="font-display text-[2rem] leading-none tabular-nums sm:text-hero">
          {stats.urgent}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-foreground">
          위험·경계
        </span>
      </div>
      <h2 className="mt-2 text-base font-semibold">전국 통합 상황판</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        229개 시·군·구 우선점검 점수입니다. 수요가 보정 범위를 넘으면 점수는
        100을 초과할 수 있습니다. 점수는 고장 확률이 아니라 점검 순서입니다.
        G·P·R은 변압기 원자료가 공개되지 않아 공개 패턴 프로토타입입니다.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="전국 평균" value={stats.avg.toFixed(1)} hint="점" />
        <Stat label="최위험" value={stats.top?.name ?? "—"} hint={`${stats.top?.score.toFixed(1) ?? "—"}점`} />
        <Stat label="분석 단위" value={String(stats.n)} hint="시군구" />
      </div>
      <GrowthControl />
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        등급 분포
      </p>
      <div className="mt-2 flex h-2 overflow-hidden rounded-full">
        {stats.counts.map((c, i) => (
          <i
            key={labels[i]}
            style={{ width: `${(c / stats.n) * 100}%`, background: cols[i] }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {labels.map((l, i) => (
          <span key={l}>
            <i
              className="mr-1 inline-block size-2 rounded-sm"
              style={{ background: cols[i] }}
            />
            {l} {stats.counts[i]}
          </span>
        ))}
      </div>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        우선 점검 TOP 8
      </p>
      <ul className="mt-1">
        {stats.scored.slice(0, 8).map((u, i) => (
          <li key={`${u.sidoId}-${u.name}`}>
            <button
              type="button"
              onClick={() => selectSgg(u.sidoId, u.name)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: gradeColor(u.score) }}
              />
              <span className="min-w-0 flex-1 truncate text-sm">
                {i + 1}. {u.name}
                <span className="text-muted-foreground"> · {u.sidoName}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{u.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg bg-muted px-2 py-2 text-center">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold tabular-nums">{value}</div>
      <div className="text-[10px] text-muted-foreground">{hint}</div>
    </div>
  );
}

function GrowthControl() {
  const growth = useMapStore((s) => s.growth);
  const setGrowth = useMapStore((s) => s.setGrowth);
  const [draft, setDraft] = useState(String(growth));
  const presetHit = (GROWTH_PRESETS as readonly number[]).includes(growth);

  useEffect(() => {
    setDraft(String(growth));
  }, [growth]);

  return (
    <div className="mt-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        수요 증가 시나리오
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        +100% 이상도 가능합니다. 직접 입력은 0–500%.
      </p>
      <div className="mt-2 grid grid-cols-5 gap-1">
        {GROWTH_PRESETS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              setGrowth(g);
              setDraft(String(g));
            }}
            className={cn(
              "rounded-lg border px-1 py-2 text-xs font-medium",
              growth === g
                ? "border-foreground bg-foreground text-background"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            {g === 0 ? "현재" : `+${g}%`}
          </button>
        ))}
      </div>
      <label className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2">
        <span className="shrink-0 text-xs text-muted-foreground">직접</span>
        <input
          type="number"
          min={0}
          max={500}
          step={1}
          inputMode="numeric"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            const n = Number(draft);
            if (!Number.isFinite(n)) {
              setDraft(String(growth));
              return;
            }
            const v = Math.min(500, Math.max(0, Math.round(n)));
            setGrowth(v);
            setDraft(String(v));
          }}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            (e.target as HTMLInputElement).blur();
          }}
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold tabular-nums outline-none"
          aria-label="수요 증가율 직접 입력"
        />
        <span className="shrink-0 text-xs font-medium text-muted-foreground">%</span>
      </label>
      {!presetHit && (
        <p className="mt-1 text-[11px] text-muted-foreground">현재 적용 +{growth}%</p>
      )}
    </div>
  );
}

function RegionView() {
  const sidoId = useMapStore((s) => s.sidoId);
  const growth = useMapStore((s) => s.growth);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const selectNation = useMapStore((s) => s.selectNation);
  const [q, setQ] = useState("");

  if (!sidoId) {
    const list = [...SIDO_LIST].sort(
      (a, b) => applyGrowth(findUnit(b.id)!, growth).score - applyGrowth(findUnit(a.id)!, growth).score,
    );
    return (
      <div>
        <label className="relative block">
          <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="시·군·구 검색"
            className="h-10 w-full rounded-lg border border-border bg-muted pr-3 pl-8 text-sm outline-none focus:bg-card"
          />
        </label>
        {q.trim() ? (
          <SearchHits q={q} />
        ) : (
          <>
            <h2 className="mt-3 text-base font-semibold">{SIDO_LIST.length}개 시·도</h2>
            <p className="mt-1 mb-3 text-xs text-muted-foreground">
              시·도를 누르면 시·군·구 목록으로 이동합니다.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {list.map((s) => {
                const sc = applyGrowth(findUnit(s.id)!, growth);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSido(s.id)}
                    className="rounded-xl border border-border p-3 text-left hover:bg-muted"
                  >
                    <div className="text-sm font-semibold">{s.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {s.children.length}곳 · {sc.score.toFixed(1)}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  const s = SIDO_LIST.find((x) => x.id === sidoId);
  if (!s) return null;
  const kids = [...s.children]
    .map((c) => applyGrowth(findUnit(s.id, c.name)!, growth))
    .sort((a, b) => b.score - a.score);

  return (
    <div>
      <button type="button" onClick={selectNation} className="text-xs font-semibold text-primary">
        전국
      </button>
      <span className="whitespace-nowrap text-muted-foreground"> › {s.name}</span>
      <h2 className="mt-2 text-base font-semibold">{s.name}</h2>
      <p className="mb-2 text-xs text-muted-foreground">시·군·구 {s.children.length}곳</p>
      <button
        type="button"
        onClick={() => selectSido(s.id)}
        className="mb-2 w-full rounded-xl border border-border p-3 text-left hover:bg-muted"
      >
        <div className="text-sm font-semibold">{s.name} 전체</div>
        <div className="text-xs text-muted-foreground">
          광역 평균 {applyGrowth(findUnit(s.id)!, growth).score.toFixed(1)}
        </div>
      </button>
      <ul>
        {kids.map((u) => (
          <li key={u.name}>
            <button
              type="button"
              onClick={() => selectSgg(s.id, u.name)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 hover:bg-muted"
            >
              <span
                className="size-2.5 rounded-full"
                style={{ background: gradeColor(u.score) }}
              />
              <span className="flex-1 text-left text-sm">{u.name}</span>
              <span className="text-sm font-semibold tabular-nums">{u.score.toFixed(1)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchHits({ q }: { q: string }) {
  const selectSgg = useMapStore((s) => s.selectSgg);
  const selectSido = useMapStore((s) => s.selectSido);
  const growth = useMapStore((s) => s.growth);
  const hits = useMemo(() => {
    const t = q.trim();
    const sgg = SIDO_LIST.flatMap((s) =>
      s.children
        .filter(
          (c) =>
            c.name.includes(t) ||
            s.name.includes(t) ||
            s.short.includes(t) ||
            (t === "광주광역시" && s.id === "전남광주") ||
            (t === "전라남도" && s.id === "전남광주"),
        )
        .map((c) => ({ sidoId: s.id, sidoName: s.name, name: c.name })),
    ).slice(0, 12);
    return sgg;
  }, [q]);
  if (!hits.length) return <p className="mt-3 text-sm text-muted-foreground">검색 결과가 없습니다.</p>;
  return (
    <ul className="mt-2">
      {hits.map((h) => {
        const u = applyGrowth(findUnit(h.sidoId, h.name)!, growth);
        return (
          <li key={`${h.sidoId}-${h.name}`}>
            <button
              type="button"
              onClick={() => {
                selectSido(h.sidoId);
                selectSgg(h.sidoId, h.name);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-muted"
            >
              <span className="flex-1 text-sm">
                {h.name} <span className="text-muted-foreground">· {h.sidoName}</span>
              </span>
              <span className="text-sm font-semibold tabular-nums">{u.score.toFixed(1)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function DetailView() {
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const growth = useMapStore((s) => s.growth);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectNation = useMapStore((s) => s.selectNation);

  if (!sidoId) {
    return (
      <p className="text-sm text-muted-foreground">
        지도 또는 지역 탭에서 시·군·구를 선택하세요.
      </p>
    );
  }
  const base = findUnit(sidoId, sggName);
  if (!base) return null;
  const u = applyGrowth(base, growth);
  const ex = explain(base, growth);
  const pred = ensemblePredict(base, growth);
  const g = gradeOf(u.score);
  const chart = [
    { name: "G×w", v: pred.contrib.G },
    { name: "P×w", v: pred.contrib.P },
    { name: "R×w", v: pred.contrib.R },
  ];

  return (
    <div>
      <button
        type="button"
        onClick={() => (sggName ? selectSido(sidoId) : selectNation())}
        className="mb-2 text-xs font-medium text-muted-foreground hover:text-foreground"
      >
        ← 돌아가기
      </button>
      <p className="text-xs text-muted-foreground">우선점검 점수</p>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-[2rem] leading-none tabular-nums sm:text-hero">
          {u.score.toFixed(1)}
        </span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{
            background: `${gradeColor(u.score)}33`,
            color: u.score >= 100 ? "#7F1D1D" : "#9a3412",
          }}
        >
          {g}
        </span>
      </div>
      <h2 className="mt-1 text-base font-semibold">
        {u.name}
        {u.kind === "sgg" ? ` · ${u.sidoName}` : ""}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{ex.headline}</p>
      <DemandProfile unit={base} />
      <GrowthControl />
      <ThreatAi unit={base} growth={growth} />
      {growth > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">
          현재 {pred.current.toFixed(1)} → +{growth}% 시 {pred.grown.toFixed(1)} (
          {pred.delta >= 0 ? "+" : ""}
          {pred.delta}) · 앙상블 {pred.ensemble.toFixed(1)}
        </p>
      )}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        설명 가능한 원인
      </p>
      <ol className="mt-2 space-y-2">
        {ex.reasons.map((r, i) => (
          <li key={r.title} className="rounded-lg bg-muted p-3">
            <div className="text-sm font-semibold">
              {i + 1}. {r.title}
              <span className="ml-2 text-xs font-medium text-muted-foreground">
                기여 {r.share.toFixed(1)}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.detail}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm font-medium">{ex.action}</p>
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        가중 기여
      </p>
      <div className="mt-1 h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
            <XAxis type="number" hide domain={[0, 80]} />
            <YAxis type="category" dataKey="name" width={40} tick={{ fontSize: 11 }} />
            <Bar dataKey="v" radius={[0, 6, 6, 0]} barSize={14}>
              {chart.map((e) => (
                <Cell key={e.name} fill="#1D4ED8" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MethodView() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <h2 className="text-base font-semibold text-foreground">우선점검 점수 산출식</h2>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">흐름</h3>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-foreground">
          공개지표 G,P,R
          <br />→ Min–Max 정규화
          <br />→ 점수 100(0.45nG+0.35nP+0.20nR)
          <br />→ 수요 g% 로 G·P 증폭
          <br />→ 위협지수 = 로지스틱(점수)
          <br />→ 챗봇은 이 숫자만 인용
        </p>
      </section>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">이론</h3>
        <p className="mt-1">
          OECD/JRC 복합지표 핸드북(2008)의 Min–Max 정규화와 TOPSIS(Hwang & Yoon,
          1981) 상대근접도를 결합했습니다. 이상해가 (1,1,1)이면 근접도는 가중
          합산과 같습니다.
        </p>
      </section>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">지표</h3>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-card p-2 text-xs text-foreground">
{`G = (1 + Δ수요) / (1 + Δ설비)
P = 7·8월 사용량 / 연평균 월사용량
R = 주택용 / 전체 판매량`}
        </pre>
      </section>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">점수</h3>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-card p-2 text-xs text-foreground">
{`Ñ = (X − min) / (max − min)   (하한 0, 상한 없음)
S' = 0.45ÑG + 0.35ÑP + 0.20ÑR
Score = 100 × S'`}
        </pre>
        <p className="mt-2">
          현재 데이터 범위 안에서는 0–100입니다. 수요 시나리오가 보정 최댓값(max)을
          넘으면 점수는 100을 초과합니다. 점수는 절대 고장확률이 아닙니다.
        </p>
      </section>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">시나리오 모형</h3>
        <p className="mt-1">
          수요 증가율 g에 대해 G는 0.85g, P는 0.45g만큼 민감하게 올립니다. g는
          0–500%(+100% 이상 포함)입니다. 보정 범위를 넘긴 값은 100점을
          초과합니다. 앙상블은 가중치가 다른 세 개의 결정 규칙을 평균합니다.
        </p>
      </section>
    </div>
  );
}

function ValidView() {
  const growth = useMapStore((s) => s.growth);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const v = useMemo(() => validationTable(growth), [growth]);
  return (
    <div>
      <h2 className="text-base font-semibold">사고 보도 지역 대조</h2>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        정전 보도를 <strong className="text-foreground">설비</strong>와{" "}
        <strong className="text-foreground">외인</strong>(화재·추돌)으로 나눕니다.
        상위 20% 적중은 설비 사례만 본 지표입니다. 표본 {v.n}건이라 Spearman은
        참고입니다.
      </p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Stat label="설비 적중" value={`${v.equipHits}/${v.equipN}`} hint="상위 20%" />
        <Stat label="외인 참고" value={`${v.extN}건`} hint="인과 없음" />
        <Stat label="Spearman" value={v.spearman.toFixed(2)} hint="n=6 참고" />
      </div>
      <ul className="mt-3 divide-y divide-border">
        {v.rows.map((r) => (
          <li key={r.region}>
            <button
              type="button"
              onClick={() => selectSgg(r.sidoId, r.name)}
              className="flex w-full items-start gap-2 py-2 text-left hover:bg-muted"
            >
              <span
                className={cn(
                  "mt-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  r.hit ? "bg-muted text-foreground" : "text-muted-foreground",
                )}
              >
                {r.kind} · {r.hit ? "상위20%" : "밖"}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{r.region}</span>
                <span className="block text-xs text-muted-foreground">
                  {r.date} · {r.cause} · {r.event}
                </span>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 inline-block text-[11px] font-medium text-foreground underline"
                >
                  {r.org} 원문
                </a>
              </span>
              <span className="text-right text-xs tabular-nums">
                {r.score.toFixed(1)}
                <span className="block text-muted-foreground">상위 {r.pct}%</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ApiView() {
  const status = useMapStore((s) => s.kakaoStatus);
  const error = useMapStore((s) => s.kakaoError);
  const setKakaoKey = useMapStore((s) => s.setKakaoKey);
  const label =
    status === "on" ? "연결됨" : status === "loading" ? "연결 중" : status === "error" ? "실패" : "대기";
  return (
    <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
      <h2 className="text-base font-semibold text-foreground">카카오맵 Open API</h2>
      <p>
        JavaScript 키는 사이트에 이미 넣어 두었습니다. 카카오맵으로 바꾸면 바로 타일이 열립니다.
        도메인이 콘솔에 없으면 타일이 막힐 수 있습니다.
      </p>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">Web 플랫폼 도메인</h3>
        <p className="mt-1">
          카카오 디벨로퍼스 → 앱 설정 → 플랫폼 → Web에 이 사이트가 열리는 주소를 등록합니다.
        </p>
        <a
          className="mt-2 inline-block text-xs font-medium text-foreground underline"
          href="https://developers.kakao.com/console/app"
          target="_blank"
          rel="noreferrer"
        >
          developers.kakao.com 콘솔
        </a>
      </section>
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">연결 상태 · {label}</h3>
        {error && <p className="mt-1 text-red-700">{error}</p>}
        {status !== "on" && (
          <button
            type="button"
            className="mt-2 rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background"
            onClick={() => setKakaoKey(DEFAULT_KAKAO_JS_KEY)}
          >
            다시 연결
          </button>
        )}
      </section>
    </div>
  );
}
