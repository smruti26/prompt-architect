import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, Eye, Wand2, Sparkles, TrendingUp, Trash2, ArrowLeft,
  Target, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { CATEGORIES, type TemplateCategoryId } from "@/lib/templates/marketplace";
import {
  clearEvents, getAnalyticsSummary, type AnalyticsSummary,
} from "@/lib/templates/marketplace-store";

export const Route = createFileRoute("/app/marketplace-analytics")({
  head: () => ({
    meta: [
      { title: "Marketplace Analytics - ArchAI" },
      { name: "description", content: "Track template views, launches, generation conversion and top-performing templates." },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    const refresh = () => setSummary(getAnalyticsSummary());
    refresh();
    const onUpdate = () => refresh();
    window.addEventListener("marketplace:events", onUpdate);
    return () => window.removeEventListener("marketplace:events", onUpdate);
  }, []);

  const maxDay = useMemo(() => {
    if (!summary) return 0;
    return summary.byDay.reduce((m, d) => Math.max(m, d.views + d.launches + d.generates), 1);
  }, [summary]);

  if (!summary) {
    return <div className="p-6 text-sm text-muted-foreground">Loading analytics...</div>;
  }

  const { totals, byTemplate, byCategory, byType, byDay, topByCategory } = summary;
  const empty = totals.views + totals.launches + totals.generates === 0;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border bg-gradient-to-br from-sky-500/10 via-background to-violet-500/5 px-6 py-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Activity className="h-3.5 w-3.5 text-sky-400" /> Marketplace Analytics
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">Template performance</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Views, launches, generation conversion and top performers across every category.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/app/marketplace"><ArrowLeft className="mr-2 h-4 w-4" />Back to marketplace</Link>
          </Button>
          <Button size="sm" variant="ghost" onClick={() => { clearEvents(); toast.success("Analytics reset"); }}>
            <Trash2 className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Eye} label="Views" value={totals.views} accent="text-sky-400" />
        <Kpi icon={Wand2} label="Launches" value={totals.launches} accent="text-violet-400" />
        <Kpi icon={Sparkles} label="Generated diagrams" value={totals.generates} accent="text-emerald-400" />
        <Kpi icon={Target} label="View -> generate" value={`${(totals.conversion * 100).toFixed(1)}%`} accent="text-amber-400" />
      </div>

      {empty && (
        <div className="mt-4 rounded-xl border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          No activity yet. Browse the <Link to="/app/marketplace" className="underline">marketplace</Link> and launch a template to start seeing analytics.
        </div>
      )}

      <div className="mt-4 grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-auto pb-6 lg:grid-cols-3">
        {/* Activity over time */}
        <Card title="Activity (last 14 days)" icon={BarChart3} className="lg:col-span-2">
          <div className="flex h-48 items-end gap-1">
            {byDay.slice(-14).map((d) => {
              const total = d.views + d.launches + d.generates;
              const h = (total / Math.max(1, maxDay)) * 100;
              return (
                <div key={d.day} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex w-full flex-1 items-end overflow-hidden rounded-md bg-muted/30">
                    <div className="w-full bg-gradient-to-t from-sky-500/70 via-violet-500/60 to-emerald-400/70 transition" style={{ height: `${h}%` }} />
                    <div className="pointer-events-none absolute -top-8 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded border bg-popover px-2 py-1 text-[10px] shadow group-hover:block">
                      {d.views}v / {d.launches}l / {d.generates}g
                    </div>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{d.day.slice(5)}</div>
                </div>
              );
            })}
            {byDay.length === 0 && <div className="flex-1 text-center text-xs text-muted-foreground">No activity yet</div>}
          </div>
        </Card>

        {/* By type */}
        <Card title="By diagram type" icon={Layers}>
          <BreakdownList rows={byType.map((r) => ({ key: r.type, label: r.type, value: r.views + r.launches + r.generates }))} />
        </Card>

        {/* By category */}
        <Card title="By category" icon={Layers} className="lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {byCategory.length === 0 && <div className="text-xs text-muted-foreground">No category data yet.</div>}
            {byCategory.map((c) => {
              const cat = CATEGORIES.find((x) => x.id === c.category);
              const total = c.views + c.launches + c.generates;
              return (
                <div key={c.category} className={`rounded-lg border bg-gradient-to-br ${cat?.gradient ?? ""} p-3`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${cat?.accent ?? ""}`}>{cat?.label ?? c.category}</span>
                    <span className="text-muted-foreground">{total}</span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] text-muted-foreground">
                    <Pill label="V" v={c.views} />
                    <Pill label="L" v={c.launches} />
                    <Pill label="G" v={c.generates} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Top templates overall */}
        <Card title="Top-performing templates" icon={TrendingUp}>
          <ScrollArea className="h-72 pr-2">
            <ol className="space-y-2">
              {byTemplate.slice(0, 20).map((t, i) => (
                <li key={t.templateId} className="flex items-center gap-2 rounded-md border bg-background/50 p-2">
                  <span className="w-6 text-center text-xs text-muted-foreground">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium">{t.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">{t.type} - {(t.conversion * 100).toFixed(0)}% conv</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-[10px]">
                    <Badge variant="secondary">{t.views}v</Badge>
                    <Badge variant="secondary">{t.launches}l</Badge>
                    <Badge variant="secondary">{t.generates}g</Badge>
                  </div>
                </li>
              ))}
              {byTemplate.length === 0 && <li className="text-xs text-muted-foreground">No templates have activity yet.</li>}
            </ol>
          </ScrollArea>
        </Card>

        {/* Top per category */}
        <Card title="Top templates per category" icon={TrendingUp} className="lg:col-span-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const list = topByCategory[cat.id] ?? [];
              if (list.length === 0) return null;
              return (
                <div key={cat.id} className={`rounded-lg border bg-gradient-to-br ${cat.gradient} p-3`}>
                  <div className={`mb-2 text-xs font-medium ${cat.accent}`}>{cat.label}</div>
                  <ol className="space-y-1">
                    {list.map((t, i) => (
                      <li key={t.templateId} className="flex items-center justify-between gap-2 rounded bg-background/40 px-2 py-1 text-[11px]">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="text-muted-foreground">{i + 1}</span>
                          <Link to="/app/template/$id" params={{ id: t.templateId }} className="truncate hover:underline">
                            {t.name}
                          </Link>
                        </div>
                        <span className="shrink-0 text-muted-foreground">{t.launches + t.generates}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
            {Object.keys(topByCategory).length === 0 && (
              <div className="text-xs text-muted-foreground">No per-category data yet.</div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: typeof Activity; label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-xl border bg-background/50 p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className={`h-3.5 w-3.5 ${accent}`} /> {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  );
}

function Card({ title, icon: Icon, children, className = "" }: { title: string; icon: typeof Activity; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border bg-background/50 p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </div>
      {children}
    </div>
  );
}

function BreakdownList({ rows }: { rows: { key: string; label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <div className="text-xs text-muted-foreground">No data yet.</div>;
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.key}>
          <div className="flex items-center justify-between text-[11px]">
            <span className="truncate">{r.label}</span>
            <span className="text-muted-foreground">{r.value}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded bg-muted/40">
            <div className="h-full bg-gradient-to-r from-sky-500/70 to-violet-500/70" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Pill({ label, v }: { label: string; v: number }) {
  return (
    <div className="rounded bg-background/50 px-1.5 py-0.5 text-center">
      <span className="text-foreground/70">{label}</span> {v}
    </div>
  );
}

// Used to satisfy TS for cat unused destructure when none of TemplateCategoryId
// is matched in the loop above.
export type _Touch = TemplateCategoryId;
