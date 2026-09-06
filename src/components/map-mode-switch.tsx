import { useMapStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function MapModeSwitch() {
  const mapMode = useMapStore((s) => s.mapMode);
  const setMapMode = useMapStore((s) => s.setMapMode);
  return (
    <div
      className="glass-float flex shrink-0 rounded-lg p-0.5"
      role="tablist"
      aria-label="지도 종류"
    >
      {(
        [
          ["color", "컬러"],
          ["kakao", "카카오"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          role="tab"
          aria-selected={mapMode === id}
          onClick={() => setMapMode(id)}
          className={cn(
            "h-8 shrink-0 rounded-md px-2.5 text-[11px] font-medium whitespace-nowrap sm:px-3",
            mapMode === id
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:bg-muted",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
