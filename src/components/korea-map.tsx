import { useEffect, useRef } from "react";
import {
  ALL_SGG,
  SIDO_LIST,
  applyGrowth,
  gradeColor,
  passesFilter,
} from "@/lib/scoring";
import { useMapStore } from "@/lib/store";

const LAT0 = 33.05;
const LAT1 = 38.65;
const LNG0 = 124.55;
const LNG1 = 131.95;

function project(
  lat: number,
  lng: number,
  w: number,
  h: number,
  panX: number,
  panY: number,
  zoom: number,
) {
  const x = ((lng - LNG0) / (LNG1 - LNG0)) * w;
  const y = (1 - (lat - LAT0) / (LAT1 - LAT0)) * h;
  const cx = w / 2;
  const cy = h / 2;
  return {
    x: (x - cx) * zoom + cx + panX,
    y: (y - cy) * zoom + cy + panY,
  };
}

export function KoreaMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({
    panX: 0,
    panY: 0,
    zoom: 1,
    drag: false,
    lx: 0,
    ly: 0,
    moved: false,
  });
  const hits = useRef<{ sidoId: string; name: string; x: number; y: number; r: number }[]>([]);
  const sidoHits = useRef<{ id: string; x: number; y: number }[]>([]);
  const growth = useMapStore((s) => s.growth);
  const filter = useMapStore((s) => s.filter);
  const sidoId = useMapStore((s) => s.sidoId);
  const sggName = useMapStore((s) => s.sggName);
  const focus = useMapStore((s) => s.focus);
  const selectSido = useMapStore((s) => s.selectSido);
  const selectSgg = useMapStore((s) => s.selectSgg);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const w = c.clientWidth;
    const h = c.clientHeight;
    if (!w || !h) return;
    const z = focus.zoom;
    const x0 = ((focus.lng - LNG0) / (LNG1 - LNG0)) * w;
    const y0 = (1 - (focus.lat - LAT0) / (LAT1 - LAT0)) * h;
    state.current.zoom = z;
    state.current.panX = w / 2 - ((x0 - w / 2) * z + w / 2);
    state.current.panY = h / 2 - ((y0 - h / 2) * z + h / 2);
  }, [focus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 2 || h < 2) return;
      const bw = Math.floor(w * dpr);
      const bh = Math.floor(h * dpr);
      if (canvas.width !== bw || canvas.height !== bh) {
        canvas.width = bw;
        canvas.height = bh;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#E8EEF4";
      ctx.fillRect(0, 0, w, h);

      const { panX, panY, zoom } = state.current;
      const showSgg = zoom >= 1.55 || Boolean(sidoId);
      hits.current = [];
      sidoHits.current = [];

      if (showSgg) {
        for (const d of ALL_SGG) {
          if (sidoId && d.sidoId !== sidoId) continue;
          const grown = applyGrowth(d, growth);
          if (!passesFilter(grown.score, filter)) continue;
          const p = project(d.lat, d.lng, w, h, panX, panY, zoom);
          if (p.x < -8 || p.x > w + 8 || p.y < -8 || p.y > h + 8) continue;
          const r = d.name === sggName ? 7 : 4.5;
          hits.current.push({ sidoId: d.sidoId, name: d.name, x: p.x, y: p.y, r: r + 6 });
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = gradeColor(grown.score);
          ctx.fill();
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = "#fff";
          ctx.stroke();
        }
      }

      ctx.font = "600 11px Pretendard, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const s of SIDO_LIST) {
        const p = project(s.lat, s.lng, w, h, panX, panY, zoom);
        if (p.x < -40 || p.x > w + 40 || p.y < -20 || p.y > h + 20) continue;
        sidoHits.current.push({ id: s.id, x: p.x, y: p.y });
        const label = s.short;
        const tw = ctx.measureText(label).width;
        roundRect(ctx, p.x - tw / 2 - 6, p.y - 8, tw + 12, 16, 4);
        ctx.fillStyle = "rgba(15,23,42,0.88)";
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.fillText(label, p.x, p.y);
      }
    };

    draw();
    const ro = new ResizeObserver(() => draw());
    ro.observe(canvas);

    const onDown = (e: PointerEvent) => {
      state.current.drag = true;
      state.current.moved = false;
      state.current.lx = e.clientX;
      state.current.ly = e.clientY;
      canvas.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!state.current.drag) return;
      const dx = e.clientX - state.current.lx;
      const dy = e.clientY - state.current.ly;
      if (Math.abs(dx) + Math.abs(dy) > 3) state.current.moved = true;
      state.current.panX += dx;
      state.current.panY += dy;
      state.current.lx = e.clientX;
      state.current.ly = e.clientY;
      draw();
    };
    const onUp = () => {
      state.current.drag = false;
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const prev = state.current.zoom;
      const next = Math.min(5.5, Math.max(0.85, prev * (e.deltaY > 0 ? 0.9 : 1.12)));
      const k = next / prev;
      state.current.panX = mx - k * (mx - state.current.panX);
      state.current.panY = my - k * (my - state.current.panY);
      state.current.zoom = next;
      draw();
    };
    const onClick = (e: MouseEvent) => {
      if (state.current.moved) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      let best: (typeof hits.current)[number] | null = null;
      let bestD = 16;
      for (const d of hits.current) {
        const dist = Math.hypot(d.x - x, d.y - y);
        if (dist < Math.max(bestD, d.r)) {
          bestD = dist;
          best = d;
        }
      }
      if (best) {
        selectSgg(best.sidoId, best.name);
        return;
      }
      let bestS: (typeof sidoHits.current)[number] | null = null;
      bestD = 28;
      for (const s of sidoHits.current) {
        const dist = Math.hypot(s.x - x, s.y - y);
        if (dist < bestD) {
          bestD = dist;
          bestS = s;
        }
      }
      if (bestS) selectSido(bestS.id);
    };

    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("click", onClick);
    return () => {
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("click", onClick);
    };
  }, [filter, growth, selectSgg, selectSido, sggName, sidoId, focus]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none"
      aria-label="전국 배전망 위험 지도"
    />
  );
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
