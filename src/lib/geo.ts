import pathsMeta from "@/data/korea-paths.json";
import sggMeta from "@/data/sgg-paths.json";

export type KoreaMeta = {
  paths: Record<string, string>;
  labels: Record<string, { short: string; x: number; y: number }>;
  bounds: Record<string, [number, number, number, number]>;
  vb: [number, number, number, number];
  proj: { mx0: number; my1: number; scale: number; pad: number };
};

export type SggPath = {
  d: string;
  cx: number;
  cy: number;
  b: [number, number, number, number];
};

export const KOREA = pathsMeta as unknown as KoreaMeta;
export const SGG_PATHS = (sggMeta as unknown as { items: Record<string, SggPath> }).items;

export function sggKey(sidoId: string, name: string) {
  return `${sidoId}|${name}`;
}

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

function padBox(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ratio: number,
): [number, number, number, number] {
  const [vx, vy, vw, vh] = KOREA.vb;
  const pad = Math.max(x1 - x0, y1 - y0) * ratio + 8;
  x0 = Math.max(vx, x0 - pad);
  y0 = Math.max(vy, y0 - pad);
  x1 = Math.min(vx + vw, x1 + pad);
  y1 = Math.min(vy + vh, y1 + pad);
  return [x0, y0, Math.max(28, x1 - x0), Math.max(28, y1 - y0)];
}

export function viewBoxFor(
  sidoId: string | null,
  _sgg: { name?: string; lng: number; lat: number } | null,
): [number, number, number, number] {
  if (!sidoId) return KOREA.vb;
  const b = KOREA.bounds[sidoId];
  if (!b) return KOREA.vb;
  return padBox(b[0], b[1], b[2], b[3], 0.14);
}
