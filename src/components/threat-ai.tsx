import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assessThreat } from "@/lib/threat";
import { gradeColor } from "@/lib/scoring";
import { useMapStore } from "@/lib/store";
import type { Unit } from "@/lib/types";
import { Bot } from "lucide-react";

export function ThreatAi({ unit, growth }: { unit: Unit; growth: number }) {
  const openChat = useMapStore((s) => s.openChat);
  const r = assessThreat(unit, growth);
  const seed =
    growth > 0
      ? `${r.label} 수요가 ${growth}% 늘면 얼마나 위험한가요?`
      : `${r.label} 수요가 늘면 얼마나 위협적인가요? +50%와 +100%도 비교해 주세요.`;

  return (
    <section className="glass-soft mt-4 rounded-xl p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
          수요 충격 AI
        </p>
        <span className="rounded-full bg-card px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          규칙 앙상블 + 로지스틱
        </span>
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            {growth > 0 ? `+${growth}% 시 위협 지수` : "현재 위협 지수"}
          </p>
          <p className="font-display text-3xl font-semibold tabular-nums tracking-tight">
            {growth > 0 ? r.pGrown : r.pNow}
            <span className="ml-1 text-base font-medium text-muted-foreground">%</span>
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>
            {growth > 0 ? (
              <>
                {r.currentScore.toFixed(1)} →{" "}
                <span className="font-semibold text-foreground">{r.grownScore.toFixed(1)}</span>
                <span className="ml-1">{r.grownGrade}</span>
              </>
            ) : (
              <>
                10%당 <span className="font-semibold text-foreground">+{r.elasticity}</span>점
              </>
            )}
          </p>
          <p className="mt-0.5">
            위험 진입 {r.crossWarn == null ? "없음" : r.crossWarn === 0 ? "이미" : `+${r.crossWarn}%`}
            {" · "}
            초과 {r.crossOver == null ? "없음" : r.crossOver === 0 ? "이미" : `+${r.crossOver}%`}
          </p>
        </div>
      </div>
      <div className="mt-2 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={r.series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="g" tickFormatter={(v) => `+${v}`} tick={{ fontSize: 10 }} />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip
              formatter={(v: number, key: string) => [
                key === "p" ? `${v}%` : v.toFixed(1),
                key === "p" ? "위협" : "점수",
              ]}
              labelFormatter={(v) => `수요 +${v}%`}
            />
            <Line type="monotone" dataKey="score" stroke="#1d4ed8" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="p" stroke="#fb923c" strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1">
        {r.series.map((s) => (
          <li key={s.g} className="flex items-center gap-2 text-xs">
            <i
              className="size-2 shrink-0 rounded-full"
              style={{ background: gradeColor(s.score) }}
            />
            <span className="w-12 tabular-nums text-muted-foreground">+{s.g}%</span>
            <span className="flex-1 font-medium tabular-nums">{s.score.toFixed(1)}</span>
            <span className="text-muted-foreground">{s.grade}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm leading-relaxed text-foreground">{r.summary}</p>
      <button
        type="button"
        onClick={() => openChat(seed)}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-foreground px-3 py-2 text-sm font-medium text-background"
      >
        <Bot className="size-4" />
        이 지역을 AI에게 물어보기
      </button>
    </section>
  );
}
