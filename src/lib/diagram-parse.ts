// Lightweight Mermaid flowchart parser — extracts nodes, edges, class assignments
// so the Diagram Studio inspector can show metadata + related connections.

export type ParsedNode = {
  id: string;
  label: string;
  shape?: "rect" | "round" | "stadium" | "cylinder" | "circle" | "diamond" | "subroutine";
  cls?: string;
};

export type ParsedEdge = {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
};

export type ParsedDiagram = {
  kind: "flowchart" | "sequence" | "er" | "other";
  direction?: string;
  nodes: Map<string, ParsedNode>;
  edges: ParsedEdge[];
};

const SHAPE_RES: Array<[RegExp, ParsedNode["shape"]]> = [
  [/^([A-Za-z0-9_]+)\(\(([^)]+)\)\)/, "circle"],
  [/^([A-Za-z0-9_]+)\[\(([^)]+)\)\]/, "cylinder"],
  [/^([A-Za-z0-9_]+)\(\[([^\]]+)\]\)/, "stadium"],
  [/^([A-Za-z0-9_]+)\[\[([^\]]+)\]\]/, "subroutine"],
  [/^([A-Za-z0-9_]+)\{([^}]+)\}/, "diamond"],
  [/^([A-Za-z0-9_]+)\(([^)]+)\)/, "round"],
  [/^([A-Za-z0-9_]+)\[([^\]]+)\]/, "rect"],
];

function captureNode(token: string, nodes: Map<string, ParsedNode>): string | null {
  const t = token.trim();
  for (const [re, shape] of SHAPE_RES) {
    const m = t.match(re);
    if (m) {
      const existing = nodes.get(m[1]);
      if (!existing) nodes.set(m[1], { id: m[1], label: m[2].trim(), shape });
      else if (existing.label === existing.id) {
        existing.label = m[2].trim();
        existing.shape = shape;
      }
      return m[1];
    }
  }
  const idMatch = t.match(/^([A-Za-z0-9_]+)/);
  if (!idMatch) return null;
  if (!nodes.has(idMatch[1])) nodes.set(idMatch[1], { id: idMatch[1], label: idMatch[1] });
  return idMatch[1];
}

export function parseDiagram(src: string): ParsedDiagram {
  const nodes = new Map<string, ParsedNode>();
  const edges: ParsedEdge[] = [];
  let kind: ParsedDiagram["kind"] = "other";
  let direction: string | undefined;

  const first = src.trim().split("\n")[0]?.trim() ?? "";
  if (/^flowchart\b/i.test(first) || /^graph\b/i.test(first)) {
    kind = "flowchart";
    direction = first.split(/\s+/)[1];
  } else if (/^sequenceDiagram/i.test(first)) kind = "sequence";
  else if (/^erDiagram/i.test(first)) kind = "er";

  if (kind !== "flowchart") return { kind, direction, nodes, edges };

  // Strip subgraph wrappers but keep their bodies.
  const lines = src
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("%%") && !l.startsWith("classDef") && !l.startsWith("flowchart") && !l.startsWith("graph"));

  for (const raw of lines) {
    if (raw.startsWith("subgraph") || raw === "end") continue;

    if (raw.startsWith("class ")) {
      const m = raw.match(/^class\s+([^\s;]+)\s+([^\s;]+)/);
      if (m) {
        m[1].split(",").map((s) => s.trim()).forEach((id) => {
          if (!nodes.has(id)) nodes.set(id, { id, label: id });
          nodes.get(id)!.cls = m[2];
        });
      }
      continue;
    }

    // Locate all edge separators in order. Order matters — longer first.
    const sepRe = /-\.\s+([^.]+?)\s+\.->|--\s+([^-]+?)\s+-->|==>|-\.->|-->/g;
    const seps: Array<{ start: number; end: number; label?: string; dashed: boolean }> = [];
    let m: RegExpExecArray | null;
    while ((m = sepRe.exec(raw))) {
      const dashed = m[0].includes("-.");
      seps.push({ start: m.index, end: m.index + m[0].length, label: m[1] || m[2], dashed });
    }

    if (seps.length === 0) {
      captureNode(raw, nodes);
      continue;
    }

    const tokens: string[] = [];
    let cursor = 0;
    for (const s of seps) {
      tokens.push(raw.slice(cursor, s.start));
      cursor = s.end;
    }
    tokens.push(raw.slice(cursor));
    const ids = tokens.map((tok) => captureNode(tok, nodes));
    for (let i = 0; i < seps.length; i++) {
      const a = ids[i];
      const b = ids[i + 1];
      if (a && b) edges.push({ from: a, to: b, label: seps[i].label, dashed: seps[i].dashed });
    }
  }

  return { kind, direction, nodes, edges };
}

// ---------- Layout transformation ----------

export type LayoutKey = "architecture" | "tree" | "flow" | "mindmap" | "graph";

export const LAYOUTS: { key: LayoutKey; label: string; description: string; direction: string; curve: string }[] = [
  { key: "architecture", label: "Architecture",     description: "Left → right system flow",   direction: "LR", curve: "basis" },
  { key: "tree",         label: "Tree",             description: "Top-down hierarchy",         direction: "TB", curve: "basis" },
  { key: "flow",         label: "Flow",             description: "Linear process pipeline",    direction: "LR", curve: "linear" },
  { key: "mindmap",      label: "Mind Map",         description: "Radial branching outward",   direction: "RL", curve: "cardinal" },
  { key: "graph",        label: "Knowledge Graph",  description: "Top-down with stepped edges", direction: "TB", curve: "stepBefore" },
];

/** Rewrite a flowchart source with a new direction. Non-flowchart sources pass through. */
export function applyLayout(src: string, layout: LayoutKey): string {
  const cfg = LAYOUTS.find((l) => l.key === layout) ?? LAYOUTS[0];
  const firstLineEnd = src.indexOf("\n");
  const header = firstLineEnd >= 0 ? src.slice(0, firstLineEnd).trim() : src.trim();
  if (!/^(flowchart|graph)\b/i.test(header)) return src;
  const rest = firstLineEnd >= 0 ? src.slice(firstLineEnd) : "";
  const directive = `%%{init: {"flowchart": {"curve": "${cfg.curve}"}}}%%\n`;
  return `${directive}flowchart ${cfg.direction}${rest}`;
}
