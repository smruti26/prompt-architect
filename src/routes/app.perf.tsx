import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Gauge, RefreshCw, Activity, Hourglass, MousePointerClick, Layers } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/app/perf")({
  component: PerfPage,
  head: () => ({ meta: [{ title: "Performance Audit" }] }),
});

type Vitals = { fcp: number | null; lcp: number | null; cls: number; inp: number | null; ttfb: number | null; domInteractive: number | null; load: number | null };
type ResourceStat = { name: string; type: string; size: number; duration: number };

function rate(metric: "fcp" | "lcp" | "cls" | "inp" | "ttfb", v: number | null) {
  if (v == null) return { label: "—", tone: "secondary" as const, pct: 0 };
  const thresholds: Record<string, [number, number]> = {
    fcp: [1800, 3000], lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500], ttfb: [800, 1800],
  };
  const [good, poor] = thresholds[metric];
  const tone = v <= good ? "default" : v <= poor ? "secondary" : "destructive";
  const label = v <= good ? "Good" : v <= poor ? "Needs work" : "Poor";
  const pct = Math.max(4, Math.min(100, 100 - (v / poor) * 100));
  return { label, tone, pct } as const;
}

function PerfPage() {
  const [vitals, setVitals] = useState<Vitals>({ fcp: null, lcp: null, cls: 0, inp: null, ttfb: null, domInteractive: null, load: null });
  const [resources, setResources] = useState<ResourceStat[]>([]);
  const [memory, setMemory] = useState<{ used: number; total: number } | null>(null);
  const [domNodes, setDomNodes] = useState(0);
  const [score, setScore] = useState<number | null>(null);

  const measure = useCallback(() => {
    const nav = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined);
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((p) => p.name === "first-contentful-paint")?.startTime ?? null;
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as any[];
    const lcp = lcpEntries.length ? (lcpEntries[lcpEntries.length - 1].renderTime || lcpEntries[lcpEntries.length - 1].loadTime) : null;
    const res = (performance.getEntriesByType("resource") as PerformanceResourceTiming[])
      .map<ResourceStat>((r) => ({ name: r.name, type: r.initiatorType || "other", size: r.transferSize || 0, duration: r.duration }))
      .sort((a, b) => b.duration - a.duration).slice(0, 12);
    setResources(res);
    setVitals((v) => ({
      ...v,
      fcp, lcp,
      ttfb: nav ? nav.responseStart : null,
      domInteractive: nav ? nav.domInteractive : null,
      load: nav ? nav.loadEventEnd : null,
    }));
    const mem = (performance as any).memory;
    if (mem) setMemory({ used: mem.usedJSHeapSize / 1048576, total: mem.totalJSHeapSize / 1048576 });
    setDomNodes(document.getElementsByTagName("*").length);
  }, []);

  useEffect(() => {
    measure();
    let clsTotal = 0;
    const obsCls = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) clsTotal += entry.value;
      }
      setVitals((v) => ({ ...v, cls: +clsTotal.toFixed(4) }));
    });
    try { obsCls.observe({ type: "layout-shift", buffered: true } as any); } catch {}

    const obsLcp = new PerformanceObserver((list) => {
      const entries = list.getEntries() as any[];
      const last = entries[entries.length - 1];
      if (last) setVitals((v) => ({ ...v, lcp: last.renderTime || last.loadTime }));
    });
    try { obsLcp.observe({ type: "largest-contentful-paint", buffered: true } as any); } catch {}

    const obsInp = new PerformanceObserver((list) => {
      let max = 0;
      for (const e of list.getEntries() as any[]) if (e.duration > max) max = e.duration;
      setVitals((v) => ({ ...v, inp: Math.max(v.inp ?? 0, max) }));
    });
    try { obsInp.observe({ type: "event", buffered: true, durationThreshold: 16 } as any); } catch {}

    return () => { obsCls.disconnect(); obsLcp.disconnect(); obsInp.disconnect(); };
  }, [measure]);

  useEffect(() => {
    // Simple Lighthouse-style composite (0-100)
    const weights = { fcp: 10, lcp: 25, cls: 15, inp: 25, ttfb: 25 };
    const score01 = (m: keyof typeof weights, v: number | null) => {
      if (v == null) return 0.5;
      const t: Record<string, [number, number]> = { fcp:[1800,3000], lcp:[2500,4000], cls:[0.1,0.25], inp:[200,500], ttfb:[800,1800] };
      const [g, p] = t[m];
      if (v <= g) return 1; if (v >= p) return 0;
      return 1 - (v - g) / (p - g);
    };
    const s = (score01("fcp", vitals.fcp) * weights.fcp +
      score01("lcp", vitals.lcp) * weights.lcp +
      score01("cls", vitals.cls) * weights.cls +
      score01("inp", vitals.inp) * weights.inp +
      score01("ttfb", vitals.ttfb) * weights.ttfb);
    setScore(Math.round(s));
  }, [vitals]);

  const totalBytes = resources.reduce((a, r) => a + r.size, 0);

  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Performance Audit</h1>
          <Badge variant="outline">Live in-browser</Badge>
        </div>
        <Button onClick={measure} variant="secondary" size="sm"><RefreshCw className="mr-1.5 h-4 w-4" /> Re-measure</Button>
      </header>

      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Composite score</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-semibold tabular-nums ${score == null ? "" : score >= 90 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500"}`}>{score ?? "—"}</span>
              <span className="mb-2 text-sm text-muted-foreground">/ 100</span>
            </div>
            <Progress value={score ?? 0} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">JS Heap</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{memory ? memory.used.toFixed(1) : "—"} <span className="text-base text-muted-foreground">MB</span></div>
            <div className="text-xs text-muted-foreground">Total {memory ? memory.total.toFixed(1) : "—"} MB</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">DOM nodes</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold tabular-nums">{domNodes}</div>
            <div className="text-xs text-muted-foreground">{resources.length} top resources · {(totalBytes / 1024).toFixed(0)} KB</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <VitalCard icon={<Hourglass className="h-4 w-4" />} label="FCP" unit="ms" value={vitals.fcp} rating={rate("fcp", vitals.fcp)} />
        <VitalCard icon={<Activity className="h-4 w-4" />} label="LCP" unit="ms" value={vitals.lcp} rating={rate("lcp", vitals.lcp)} />
        <VitalCard icon={<Layers className="h-4 w-4" />} label="CLS" unit="" value={vitals.cls} rating={rate("cls", vitals.cls)} fixed={3} />
        <VitalCard icon={<MousePointerClick className="h-4 w-4" />} label="INP" unit="ms" value={vitals.inp} rating={rate("inp", vitals.inp)} />
        <VitalCard icon={<Activity className="h-4 w-4" />} label="TTFB" unit="ms" value={vitals.ttfb} rating={rate("ttfb", vitals.ttfb)} />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Slowest resources</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-1.5 pr-3">Resource</th>
                  <th className="py-1.5 pr-3">Type</th>
                  <th className="py-1.5 pr-3 text-right">Size</th>
                  <th className="py-1.5 text-right">Duration</th>
                </tr>
              </thead>
              <tbody>
                {resources.map((r) => (
                  <tr key={r.name} className="border-t border-border/40">
                    <td className="max-w-[480px] truncate py-1.5 pr-3 font-mono">{r.name.replace(/^https?:\/\/[^/]+/, "")}</td>
                    <td className="py-1.5 pr-3"><Badge variant="outline">{r.type}</Badge></td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.size ? (r.size / 1024).toFixed(1) + " KB" : "—"}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.duration.toFixed(0)} ms</td>
                  </tr>
                ))}
                {resources.length === 0 && <tr><td colSpan={4} className="py-4 text-center text-muted-foreground">No resources recorded yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recommendations</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1.5 text-sm">
            {(vitals.lcp ?? 0) > 2500 && <li>• Preload the LCP image/font and serve from the same origin to cut LCP below 2.5s.</li>}
            {(vitals.ttfb ?? 0) > 800 && <li>• TTFB is high — enable edge caching or move SSR to a closer region.</li>}
            {(vitals.cls ?? 0) > 0.1 && <li>• CLS exceeds 0.1 — reserve dimensions for images and async-loaded UI.</li>}
            {(vitals.inp ?? 0) > 200 && <li>• INP indicates long tasks — defer non-critical work with <code>requestIdleCallback</code> and code-split heavy routes.</li>}
            {domNodes > 1500 && <li>• DOM has &gt;1500 nodes — virtualize long lists and lazy-mount panels.</li>}
            {(memory?.used ?? 0) > 80 && <li>• JS heap &gt; 80 MB — audit retained closures, big in-memory caches, and unbounded arrays.</li>}
            <li>• Production builds will significantly outperform this dev-mode reading (Vite ships unminified modules in dev).</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

function VitalCard({ icon, label, unit, value, rating, fixed = 0 }: {
  icon: React.ReactNode; label: string; unit: string; value: number | null;
  rating: { label: string; tone: "default" | "secondary" | "destructive"; pct: number }; fixed?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">{icon} {label}</span>
          <Badge variant={rating.tone}>{rating.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tabular-nums">
          {value == null ? "—" : (fixed ? value.toFixed(fixed) : Math.round(value))}
          {unit && <span className="ml-1 text-sm text-muted-foreground">{unit}</span>}
        </div>
        <Progress value={rating.pct} className="mt-2" />
      </CardContent>
    </Card>
  );
}