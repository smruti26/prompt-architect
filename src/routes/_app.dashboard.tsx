import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBlueprint } from "@/lib/blueprint-store";
import { useAuth } from "@/lib/auth";
import { ArrowUpRight, Boxes, Code2, FileText, GitBranch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — ArchAI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { blueprint } = useBlueprint();

  const stats = [
    { label: "Active Blueprint", value: blueprint?.name ?? "—", icon: Sparkles },
    { label: "Diagrams", value: blueprint ? Object.keys(blueprint.diagrams).length : 0, icon: GitBranch },
    { label: "Source Files", value: blueprint ? Object.keys(blueprint.files).length : 0, icon: Code2 },
    { label: "Docs", value: blueprint ? Object.keys(blueprint.docs).length : 0, icon: FileText },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Welcome back</div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">
            Hello, <span className="gradient-text">{user?.displayName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate architecture, code, diagrams and docs from one prompt or repository.
          </p>
        </div>
        <Link to="/workspace">
          <Button className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background hover:opacity-90">
            New generation <ArrowUpRight className="ml-1.5 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="glass overflow-hidden border-border/60">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 truncate font-display text-2xl font-semibold">{value || "—"}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display">Current Blueprint</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {blueprint ? (
              <>
                <p className="text-sm text-muted-foreground">{blueprint.summary}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["frontend", "backend", "database", "infra"] as const).map((k) => (
                    <div key={k} className="rounded-lg border border-border/60 bg-card/40 p-4">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground">{k}</div>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {blueprint.stack[k].map((s) => (
                          <span key={s} className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
                <Boxes className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No blueprint yet. Start one in the AI Workspace.</p>
                <Link to="/workspace">
                  <Button className="mt-4" variant="outline">Open AI Workspace</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardHeader>
            <CardTitle className="font-display">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { to: "/workspace" as const, label: "Generate from prompt", icon: Sparkles },
              { to: "/diagrams" as const, label: "Open diagram studio", icon: GitBranch },
              { to: "/generator" as const, label: "Browse generated code", icon: Code2 },
              { to: "/docs" as const, label: "Read HLD / LLD docs", icon: FileText },
            ].map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to} className="flex items-center justify-between rounded-lg border border-border/60 bg-card/40 p-3 text-sm transition-colors hover:bg-card">
                <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" />{label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
