import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
type PanZoomInstance = {
  destroy: () => void;
  resize: () => void;
  fit: () => void;
  center: () => void;
  resetZoom: () => void;
  resetPan: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getZoom: () => number;
  getPan: () => { x: number; y: number };
  getSizes: () => { width: number; height: number; realZoom: number; viewBox: { x: number; y: number; width: number; height: number } };
  zoom: (n: number) => void;
  zoomAtPoint: (n: number, p: { x: number; y: number }) => void;
  pan: (p: { x: number; y: number }) => void;
  panBy: (p: { x: number; y: number }) => void;
  setOnZoom: (fn: (z: number) => void) => void;
  setOnPan: (fn: (p: { x: number; y: number }) => void) => void;
};

let injected = false;
function injectMermaidStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.setAttribute("data-mermaid-enhance", "true");
  style.textContent = `
    .mermaid-host { width: 100%; height: 100%; }
    .mermaid-host svg { width: 100% !important; height: 100% !important; max-width: none !important; font-family: "Geist", "Inter", ui-sans-serif, system-ui, sans-serif !important; }
    .mermaid-host .node { cursor: pointer; }
    .mermaid-host .node rect,
    .mermaid-host .node polygon,
    .mermaid-host .node circle,
    .mermaid-host .node ellipse,
    .mermaid-host .node path {
      filter: drop-shadow(0 10px 22px rgba(8, 12, 30, 0.45));
      transition: filter .25s ease, transform .25s ease;
      stroke-width: 2px !important;
    }
    .mermaid-host .node:hover rect,
    .mermaid-host .node:hover polygon,
    .mermaid-host .node:hover circle,
    .mermaid-host .node:hover ellipse,
    .mermaid-host .node:hover path {
      filter: drop-shadow(0 16px 36px rgba(34, 211, 238, 0.6));
    }
    .mermaid-host .node.archai-selected rect,
    .mermaid-host .node.archai-selected polygon,
    .mermaid-host .node.archai-selected circle,
    .mermaid-host .node.archai-selected ellipse,
    .mermaid-host .node.archai-selected path {
      stroke: #22d3ee !important;
      stroke-width: 3.5px !important;
      filter: drop-shadow(0 0 14px rgba(34, 211, 238, 0.85)) drop-shadow(0 0 24px rgba(167, 139, 250, 0.55));
    }
    .mermaid-host .node.archai-dim { opacity: 0.22; transition: opacity .2s ease; }
    .mermaid-host .edgePath.archai-dim { opacity: 0.1; }
    .mermaid-host .node.archai-hidden { display: none; }
    .mermaid-host .edgePath.archai-hidden { display: none; }
    .mermaid-host .edgePath.archai-highlight .path {
      stroke: #22d3ee !important;
      stroke-width: 3px !important;
      filter: drop-shadow(0 0 8px rgba(34, 211, 238, 0.7));
    }
    .mermaid-host .nodeLabel,
    .mermaid-host .edgeLabel,
    .mermaid-host text { font-weight: 600 !important; letter-spacing: -0.01em; font-size: 15px !important; }
    .mermaid-host .nodeLabel { font-size: 15px !important; }
    .mermaid-host .edgeLabel { background: transparent !important; }
    .mermaid-host .edgeLabel rect { fill: rgba(15, 23, 42, .85) !important; rx: 6; }
    .mermaid-host .edgeLabel .labelBkg { fill: rgba(15,23,42,.85) !important; rx: 6; }
    .mermaid-host .edgeLabel text { font-size: 12px !important; }
    .mermaid-host .edgePath .path {
      stroke-width: 2px !important;
      stroke-dasharray: 6 6;
      animation: dashflow 1.4s linear infinite;
      filter: drop-shadow(0 0 6px rgba(34, 211, 238, .4));
    }
    .mermaid-host .flowchart-link { stroke-linecap: round; }
    .mermaid-host .cluster rect {
      rx: 20; ry: 20;
      stroke-dasharray: 4 5;
      stroke-width: 1.25px !important;
    }
    .mermaid-host .cluster .cluster-label .nodeLabel,
    .mermaid-host .cluster-label text {
      font-size: 12px !important; opacity: .8; text-transform: uppercase; letter-spacing: .16em; font-weight: 700 !important;
    }
    @keyframes dashflow { to { stroke-dashoffset: -120; } }
    .mermaid-host marker path { fill: var(--color-cyan-glow, #22d3ee) !important; stroke: none !important; }
  `;
  document.head.appendChild(style);
}

