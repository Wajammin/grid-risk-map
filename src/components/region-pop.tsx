import { applyGrowth, findUnit, gradeColor, gradeOf } from "@/lib/scoring";
import { useMapStore } from "@/lib/store";

export function RegionPop() {
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const growth = useMapStore((s) => s.growth);
  if (!sidoId) return null;
  const base = findUnit(sidoId, sggName);
  if (!base) return null;
  const u = applyGrowth(base, growth);
  const g = gradeOf(u.score);
  const title = u.kind === "sido" ? `${u.short ?? u.name}의 상태` : u.name;
  return (
    <div className="map-pop pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
      {u.kind === "sgg" && <p className="text-[11px] text-muted-foreground">{u.sidoName}</p>}
      <p className="text-sm font-semibold tracking-tight">{title}</p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs tabular-nums">
        <i className="size-2 rounded-full" style={{ background: gradeColor(u.score) }} />
        {u.score.toFixed(1)} · {g}
      </p>
    </div>
  );
}
