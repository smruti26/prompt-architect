import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";

export function Mermaid({ chart, id }: { chart: string; id: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { mode } = useTheme();
  const [svg, setSvg] = useState("");

  useEffect(() => {
    let cancel = false;
    (async () => {
      const mermaid = (await import("mermaid")).default;
      mermaid.initialize({
      startOnLoad: false,
      theme: mode === "dark" ? "dark" : "default",
      themeVariables: {
        fontFamily: "Inter, ui-sans-serif",
        primaryColor: mode === "dark" ? "#1e2742" : "#eef2ff",
        primaryTextColor: mode === "dark" ? "#e2e8f0" : "#0f172a",
        primaryBorderColor: "#22d3ee",
        lineColor: mode === "dark" ? "#64748b" : "#94a3b8",
        secondaryColor: mode === "dark" ? "#312e81" : "#e0e7ff",
        tertiaryColor: mode === "dark" ? "#0b1228" : "#f8fafc",
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
    return () => {
      cancel = true;
    };
  }, [chart, id, mode]);

  return <div ref={ref} className="mermaid-host w-full overflow-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}
