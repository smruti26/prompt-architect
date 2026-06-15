import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mermaid } from "@/components/mermaid";
import { useBlueprint } from "@/lib/blueprint-store";
import { DIAGRAM_ORDER, type DiagramKey } from "@/lib/blueprint";
import {
  Download, ZoomIn, ZoomOut, FileImage, Sparkles, Maximize2, Minimize2,
  Network, Component, FolderTree, Boxes, Workflow, Database, MessagesSquare, Cloud, GitBranch,
  Grid3x3, CircleDot, Sparkle,
} from "lucide-react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export const Route = createFileRoute("/app/diagrams")({
  head: () => ({ meta: [{ title: "Diagram Studio — ArchAI" }] }),
  component: Diagrams,
});

const DIAGRAM_META: Record<DiagramKey, { icon: typeof Network; gradient: string; tag: string }> = {
  architecture:  { icon: Network,         gradient: "from-cyan-400 to-blue-500",     tag: "System" },
  component:     { icon: Component,       gradient: "from-violet-400 to-fuchsia-500", tag: "Frontend" },
  folder:        { icon: FolderTree,      gradient: "from-emerald-400 to-teal-500",  tag: "Structure" },
  microfrontend: { icon: Boxes,           gradient: "from-pink-400 to-rose-500",     tag: "MFE" },
  apiflow:       { icon: Workflow,        gradient: "from-amber-400 to-orange-500",  tag: "Flow" },
  er:            { icon: Database,        gradient: "from-fuchsia-400 to-pink-500",  tag: "Data" },
  sequence:      { icon: MessagesSquare,  gradient: "from-sky-400 to-indigo-500",    tag: "Sequence" },
  deployment:    { icon: Cloud,           gradient: "from-indigo-400 to-purple-500", tag: "DevOps" },
  cicd:          { icon: GitBranch,       gradient: "from-lime-400 to-emerald-500",  tag: "Pipeline" },
};

type Bg = "dotted" | "grid" | "aurora";

function Diagrams() {
  const { blueprint } = useBlueprint();
  const [active, setActive] = useState<DiagramKey>("architecture");
  const [zoom, setZoom] = useState(1);
  const [bg, setBg] = useState<Bg>("dotted");
  const [fullscreen, setFullscreen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);

  const current = useMemo(() => (blueprint ? blueprint.diagrams[active] : null), [blueprint, active]);

  const exportSvg = () => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    saveAs(new Blob([xml], { type: "image/svg+xml" }), `${active}.svg`);
  };

  const exportPdf = async () => {
    const svg = hostRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#0b1228";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
    pdf.addImage(dataUrl, "PNG", 0, 0, canvas.width, canvas.height);
    pdf.save(`${active}.pdf`);
    URL.revokeObjectURL(url);
  };

  if (!blueprint) return <Empty />;

  const ActiveIcon = DIAGRAM_META[active].icon;

  return (
    <div className={fullscreen ? "fixed inset-0 z-50 bg-background p-4 md:p-6 overflow-auto" : "mx-auto max-w-[1400px] space-y-6 p-6 md:p-10"}>
      {!fullscreen && (
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              <Sparkle className="h-3 w-3 text-[var(--cyan-glow)]" /> Diagram Studio
            </div>
            <h1 className="font-display text-3xl font-semibold md:text-4xl">
              Visual <span className="gradient-text">Architecture</span> Canvas
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{blueprint.summary}</p>
          </div>
        </div>
      )}

      <div className={fullscreen ? "grid h-[calc(100vh-3rem)] grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]" : "grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]"}>
        {/* Sidebar list */}
        <Card className="glass border-border/60 h-fit lg:sticky lg:top-4">
          <CardContent className="p-2">
            <div className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {DIAGRAM_ORDER.length} Diagrams
            </div>
            <div className="flex flex-col gap-1">
              {DIAGRAM_ORDER.map((d) => {
                const meta = DIAGRAM_META[d.key];
                const Icon = meta.icon;
                const isActive = active === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setActive(d.key)}
                    className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                      isActive
                        ? "border-primary/40 bg-primary/10 shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-cyan-glow)_25%,transparent),0_10px_30px_-15px_color-mix(in_oklab,var(--color-violet-glow)_60%,transparent)]"
                        : "border-transparent hover:border-border/60 hover:bg-card/40"
                    }`}
                  >
                    <span className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${meta.gradient} text-white shadow-md`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{d.label}</span>
                      <span className="block truncate text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{meta.tag}</span>
                    </span>
                    {isActive && <span className="h-2 w-2 rounded-full bg-[var(--cyan-glow)] shadow-[0_0_10px_2px_var(--cyan-glow)]" />}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Canvas */}
        <Card className="glass overflow-hidden border-border/60">
          <CardContent className="p-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-card/60 to-card/20 p-4">
              <div className="flex items-center gap-3">
                <span className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${DIAGRAM_META[active].gradient} text-white shadow-lg`}>
                  <ActiveIcon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{current?.title}</span>
                    <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {DIAGRAM_META[active].tag}
                    </span>
                    <span className="hidden items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-emerald-400 sm:inline-flex">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">{current?.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="mr-2 hidden items-center gap-1 rounded-lg border border-border/60 bg-card/40 p-1 md:flex">
                  {([
                    { k: "dotted", I: CircleDot },
                    { k: "grid", I: Grid3x3 },
                    { k: "aurora", I: Sparkles },
                  ] as const).map(({ k, I }) => (
                    <button
                      key={k}
                      onClick={() => setBg(k)}
                      title={k}
                      className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
                        bg === k ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <I className="h-3.5 w-3.5" />
                    </button>
                  ))}
                </div>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}><ZoomOut className="h-4 w-4" /></Button>
                <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
                <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}><ZoomIn className="h-4 w-4" /></Button>
                <Button variant="outline" size="icon" onClick={() => setFullscreen((f) => !f)}>
                  {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={exportSvg}><FileImage className="mr-1.5 h-4 w-4" />SVG</Button>
                <Button size="sm" className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background" onClick={exportPdf}>
                  <Download className="mr-1.5 h-4 w-4" />PDF
                </Button>
              </div>
            </div>

            {/* Canvas surface */}
            <div
              ref={hostRef}
              className={`relative overflow-auto p-6 ${fullscreen ? "h-[calc(100vh-9rem)]" : "min-h-[560px]"}`}
            >
              <div className={`pointer-events-none absolute inset-0 ${bg === "dotted" ? "dotted-bg opacity-30" : bg === "grid" ? "grid-bg opacity-40" : "aurora opacity-60"}`} />
              {/* Corner glow */}
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[var(--cyan-glow)] opacity-[0.08] blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-[var(--violet-glow)] opacity-[0.08] blur-3xl" />
              <div className="relative origin-top-left transition-transform" style={{ transform: `scale(${zoom})` }}>
                {current && <Mermaid id={active} chart={current.mermaid} />}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/60 bg-card/30 px-4 py-3 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {[
                ["Users", "#fde68a"],
                ["Edge", "#a7f3d0"],
                ["Web", "#bae6fd"],
                ["Services", "#c7d2fe"],
                ["API", "#ddd6fe"],
                ["Data", "#fbcfe8"],
                ["Cache", "#fecaca"],
                ["Queue", "#fed7aa"],
                ["Infra", "#e2e8f0"],
              ].map(([label, color]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10" style={{ background: color }} />
                  {label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
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
