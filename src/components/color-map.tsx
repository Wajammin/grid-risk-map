import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { KOREA, projectLngLat, viewBoxFor } from "@/lib/geo";
import {
  ALL_SGG,
  SIDO_LIST,
  applyGrowth,
  findUnit,
  gradeColor,
  passesFilter,
} from "@/lib/scoring";
import { pickLabels, spreadBoxes, labelWidth } from "@/lib/declutter";
import { useMapStore } from "@/lib/store";

type Cam = { x: number; y: number; w: number; h: number };

const [VX, VY, VW, VH] = KOREA.vb;
const MIN_W = VW * 0.045;
const MAX_W = VW * 1.08;

function clampCam(c: Cam): Cam {
  const w = Math.min(MAX_W, Math.max(MIN_W, c.w));
  const h = w * (c.h / c.w);
  let x = c.x;
  let y = c.y;
  const slackX = VW * 0.08;
  const slackY = VH * 0.08;
  x = Math.min(VX + VW - w * 0.2, Math.max(VX - slackX, x));
  y = Math.min(VY + VH - h * 0.2, Math.max(VY - slackY, y));
  return { x, y, w, h };
}

function zoomAt(cam: Cam, sx: number, sy: number, factor: number): Cam {
  const nextW = cam.w * factor;
  const k = nextW / cam.w;
  return clampCam({
    x: sx - (sx - cam.x) * k,
    y: sy - (sy - cam.y) * k,
    w: nextW,
    h: cam.h * k,
  });
}

