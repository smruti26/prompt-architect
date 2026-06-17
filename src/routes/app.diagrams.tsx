import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mermaid, type MermaidApi } from "@/components/mermaid";
import { DiagramInspector } from "@/components/diagram-inspector";
import { DiagramMinimap } from "@/components/diagram-minimap";
import { useBlueprint } from "@/lib/blueprint-store";
import { DIAGRAM_ORDER, type DiagramKey } from "@/lib/blueprint";
import { LAYOUTS, applyLayout, parseDiagram, type LayoutKey } from "@/lib/diagram-parse";
import { toast } from "sonner";
import {
  Download, ZoomIn, ZoomOut, FileImage, Sparkles, Maximize2, Minimize2,
  Network, Component, FolderTree, Boxes, Workflow, Database, MessagesSquare, Cloud, GitBranch,
  Grid3x3, CircleDot, Sparkle, Maximize, RotateCcw, Map as MapIcon, MoveDiagonal,
  GitFork, Share2, Brain, Search, Zap, Filter, AlertTriangle, Activity, Eye, MessageSquare,
  Copy, Crosshair, Wand2, Layers as LayersIcon, X, PanelRightOpen, PanelRightClose, ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/app/diagrams")({
  head: () => ({ meta: [{ title: "Diagram Studio — ArchAI" }] }),
  component: Diagrams,
});

const DIAGRAM_META: Record<DiagramKey, { icon: typeof Network; gradient: string; tag: string }> = {
  architecture:  { icon: Network,         gradient: "from-cyan-400 to-blue-500",      tag: "System" },
  component:     { icon: Component,       gradient: "from-violet-400 to-fuchsia-500", tag: "Frontend" },
  folder:        { icon: FolderTree,      gradient: "from-emerald-400 to-teal-500",   tag: "Structure" },
  microfrontend: { icon: Boxes,           gradient: "from-pink-400 to-rose-500",      tag: "MFE" },
  apiflow:       { icon: Workflow,        gradient: "from-amber-400 to-orange-500",   tag: "Flow" },
  er:            { icon: Database,        gradient: "from-fuchsia-400 to-pink-500",   tag: "Data" },
  sequence:      { icon: MessagesSquare,  gradient: "from-sky-400 to-indigo-500",     tag: "Sequence" },
  deployment:    { icon: Cloud,           gradient: "from-indigo-400 to-purple-500",  tag: "DevOps" },
  cicd:          { icon: GitBranch,       gradient: "from-lime-400 to-emerald-500",   tag: "Pipeline" },
};

const LAYOUT_ICONS: Record<LayoutKey, typeof Network> = {
  architecture: Network,
  tree: GitFork,
  flow: Workflow,
  mindmap: Brain,
  graph: Share2,
};

type Bg = "dotted" | "grid" | "aurora";

