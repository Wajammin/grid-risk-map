import { askGridAi } from "@/lib/ai/ask";
import { answerLocally, packFacts } from "@/lib/ai/retrieve";
import { useMapStore } from "@/lib/store";
import { Bot, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGEST = [
  "지금 제일 위험한 곳은?",
  "창원시 수요 +50%면?",
  "점수는 고장 확률이야?",
  "남양주시가 위험한 이유",
];

const HELLO: Msg = {
  role: "assistant",
  content:
    "배전망 우선점검 도우미입니다. 시·군·구를 말하면 수요가 늘 때 점수가 얼마나 위험해지는지 계산합니다. 점수는 고장 확률이 아닙니다.",
};

export function GridChat() {
  const open = useMapStore((s) => s.chatOpen);
  const seed = useMapStore((s) => s.chatSeed);
  const closeChat = useMapStore((s) => s.closeChat);
  const openChat = useMapStore((s) => s.openChat);
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const growth = useMapStore((s) => s.growth);

  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const busyRef = useRef(false);
  const seedUsed = useRef<string | null>(null);
  const msgsRef = useRef(msgs);
  msgsRef.current = msgs;

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy, open]);

  useEffect(() => {
    if (!open || !seed || seedUsed.current === seed) return;
    seedUsed.current = seed;
    void send(seed);
  }, [open, seed]);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busyRef.current) return;
    busyRef.current = true;
    setDraft("");
    const next: Msg[] = [...msgsRef.current, { role: "user", content: q }];
    setMsgs(next);
    setBusy(true);
    const facts = packFacts({ question: q, sidoId, sggName, growth });
    const local = answerLocally(q, facts);
    try {
      const res = await askGridAi({
        data: { messages: next.slice(-8), facts: facts.text },
      });
      setMsgs((m) => [...m, { role: "assistant", content: res.ok ? res.text : local }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: local }]);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (open ? closeChat() : openChat())}
        className="toolbar-btn gap-1 text-muted-foreground hover:text-foreground"
        aria-label="AI 챗봇"
        aria-pressed={open}
      >
        <Bot className="size-3.5" />
        AI
      </button>
      {open && (
        <div className="pointer-events-none fixed inset-0 z-40">
          <div className="pointer-events-auto absolute top-14 left-2 flex h-[min(70dvh,560px)] w-[min(22rem,calc(100vw-1rem))] flex-col rounded-2xl border border-border bg-card shadow-2xl sm:top-16">
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-semibold">배전망 AI</p>
                <p className="text-[11px] text-muted-foreground">
                  선택 지역 점수와 수요 시나리오를 근거로 답합니다
                </p>
              </div>
              <button
                type="button"
                onClick={closeChat}
                className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:bg-muted"
                aria-label="챗봇 닫기"
              >
                <X className="size-4" />
              </button>
            </header>
            <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              {msgs.map((m, i) => (
                <div
                  key={`${m.role}-${i}`}
                  className={
                    m.role === "user"
                      ? "ml-8 rounded-2xl bg-foreground px-3 py-2 text-sm whitespace-pre-wrap text-background"
                      : "mr-6 rounded-2xl bg-muted px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground"
                  }
                >
                  {m.content}
                </div>
              ))}
              {busy && (
                <p className="text-xs text-muted-foreground">지역 점수와 시나리오를 읽고 있습니다…</p>
              )}
            </div>
            <div className="flex gap-1 overflow-x-auto px-4 pb-2">
              {SUGGEST.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => void send(s)}
                  className="shrink-0 rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:bg-muted"
                >
                  {s}
                </button>
              ))}
            </div>
            <form
              className="flex items-center gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
            >
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="지역 또는 수요 증가를 물어보세요"
                className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-muted px-3 text-sm outline-none"
                disabled={busy}
              />
              <button
                type="submit"
                disabled={busy || !draft.trim()}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-foreground text-background disabled:opacity-40"
                aria-label="보내기"
              >
                <Send className="size-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
