import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ArchAI" },
      { name: "description", content: "Sign in to ArchAI to generate enterprise application architectures, code, and documentation." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [username, setUsername] = useState("smruti");
  const [password, setPassword] = useState("smruti");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const r = await login(username, password);
    setLoading(false);
    if (r.ok) {
      toast.success("Welcome back");
      navigate({ to: "/dashboard" });
    } else {
      toast.error(r.error ?? "Login failed");
    }
  };

  return (
    <div className="dark relative grid min-h-screen md:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-gradient-to-br from-[oklch(0.18_0.04_265)] via-[oklch(0.16_0.04_270)] to-[oklch(0.12_0.05_280)] p-12 md:flex">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-30" />
        <div className="pointer-events-none absolute inset-0 aurora opacity-60" />
        <div className="relative z-10">
          <Logo />
        </div>
        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Architect your next application with <span className="gradient-text">one prompt</span>.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Diagrams, code, schema, and docs — generated, downloadable, and ready to ship.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" /> Enterprise-grade · Role-based access
        </div>
      </div>

      <div className="relative flex items-center justify-center bg-background p-8">
        <div className="pointer-events-none absolute inset-0 dotted-bg opacity-20" />
        <form onSubmit={onSubmit} className="glass relative z-10 w-full max-w-md rounded-2xl p-8">
          <div className="md:hidden mb-6"><Logo /></div>
          <h2 className="font-display text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Demo credentials are pre-filled — <span className="font-mono text-foreground">smruti / smruti</span>.
          </p>

          <div className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="mt-6 w-full bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background hover:opacity-90">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
            Sign in
          </Button>

          <Link to="/" className="mt-4 block text-center text-xs text-muted-foreground hover:text-foreground">
            ← Back to home
          </Link>
        </form>
      </div>
    </div>
  );
}
