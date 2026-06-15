import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { generateBlueprint, type Blueprint } from "./blueprint";

type Ctx = {
  blueprint: Blueprint | null;
  generating: boolean;
  logs: string[];
  generate: (prompt: string, source?: string) => Promise<Blueprint>;
  clear: () => void;
};

const KEY = "arch-ai.blueprint";
const C = createContext<Ctx | null>(null);

export function BlueprintProvider({ children }: { children: ReactNode }) {
  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setBlueprint(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const generate: Ctx["generate"] = async (prompt, source) => {
    setGenerating(true);
    setLogs([]);
    const steps = [
      `→ Parsing prompt${source ? ` + ${source}` : ""}…`,
      "→ Detecting frameworks, libraries, design patterns…",
      "→ Inferring domain entities + relationships…",
      "→ Synthesizing system architecture…",
      "→ Generating component tree + folder structure…",
      "→ Drafting API contracts (REST + GraphQL)…",
      "→ Producing Mermaid diagrams (architecture, ER, sequence, deployment, CI/CD)…",
      "→ Compiling HLD + LLD documentation…",
      "→ Writing source files + IaC manifests…",
      "✓ Blueprint ready.",
    ];
    for (const s of steps) {
      await new Promise((r) => setTimeout(r, 280 + Math.random() * 220));
      setLogs((l) => [...l, s]);
    }
    const bp = generateBlueprint(prompt);
    setBlueprint(bp);
    try {
      localStorage.setItem(KEY, JSON.stringify(bp));
    } catch {
      // ignore
    }
    setGenerating(false);
    return bp;
  };

  const clear = () => {
    setBlueprint(null);
    setLogs([]);
    localStorage.removeItem(KEY);
  };

  return <C.Provider value={{ blueprint, generating, logs, generate, clear }}>{children}</C.Provider>;
}

export function useBlueprint() {
  const c = useContext(C);
  if (!c) throw new Error("useBlueprint must be used inside BlueprintProvider");
  return c;
}
