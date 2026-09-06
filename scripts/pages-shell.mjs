#!/usr/bin/env node
/**
 * Vite Pages 빌드 산출물을 GitHub Pages 루트 파일명으로 맞춘다.
 */
import { copyFileSync, existsSync, readdirSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(process.cwd(), ".output/public");
if (!existsSync(dir)) {
  console.error("pages-shell: .output/public 없음");
  process.exit(1);
}

const spa = join(dir, "spa-index.html");
const index = join(dir, "index.html");
if (existsSync(spa)) renameSync(spa, index);
if (!existsSync(index)) {
  console.error("pages-shell: index.html 없음", readdirSync(dir));
  process.exit(1);
}
copyFileSync(index, join(dir, "404.html"));
writeFileSync(join(dir, ".nojekyll"), "");
console.log("pages-shell: ok", readdirSync(dir).slice(0, 12));
