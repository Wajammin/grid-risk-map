import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { RiskMap } from "@/lib/risk-map.js";
import { KOREA } from "@/lib/geo";
import {
  ALL_SGG,
  GRADE_RAMP,
  SIDO_LIST,
  applyGrowth,
  findUnit,
  gradeColor,
  gradeOf,
  passesFilter,
} from "@/lib/scoring";
import { publicUrl } from "@/lib/public-url";
import { useMapStore } from "@/lib/store";

const COLORS = GRADE_RAMP.filter((g, i, a) => a.findIndex((x) => x.color === g.color) === i).map(
  (g) => g.color,
);

function keyOf(sidoId: string, name: string) {
  return `${sidoId}|${name}`;
}

function parseKey(key: string) {
  const i = key.indexOf("|");
  return { sidoId: key.slice(0, i), name: key.slice(i + 1) };
}

let geoCache: Promise<{
  type: string;
  features: { properties: { 시도: string; 시군구: string }; geometry: unknown }[];
}> | null = null;

function loadGeo() {
  if (!geoCache) {
    geoCache = fetch(publicUrl("/data/sigungu.geojson")).then((r) => {
      if (!r.ok) throw new Error("geo");
      return r.json();
    });
  }
  return geoCache;
}

export function ColorMap() {
  const sidoId = useMapStore((s) => s.sidoId);
  if (!sidoId) return <SidoOverview />;
  return <SggChoropleth sidoId={sidoId} />;
}

