/** GitHub Pages 하위 경로에서도 정적 파일이 열리게 BASE_URL을 붙인다. */
export function publicUrl(path: string) {
  const base = import.meta.env.BASE_URL || "/";
  const prefix = base.endsWith("/") ? base.slice(0, -1) : base;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${prefix}${suffix}` || "/";
}
