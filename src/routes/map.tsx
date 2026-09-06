import { createFileRoute, Link } from "@tanstack/react-router";
import { ColorMap } from "@/components/color-map";
import { KakaoRiskMap } from "@/components/kakao-risk-map";
import { KakaoKeyChip } from "@/components/kakao-key-chip";
import { MapModeSwitch } from "@/components/map-mode-switch";
import { SidePanel } from "@/components/side-panel";
import { GridChat } from "@/components/grid-chat";
import { useMapStore } from "@/lib/store";
import { ALL_SGG, GRADE_SPECTRUM } from "@/lib/scoring";
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
  const cycleSnap = useMapStore((s) => s.cycleSnap);
  const mobileSnap = useMapStore((s) => s.mobileSnap);
  const sidoId = useMapStore((s) => s.sidoId);
  const kakaoOn = mapMode === "kakao" && kakaoStatus === "on";
  const showKakao = mapMode === "kakao" && kakaoStatus !== "error";
  const live =
    mapMode === "kakao"
      ? kakaoOn
        ? `카카오맵 · ${ALL_SGG.length}개`
        : "카카오맵"
      : `컬러맵 · ${ALL_SGG.length}개`;
  const mapH =
    mobileSnap === "peek" ? "h-[62%]" : mobileSnap === "tall" ? "h-[24%]" : "h-[42%]";
  return (
    <div className="flex h-[100dvh] flex-col bg-background text-foreground">
      <header className="glass z-20 shrink-0 border-b">
        <div className="flex h-11 items-center gap-1 overflow-x-auto px-2 sm:h-12 sm:gap-2 sm:px-4">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-foreground text-background">
            <Zap className="size-3.5" strokeWidth={2.4} />
          </span>
          <h1 className="min-w-0 truncate text-[13px] font-semibold sm:text-sm">
            <span className="sm:hidden">배전망</span>
            <span className="hidden sm:inline">배전망 위험 지도</span>
            <span
              className="ml-1.5 hidden align-middle text-[10px] font-medium tracking-wide text-muted-foreground sm:inline"
              title="시군구 변압기 실제 용량은 공개되어 있지 않습니다"
            >
              시험판
            </span>
          </h1>
          <div className="ml-1 flex shrink-0 gap-0.5 rounded-full bg-muted p-0.5">
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
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium whitespace-nowrap ${
                  filter === id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex shrink-0 items-center gap-1">
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
        <div className={`relative min-h-[160px] shrink-0 overflow-hidden md:h-auto md:min-h-0 ${mapH} md:h-auto`}>
          {showKakao ? (
            <KakaoRiskMap />
          ) : mapMode === "kakao" ? (
            <div className="absolute inset-0 grid place-items-center bg-sea px-6 text-center">
              <p className="text-sm text-muted-foreground">카카오맵을 연결하는 중입니다.</p>
            </div>
          ) : (
            <ColorMap />
          )}
          {!sidoId && (
            <div className="pointer-events-none absolute top-12 left-2 z-10 hidden max-w-[16rem] md:block">
              <p className="text-[11px] leading-snug text-foreground/80">
                광역을 누르면 시·군·구가 열립니다.
              </p>
            </div>
          )}
          {mapMode === "kakao" && <KakaoKeyChip />}
          <div className="glass-float absolute bottom-2 left-2 z-10 hidden w-[12rem] rounded-xl px-3 py-2 md:block">
            <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              낮음 → 높음
            </p>
            <div
              className="h-2 rounded-full"
              style={{ background: GRADE_SPECTRUM }}
              aria-hidden
            />
            <div className="mt-1 flex justify-between text-[9px] text-muted-foreground">
              <span>안전</span>
              <span>주의</span>
              <span>초과</span>
            </div>
            <p className="mt-1.5 text-[10px] leading-snug text-muted-foreground">
              {kakaoOn
                ? "광역 이름을 누르면 시·군·구가 열립니다."
                : "광역을 누르면 시·군·구가 열립니다."}
            </p>
          </div>
          <div className="glass-float absolute right-2 bottom-2 z-10 flex w-[9.5rem] flex-col gap-0.5 rounded-xl px-2 py-1.5 md:hidden">
            <div className="h-1.5 rounded-full" style={{ background: GRADE_SPECTRUM }} aria-hidden />
            <div className="flex justify-between text-[9px] text-muted-foreground">
              <span>안전</span>
              <span>초과</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="flex h-4 shrink-0 items-center justify-center md:hidden"
          onClick={cycleSnap}
          aria-label="상황판 높이 조절"
        >
          <span className="block h-1 w-10 rounded-full bg-border" />
        </button>
        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col md:h-auto">
          <SidePanel />
        </div>
      </div>
    </div>
  );
}