function SidoOverview() {
  const growth = useMapStore((s) => s.growth);
  const filter = useMapStore((s) => s.filter);
  const selectSido = useMapStore((s) => s.selectSido);
  const [vx, vy, vw, vh] = KOREA.vb;
  const drag = useRef({ moved: false, x: 0, y: 0 });
  const [tip, setTip] = useState<{ x: number; y: number; name: string; score: number } | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={hostRef} className="risk-map relative h-full w-full bg-sea">
      <svg
        viewBox={`${vx} ${vy} ${vw} ${vh}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        aria-label="광역 지방자치단체 지도"
        onPointerDown={(e) => {
          drag.current = { moved: false, x: e.clientX, y: e.clientY };
        }}
        onPointerMove={(e) => {
          if (Math.hypot(e.clientX - drag.current.x, e.clientY - drag.current.y) > 6) {
            drag.current.moved = true;
          }
        }}
      >
        <g id="map-base" pointerEvents="none" transform="translate(0 8)">
          {SIDO_LIST.map((s) => {
            const d = KOREA.paths[s.id];
            if (!d) return null;
            return <path key={`b-${s.id}`} d={d} />;
          })}
        </g>
        <g id="map-group">
          {SIDO_LIST.map((s) => {
            const d = KOREA.paths[s.id];
            if (!d) return null;
            const u = findUnit(s.id);
            const grown = u ? applyGrowth(u, growth) : null;
            const score = grown?.score ?? 0;
            const on = passesFilter(score, filter);
            return (
              <path
                key={s.id}
                d={d}
                fill={on ? gradeColor(score) : "var(--color-muted)"}
                opacity={on ? 1 : 0.28}
                className={on ? "cursor-pointer" : "pointer-events-none"}
                onPointerUp={() => {
                  if (!on || drag.current.moved) return;
                  selectSido(s.id);
                }}
                onPointerEnter={(e) => {
                  const host = hostRef.current;
                  if (!host) return;
                  const r = host.getBoundingClientRect();
                  setTip({ x: e.clientX - r.left, y: e.clientY - r.top, name: s.name, score });
                }}
                onPointerMove={(e) => {
                  const host = hostRef.current;
                  if (!host || !tip) return;
                  const r = host.getBoundingClientRect();
                  setTip({ x: e.clientX - r.left, y: e.clientY - r.top, name: s.name, score });
                }}
                onPointerLeave={() => setTip(null)}
              />
            );
          })}
        </g>
        {SIDO_LIST.map((s) => {
          const lab = KOREA.labels[s.id];
          if (!lab) return null;
          const u = findUnit(s.id);
          const score = u ? applyGrowth(u, growth).score : 0;
          if (!passesFilter(score, filter)) return null;
          return (
            <text
              key={`lab-${s.id}`}
              x={lab.x}
              y={lab.y}
              textAnchor="middle"
              className="pointer-events-none select-none fill-foreground"
              style={{
                fontSize: s.short.length > 3 ? 11 : 13,
                fontWeight: 700,
                paintOrder: "stroke",
                stroke: "#fff",
                strokeWidth: 3.4,
                strokeLinejoin: "round",
              }}
            >
              {lab.short}
            </text>
          );
        })}
      </svg>
      {tip && (
        <div className="map-tip pointer-events-none absolute z-20" style={{ left: tip.x + 12, top: tip.y + 12 }}>
          <p className="font-semibold">{tip.name}</p>
          <p className="tabular-nums">
            {tip.score.toFixed(1)} · {gradeOf(tip.score)}
          </p>
        </div>
      )}
    </div>
  );
}

function SggChoropleth({ sidoId }: { sidoId: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const growth = useMapStore((s) => s.growth);
  const filter = useMapStore((s) => s.filter);
  const sggName = useMapStore((s) => s.sggName);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectNation = useMapStore((s) => s.selectNation);
  const selectSggRef = useRef(selectSgg);
  selectSggRef.current = selectSgg;

  const paintRef = useRef(() => {});
  paintRef.current = () => {
    if (!ready.current) return;
    const scores = new Map<string, number>();
    const gNow = useMapStore.getState().growth;
    const fil = useMapStore.getState().filter;
    for (const g of ALL_SGG) {
      if (g.sidoId !== sidoId) continue;
      scores.set(keyOf(g.sidoId, g.name), applyGrowth(g, gNow).score);
    }
    const st = useMapStore.getState();
    const selected = st.sggName ? keyOf(sidoId, st.sggName) : null;
    RiskMap.paint(scores, selected);
    RiskMap.setPin(null, "");
    const root = hostRef.current?.querySelector("#map-group");
    root?.querySelectorAll("path[data-key]").forEach((el) => {
      const key = (el as SVGPathElement).dataset.key;
      if (!key) return;
      const sc = scores.get(key) ?? 0;
      const on = passesFilter(sc, fil);
      el.setAttribute("fill", on ? (el.getAttribute("fill") ?? gradeColor(sc)) : "#d9e2ec");
      (el as SVGPathElement).style.opacity = on ? "1" : "0.28";
    });
  };

  useEffect(() => {
    const host = hostRef.current;
    const svg = host?.querySelector("svg");
    if (!svg) return;
    let cancel = false;
    ready.current = false;
    RiskMap.stopIntro();

    loadGeo()
      .then((geojson) => {
        if (cancel || !svg.isConnected) return;
        RiskMap.setColors(COLORS);
        const n = RiskMap.draw(svg, geojson, {
          has: (key: string) => key.startsWith(`${sidoId}|`),
          onSelect: (key: string) => {
            const parsed = parseKey(key);
            if (parsed.sidoId === sidoId) selectSggRef.current(parsed.sidoId, parsed.name);
          },
          onHover: () => {},
        });
        RiskMap.setTooltip((key: string) => {
          const parsed = parseKey(key);
          const u = ALL_SGG.find((g) => g.sidoId === parsed.sidoId && g.name === parsed.name);
          if (!u) return "";
          const grown = applyGrowth(u, useMapStore.getState().growth);
          return `<b>${parsed.name}</b> <small>${parsed.sidoId}</small><br>${grown.score.toFixed(1)} · ${gradeOf(grown.score)}`;
        });
        ready.current = n > 0;
        paintRef.current();
      })
      .catch(() => {
        /* empty */
      });

    return () => {
      cancel = true;
      RiskMap.stopIntro();
    };
  }, [sidoId]);

  useEffect(() => {
    paintRef.current();
  }, [growth, sggName, sidoId, filter]);

  useEffect(() => {
    if (!ready.current) return;
    if (sggName) void RiskMap.focus(keyOf(sidoId, sggName), { scale: 2.4, biasX: 0.46 });
    else void RiskMap.reset({ animate: false });
  }, [sggName, sidoId]);

  const short = SIDO_LIST.find((s) => s.id === sidoId)?.short ?? sidoId;

  return (
    <div ref={hostRef} className="risk-map relative h-full w-full bg-sea">
      <svg className="h-full w-full touch-none" aria-label={`${sidoId} 기초 지방자치단체 지도`} />
      <div id="tooltip" className="map-tip" hidden />
      <div className="glass-float absolute bottom-14 left-2 z-10 flex max-w-[70%] items-center gap-1 rounded-lg bg-card px-2 py-1 text-[11px] md:bottom-24">
        <button type="button" className="text-muted-foreground hover:text-foreground" onClick={selectNation}>
          전국
        </button>
        <span className="text-muted-foreground">›</span>
        <button
          type="button"
          className={sggName ? "text-muted-foreground hover:text-foreground" : "font-medium"}
          onClick={() => selectSido(sidoId)}
        >
          {short}
        </button>
        {sggName && (
          <>
            <span className="text-muted-foreground">›</span>
            <span className="truncate font-medium">{sggName}</span>
          </>
        )}
      </div>
      <div className="glass-float absolute top-14 right-2 z-10 flex flex-col overflow-hidden rounded-xl sm:top-14">
        <button
          type="button"
          aria-label="확대"
          className="grid size-8 place-items-center text-foreground hover:bg-muted"
          onClick={() => RiskMap.zoomBy(1.2)}
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          aria-label="축소"
          className="grid size-8 place-items-center border-t border-border text-foreground hover:bg-muted"
          onClick={() => RiskMap.zoomBy(1 / 1.2)}
        >
          <Minus className="size-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
