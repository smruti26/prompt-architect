import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "dark" | "light";
const C = createContext<{ mode: Mode; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>("dark");
  useEffect(() => {
    const saved = (typeof window !== "undefined" && (localStorage.getItem("arch-ai.theme") as Mode | null)) || "dark";
    setMode(saved);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    localStorage.setItem("arch-ai.theme", mode);
  }, [mode]);
  return <C.Provider value={{ mode, toggle: () => setMode((m) => (m === "dark" ? "light" : "dark")) }}>{children}</C.Provider>;
}

export function useTheme() {
  const c = useContext(C);
  if (!c) throw new Error("useTheme must be used inside ThemeProvider");
  return c;
}
