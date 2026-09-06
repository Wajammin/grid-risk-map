#!/usr/bin/env node
/**
 * GitHub Pages 는 서버가 없다. Nitro prerender 가 비어 있어도
 * 클라이언트 엔트리로 SPA 껍질을 만든다.
 */
import { readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), ".output/public");
const assets = join(dir, "assets");
if (!existsSync(assets)) {
  console.error("pages-shell: .output/public/assets 가 없습니다. 먼저 빌드하세요.");
  process.exit(1);
}

const files = readdirSync(assets);
const css = files.find((f) => f.endsWith(".css"));
const js = files
  .filter((f) => f.endsWith(".js"))
  .sort((a, b) => {
    const pa = a.startsWith("index-") ? 0 : 1;
    const pb = b.startsWith("index-") ? 0 : 1;
    return pa - pb;
  })[0];

if (!css || !js) {
  console.error("pages-shell: css/js 를 찾지 못했습니다.", files);
  process.exit(1);
}

const base = process.env.VITE_BASE || "/grid-risk-map/";
const prefix = base.endsWith("/") ? base : `${base}/`;

const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>배전망 위험 지도</title>
    <meta name="description" content="변압기 용량 대비 부하 기반 전국 시·군·구 배전망 우선점검 지도" />
    <link rel="icon" type="image/svg+xml" href="${prefix}favicon.svg" />
    <link rel="stylesheet" href="${prefix}assets/${css}" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" />
    <script type="module" src="${prefix}assets/${js}"></script>
  </head>
  <body></body>
</html>
`;

writeFileSync(join(dir, "index.html"), html);
writeFileSync(join(dir, "404.html"), html);
writeFileSync(join(dir, ".nojekyll"), "");
console.log("pages-shell: wrote index.html 404.html .nojekyll", { css, js, prefix });