function Diagrams() {
  const { blueprint } = useBlueprint();
  const [active, setActive] = useState<DiagramKey>("architecture");
  const [layout, setLayout] = useState<LayoutKey>("architecture");
  const [bg, setBg] = useState<Bg>("dotted");
  const [fullscreen, setFullscreen] = useState(false);
  const [showMinimap, setShowMinimap] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoomPct, setZoomPct] = useState(100);
  const [query, setQuery] = useState("");
  const [filterCls, setFilterCls] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const apiRef = useRef<MermaidApi | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  const current = useMemo(() => (blueprint ? blueprint.diagrams[active] : null), [blueprint, active]);
  const isFlowchart = current ? /^(flowchart|graph)\b/i.test(current.mermaid.trim()) : false;
  const chart = useMemo(() => (current ? (isFlowchart ? applyLayout(current.mermaid, layout) : current.mermaid) : ""), [current, isFlowchart, layout]);
  const parsed = useMemo(() => parseDiagram(chart), [chart]);

  // Highlight set = selected + direct neighbors (1-hop in/out).
  const highlightIds = useMemo(() => {
    if (!selectedId) return undefined;
    const set = new Set<string>([selectedId]);
    parsed.edges.forEach((e) => {
      if (e.from === selectedId) set.add(e.to);
      if (e.to === selectedId) set.add(e.from);
    });
    return set;
  }, [selectedId, parsed]);

  // Degree map for AI features
  const degree = useMemo(() => {
    const m = new Map<string, { in: number; out: number }>();
    parsed.nodes.forEach((n) => m.set(n.id, { in: 0, out: 0 }));
    parsed.edges.forEach((e) => {
      const a = m.get(e.from); if (a) a.out++;
      const b = m.get(e.to); if (b) b.in++;
    });
    return m;
  }, [parsed]);

  // Hidden node set from search + class filter + focus mode.
  const hiddenIds = useMemo(() => {
    const hidden = new Set<string>();
    const q = query.trim().toLowerCase();
    parsed.nodes.forEach((n) => {
      if (q && !n.label.toLowerCase().includes(q) && !n.id.toLowerCase().includes(q)) hidden.add(n.id);
      if (filterCls && n.cls !== filterCls) hidden.add(n.id);
    });
    if (focusMode && selectedId) {
      const keep = new Set<string>([selectedId]);
      parsed.edges.forEach((e) => {
        if (e.from === selectedId) keep.add(e.to);
        if (e.to === selectedId) keep.add(e.from);
      });
      parsed.nodes.forEach((n) => { if (!keep.has(n.id)) hidden.add(n.id); });
    }
    return hidden;
  }, [query, filterCls, focusMode, selectedId, parsed]);

  // Complexity score: nodes + 0.6*edges + density bonus.
  const complexity = useMemo(() => {
    const n = parsed.nodes.size, e = parsed.edges.length;
    if (!n) return { score: 0, label: "—", tone: "text-muted-foreground" };
    const raw = n + e * 0.6;
    const score = Math.min(100, Math.round(raw * 2.2));
    const label = score < 30 ? "Simple" : score < 60 ? "Moderate" : score < 85 ? "Complex" : "Dense";
    const tone = score < 30 ? "text-emerald-300" : score < 60 ? "text-sky-300" : score < 85 ? "text-amber-300" : "text-rose-300";
    return { score, label, tone };
  }, [parsed]);

  const classes = useMemo(() => {
    const s = new Set<string>();
    parsed.nodes.forEach((n) => { if (n.cls) s.add(n.cls); });
    return Array.from(s);
  }, [parsed]);

  const onReady = useCallback((api: MermaidApi) => {
    apiRef.current = api;
    try { api.panZoom?.setOnZoom?.((z) => setZoomPct(Math.round(z * 100))); } catch { /* noop */ }
    setZoomPct(Math.round((api.panZoom?.getZoom() ?? 1) * 100));
  }, []);

  const switchDiagram = (key: DiagramKey) => {
    setActive(key);
    setSelectedId(null);
    setZoomPct(100);
    setQuery("");
    setFilterCls(null);
    setFocusMode(false);
  };
  const switchLayout = (l: LayoutKey) => {
    setLayout(l);
    setSelectedId(null);
  };

  const exportSvg = async () => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const { saveAs } = await import("file-saver");
    saveAs(new Blob([xml], { type: "image/svg+xml" }), `${active}-${layout}.svg`);
  };

  const exportPdf = async () => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(img.width, 1200) * 2;
    canvas.height = Math.max(img.height, 800) * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0b1228";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, canvas.width / 2, canvas.height / 2);
    const dataUrl = canvas.toDataURL("image/png");
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${active}-${layout}.pdf`);
    URL.revokeObjectURL(url);
  };

  if (!blueprint) return <Empty />;

  const ActiveIcon = DIAGRAM_META[active].icon;

  // ---------- AI features ----------
  const isolatedNodes = Array.from(parsed.nodes.values()).filter((n) => {
    const d = degree.get(n.id); return d && d.in + d.out === 0;
  });
  const criticalNode = (() => {
    let top = ""; let best = -1;
    degree.forEach((d, k) => { const s = d.in + d.out; if (s > best) { best = s; top = k; } });
    return top;
  })();

  const aiActions = [
    { key: "critical", icon: Crosshair, label: "Critical path", run: () => {
        if (!criticalNode) return toast.message("No nodes");
        setSelectedId(criticalNode);
        toast.success(`Hot node: ${parsed.nodes.get(criticalNode)?.label}`);
      } },
    { key: "isolated", icon: AlertTriangle, label: "Find isolated", run: () => {
        if (!isolatedNodes.length) return toast.success("No isolated nodes — clean graph.");
        setSelectedId(isolatedNodes[0].id);
        toast.warning(`${isolatedNodes.length} isolated node(s) detected`);
      } },
    { key: "focus", icon: Eye, label: focusMode ? "Exit focus" : "Focus selection", run: () => {
        if (!selectedId) return toast.message("Select a node first");
        setFocusMode((v) => !v);
      } },
    { key: "clear", icon: X, label: "Clear filters", run: () => {
        setQuery(""); setFilterCls(null); setFocusMode(false); setSelectedId(null);
        toast.success("Filters cleared");
      } },
    { key: "fit", icon: Wand2, label: "Smart fit", run: () => {
        apiRef.current?.fit(); apiRef.current?.reset(); toast.success("Re-centered & fit");
      } },
    { key: "explain", icon: MessageSquare, label: "Explain selection", run: () => {
        if (!selectedId) return toast.message("Select a node first");
        const n = parsed.nodes.get(selectedId); const d = degree.get(selectedId);
        toast(`${n?.label}: ${d?.in ?? 0} upstream, ${d?.out ?? 0} downstream`, {
          description: n?.cls ? `Layer: ${n.cls}. Touches ${(d?.in ?? 0) + (d?.out ?? 0)} edges.` : `Touches ${(d?.in ?? 0) + (d?.out ?? 0)} edges.`,
        });
      } },
    { key: "copy", icon: Copy, label: "Copy Mermaid", run: async () => {
        try { await navigator.clipboard.writeText(chart); toast.success("Mermaid copied"); }
        catch { toast.error("Copy failed"); }
      } },
    { key: "complexity", icon: Activity, label: `Score ${complexity.score}`, run: () => {
        toast(`Complexity: ${complexity.label} (${complexity.score}/100)`, {
          description: `${parsed.nodes.size} nodes · ${parsed.edges.length} edges`,
        });
      } },
    { key: "stack", icon: LayersIcon, label: "Surface layers", run: () => {
        if (!classes.length) return toast.message("No layers detected");
        const next = filterCls ? null : classes[0];
        setFilterCls(next);
        toast.success(next ? `Showing ${next} layer` : "Showing all layers");
      } },
    { key: "suggest", icon: Zap, label: "AI suggestions", run: () => {
        const tips: string[] = [];
        if (isolatedNodes.length) tips.push(`${isolatedNodes.length} isolated nodes — consider wiring or removing.`);
        if (complexity.score > 75) tips.push("High complexity — try splitting into sub-diagrams.");
        const dataNodes = Array.from(parsed.nodes.values()).filter((n) => n.cls === "data").length;
        if (dataNodes > 3) tips.push("Multiple data stores — verify ownership boundaries.");
        if (!tips.length) tips.push("Architecture looks balanced.");
        toast("AI Suggestions", { description: tips.join("  •  ") });
      } },
  ];

  const [inspectorOpen, setInspectorOpen] = useState(true);

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 flex flex-col bg-background" : "flex h-[calc(100vh-2rem)] flex-col"}>
      {/* ============ TOP NAV BAR ============ */}
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        {/* Row 1: brand + title + primary actions */}
        <div className="flex items-center gap-4 px-5 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${DIAGRAM_META[active].gradient} text-white shadow-lg`}>
              <ActiveIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-base font-semibold tracking-tight">{current?.title}</span>
                <span className="rounded-md border border-border/60 bg-card/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {DIAGRAM_META[active].tag}
                </span>
                <span className="hidden items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-400 sm:inline-flex">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
                </span>
                <span className={`hidden items-center gap-1 rounded-md border border-border/60 bg-card/40 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] md:inline-flex ${complexity.tone}`}>
                  <Activity className="h-2.5 w-2.5" /> {complexity.label} · {complexity.score}
                </span>
              </div>
              <div className="truncate text-xs text-muted-foreground">{current?.description}</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <div className="hidden items-center gap-1 rounded-lg border border-border/60 bg-card/40 p-1 lg:flex">
              {([
                { k: "dotted", I: CircleDot },
                { k: "grid", I: Grid3x3 },
                { k: "aurora", I: Sparkles },
              ] as const).map(({ k, I }) => (
                <button
                  key={k}
                  onClick={() => setBg(k)}
                  title={k}
                  className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${bg === k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <I className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <div className="flex items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-1">
              <button onClick={() => apiRef.current?.zoomOut()} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"><ZoomOut className="h-3.5 w-3.5" /></button>
              <span className="w-11 text-center text-[11px] tabular-nums text-muted-foreground">{zoomPct}%</span>
              <button onClick={() => apiRef.current?.zoomIn()} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"><ZoomIn className="h-3.5 w-3.5" /></button>
              <span className="mx-0.5 h-4 w-px bg-border/60" />
              <button title="Fit" onClick={() => apiRef.current?.fit()} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"><Maximize className="h-3.5 w-3.5" /></button>
              <button title="Reset" onClick={() => apiRef.current?.reset()} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
              <button title="Minimap" onClick={() => setShowMinimap((v) => !v)} className={`grid h-7 w-7 place-items-center rounded-md hover:bg-card ${showMinimap ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}><MapIcon className="h-3.5 w-3.5" /></button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setFullscreen((f) => !f)} className="hidden md:inline-flex">
              {fullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="outline" size="sm" onClick={exportSvg}><FileImage className="mr-1.5 h-3.5 w-3.5" />SVG</Button>
            <Button size="sm" className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background" onClick={exportPdf}>
              <Download className="mr-1.5 h-3.5 w-3.5" />Export PDF
            </Button>
            <button
              onClick={() => setInspectorOpen((v) => !v)}
              title={inspectorOpen ? "Hide inspector" : "Show inspector"}
              className={`grid h-9 w-9 place-items-center rounded-lg border transition-colors ${inspectorOpen ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"}`}
            >
              {inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Row 2: horizontal diagram tabs */}
        <div className="flex items-center gap-2 overflow-x-auto border-t border-border/60 bg-card/20 px-5 py-2 scrollbar-none">
          <span className="mr-1 shrink-0 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Diagrams
          </span>
          {DIAGRAM_ORDER.map((d) => {
            const meta = DIAGRAM_META[d.key];
            const Icon = meta.icon;
            const isActive = active === d.key;
            return (
              <button
                key={d.key}
                onClick={() => switchDiagram(d.key)}
                className={`group inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all ${
                  isActive
                    ? "border-[var(--cyan-glow)]/60 bg-gradient-to-r from-[var(--cyan-glow)]/15 to-[var(--violet-glow)]/15 text-foreground shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-cyan-glow)_25%,transparent)]"
                    : "border-border/60 bg-card/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
              >
                <span className={`grid h-5 w-5 place-items-center rounded-md bg-gradient-to-br ${meta.gradient} text-white`}>
                  <Icon className="h-3 w-3" />
                </span>
                <span className="font-medium">{d.label}</span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">{meta.tag}</span>
              </button>
            );
          })}
        </div>

        {/* Row 3: layout + search + AI actions */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-gradient-to-r from-[var(--cyan-glow)]/[0.03] via-transparent to-[var(--violet-glow)]/[0.03] px-5 py-2">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            <MoveDiagonal className="h-3 w-3" /> Layout
          </span>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/40 p-0.5">
            {LAYOUTS.map((l) => {
              const Icon = LAYOUT_ICONS[l.key];
              const isOn = layout === l.key;
              const disabled = !isFlowchart;
              return (
                <button
                  key={l.key}
                  onClick={() => !disabled && switchLayout(l.key)}
                  disabled={disabled}
                  title={l.description}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] transition-all ${
                    disabled
                      ? "cursor-not-allowed text-muted-foreground/40"
                      : isOn
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:bg-card hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {l.label}
                </button>
              );
            })}
          </div>

          <span className="mx-1 hidden h-5 w-px bg-border/60 md:block" />

          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search nodes…"
              className="h-8 w-48 rounded-lg border-border/60 bg-card/40 pl-8 text-xs"
            />
          </div>

          {classes.length > 0 && (
            <div className="hidden items-center gap-0.5 rounded-lg border border-border/60 bg-card/40 p-0.5 lg:flex">
              <Filter className="ml-1.5 h-3 w-3 text-muted-foreground" />
              <button
                onClick={() => setFilterCls(null)}
                className={`rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] transition-colors ${!filterCls ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >All</button>
              {classes.map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCls(filterCls === c ? null : c)}
                  className={`rounded-md px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] transition-colors ${filterCls === c ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >{c}</button>
              ))}
            </div>
          )}

          <span className="ml-auto inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--cyan-glow)]">
            <Sparkles className="h-3 w-3" /> AI
          </span>
          <div className="flex flex-wrap items-center gap-1">
            {aiActions.map((a) => {
              const Icon = a.icon;
              return (
                <button
                  key={a.key}
                  onClick={a.run}
                  title={a.label}
                  className="group inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-2 py-1 text-[11px] text-muted-foreground transition-all hover:border-[var(--cyan-glow)]/50 hover:bg-[var(--cyan-glow)]/10 hover:text-foreground"
                >
                  <Icon className="h-3 w-3" />
                  <span className="hidden xl:inline">{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ============ MAIN CANVAS + INSPECTOR ============ */}
      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Canvas */}
        <div ref={hostRef} className="relative min-w-0 flex-1 overflow-hidden">
          <div className={`pointer-events-none absolute inset-0 ${bg === "dotted" ? "dotted-bg opacity-30" : bg === "grid" ? "grid-bg opacity-40" : "aurora opacity-60"}`} />
          <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-[var(--cyan-glow)] opacity-[0.08] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[var(--violet-glow)] opacity-[0.08] blur-3xl" />
          <div className="relative h-full w-full">
            {current && (
              <Mermaid
                id={`${active}-${layout}`}
                chart={chart}
                onReady={onReady}
                onNodeClick={(nid) => setSelectedId((cur) => (cur === nid ? null : nid))}
                selectedId={selectedId}
                highlightIds={highlightIds}
                hiddenIds={hiddenIds}
              />
            )}
          </div>
          {showMinimap && <DiagramMinimap api={apiRef.current} refreshKey={`${active}-${layout}-${zoomPct}`} />}

          {/* Floating legend */}
          <div className="pointer-events-auto absolute bottom-4 left-4 z-10 flex max-w-[60%] flex-wrap items-center gap-x-3 gap-y-1 rounded-xl border border-border/60 bg-background/80 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
            {[
              ["Users", "#fde68a"], ["Edge", "#a7f3d0"], ["Web", "#bae6fd"],
              ["Services", "#c7d2fe"], ["API", "#ddd6fe"], ["Data", "#fbcfe8"],
              ["Cache", "#fecaca"], ["Queue", "#fed7aa"], ["Infra", "#e2e8f0"],
            ].map(([label, color]) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full ring-1 ring-black/10" style={{ background: color }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Inspector drawer */}
        {inspectorOpen && (
          <aside className="hidden h-full w-[340px] shrink-0 overflow-y-auto border-l border-border/60 bg-background/60 backdrop-blur md:block">
            <DiagramInspector parsed={parsed} selectedId={selectedId} onSelect={setSelectedId} />
          </aside>
        )}
      </div>
    </div>
  );
}

function Empty() {
  return (
    <div className="mx-auto max-w-3xl p-10">
      <Card className="glass border-border/60">
        <CardContent className="space-y-4 p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-primary" />
          <h2 className="font-display text-xl font-semibold">No diagrams yet</h2>
          <p className="text-sm text-muted-foreground">Generate a blueprint from the AI Workspace to populate the diagram studio.</p>
          <Link to="/app/workspace"><Button>Go to AI Workspace</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
