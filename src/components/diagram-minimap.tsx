import { useEffect, useRef, useState } from "react";
import type { MermaidApi } from "@/components/mermaid";

/** Compact minimap that mirrors the rendered SVG and shows the current viewport. */
export function DiagramMinimap({ api, refreshKey }: { api: MermaidApi | null; refreshKey: string | number }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [svgUrl, setSvgUrl] = useState<string | null>(null);
  const [rect, setRect] = useState({ x: 0, y: 0, w: 1, h: 1 });
  const [vb, setVb] = useState({ x: 0, y: 0, w: 1, h: 1 });

  // Snapshot the SVG as a static minimap whenever the source diagram changes.
  useEffect(() => {
    if (!api?.svg) { setSvgUrl(null); return; }
    const clone = api.svg.cloneNode(true) as SVGSVGElement;
    // Strip any pan-zoom transforms from the clone — we want the base layout.
    clone.querySelectorAll("g.svg-pan-zoom_viewport").forEach((g) => g.removeAttribute("transform"));
    clone.removeAttribute("style");
    const xml = new XMLSerializer().serializeToString(clone);
    const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml" }));
    setSvgUrl(url);
    const box = api.svg.viewBox.baseVal;
    setVb({ x: box.x, y: box.y, w: box.width || 1, h: box.height || 1 });
    return () => URL.revokeObjectURL(url);
  }, [api, refreshKey]);

  // Track pan/zoom and recompute the viewport rect.
  useEffect(() => {
    if (!api?.panZoom) return;
    const pz = api.panZoom;
    const update = () => {
      try {
        const sizes = pz.getSizes();
        const pan = pz.getPan();
        const realZoom = sizes.realZoom || 1;
        const viewW = sizes.width / realZoom;
        const viewH = sizes.height / realZoom;
        const x = -pan.x / realZoom + sizes.viewBox.x;
        const y = -pan.y / realZoom + sizes.viewBox.y;
        setRect({ x, y, w: viewW, h: viewH });
      } catch { /* noop */ }
    };
    update();
    pz.setOnZoom(update);
    pz.setOnPan(update);
  }, [api]);

  if (!svgUrl) return null;

  // Map viewBox coords -> percentage of minimap area.
  const pct = (v: number, off: number, span: number) => `${((v - off) / span) * 100}%`;

  return (
    <div className="pointer-events-auto absolute bottom-4 right-4 z-10 w-48 overflow-hidden rounded-xl border border-border/60 bg-background/85 p-2 shadow-2xl backdrop-blur">
      <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        <span>Minimap</span>
        <span className="font-mono">{Math.round((api?.panZoom?.getZoom?.() ?? 1) * 100)}%</span>
      </div>
      <div
        ref={wrapRef}
        className="relative h-28 w-full overflow-hidden rounded-md bg-[color-mix(in_oklab,var(--color-foreground)_5%,transparent)]"
        onMouseDown={(e) => {
          if (!api?.panZoom || !wrapRef.current) return;
          const wrap = wrapRef.current;
          const move = (ev: MouseEvent | React.MouseEvent) => {
            const r = wrap.getBoundingClientRect();
            const x = ("clientX" in ev ? ev.clientX : 0) - r.left;
            const y = ("clientY" in ev ? ev.clientY : 0) - r.top;
            const targetX = vb.x + (x / r.width) * vb.w;
            const targetY = vb.y + (y / r.height) * vb.h;
            const sizes = api.panZoom!.getSizes();
            const realZoom = sizes.realZoom || 1;
            api.panZoom!.pan({
              x: -(targetX - sizes.viewBox.x - sizes.width / realZoom / 2) * realZoom,
              y: -(targetY - sizes.viewBox.y - sizes.height / realZoom / 2) * realZoom,
            });
          };
          move(e);
          const up = () => { window.removeEventListener("mousemove", move as never); window.removeEventListener("mouseup", up); };
          window.addEventListener("mousemove", move as never);
          window.addEventListener("mouseup", up);
        }}
      >
        <img src={svgUrl} alt="" className="pointer-events-none h-full w-full object-contain opacity-80" />
        <div
          className="pointer-events-none absolute rounded-sm border-2 border-[var(--cyan-glow)] bg-[var(--cyan-glow)]/10 shadow-[0_0_12px_rgba(34,211,238,0.6)]"
          style={{
            left: pct(rect.x, vb.x, vb.w),
            top: pct(rect.y, vb.y, vb.h),
            width: `${(rect.w / vb.w) * 100}%`,
            height: `${(rect.h / vb.h) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
