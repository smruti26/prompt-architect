import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = {
  username: string;
  displayName: string;
  email: string;
  role: "Architect" | "Developer" | "Admin";
  avatarColor: string;
};

type AuthCtx = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (patch: Partial<User>) => void;
};

const Ctx = createContext<AuthCtx | null>(null);
const KEY = "arch-ai.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const login: AuthCtx["login"] = async (username, password) => {
    await new Promise((r) => setTimeout(r, 450));
    if (username.trim().toLowerCase() === "smruti" && password === "smruti") {
      const u: User = {
        username: "smruti",
        displayName: "Smruti",
        email: "smruti@archai.dev",
        role: "Architect",
        avatarColor: "#22d3ee",
      };
      localStorage.setItem(KEY, JSON.stringify(u));
      setUser(u);
      return { ok: true };
    }
    return { ok: false, error: "Invalid credentials. Try smruti / smruti." };
  };

  const logout = () => {
    localStorage.removeItem(KEY);
    setUser(null);
  };

  const updateProfile: AuthCtx["updateProfile"] = (patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  return <Ctx.Provider value={{ user, loading, login, logout, updateProfile }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
