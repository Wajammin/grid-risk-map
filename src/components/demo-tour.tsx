import { useMapStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const STEPS = [
  {
    n: "1",
    title: "전국을 본다",
    look: "오른쪽 상황판의 큰 숫자와 왼쪽 지도 색.",
    do: "점수는 고장 확률이 아닙니다. 어디를 먼저 보면 좋은지, 점검 순서입니다.",
    apply: () => {
      const s = useMapStore.getState();
      s.closeChat();
      s.setFilter("all");
      s.setMapMode("color");
      s.setGrowth(0);
      s.selectNation();
    },
  },
  {
    n: "2",
    title: "한 곳을 연다",
    look: "지도를 누르거나 지역 탭에서 시·도를 고릅니다.",
    do: "예로 남양주시를 열었습니다. 큰 도시라고 앞에 두지 않습니다.",
    apply: () => {
      useMapStore.getState().selectSgg("경기도", "남양주시");
    },
  },
  {
    n: "3",
    title: "점수와 이유를 읽는다",
    look: "상세 탭. 숫자 아래 한글 문장.",
    do: "학습해서 맞히는 모델이 아닙니다. 격차·피크·주택 세 숫자가 이유를 만듭니다.",
    apply: () => {
      const s = useMapStore.getState();
      s.selectSgg("경기도", "남양주시");
      s.setTab("detail");
    },
  },
  {
    n: "4",
    title: "수요를 올려 본다",
    look: "상황판·상세에 있는 수요 증가 칸.",
    do: "전기를 더 쓴다고 가정합니다. 100을 넘을 수 있습니다. 실제 예측이 아니라 가정입니다.",
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
    look: "방법 탭, 그다음 출처 탭.",
    do: "변압기 실제 용량은 공개되어 있지 않습니다. 그 숫자를 만들면 거짓말입니다. 식과 원문은 여기 있습니다.",
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
    STEPS[i]?.apply();
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
