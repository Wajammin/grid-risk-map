// @ts-nocheck
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { RiskMap } from './risk-map.js';

const T = RiskMap._test;
const geo = JSON.parse(readFileSync(new URL('../../public/data/sigungu.geojson', import.meta.url), 'utf8'));

function hexToRgb(hex) {
  const n = hex.replace('#', '');
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}

/* Machado 2009 적록(제1색맹) 모의. 선형 sRGB 근사. */
const PROTANOPE = [
  [0.152286, 1.052583, -0.204868],
  [0.114503, 0.786281, 0.099216],
  [-0.003882, -0.048116, 1.051998],
];

function srgbToLinear(c) {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(x) {
  const y = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, y)) * 255);
}

function simulateProtanopia(hex) {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear);
  const rgb = [
    PROTANOPE[0][0] * r + PROTANOPE[0][1] * g + PROTANOPE[0][2] * b,
    PROTANOPE[1][0] * r + PROTANOPE[1][1] * g + PROTANOPE[1][2] * b,
    PROTANOPE[2][0] * r + PROTANOPE[2][1] * g + PROTANOPE[2][2] * b,
  ].map(linearToSrgb);
  return rgb;
}

/* OKLab ΔE — 이웃 등급이 배경·서로에게서 충분히 떨어지는지 본다. */
function rgbToOklab([r, g, b]) {
  const lr = srgbToLinear(r);
  const lg = srgbToLinear(g);
  const lb = srgbToLinear(b);
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function deltaE(hexA, rgbB) {
  const a = rgbToOklab(hexToRgb(hexA));
  const b = rgbToOklab(rgbB);
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

describe('RiskMap choropleth', () => {
  it('모든 feature 가 경로 문자열을 얻고 viewBox 세로는 비에서 나온다', () => {
    const wanted = geo.features;
    const bounds = T.boundsOf(wanted);
    const h = T.viewHeightFromBounds(bounds);
    assert.equal(T.VIEW_W, 1000);
    assert.ok(h >= 700 && h <= 1800);
    const ratio = (bounds.maxLat - bounds.minLat) / (bounds.maxLon - bounds.minLon);
    assert.ok(h / T.VIEW_W > 0.7, '세로로 긴 한반도 비를 따른다');
    void ratio;

    const project = T.makeProjection(bounds, { x: 14, y: 14, w: 972, h: h - 28 });
    let n = 0;
    for (const f of wanted) {
      const d = T.geometryToPath(f.geometry, project);
      assert.match(d, /^M/);
      assert.match(d, /Z/);
      const [cx, cy] = T.centerOfPath(d);
      assert.equal(Number.isFinite(cx), true);
      assert.equal(Number.isFinite(cy), true);
      n += 1;
    }
    assert.equal(n, 229);
    assert.equal(T.keyOf(wanted[0]), `${wanted[0].properties.시도}|${wanted[0].properties.시군구}`);
  });

  it('등급 색 6개가 서로 다르고 적록색맹 모의에서도 이웃·배경과 떨어진다', () => {
    const cols = T.GRADE_COLORS;
    assert.equal(cols.length, 6);
    assert.equal(new Set(cols).size, 6);
    const bg = [13, 17, 23]; // #0d1117
    for (let i = 0; i < cols.length; i += 1) {
      const sim = simulateProtanopia(cols[i]);
      assert.ok(deltaE(cols[i], bg) > 0.12, `${cols[i]} 가 배경과 붙음`);
      if (i === 0) continue;
      const prev = simulateProtanopia(cols[i - 1]);
      const d = Math.hypot(sim[0] - prev[0], sim[1] - prev[1], sim[2] - prev[2]) / 255;
      assert.ok(d > 0.04, `${cols[i - 1]}→${cols[i]} 적록 모의 간격 ${d}`);
    }
    assert.equal(T.gradeIndex(0), 0);
    assert.equal(T.gradeIndex(19.9), 0);
    assert.equal(T.gradeIndex(20), 1);
    assert.equal(T.gradeIndex(79.9), 3);
    assert.equal(T.gradeIndex(80), 4);
    assert.equal(T.gradeIndex(99.9), 4);
    assert.equal(T.gradeIndex(100), 5);
    assert.equal(T.gradeIndex(140), 5);
  });

  it('클램프가 배율 1 에서 원점을 고정한다', () => {
    const a = T.clampViewState({ x: -40, y: 12, scale: 1 }, 1000, 1200);
    assert.deepEqual(a, { x: 0, y: 0, scale: 1 });
    const b = T.clampViewState({ x: 50, y: 50, scale: 2 }, 1000, 1200);
    assert.equal(b.x, 0);
    assert.equal(b.y, 0);
    const c = T.clampViewState({ x: -2000, y: -3000, scale: 2 }, 1000, 1200);
    assert.equal(c.x, -1000);
    assert.equal(c.y, -1200);
  });
});
