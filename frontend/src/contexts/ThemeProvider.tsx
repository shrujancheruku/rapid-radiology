// src/contexts/ThemeProvider.tsx
import {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    type ReactNode,
} from "react";

type Theme = "dark" | "light" | "system";

interface ThemeProviderProps {
    children: ReactNode;
    defaultTheme?: Theme;
    storageKey?: string;
}

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
                                  children,
                                  defaultTheme = "system",
                                  storageKey = "vite-ui-theme",
                              }: ThemeProviderProps) {
    const safeGetStored = () => {
        if (typeof window === "undefined") return null;
        try {
            return (localStorage.getItem(storageKey) as Theme | null) || null;
        } catch {
            return null;
        }
    };

    const [theme, setThemeState] = useState<Theme>(() => {
        const stored = safeGetStored();
        return (stored as Theme) || defaultTheme;
    });

    // keep a ref for the removal timeout so we can clear it if user toggles quickly
    const transitionTimerRef = useRef<number | null>(null);
    // keep a ref for matchMedia listener for system
    const mqlRef = useRef<MediaQueryList | null>(null);

    // Apply theme classes (used on mount and when system preference changes)
    const applyThemeClass = (t: Theme) => {
        if (typeof window === "undefined") return;
        const root = window.document.documentElement;
        root.classList.remove("light", "dark");
        if (t === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.add(prefersDark ? "dark" : "light");
        } else {
            root.classList.add(t);
        }
    };

    // On mount, apply initial theme and set up system listener if needed
    useEffect(() => {
        applyThemeClass(theme);

        // If theme == system, listen to changes
        if (typeof window !== "undefined") {
            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => {
                // only apply if theme is system
                if (theme === "system") applyThemeClass("system");
            };

            // modern API with addEventListener, fallback to addListener for older browsers
            if (mql.addEventListener) mql.addEventListener("change", handler);
            else mql.addListener(handler);

            mqlRef.current = mql;

            return () => {
                if (!mqlRef.current) return;
                if (mqlRef.current.removeEventListener)
                    mqlRef.current.removeEventListener("change", handler);
                else mqlRef.current.removeListener(handler);
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // run once on mount

    const setTheme = (newTheme: Theme) => {
        if (typeof window === "undefined") {
            setThemeState(newTheme);
            return;
        }

        const root = window.document.documentElement;

        // Clear any previous timer
        if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }

        // 1) Add the theme-transition class so descendants get the short-lived transition
        root.classList.add("theme-transition");

        // Force a reflow so the browser registers the class addition before we change theme classes
        // (this helps ensure the transition actually animates)
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        root.offsetHeight;

        // 2) Apply the theme change immediately (remove old light/dark and add new)
        //    For 'system' evaluate current preference
        if (newTheme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.remove("light", "dark");
            root.classList.add(prefersDark ? "dark" : "light");
        } else {
            root.classList.remove("light", "dark");
            root.classList.add(newTheme);
        }

        // Persist and update state
        try {
            localStorage.setItem(storageKey, newTheme);
        } catch {
            // ignore localStorage failures
        }
        setThemeState(newTheme);

        // 3) Remove the transition class after the animation window
        transitionTimerRef.current = window.setTimeout(() => {
            root.classList.remove("theme-transition");
            transitionTimerRef.current = null;
        }, 1100); // keep slight buffer (CSS is 800ms)
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}