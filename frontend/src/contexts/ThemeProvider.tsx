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

    const transitionTimerRef = useRef<number | null>(null);
    const mqlRef = useRef<MediaQueryList | null>(null);

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

    useEffect(() => {
        applyThemeClass(theme);

        if (typeof window !== "undefined") {
            const mql = window.matchMedia("(prefers-color-scheme: dark)");
            const handler = () => {
                if (theme === "system") applyThemeClass("system");
            };

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
    }, []);

    const setTheme = (newTheme: Theme) => {
        if (typeof window === "undefined") {
            setThemeState(newTheme);
            return;
        }

        const root = window.document.documentElement;

        if (transitionTimerRef.current) {
            window.clearTimeout(transitionTimerRef.current);
            transitionTimerRef.current = null;
        }

        root.classList.add("theme-transition");

        root.offsetHeight;


        if (newTheme === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            root.classList.remove("light", "dark");
            root.classList.add(prefersDark ? "dark" : "light");
        } else {
            root.classList.remove("light", "dark");
            root.classList.add(newTheme);
        }

        try {
            localStorage.setItem(storageKey, newTheme);
        } catch {
        }
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

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error("useTheme must be used within ThemeProvider");
    }
    return ctx;
}