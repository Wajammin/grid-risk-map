import {
  ALL_SGG,
  GRADE_RAMP,
  SIDO_LIST,
  adminKind,
  applyGrowth,
  gradeColor,
  gradeOf,
  rankInKind,
} from "@/lib/scoring";
import { useMapStore } from "@/lib/store";
import { X } from "lucide-react";
import { useMemo, useState } from "react";

const KINDS = ["all", "시", "군", "구"] as const;

export function RankSheet() {
  const open = useMapStore((s) => s.sheet === "rank");
  const setSheet = useMapStore((s) => s.setSheet);
  const growth = useMapStore((s) => s.growth);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const [q, setQ] = useState("");
  const [sido, setSido] = useState("all");
  const [grade, setGrade] = useState("all");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");

  const rows = useMemo(() => {
    const t = q.trim();
    const ranked = ALL_SGG.map((u) => applyGrowth(u, growth))
      .sort((a, b) => b.score - a.score)
      .map((u, i) => ({ ...u, rank: i + 1 }));
    return ranked.filter((u) => {
      if (sido !== "all" && u.sidoId !== sido) return false;
      if (grade !== "all" && gradeOf(u.score) !== grade) return false;
      if (kind !== "all" && adminKind(u.name) !== kind) return false;
      if (t && !u.name.includes(t) && !u.sidoName.includes(t)) return false;
      return true;
    });
  }, [growth, q, sido, grade, kind]);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-card">
      <header className="flex items-center gap-2 border-b border-border px-3 py-2">
        <h2 className="flex-1 text-sm font-semibold">
          {kind === "all" ? "전체 순위" : `${kind} 순위`} {rows.length}곳
        </h2>
        <button
          type="button"
          onClick={() => setSheet(null)}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="닫기"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="flex gap-1 border-b border-border px-3 py-2">
        {KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium ${
              kind === k ? "bg-muted text-foreground" : "text-muted-foreground"
            }`}
          >
            {k === "all" ? "전체" : k}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 border-b border-border px-3 py-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름 검색"
          className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-muted px-2 text-sm outline-none"
        />
        <select
          value={sido}
          onChange={(e) => setSido(e.target.value)}
          className="h-9 max-w-[7.5rem] rounded-lg border border-border bg-muted px-1.5 text-xs"
          aria-label="광역 선택"
        >
          <option value="all">광역 전체</option>
          {SIDO_LIST.map((s) => (
            <option key={s.id} value={s.id}>
              {s.short}
            </option>
          ))}
        </select>
        <select
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="h-9 max-w-[5.5rem] rounded-lg border border-border bg-muted px-1.5 text-xs"
          aria-label="등급 선택"
        >
          <option value="all">등급</option>
          {GRADE_RAMP.map((g) => (
            <option key={g.name} value={g.name}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <ol className="min-h-0 flex-1 overflow-y-auto">
        {rows.map((u, i) => {
          const typed = rankInKind(u.sidoId, u.name, growth);
          return (
            <li key={`${u.sidoId}-${u.name}`}>
              <button
                type="button"
                onClick={() => {
                  selectSgg(u.sidoId, u.name);
                  setSheet(null);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted"
              >
                <span className="w-7 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
                  {kind === "all" ? u.rank : i + 1}
                </span>
                <i
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ background: gradeColor(u.score) }}
                />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {u.name}
                  <span className="text-muted-foreground">
                    {" "}
                    · {u.sidoName} · {typed.kind}
                  </span>
                </span>
                <span className="hidden text-[10px] text-muted-foreground sm:inline">
                  {typed.kind} {typed.rank}위
                </span>
                <span className="text-xs text-muted-foreground">{gradeOf(u.score)}</span>
                <span className="w-10 text-right text-sm font-semibold tabular-nums">
                  {u.score.toFixed(1)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
