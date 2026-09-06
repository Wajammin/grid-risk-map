import { useMapStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    n: "1",
    title: "전국을 봅니다",
    look: "왼쪽은 229개 시군구 지도입니다. 진할수록 먼저 점검할 곳입니다.",
    do: "점수는 고장 확률이 아닙니다. 점검 순서입니다.",
    try: "전국으로",
    apply: () => {
      const s = useMapStore.getState();
      s.closeChat();
      s.setSheet(null);
      s.setFilter("all");
      s.setMapMode("color");
      s.setGrowth(0);
      s.selectNation();
    },
  },
  {
    n: "2",
    title: "한 곳을 엽니다",
    look: "검색창에 이름을 넣거나 지도를 누릅니다. 상황판 층 순서는 그대로입니다.",
    do: "큰 도시라고 앞에 두지 않습니다. 설비가 빠듯한 곳을 엽니다.",
    try: "가장 위험한 곳 열기",
    apply: () => {
      const s = useMapStore.getState();
      s.selectSgg("경기도", "남양주시");
    },
  },
  {
    n: "3",
    title: "이유를 읽습니다",
    look: "상세 탭. 점수 아래 한글 문장과 전국 n위.",
    do: "학습 모델이 아닙니다. 격차·피크·주택 세 숫자가 이유를 만듭니다.",
    try: null,
    apply: () => {
      const s = useMapStore.getState();
      s.selectSgg("경기도", "남양주시");
      s.setTab("detail");
    },
  },
  {
    n: "4",
    title: "수요를 올려 봅니다",
    look: "상황판의 수요 단추 또는 직접 입력.",
    do: "100을 넘어도 고장이 난다는 뜻이 아닙니다. 더 먼저 보라는 뜻입니다.",
    try: "수요 +50% 넣어 보기",
    apply: () => {
      const s = useMapStore.getState();
      s.selectSgg("경기도", "남양주시");
      s.setGrowth(50);
      s.setTab("detail");
    },
  },
  {
    n: "5",
    title: "식과 한계",
    look: "방법 탭, 이어서 출처 탭.",
    do: "변압기 실제 용량은 공개되어 있지 않습니다. 그 숫자를 만들면 거짓말입니다.",
    try: "방법 열기",
    apply: () => {
      useMapStore.getState().setTab("method");
    },
  },
] as const;

export function DemoTour() {
  const [open, setOpen] = useState(false);
  const [i, setI] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const q = new URLSearchParams(window.location.search);
      if (q.get("guide") === "1" || sessionStorage.getItem("grid-guide") === "1") {
        sessionStorage.removeItem("grid-guide");
        setOpen(true);
      }
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    // 첫 장만 전국으로 맞춰 두고, 나머지는 '해보기'를 눌러야 움직입니다.
    if (i === 0) STEPS[0].apply();
  }, [open, i]);

  function start() {
    setI(0);
    setOpen(true);
  }

  function close() {
    setOpen(false);
    setI(0);
  }

  const step = STEPS[i];
  const last = i === STEPS.length - 1;

  const dialog =
    mounted && open && step
      ? createPortal(
          <div className="pointer-events-none fixed inset-0 z-[300] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-title"
              className="pointer-events-auto w-full max-w-md rounded-xl border border-border bg-background p-5 text-foreground shadow-2xl"
            >
              <p className="text-[11px] font-medium tracking-wide text-muted-foreground">
                사용 설명서 {step.n} / {STEPS.length}
              </p>
              <h2 id="guide-title" className="mt-1 text-lg font-medium tracking-tight">
                {step.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed">
                <span className="font-medium">볼 곳. </span>
                {step.look}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.do}</p>
              {step.try && (
                <button
                  type="button"
                  onClick={() => step.apply()}
                  className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
                >
                  해보기 · {step.try}
                </button>
              )}
              <div className="mt-5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  닫기
                </button>
                <div className="flex gap-2">
                  {i > 0 && (
                    <button
                      type="button"
                      onClick={() => setI((n) => n - 1)}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium"
                    >
                      이전
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => (last ? close() : setI((n) => n + 1))}
                    className="inline-flex h-8 items-center rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
                  >
                    {last ? "끝" : "다음"}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="toolbar-btn text-muted-foreground hover:text-foreground"
        aria-label="사용 설명서"
      >
        설명서
      </button>
      {dialog}
    </>
  );
}
