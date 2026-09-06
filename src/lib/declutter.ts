export type SpreadItem = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  pri: number;
};

/** Keep higher-priority labels; drop ones that would overlap. */
export function pickLabels<T extends SpreadItem>(items: T[]): T[] {
  const sorted = [...items].sort((a, b) => b.pri - a.pri);
  const kept: T[] = [];
  for (const it of sorted) {
    const clash = kept.some((p) => {
      const ox = (p.w + it.w) / 2 + 2 - Math.abs(p.x - it.x);
      const oy = (p.h + it.h) / 2 + 2 - Math.abs(p.y - it.y);
      return ox > 0 && oy > 0;
    });
    if (!clash) kept.push(it);
  }
  return kept;
}

/** Small local nudge only. Higher `pri` stays closer to the origin. */
export function spreadBoxes<T extends SpreadItem>(items: T[], loops = 10): T[] {
  const origin = items.map((i) => ({ x: i.x, y: i.y }));
  const out = items.map((i) => ({ ...i }));
  for (let n = 0; n < loops; n++) {
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const a = out[i];
        const b = out[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const ox = (a.w + b.w) / 2 + 1.2 - Math.abs(dx);
        const oy = (a.h + b.h) / 2 + 1.2 - Math.abs(dy);
        if (ox <= 0 || oy <= 0) continue;
        const ux = Math.abs(dx) < 0.04 ? (i % 2 === 0 ? 1 : -1) : Math.sign(dx);
        const uy = Math.abs(dy) < 0.04 ? (j % 2 === 0 ? 1 : -1) : Math.sign(dy);
        const fa = a.pri >= b.pri ? 0.2 : 0.8;
        a.x -= ux * (ox / 2) * fa;
        a.y -= uy * (oy / 2) * fa;
        b.x += ux * (ox / 2) * (1 - fa);
        b.y += uy * (oy / 2) * (1 - fa);
      }
    }
  }
  const MAX = 16;
  for (let i = 0; i < out.length; i++) {
    const dx = out[i].x - origin[i].x;
    const dy = out[i].y - origin[i].y;
    const d = Math.hypot(dx, dy);
    if (d > MAX) {
      out[i].x = origin[i].x + (dx / d) * MAX;
      out[i].y = origin[i].y + (dy / d) * MAX;
    }
  }
  return out;
}

export function labelWidth(text: string, font: number) {
  return Math.max(18, text.length * font * 0.95 + 8);
}
