import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mermaid } from "@/components/mermaid";
import { useBlueprint } from "@/lib/blueprint-store";
import { DIAGRAM_ORDER, type DiagramKey } from "@/lib/blueprint";
import { Download, ZoomIn, ZoomOut, FileImage, Sparkles } from "lucide-react";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_app/diagrams")({
  head: () => ({ meta: [{ title: "Diagram Studio — ArchAI" }] }),
  component: Diagrams,
});

function Diagrams() {
  const { blueprint } = useBlueprint();
  const [active, setActive] = useState<DiagramKey>("architecture");
  const [zoom, setZoom] = useState(1);
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

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Diagram Studio</h1>
        <p className="mt-1 text-sm text-muted-foreground">{blueprint.summary}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {DIAGRAM_ORDER.map((d) => (
          <button
            key={d.key}
            onClick={() => setActive(d.key)}
            className={`rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
              active === d.key
                ? "border-primary/60 bg-primary/15 text-primary"
                : "border-border/60 bg-card/40 text-muted-foreground hover:text-foreground"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      <Card className="glass border-border/60">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-4">
            <div>
              <div className="text-sm font-semibold">{current?.title}</div>
              <div className="text-xs text-muted-foreground">{current?.description}</div>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}><ZoomOut className="h-4 w-4" /></Button>
              <span className="w-12 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}><ZoomIn className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" onClick={exportSvg}><FileImage className="mr-1.5 h-4 w-4" />SVG</Button>
              <Button size="sm" className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background" onClick={exportPdf}><Download className="mr-1.5 h-4 w-4" />PDF</Button>
            </div>
          </div>
          <div ref={hostRef} className="relative min-h-[480px] overflow-auto p-6">
            <div className="pointer-events-none absolute inset-0 dotted-bg opacity-30" />
            <div className="relative origin-top-left transition-transform" style={{ transform: `scale(${zoom})` }}>
              {current && <Mermaid id={active} chart={current.mermaid} />}
            </div>
          </div>
        </CardContent>
      </Card>
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
          <Link to="/workspace"><Button>Go to AI Workspace</Button></Link>
        </CardContent>
      </Card>
    </div>
  );
}
