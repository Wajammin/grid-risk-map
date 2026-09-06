import { Link } from "@tanstack/react-router";
import { useEffect, type MouseEvent } from "react";
import { PhilosophyScroll } from "@/components/philosophy-scroll";
import { KOREA } from "@/lib/geo";
import { SIDO_LIST, gradeColor } from "@/lib/scoring";

const META = KOREA;

export function IntroReel() {
  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (id) document.getElementById(id)?.scrollIntoView();
  }, []);

  function go(id: string) {
    return (e: MouseEvent) => {
      e.preventDefault();
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  return (
    <div className="intro-page h-[100dvh] overflow-y-auto bg-background text-foreground">
      <header className="sticky top-0 z-30 flex h-12 items-center justify-between border-b border-border bg-background px-4">
        <p className="text-[13px] font-medium tracking-tight">배전망 위험 지도</p>
        <nav className="flex items-center gap-5 text-[13px] text-muted-foreground">
          <a href="#about" className="hover:text-foreground" onClick={go("about")}>
            소개
          </a>
          <a href="#plan" className="hover:text-foreground" onClick={go("plan")}>
            계획
          </a>
          <Link to="/map" className="hover:text-foreground">
            지도
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid min-h-[calc(100dvh-3rem)] w-full max-w-6xl items-center gap-8 px-5 py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-12">
        <div>
          <p className="phil-kicker">한전KDN 배전망</p>
          <h1 className="mt-4 text-[clamp(1.75rem,3.4vw,2.5rem)] font-medium leading-[1.22] tracking-tight">
            우리 동네 변압기가
            <br />
            전기를 버티는지 보는 지도
          </h1>
          <p className="phil-body mt-5 max-w-[32ch]">
            얼마나 쓰는가가 아닙니다. 설비가 빠듯한 곳을 먼저 봅니다.
          </p>
          <Link
            to="/map"
            className="intro-cta mt-8"
            onClick={() => {
              try {
                sessionStorage.setItem("grid-guide", "1");
              } catch {
                /* empty */
              }
            }}
          >
            지도 열기
          </Link>
        </div>
        <div className="flex min-h-0 w-full items-center justify-center">
          <KoreaSilhouette />
        </div>
      </section>

      <PhilosophyScroll />
    </div>
  );
}

function KoreaSilhouette() {
  return (
    <svg
      viewBox={META.vb.join(" ")}
      preserveAspectRatio="xMidYMid meet"
      className="h-auto max-h-[min(70vh,640px)] w-full"
      aria-hidden
    >
      {SIDO_LIST.map((s) => {
        const d = META.paths[s.id];
        if (!d) return null;
        return (
          <path
            key={s.id}
            d={d}
            fill={gradeColor(s.score)}
            fillOpacity={0.92}
            stroke="rgba(15,23,42,0.28)"
            strokeWidth={1.1}
          />
        );
      })}
    </svg>
  );
}
