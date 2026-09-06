import { ALL_SGG, SIDO_LIST, applyGrowth, findUnit, gradeColor } from "@/lib/scoring";
import { useMapStore } from "@/lib/store";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

export function RegionSearch({ compact = false }: { compact?: boolean }) {
  const growth = useMapStore((s) => s.growth);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const selectSido = useMapStore((s) => s.selectSido);
  const setSheet = useMapStore((s) => s.setSheet);
  const [q, setQ] = useState("");
  const [on, setOn] = useState(false);

  const hits = useMemo(() => {
    const t = q.trim();
    if (!t) return [];
    const sidoHits = SIDO_LIST.filter(
      (s) =>
        s.name.includes(t) ||
        s.short.includes(t) ||
        (t === "광주광역시" && s.id === "전남광주") ||
        (t === "전라남도" && s.id === "전남광주"),
    ).map((s) => ({
      kind: "sido" as const,
      sidoId: s.id,
      sidoName: s.name,
      name: s.name,
    }));
    const sggHits = ALL_SGG.filter(
      (g) =>
        g.name.includes(t) ||
        g.sidoName.includes(t) ||
        (t === "광주광역시" && g.sidoId === "전남광주") ||
        (t === "전라남도" && g.sidoId === "전남광주"),
    )
      .slice(0, 10)
      .map((g) => ({
        kind: "sgg" as const,
        sidoId: g.sidoId,
        sidoName: g.sidoName,
        name: g.name,
      }));
    return [...sidoHits, ...sggHits].slice(0, 12);
  }, [q]);

  function pick(h: (typeof hits)[number]) {
    setSheet(null);
    if (h.kind === "sido") selectSido(h.sidoId);
    else selectSgg(h.sidoId, h.name);
    setQ("");
    setOn(false);
  }

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOn(true);
        }}
        onFocus={() => setOn(true)}
        onBlur={() => window.setTimeout(() => setOn(false), 160)}
        placeholder={compact ? "지역 검색" : "지역 검색 (예: 강남구, 대구)"}
        className="h-9 w-full rounded-lg border border-border bg-muted pr-3 pl-8 text-sm outline-none focus:bg-card"
        aria-label="지역 이름 검색"
      />
      {on && q.trim() && (
        <ul className="absolute top-[calc(100%+4px)] right-0 left-0 z-30 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-1 shadow-lg">
          {hits.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">찾는 지역이 없습니다.</li>
          )}
          {hits.map((h) => {
            const u = applyGrowth(findUnit(h.sidoId, h.kind === "sgg" ? h.name : undefined)!, growth);
            return (
              <li key={`${h.kind}-${h.sidoId}-${h.name}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(h)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
                >
                  <i
                    className="size-2 shrink-0 rounded-full"
                    style={{ background: gradeColor(u.score) }}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">
                    {h.name}
                    {h.kind === "sgg" && (
                      <span className="text-muted-foreground"> · {h.sidoName}</span>
                    )}
                    {h.kind === "sido" && (
                      <span className="text-muted-foreground"> · 시·도</span>
                    )}
                  </span>
                  <span className="text-xs font-semibold tabular-nums">{u.score.toFixed(1)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
