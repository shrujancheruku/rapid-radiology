import { useState, useEffect, useRef, type ReactNode } from "react";
import { type Theme, ThemeContext } from "@/contexts/useTheme";

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const applyThemeClass = (t: Theme) => {
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  if (t === "system") {
    root.classList.add(darkQuery().matches ? "dark" : "light");
  } else {
    root.classList.add(t);
  }
};

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      return (localStorage.getItem(storageKey) as Theme | null) || defaultTheme;
    } catch {
      return defaultTheme;
    }
  });

  // The system-theme listener is registered once, so it reads the latest theme from a ref.
  const themeRef = useRef(theme);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    applyThemeClass(themeRef.current);

    const mql = darkQuery();
    const handler = () => {
      if (themeRef.current === "system") applyThemeClass("system");
    };

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  const setTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    root.classList.add("theme-transition");
    // Force a reflow so the transition class applies before the theme class changes.
    void root.offsetHeight;

    applyThemeClass(newTheme);

    try {
      localStorage.setItem(storageKey, newTheme);
    } catch {
      // Storage can be unavailable (private mode); the theme still applies for this visit.
    }
    themeRef.current = newTheme;
    setThemeState(newTheme);

    transitionTimerRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimerRef.current = null;
    }, 1100);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
