import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

function stripFences(s: string): string {
  const m = s.match(/```(?:mermaid|json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}

async function callGateway(messages: Array<{ role: string; content: string }>, temp = 0.4): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY not configured");
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({ model: "google/gemini-3-flash-preview", messages, temperature: temp }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI rate-limited. Retry shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return (json?.choices?.[0]?.message?.content ?? "") as string;
}

/** 1. Voice-to-Diagram — converts loose spoken transcript into a clean Mermaid diagram. */
export const voiceToDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({ transcript: z.string().min(2).max(8000) }))
  .handler(async ({ data }) => {
    const system = `You convert spoken brainstorming into a clean Mermaid diagram.
- Infer the best diagram type (flowchart, sequence, mindmap, erDiagram).
- Ignore filler words ("um", "like", "you know"). Normalize entities and dedupe.
- Output ONLY valid Mermaid source — no prose, no fences.
- Use short labels (<= 4 words). Use subgraphs to group.`;
    const mermaid = stripFences(await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.transcript },
    ]));
    return { mermaid };
  });

/** 2. Semantic Diagram Diff — explains what really changed between two diagram versions. */
export const diagramDiff = createServerFn({ method: "POST" })
  .inputValidator(z.object({ before: z.string().min(2).max(20000), after: z.string().min(2).max(20000) }))
  .handler(async ({ data }) => {
    const system = `You are a senior architect performing a SEMANTIC diff between two Mermaid diagrams.
Return STRICT JSON with shape:
{
  "summary": "1-2 sentence change overview",
  "added": ["node/edge"],
  "removed": ["node/edge"],
  "modified": ["short description"],
  "risks": [{"level":"low|medium|high","note":"..."}],
  "blastRadius": "low|medium|high",
  "migrationSteps": ["..."]
}
JSON only — no prose, no fences.`;
    const user = `BEFORE:\n${data.before}\n\nAFTER:\n${data.after}`;
    const raw = stripFences(await callGateway([
      { role: "system", content: system },
      { role: "user", content: user },
    ], 0.2));
    try {
      const parsed = JSON.parse(raw);
      return { diff: parsed };
    } catch {
      return {
        diff: {
          summary: "Diff produced (raw)",
          added: [], removed: [], modified: [raw.slice(0, 400)],
          risks: [], blastRadius: "low", migrationSteps: [],
        },
      };
    }
  });

/** 3. AI Narrated Walkthrough — generates an ordered, narratable walkthrough of a diagram. */
export const narrateDiagram = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    mermaid: z.string().min(5).max(20000),
    audience: z.enum(["executive", "engineer", "newHire", "customer"]).default("engineer"),
  }))
  .handler(async ({ data }) => {
    const system = `Produce a guided walkthrough of the given Mermaid diagram for a ${data.audience} audience.
Return STRICT JSON: { "title": "...", "steps": [{ "node": "node id or label", "narration": "1-2 sentences" }] }
- 5-9 steps, ordered by data/control flow.
- Each narration must be plain spoken English suitable for TTS.
- JSON only.`;
    const raw = stripFences(await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.mermaid },
    ], 0.3));
    try {
      const parsed = JSON.parse(raw);
      return { walkthrough: parsed };
    } catch {
      return { walkthrough: { title: "Walkthrough", steps: [{ node: "system", narration: raw.slice(0, 400) }] } };
    }
  });