export function ColorMap() {
  const growth = useMapStore((s) => s.growth);
  const filter = useMapStore((s) => s.filter);
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectSgg = useMapStore((s) => s.selectSgg);
  const svgRef = useRef<SVGSVGElement>(null);
  const cam = useRef<Cam>({ x: VX, y: VY, w: VW, h: VH });
  const drag = useRef({
    on: false,
    moved: false,
    lx: 0,
    ly: 0,
    pts: new Map<number, { x: number; y: number }>(),
    pinch: 0,
  });
  const [box, setBox] = useState<Cam>({ x: VX, y: VY, w: VW, h: VH });

  const sgg = sidoId && sggName
    ? ALL_SGG.find((g) => g.sidoId === sidoId && g.name === sggName) ?? null
    : null;

  useEffect(() => {
    const next = viewBoxFor(sidoId, sgg);
    const c = { x: next[0], y: next[1], w: next[2], h: next[3] };
    cam.current = c;
    setBox(c);
  }, [sidoId, sggName]);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const svg = svgRef.current;
      if (!svg) return;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const m = svg.getScreenCTM();
      const p = m
        ? pt.matrixTransform(m.inverse())
        : { x: cam.current.x + cam.current.w / 2, y: cam.current.y + cam.current.h / 2 };
      const next = clampCam(zoomAt(cam.current, p.x, p.y, e.deltaY > 0 ? 1.12 : 0.89));
      cam.current = next;
      setBox(next);
      svg.setAttribute("viewBox", `${next.x} ${next.y} ${next.w} ${next.h}`);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  });

  const apply = (c: Cam) => {
    const next = clampCam(c);
    cam.current = next;
    setBox(next);
    const el = svgRef.current;
    if (el) el.setAttribute("viewBox", `${next.x} ${next.y} ${next.w} ${next.h}`);
  };

  const clientToSvg = (cx: number, cy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const pt = svg.createSVGPoint();
    pt.x = cx;
    pt.y = cy;
    const m = svg.getScreenCTM();
    if (!m) return { x: box.x + box.w / 2, y: box.y + box.h / 2 };
    const p = pt.matrixTransform(m.inverse());
    return { x: p.x, y: p.y };
  };

  const unit = Math.max(box.w, box.h);
  const labelSize = Math.max(8, Math.min(14, unit / 32));
  const dotR = sggName ? Math.max(3.2, unit / 90) : sidoId ? Math.max(2.8, unit / 110) : Math.max(2.4, unit / 140);
  const zoomed = box.w < VW * 0.62;
  const showSgg = Boolean(sidoId) || zoomed;
  const strokeW = Math.max(0.7, unit / 820);

  const markers = useMemo(() => {
    if (!showSgg) return [];
    const list = ALL_SGG.filter((g) => {
      if (sidoId && g.sidoId !== sidoId) return false;
      const grown = applyGrowth(g, growth);
      if (!passesFilter(grown.score, filter)) return false;
      const p = projectLngLat(g.lng, g.lat);
      if (p.x < box.x - 24 || p.x > box.x + box.w + 24) return false;
      if (p.y < box.y - 24 || p.y > box.y + box.h + 24) return false;
      return true;
    });
    const scale = 720 / box.w;
    const raw = list.map((g) => {
      const grown = applyGrowth(g, growth);
      const p = projectLngLat(g.lng, g.lat);
      const on = g.name === sggName;
      return {
        g,
        grown,
        p,
        on,
        pri: on ? 10_000 : grown.score,
      };
    });
    const candidates = raw.map((d) => ({
      id: `${d.g.sidoId}-${d.g.name}`,
      x: d.p.x * scale,
      y: (d.p.y + labelSize + 5) * scale,
      w: labelWidth(d.g.name, labelSize) * scale,
      h: (labelSize + 6) * scale,
      pri: d.pri,
    }));
    const kept = new Set(pickLabels(candidates).map((s) => s.id));
    const local = spreadBoxes(
      candidates.filter((c) => kept.has(c.id)).map((c) => ({
        ...c,
        x: c.x / scale,
        y: c.y / scale,
        w: c.w / scale,
        h: c.h / scale,
      })),
    );
    const byId = new Map(local.map((s) => [s.id, s]));
    return raw.map((d) => {
      const id = `${d.g.sidoId}-${d.g.name}`;
      const s = byId.get(id);
      return {
        ...d,
        showName: Boolean(s) || d.on,
        lx: s?.x ?? d.p.x,
        ly: s?.y ?? d.p.y + labelSize + 5,
      };
    });
  }, [showSgg, sidoId, growth, filter, box.x, box.y, box.w, box.h, sggName, labelSize]);

  return (
    <div className="relative h-full w-full bg-sea">
      <svg
        ref={svgRef}
        viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        aria-label="전국 배전망 컬러맵"
        onPointerDown={(e) => {
          (e.currentTarget as SVGSVGElement).setPointerCapture(e.pointerId);
          drag.current.on = true;
          drag.current.moved = false;
          drag.current.lx = e.clientX;
          drag.current.ly = e.clientY;
          drag.current.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (drag.current.pts.size === 2) {
            const [a, b] = [...drag.current.pts.values()];
            drag.current.pinch = Math.hypot(a.x - b.x, a.y - b.y);
          }
        }}
        onPointerMove={(e) => {
          const st = drag.current;
          st.pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (st.pts.size === 2) {
            const [a, b] = [...st.pts.values()];
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            if (st.pinch > 0 && dist > 0) {
              const mid = clientToSvg((a.x + b.x) / 2, (a.y + b.y) / 2);
              apply(zoomAt(cam.current, mid.x, mid.y, st.pinch / dist));
              st.pinch = dist;
              st.moved = true;
            }
            return;
          }
          if (!st.on) return;
          const svg = svgRef.current;
          if (!svg) return;
          const rect = svg.getBoundingClientRect();
          const dx = ((e.clientX - st.lx) / rect.width) * cam.current.w;
          const dy = ((e.clientY - st.ly) / rect.height) * cam.current.h;
          if (Math.abs(e.clientX - st.lx) + Math.abs(e.clientY - st.ly) > 3) st.moved = true;
          st.lx = e.clientX;
          st.ly = e.clientY;
          apply({
            ...cam.current,
            x: cam.current.x - dx,
            y: cam.current.y - dy,
          });
        }}
        onPointerUp={(e) => {
          drag.current.pts.delete(e.pointerId);
          drag.current.on = drag.current.pts.size > 0;
          drag.current.pinch = 0;
        }}
        onPointerCancel={(e) => {
          drag.current.pts.delete(e.pointerId);
          drag.current.on = false;
          drag.current.pinch = 0;
        }}
        onDoubleClick={(e) => {
          const p = clientToSvg(e.clientX, e.clientY);
          apply(zoomAt(cam.current, p.x, p.y, 0.72));
        }}
      >
        {SIDO_LIST.map((s) => {
          const d = KOREA.paths[s.id];
          if (!d) return null;
          const unitS = findUnit(s.id);
          const grown = unitS ? applyGrowth(unitS, growth) : null;
          const score = grown?.score ?? 0;
          const dim = Boolean(sidoId && sidoId !== s.id);
          const kids = ALL_SGG.filter((g) => g.sidoId === s.id);
          const anyPass = kids.some((g) => passesFilter(applyGrowth(g, growth).score, filter));
          const fill = !anyPass ? "var(--color-muted)" : gradeColor(score);
          return (
            <path
              key={s.id}
              d={d}
              fill={fill}
              opacity={dim ? 0.22 : 1}
              stroke={sidoId === s.id ? "var(--color-primary)" : "var(--color-card)"}
              strokeWidth={sidoId === s.id ? strokeW * 1.8 : strokeW}
              className="cursor-pointer"
              onClick={() => {
                if (drag.current.moved) return;
                selectSido(s.id);
              }}
            />
          );
        })}
        {markers.map((m) => {
          const hideOthers = Boolean(sggName && !m.on);
          const shifted = Math.hypot(m.lx - m.p.x, m.ly - (m.p.y + labelSize + 5)) > 6;
          return (
            <g
              key={`${m.g.sidoId}-${m.g.name}`}
              className="cursor-pointer"
              opacity={hideOthers ? 0.38 : 1}
              onClick={(e) => {
                e.stopPropagation();
                if (drag.current.moved) return;
                selectSgg(m.g.sidoId, m.g.name);
              }}
            >
              <circle cx={m.p.x} cy={m.p.y} r={Math.max(10, dotR * 2.4)} fill="transparent" />
              {m.showName && shifted && (
                <line
                  x1={m.p.x}
                  y1={m.p.y}
                  x2={m.lx}
                  y2={m.ly - 2}
                  stroke="var(--color-foreground)"
                  strokeOpacity={0.35}
                  strokeWidth={Math.max(0.5, unit / 900)}
                />
              )}
              <circle
                cx={m.p.x}
                cy={m.p.y}
                r={m.on ? dotR + 1.4 : dotR}
                fill={gradeColor(m.grown.score)}
                stroke="#fff"
                strokeWidth={Math.max(0.6, unit / 900)}
              />
              {m.showName && (
                <text
                  x={m.lx}
                  y={m.ly}
                  textAnchor="middle"
                  className="fill-foreground"
                  style={{
                    fontSize: m.on ? labelSize + 1 : labelSize,
                    fontWeight: 700,
                    paintOrder: "stroke",
                    stroke: "var(--color-card)",
                    strokeWidth: Math.max(2.4, labelSize * 0.28),
                  }}
                >
                  {m.g.name}
                </text>
              )}
            </g>
          );
        })}
        {SIDO_LIST.map((s) => {
          const lab = KOREA.labels[s.id];
          if (!lab) return null;
          if (sidoId || zoomed) return null;
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
                strokeWidth: 3.5,
                strokeLinejoin: "round",
              }}
            >
              {lab.short}
            </text>
          );
        })}
      </svg>
      <div className="glass-float absolute top-12 right-2 z-10 flex flex-col overflow-hidden rounded-xl sm:top-2">
        <button
          type="button"
          aria-label="확대"
          className="grid size-8 place-items-center text-foreground hover:bg-muted"
          onClick={() => {
            const c = cam.current;
            apply(zoomAt(c, c.x + c.w / 2, c.y + c.h / 2, 0.82));
          }}
        >
          <Plus className="size-3.5" strokeWidth={2.4} />
        </button>
        <button
          type="button"
          aria-label="축소"
          className="grid size-8 place-items-center border-t border-border text-foreground hover:bg-muted"
          onClick={() => {
            const c = cam.current;
            apply(zoomAt(c, c.x + c.w / 2, c.y + c.h / 2, 1.22));
          }}
        >
          <Minus className="size-3.5" strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
