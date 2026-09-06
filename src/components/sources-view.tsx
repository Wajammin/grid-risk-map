import {
  DATA_SOURCES,
  LIMITS,
  METHOD_SOURCES,
  NEWS_SOURCES,
  TOOL_SOURCES,
  type SourceItem,
} from "@/lib/sources";
import { socioCoverage } from "@/lib/socio";

export function SourcesView() {
  const cov = socioCoverage();
  return (
    <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
      <div>
        <h2 className="text-base font-semibold text-foreground">데이터 · 뉴스 출처</h2>
        <p className="mt-1 text-xs">
          화면에 나온 숫자와 사고 사례는 아래 공개 자료에 연결됩니다. 시군구 {cov.ok}/{cov.n}곳에
          인구가 붙어 있습니다.
        </p>
      </div>
      <Block title="1. 인구 · 전력" items={DATA_SOURCES} />
      <Block title="2. 산출식 문헌" items={METHOD_SOURCES} />
      <Block title="3. 정전 뉴스 (방법 탭)" items={NEWS_SOURCES} />
      <Block title="4. 지도 API" items={TOOL_SOURCES} />
      <section className="rounded-xl bg-muted p-3">
        <h3 className="font-semibold text-foreground">5. 한계 (정직하게)</h3>
        <ul className="mt-2 space-y-1.5 text-xs">
          {LIMITS.map((l) => (
            <li key={l}>· {l}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Block({ title, items }: { title: string; items: SourceItem[] }) {
  return (
    <section>
      <h3 className="text-xs font-semibold tracking-wide text-foreground">{title}</h3>
      <ul className="mt-2 space-y-2">
        {items.map((s) => (
          <li key={s.url} className="rounded-xl border border-border bg-muted p-3">
            <a
              href={s.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-foreground underline-offset-2 hover:underline"
            >
              {s.title}
            </a>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {s.org} · {s.date}
            </p>
            <p className="mt-1 text-xs text-foreground">사용: {s.usedFor}</p>
            {s.note && <p className="mt-1 text-[11px] leading-relaxed">{s.note}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