/** Extract the logical node ID from a mermaid g.node DOM id like "flowchart-API-12". */
export function nodeIdFromDom(domId: string): string | null {
  const m = domId.match(/^flowchart-(.+?)-\d+$/);
  return m ? m[1] : null;
}

export type MermaidApi = {
  panZoom: PanZoomInstance | null;
  svg: SVGSVGElement | null;
  fit: () => void;
  reset: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
};

export function Mermaid({
  chart,
  id,
  onNodeClick,
  onReady,
  selectedId,
  highlightIds,
  hiddenIds,
}: {
  chart: string;
  id: string;
  onNodeClick?: (nodeId: string) => void;
  onReady?: (api: MermaidApi) => void;
  selectedId?: string | null;
  highlightIds?: Set<string>;
  hiddenIds?: Set<string>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<PanZoomInstance | null>(null);
  const { mode } = useTheme();
  const [svg, setSvg] = useState("");

  // Keep latest callbacks in refs so the pan-zoom effect doesn't re-run
  // every time the parent re-renders (which destroyed pan-zoom and reset
  // the view on every click — major perf + UX regression).
  const onNodeClickRef = useRef(onNodeClick);
  const onReadyRef = useRef(onReady);
  useEffect(() => { onNodeClickRef.current = onNodeClick; }, [onNodeClick]);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);

  // Render mermaid -> SVG string
  useEffect(() => {
    injectMermaidStyles();
    let cancel = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      const dark = mode === "dark";
      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        fontFamily: "Inter, ui-sans-serif, system-ui",
        flowchart: { htmlLabels: true, curve: "basis", padding: 36, nodeSpacing: 90, rankSpacing: 120, useMaxWidth: false },
        sequence: { actorMargin: 80, messageMargin: 55, mirrorActors: false, useMaxWidth: false, boxMargin: 16, noteMargin: 14, width: 180 },
        er: { useMaxWidth: false, layoutDirection: "LR", entityPadding: 18, minEntityWidth: 140, minEntityHeight: 90 },
        themeVariables: {
          background: "transparent",
          fontFamily: "Inter, ui-sans-serif",
          primaryColor: dark ? "#1a2348" : "#eef2ff",
          primaryTextColor: dark ? "#e6ecff" : "#0f172a",
          primaryBorderColor: "#22d3ee",
          lineColor: dark ? "#7c8fb8" : "#94a3b8",
          secondaryColor: dark ? "#2a1d5e" : "#ede9fe",
          tertiaryColor: dark ? "#0b1228" : "#f8fafc",
          clusterBkg: dark ? "rgba(34,211,238,0.04)" : "rgba(99,102,241,0.04)",
          clusterBorder: dark ? "rgba(124,143,184,0.35)" : "rgba(148,163,184,0.45)",
          edgeLabelBackground: dark ? "#0b1228" : "#ffffff",
          noteBkgColor: dark ? "#22d3ee22" : "#e0f2fe",
          noteTextColor: dark ? "#e6ecff" : "#0f172a",
          noteBorderColor: "#22d3ee",
          actorBkg: dark ? "#1a2348" : "#eef2ff",
          actorBorder: "#22d3ee",
          actorTextColor: dark ? "#e6ecff" : "#0f172a",
          signalColor: dark ? "#a5b4fc" : "#64748b",
          signalTextColor: dark ? "#e6ecff" : "#0f172a",
          labelBoxBkgColor: dark ? "#1a2348" : "#eef2ff",
          labelBoxBorderColor: "#a78bfa",
          activationBkgColor: "#22d3ee",
          activationBorderColor: "#a78bfa",
        },
        securityLevel: "loose",
      });
      try {
        const res = await mermaid.render(`m-${id}-${Math.random().toString(36).slice(2, 7)}`, chart);
        if (!cancel) setSvg(res.svg);
      } catch (e) {
        if (!cancel) setSvg(`<pre style="color:#f87171">${String((e as Error)?.message ?? e)}</pre>`);
      }
    })();
    return () => { cancel = true; };
  }, [chart, id, mode]);

  // Wire pan/zoom + node click handlers after each new SVG render.
  useEffect(() => {
    if (!svg || !hostRef.current) return;
    const svgEl = hostRef.current.querySelector("svg") as SVGSVGElement | null;
    if (!svgEl) return;

    // Mermaid sometimes ships max-width inline styles that fight pan-zoom.
    svgEl.style.maxWidth = "none";
    svgEl.style.width = "100%";
    svgEl.style.height = "100%";

    // Click handlers on nodes.
    const nodes = Array.from(svgEl.querySelectorAll<SVGGElement>("g.node"));
    const handlers: Array<() => void> = [];
    nodes.forEach((n) => {
      const handler = (e: Event) => {
        e.stopPropagation();
        const nid = nodeIdFromDom(n.id);
        const cb = onNodeClickRef.current;
        if (nid && cb) cb(nid);
      };
      n.addEventListener("click", handler);
      handlers.push(() => n.removeEventListener("click", handler));
    });

    let panZoom: PanZoomInstance | null = null;
    let cancelled = false;
    (async () => {
      const mod: unknown = await import("svg-pan-zoom");
      if (cancelled) return;
      const m = mod as { default?: unknown };
      const svgPanZoom = (typeof m.default === "function" ? m.default : (mod as unknown)) as (
        el: SVGSVGElement,
        opts: Record<string, unknown>,
      ) => PanZoomInstance;
      panZoom = svgPanZoom(svgEl, {
        zoomEnabled: true,
        controlIconsEnabled: false,
        fit: true,
        center: true,
        minZoom: 0.2,
        maxZoom: 8,
        zoomScaleSensitivity: 0.4,
        contain: false,
        mouseWheelZoomEnabled: true,
        dblClickZoomEnabled: false,
      });
      panZoomRef.current = panZoom;
      onReadyRef.current?.({
        svg: svgEl,
        panZoom,
        fit: () => { panZoom?.resize(); panZoom?.fit(); panZoom?.center(); },
        reset: () => { panZoom?.resetZoom(); panZoom?.resetPan(); panZoom?.center(); },
        zoomIn: () => panZoom?.zoomIn(),
        zoomOut: () => panZoom?.zoomOut(),
      });
    })();

    return () => {
      cancelled = true;
      handlers.forEach((u) => u());
      try { panZoom?.destroy(); } catch { /* noop */ }
      panZoomRef.current = null;
    };
  }, [svg]);

  // Apply selection / highlight classes.
  useEffect(() => {
    if (!hostRef.current) return;
    const svgEl = hostRef.current.querySelector("svg");
    if (!svgEl) return;
    const nodes = Array.from(svgEl.querySelectorAll<SVGGElement>("g.node"));
    const edges = Array.from(svgEl.querySelectorAll<SVGGElement>("g.edgePath, path.flowchart-link"));
    nodes.forEach((n) => { n.classList.remove("archai-selected", "archai-dim", "archai-hidden"); });
    edges.forEach((e) => { e.classList.remove("archai-highlight", "archai-dim", "archai-hidden"); });
    if (hiddenIds && hiddenIds.size) {
      nodes.forEach((n) => {
        const nid = nodeIdFromDom(n.id);
        if (nid && hiddenIds.has(nid)) n.classList.add("archai-hidden");
      });
      edges.forEach((e) => {
        const cls = (e.getAttribute("class") || "") + " " + (e.id || "");
        for (const id of hiddenIds) {
          if (cls.includes(`-${id}-`) || cls.includes(`LS-${id}`) || cls.includes(`LE-${id}`)) {
            e.classList.add("archai-hidden");
            break;
          }
        }
      });
    }
    if (!selectedId) return;
    const hi = highlightIds ?? new Set([selectedId]);
    nodes.forEach((n) => {
      const nid = nodeIdFromDom(n.id);
      if (!nid) return;
      if (nid === selectedId) n.classList.add("archai-selected");
      else if (!hi.has(nid)) n.classList.add("archai-dim");
    });
    edges.forEach((e) => {
      const eid = e.id || "";
      // mermaid edge ids look like "L-A-B-0" or class "LS-A LE-B"
      const cls = (e.getAttribute("class") || "") + " " + eid;
      const touchesSelected = cls.includes(`-${selectedId}-`) || cls.includes(`LS-${selectedId}`) || cls.includes(`LE-${selectedId}`);
      if (touchesSelected) e.classList.add("archai-highlight");
      else e.classList.add("archai-dim");
    });
  }, [selectedId, highlightIds, hiddenIds, svg]);

  return <div ref={hostRef} className="mermaid-host" dangerouslySetInnerHTML={{ __html: svg }} />;
}
