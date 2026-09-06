export type Theme = "light" | "dark";

export const THEME_KEY = "grid-theme";

export function readTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "dark" || v === "light") return v;
  } catch {
    /* empty */
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

export function writeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* empty */
  }
  applyTheme(theme);
}
