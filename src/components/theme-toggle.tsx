import { applyTheme, readTheme, writeTheme, type Theme } from "@/lib/theme";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = readTheme();
    setTheme(t);
    applyTheme(t);
  }, []);

  const dark = theme === "dark";
  return (
    <button
      type="button"
      aria-label={dark ? "라이트 모드로 바꾸기" : "다크 모드로 바꾸기"}
      title={dark ? "라이트 모드" : "다크 모드"}
      aria-pressed={dark}
      onClick={() => {
        const next: Theme = dark ? "light" : "dark";
        writeTheme(next);
        setTheme(next);
      }}
      className="toolbar-btn size-8 p-0 text-muted-foreground hover:text-foreground sm:size-9"
    >
      {dark ? <Sun className="size-4" strokeWidth={2} /> : <Moon className="size-4" strokeWidth={2} />}
    </button>
  );
}
