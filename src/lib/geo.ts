import pathsMeta from "@/data/korea-paths.json";

export type KoreaMeta = {
  paths: Record<string, string>;
  labels: Record<string, { short: string; x: number; y: number }>;
  bounds: Record<string, [number, number, number, number]>;
  vb: [number, number, number, number];
  proj: { mx0: number; my1: number; scale: number; pad: number };
};

export const KOREA = pathsMeta as unknown as KoreaMeta;

export function projectLngLat(lng: number, lat: number) {
  const { mx0, my1, scale, pad } = KOREA.proj;
  const x = (lng * Math.PI) / 180;
  const φ = Math.max(-85, Math.min(85, lat)) * (Math.PI / 180);
  const y = Math.log(Math.tan(Math.PI / 4 + φ / 2));
  return {
    x: pad + (x - mx0) * scale,
    y: pad + (my1 - y) * scale,
  };
}

export function viewBoxFor(
  sidoId: string | null,
  sgg: { lng: number; lat: number } | null,
): [number, number, number, number] {
  const [vx, vy, vw, vh] = KOREA.vb;
  if (!sidoId) return KOREA.vb;
  const b = KOREA.bounds[sidoId];
  if (!b) return KOREA.vb;
  let [x0, y0, x1, y1] = b;
  if (sgg) {
    const p = projectLngLat(sgg.lng, sgg.lat);
    const span = Math.max(x1 - x0, y1 - y0, 48) * 0.2;
    x0 = p.x - span;
    y0 = p.y - span * 0.9;
    x1 = p.x + span;
    y1 = p.y + span * 1.1;
  }
  const pad = Math.max(x1 - x0, y1 - y0) * (sgg ? 0.18 : 0.16) + 10;
  x0 -= pad;
  y0 -= pad;
  x1 += pad;
  y1 += pad;
  x0 = Math.max(vx, x0);
  y0 = Math.max(vy, y0);
  x1 = Math.min(vx + vw, x1);
  y1 = Math.min(vy + vh, y1);
  const w = Math.max(36, x1 - x0);
  const h = Math.max(36, y1 - y0);
  return [x0, y0, w, h];
}
