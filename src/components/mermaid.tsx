import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

let injected = false;
function injectMermaidStyles() {
  if (injected || typeof document === "undefined") return;
  injected = true;
  const style = document.createElement("style");
  style.setAttribute("data-mermaid-enhance", "true");
  style.textContent = `
    .mermaid-host svg { width: 100%; height: auto; font-family: "Inter", ui-sans-serif, system-ui, sans-serif !important; overflow: visible; }
    .mermaid-host .node rect,
    .mermaid-host .node polygon,
    .mermaid-host .node circle,
    .mermaid-host .node ellipse,
    .mermaid-host .node path {
      filter: drop-shadow(0 6px 14px rgba(8, 12, 30, 0.35));
      transition: filter .25s ease, transform .25s ease;
    }
    .mermaid-host .node:hover rect,
    .mermaid-host .node:hover polygon,
    .mermaid-host .node:hover circle,
    .mermaid-host .node:hover ellipse,
    .mermaid-host .node:hover path {
      filter: drop-shadow(0 12px 28px rgba(34, 211, 238, 0.5));
    }
    .mermaid-host .nodeLabel,
    .mermaid-host .edgeLabel,
    .mermaid-host text { font-weight: 600 !important; letter-spacing: -0.01em; }
    .mermaid-host .edgeLabel { background: transparent !important; }
    .mermaid-host .edgeLabel rect { fill: rgba(15, 23, 42, .85) !important; rx: 6; }
    .mermaid-host .edgePath .path {
      stroke-width: 1.75px !important;
      stroke-dasharray: 6 6;
      animation: dashflow 1.4s linear infinite;
      filter: drop-shadow(0 0 4px rgba(34, 211, 238, .35));
    }
    .mermaid-host .flowchart-link { stroke-linecap: round; }
    .mermaid-host .cluster rect {
      rx: 16; ry: 16;
      stroke-dasharray: 4 5;
      stroke-width: 1px !important;
    }
    .mermaid-host .cluster .cluster-label .nodeLabel,
    .mermaid-host .cluster-label text {
      font-size: 11px !important; opacity: .75; text-transform: uppercase; letter-spacing: .14em;
    }
    @keyframes dashflow { to { stroke-dashoffset: -120; } }
    .mermaid-host marker path { fill: var(--color-cyan-glow, #22d3ee) !important; stroke: none !important; }
  `;
  document.head.appendChild(style);
}

export function Mermaid({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();
  const [svg, setSvg] = useState("");

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
        flowchart: { htmlLabels: true, curve: "basis", padding: 24, nodeSpacing: 60, rankSpacing: 80, useMaxWidth: true },
        sequence: { actorMargin: 60, messageMargin: 40, mirrorActors: false, useMaxWidth: true },
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

  return <div ref={ref} className="mermaid-host w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
