import { readFileSync, writeFileSync } from "node:fs";

const src = JSON.parse(readFileSync("src/data/korea-paths.equirect.json", "utf8"));

const LNG0 = 124.45;
const LNG1 = 132.05;
const LAT0 = 32.95;
const LAT1 = 38.72;
const VW = 780;
const VH = 980;

function toLl(x, y) {
  return {
    lng: LNG0 + (x / VW) * (LNG1 - LNG0),
    lat: LAT1 - (y / VH) * (LAT1 - LAT0),
  };
}

function merc(lng, lat) {
  const x = (lng * Math.PI) / 180;
  const φ = Math.max(-85, Math.min(85, lat)) * (Math.PI / 180);
  const y = Math.log(Math.tan(Math.PI / 4 + φ / 2));
  return { x, y };
}

function parsePath(d) {
  const tokens = d.match(/[MLZmlz]|-?\d+\.?\d*/g) ?? [];
  const cmds = [];
  let i = 0;
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === "M" || t === "L" || t === "m" || t === "l") {
      cmds.push({ t: t.toUpperCase(), x: Number(tokens[i + 1]), y: Number(tokens[i + 2]) });
      i += 3;
    } else if (t === "Z" || t === "z") {
      cmds.push({ t: "Z" });
      i += 1;
    } else {
      i += 1;
    }
  }
  return cmds;
}

const all = [];
for (const d of Object.values(src.paths)) {
  for (const c of parsePath(d)) {
    if (c.t === "Z") continue;
    all.push(merc(toLl(c.x, c.y).lng, toLl(c.x, c.y).lat));
  }
}
const mx0 = Math.min(...all.map((p) => p.x));
const mx1 = Math.max(...all.map((p) => p.x));
const my0 = Math.min(...all.map((p) => p.y));
const my1 = Math.max(...all.map((p) => p.y));
const W = 900;
const scale = W / (mx1 - mx0);
const H = (my1 - my0) * scale;
const PAD = 28;

function xy(lng, lat) {
  const m = merc(lng, lat);
  return {
    x: PAD + (m.x - mx0) * scale,
    y: PAD + (my1 - m.y) * scale,
  };
}

function rewrite(d) {
  return parsePath(d)
    .map((c) => {
      if (c.t === "Z") return "Z";
      const ll = toLl(c.x, c.y);
      const p = xy(ll.lng, ll.lat);
      return `${c.t}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join("");
}

const paths = {};
const bounds = {};
for (const [id, d] of Object.entries(src.paths)) {
  const nd = rewrite(d);
  paths[id] = nd;
  const pts = parsePath(nd).filter((c) => c.t !== "Z");
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  bounds[id] = [
    Math.min(...xs),
    Math.min(...ys),
    Math.max(...xs),
    Math.max(...ys),
  ].map((n) => Math.round(n * 10) / 10);
}

const labels = {};
for (const [id, lab] of Object.entries(src.labels)) {
  const ll = toLl(lab.x, lab.y);
  const p = xy(ll.lng, ll.lat);
  labels[id] = { short: lab.short, x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
}

const vb = [0, 0, Math.round(W + PAD * 2), Math.round(H + PAD * 2)];
const out = {
  paths,
  labels,
  bounds,
  vb,
  proj: { mx0, my1, scale, pad: PAD },
};

writeFileSync("src/data/korea-paths.json", JSON.stringify(out));
console.log("vb", vb, "aspect", (vb[2] / vb[3]).toFixed(3));
