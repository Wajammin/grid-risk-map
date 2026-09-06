import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

const PILLARS = [
  {
    kicker: "질문",
    title: "설비가 버티는가",
    body: "전기를 얼마나 쓰는가가 아닙니다. 변압기가 그 수요를 받을 수 있는지를 봅니다.",
  },
  {
    kicker: "투명성",
    title: "식과 출처를 연다",
    body: "점수 공식, 공공 통계, 뉴스 출처를 지도 안에 같이 둡니다. 숨기지 않습니다.",
  },
  {
    kicker: "설명",
    title: "이유를 한글로",
    body: "학습해서 사고를 맞히는 모델이 아닙니다. 격차, 피크, 주택. 세 숫자가 점수를 만듭니다.",
  },
  {
    kicker: "여백",
    title: "모르는 숫자는 비운다",
    body: "변압기 실제 용량은 공개되어 있지 않습니다. 그 숫자를 만들면 거짓말입니다.",
  },
] as const;

const STEPS = [
  {
    n: "1",
    when: "지금",
    title: "설명하는 지도",
    body: "공개 통계로 229곳을 같은 자에 세웁니다. 수업, 발표, 시연에 씁니다.",
  },
  {
    n: "2",
    when: "다음",
    title: "비교를 더 모은다",
    body: "정전 뉴스와 점수를 나란히 두고, 공공데이터를 새로 받을 수 있게 합니다.",
  },
  {
    n: "3",
    when: "데이터가 열리면",
    title: "같은 그릇에 실제 숫자",
    body: "한전·KDN의 변압기 용량과 부하가 들어가면 지금 만든 지도에 그 숫자가 올라갑니다.",
  },
  {
    n: "4",
    when: "최종",
    title: "설명 가능한 상황판",
    body: "지자체가 우리 동네 설비를 보는 화면. 한전 컴퓨터를 대신하지 않습니다.",
  },
] as const;

export function PhilosophyScroll() {
  return (
    <div>
      <section id="about" className="border-t border-border">
        <div className="mx-auto max-w-6xl px-5 py-16 md:py-20">
          <div className="grid gap-12 md:grid-cols-2 md:gap-16">
            <Block kicker="질문" title={"얼마나 쓰는가가\n아닙니다."}>
              많이 쓰는 동네가 위험한 게 아닙니다. 변압기가 빠듯한 동네가 위험합니다.
            </Block>
            <Block kicker="방식" title={"수도관이 가늘면\n수압이 떨어집니다."}>
              전기도 같습니다. 우리가 묻는 것은 수요의 크기가 아니라, 설비가 그 수요를 받느냐입니다.
            </Block>
          </div>

          <figure className="mt-14">
            <img
              src="/phil-hangang.jpg"
              alt="한강 야경"
              className="aspect-[16/9] h-auto max-h-[360px] w-full object-cover"
            />
            <figcaption className="mt-4 max-w-[40ch] text-sm leading-relaxed text-muted-foreground">
              멀리서는 하나의 야경입니다. 그 불이 먼저 흔들리는 곳은 강이 아니라, 보이지 않는 가까운 한 점입니다.
            </figcaption>
          </figure>
        </div>

        <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 pb-16 md:grid-cols-2 md:gap-16 md:pb-20">
          <Block kicker="범위" title={"229곳을 한 줄에 세웁니다."}>
            시·군·구를 같은 자로 잽니다. 큰 도시라고 앞에 두지 않습니다. 점수는 고장 확률이 아니라 점검 순서입니다. 모르는 숫자는 비워 둡니다. 변압기 실제 용량을 만들면 거짓말입니다.
          </Block>
          <img
            src="/phil-pole.jpg"
            alt="전봇대에 매달린 변압기"
            className="aspect-[3/4] max-h-[420px] w-full object-cover"
          />
        </div>
      </section>

      <Plan />
    </div>
  );
}

function Plan() {
  return (
    <section id="plan" className="border-t border-border bg-card px-5 py-20">
      <div className="mx-auto max-w-6xl">
        <p className="phil-kicker">계획</p>
        <h2 className="mt-3 text-[clamp(1.5rem,3vw,2.125rem)] font-medium leading-tight tracking-tight">
          앞으로의 계획
        </h2>
        <p className="phil-body mt-5 max-w-[46ch]">
          지금은 설명하는 지도입니다. 할 수 있는 일과 아직 못 하는 일을 나눠 적습니다.
        </p>

        <h3 className="mt-16 text-[13px] font-medium text-muted-foreground">핵심 영역</h3>
        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
            <article key={p.kicker} className="plan-card">
              <p className="phil-kicker">{p.kicker}</p>
              <h4 className="mt-3 text-lg font-medium tracking-tight">{p.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
            </article>
          ))}
        </div>

        <h3 className="mt-20 text-[13px] font-medium text-muted-foreground">단계별 목표</h3>
        <ol className="mt-6 grid gap-8 md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="plan-card">
              <p className="text-[13px] text-muted-foreground">
                {s.n}단계 · {s.when}
              </p>
              <h4 className="mt-3 text-lg font-medium tracking-tight">{s.title}</h4>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-20 max-w-2xl border-t border-border pt-10">
          <p className="phil-kicker">최종 목표</p>
          <h3 className="mt-3 text-[clamp(1.35rem,2.4vw,1.75rem)] font-medium tracking-tight">
            설명 가능한 상황판
          </h3>
          <p className="phil-body mt-4">
            지자체와 수업에서 우리 동네 설비를 같은 화면으로 보는 것. 이유를 말할 수 없는 점수는 올리지 않습니다. 한전 내부 시스템을 대신한다고 말하지 않습니다.
          </p>
          <Link to="/map" className="intro-link mt-8 inline-block border-b border-foreground pb-0.5">
            지도로 가기
          </Link>
        </div>
      </div>
    </section>
  );
}

function Block({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: ReactNode;
}) {
  const { ref, on } = useInView();
  return (
    <div ref={ref} className={on ? "is-in" : ""}>
      <p className="phil-kicker phil-line">{kicker}</p>
      <h2 className="phil-title phil-line mt-3 whitespace-pre-line">{title}</h2>
      <p className="phil-body phil-line mt-4">{children}</p>
    </div>
  );
}

function useInView() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setOn(true);
          io.disconnect();
        }
      },
      { threshold: 0, rootMargin: "0px 0px 10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, on };
}
