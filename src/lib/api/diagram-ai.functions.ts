import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DIAGRAM_TYPES = [
  "ui-tree",
  "flowchart",
  "architecture",
  "mindmap",
  "er",
  "sequence",
  "network",
  "process",
  "org-chart",
  "user-journey",
  "database",
  "cloud",
  "wireframe",
] as const;

const TYPE_GUIDE: Record<(typeof DIAGRAM_TYPES)[number], string> = {
  "ui-tree": "Render as `flowchart TB` showing component hierarchy of a UI.",
  flowchart: "Render as `flowchart LR` with clear decision diamonds where useful.",
  architecture: "Render as `flowchart LR` grouping services into subgraphs (Client, API, Data, Infra).",
  mindmap: "Render as `mindmap` with a single root and branching ideas.",
  er: "Render as `erDiagram` with entities, attributes and cardinality.",
  sequence: "Render as `sequenceDiagram` with participants and ordered messages.",
  network: "Render as `flowchart LR` showing network zones (Internet, DMZ, Private) as subgraphs.",
  process: "Render as `flowchart LR` step-by-step business process with swimlane subgraphs if needed.",
  "org-chart": "Render as `flowchart TB` hierarchical org chart with role labels.",
  "user-journey": "Render as `journey` with sections and tasks scored 1-5.",
  database: "Render as `erDiagram` showing tables, PK/FK and relations.",
  cloud: "Render as `flowchart LR` with cloud zones (VPC, Region, Edge) as subgraphs and provider services as nodes.",
  wireframe: "Render as `flowchart TB` showing app screens and navigation transitions, labeling edges with user actions.",
};

function stripFences(s: string): string {
  const m = s.match(/```(?:mermaid)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

async function callGateway(messages: Array<{ role: string; content: string }>): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      temperature: 0.4,
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is rate-limited. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  const text: string = json?.choices?.[0]?.message?.content ?? "";
  return stripFences(text);
}

export const generateDiagram = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      prompt: z.string().min(3).max(4000),
      type: z.enum(DIAGRAM_TYPES),
    }),
  )
  .handler(async ({ data }) => {
    const guide = TYPE_GUIDE[data.type];
    const system = `You are an expert diagram architect. Output ONLY valid Mermaid.js source — no prose, no markdown fences, no explanations.
Rules:
- Use crisp, short node labels (max 4 words).
- Prefer subgraphs to group related nodes.
- For flowcharts, use classDef to assign visual classes like:
  classDef service fill:#1e293b,stroke:#22d3ee,color:#e6ecff
  classDef data fill:#3b1d6b,stroke:#a78bfa,color:#e6ecff
  classDef cloud fill:#082f49,stroke:#38bdf8,color:#e6ecff
- Always start with the correct diagram header.
${guide}`;
    const user = `Create a ${data.type} diagram for:\n\n${data.prompt}`;
    const mermaid = await callGateway([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    return { mermaid, type: data.type };
  });

export const optimizeDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mermaid: z.string().min(5).max(20000) }))
  .handler(async ({ data }) => {
    const system = `You are a Mermaid.js refactoring expert. Take the diagram and improve clarity: tighten labels, regroup with subgraphs, add classDef styling, fix any syntax issues. Output ONLY valid Mermaid source — no prose.`;
    const mermaid = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.mermaid },
    ]);
    return { mermaid };
  });

export const codeToDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ code: z.string().min(5).max(20000), language: z.string().optional() }))
  .handler(async ({ data }) => {
    const system = `You analyze source code and produce an architecture diagram of its modules, classes, and call relationships as Mermaid \`flowchart LR\` with subgraphs. Output ONLY Mermaid source.`;
    const user = `Language: ${data.language ?? "unknown"}\n\n${data.code}`;
    const mermaid = await callGateway([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    return { mermaid };
  });

export const repoToDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ repoUrl: z.string().url() }))
  .handler(async ({ data }) => {
    const system = `Given a public Git repository URL, infer a likely high-level architecture diagram based on the project's name and common conventions. Output ONLY a Mermaid \`flowchart LR\` with subgraphs (Client, API, Services, Data, Infra) and classDef styling. Add a note node like N["Inferred from repo name"]:::note if uncertain.`;
    const mermaid = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.repoUrl },
    ]);
    return { mermaid };
  });

export const explainDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mermaid: z.string().min(5).max(20000) }))
  .handler(async ({ data }) => {
    const system = `You are a software architect. Given Mermaid source, write a concise 4-6 bullet explanation of the system, its layers, and notable risks. Plain markdown bullets only.`;
    const res = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.mermaid },
    ]);
    return { explanation: res };
  });

export const suggestShapes = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mermaid: z.string().min(5).max(20000) }))
  .handler(async ({ data }) => {
    const system = `Given a Mermaid diagram, suggest 5 additional nodes (with id, label, and short rationale) that would make the architecture more complete. Reply as JSON array: [{"id":"...","label":"...","why":"..."}]. JSON only.`;
    const text = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.mermaid },
    ]);
    try {
      const json = JSON.parse(text.replace(/^[^[]*/, "").replace(/[^\]]*$/, ""));
      return { suggestions: json as Array<{ id: string; label: string; why: string }> };
    } catch {
      return { suggestions: [] as Array<{ id: string; label: string; why: string }> };
    }
  });

export const docsFromDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ mermaid: z.string().min(5).max(20000) }))
  .handler(async ({ data }) => {
    const system = `Generate professional markdown documentation for the given Mermaid diagram. Include: Overview, Components, Data Flow, Dependencies, Operational Concerns. Use H2 headings.`;
    const docs = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.mermaid },
    ]);
    return { docs };
  });