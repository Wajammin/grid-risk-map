import { createFileRoute, Link } from "@tanstack/react-router";
import { ColorMap } from "@/components/color-map";
import { KakaoRiskMap } from "@/components/kakao-risk-map";
import { KakaoKeyChip } from "@/components/kakao-key-chip";
import { MapModeSwitch } from "@/components/map-mode-switch";
import { SidePanel } from "@/components/side-panel";
import { GridChat } from "@/components/grid-chat";
import { useMapStore } from "@/lib/store";
import { ALL_SGG } from "@/lib/scoring";
import { ThemeToggle } from "@/components/theme-toggle";
import { DemoTour } from "@/components/demo-tour";
import { Zap } from "lucide-react";

export const Route = createFileRoute("/map")({ component: Home });

function Home() {
  const selectNation = useMapStore((s) => s.selectNation);
  const filter = useMapStore((s) => s.filter);
  const setFilter = useMapStore((s) => s.setFilter);
  const mapMode = useMapStore((s) => s.mapMode);
  const kakaoStatus = useMapStore((s) => s.kakaoStatus);
  const kakaoOn = mapMode === "kakao" && kakaoStatus === "on";
  const showKakao = mapMode === "kakao" && kakaoStatus !== "error";
  const live =
    mapMode === "kakao"
      ? kakaoOn
        ? `카카오맵 · ${ALL_SGG.length}개`
        : "카카오맵"
      : `컬러맵 · ${ALL_SGG.length}개`;
  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <header className="glass z-20 shrink-0 border-b">
        <div className="flex h-11 items-center gap-1 px-2 sm:h-12 sm:gap-2 sm:px-4">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-background">
            <Zap className="size-3.5" strokeWidth={2.4} />
          </span>
          <h1 className="min-w-0 flex-1 truncate text-[13px] font-semibold sm:text-sm">
            <span className="sm:hidden">배전망</span>
            <span className="hidden sm:inline">배전망 위험 지도</span>
          </h1>
          <Link
            to="/"
            className="toolbar-btn text-muted-foreground hover:text-foreground"
          >
            소개
          </Link>
          <GridChat />
          <ThemeToggle />
          <div className="hidden items-center gap-2 sm:flex">
            <DemoTour />
            <MapModeSwitch />
            <button
              type="button"
              onClick={selectNation}
              className="toolbar-btn text-muted-foreground hover:text-foreground"
            >
              전국
            </button>
            <span className="glass-float hidden items-center gap-1.5 rounded-full px-2 py-1 text-[11px] text-muted-foreground lg:inline-flex">
              <i className={`size-1.5 rounded-full ${kakaoOn ? "bg-emerald-500" : "bg-slate-400"}`} />
              {live}
            </span>
          </div>
        </div>
        <div className="flex h-10 items-center gap-1.5 border-t border-border px-2 sm:hidden">
          <MapModeSwitch />
          <DemoTour />
          <button
            type="button"
            onClick={selectNation}
            className="toolbar-btn ml-auto text-muted-foreground"
          >
            전국
          </button>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-[1.618fr_1fr]">
        <div className="relative h-[42%] min-h-[200px] shrink-0 overflow-hidden md:h-auto md:min-h-0">
          {showKakao ? (
            <KakaoRiskMap />
          ) : mapMode === "kakao" ? (
            <div className="absolute inset-0 grid place-items-center bg-sea px-6 text-center">
              <p className="text-sm text-muted-foreground">카카오맵을 연결하는 중입니다.</p>
            </div>
          ) : (
            <ColorMap />
          )}
          <div className="glass-float absolute top-2 left-2 z-10 flex max-w-[calc(100%-1rem)] gap-0.5 overflow-x-auto rounded-xl p-0.5 sm:max-w-[72%]">
            {(
              [
                ["all", "전체"],
                ["high", "위험"],
                ["mid", "주의"],
                ["low", "관심"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap ${
                  filter === id ? "bg-muted text-foreground" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {mapMode === "kakao" && <KakaoKeyChip />}
          <div className="glass-float absolute bottom-2 left-2 z-10 hidden rounded-xl px-3 py-2 text-[11px] text-muted-foreground md:block">
            <p className="mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground">
              등급
            </p>
            <LegendRow color="#A7F3D0" label="0–20 안전" />
            <LegendRow color="#6EE7B7" label="20–40 관심" />
            <LegendRow color="#FCD34D" label="40–60 주의" />
            <LegendRow color="#FB923C" label="60–80 경계" />
            <LegendRow color="#F87171" label="80–100 위험" />
            <LegendRow color="#B91C1C" label="100+ 초과" />
            <p className="mt-1.5 max-w-[160px] text-[10px] leading-snug">
              {kakaoOn
                ? "확대하면 가까운 시·군·구가 점과 이름으로 나뉩니다."
                : "휠·핀치 또는 +/− 로 확대하세요. 시·도를 누르면 해당 지역으로 갑니다."}
            </p>
          </div>
          <div className="glass-float absolute right-2 bottom-2 z-10 flex items-center gap-1 rounded-full px-2 py-1 md:hidden">
            {[
              ["#A7F3D0", "안전"],
              ["#6EE7B7", "관심"],
              ["#FCD34D", "주의"],
              ["#FB923C", "경계"],
              ["#F87171", "위험"],
              ["#B91C1C", "초과"],
            ].map(([c, n]) => (
              <span key={n} className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                <i className="size-2 rounded-sm" style={{ background: c }} />
                {n}
              </span>
            ))}
          </div>
        </div>
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col md:h-auto">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="size-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </div>
  );
}
