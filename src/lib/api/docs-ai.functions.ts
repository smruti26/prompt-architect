import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const DOC_TYPES = [
  "hld", "lld", "solution-architecture", "technical-design",
  "prd", "brd", "api-doc", "system-infra", "user-manual",
  "kb-article", "sop", "runbook",
] as const;
export type DocType = (typeof DOC_TYPES)[number];

const DOC_GUIDE: Record<DocType, { title: string; outline: string }> = {
  hld: { title: "High-Level Design", outline: "1. Executive Summary\n2. Business Context & Goals\n3. Scope and Non-Goals\n4. Architecture Overview (logical, deployment)\n5. Key Components\n6. Data Flow\n7. Integration Points\n8. Non-Functional Requirements\n9. Risks & Mitigations\n10. Roadmap" },
  lld: { title: "Low-Level Design", outline: "1. Module Overview\n2. Class / Service Design\n3. Sequence Flows\n4. Data Model (tables, indexes)\n5. API Contracts (endpoints, payloads)\n6. Error Handling\n7. Configuration\n8. Telemetry & Observability\n9. Test Strategy" },
  "solution-architecture": { title: "Solution Architecture Document", outline: "1. Solution Overview\n2. Stakeholders\n3. Business Drivers\n4. Logical Architecture\n5. Application Architecture\n6. Data Architecture\n7. Integration Architecture\n8. Security Architecture\n9. Deployment View\n10. Cost Model" },
  "technical-design": { title: "Technical Design Document", outline: "1. Problem Statement\n2. Goals / Non-Goals\n3. Proposed Design\n4. Alternatives Considered\n5. Detailed Design\n6. Migration / Rollout Plan\n7. Observability\n8. Risks & Open Questions" },
  prd: { title: "Product Requirements Document", outline: "1. Problem & Opportunity\n2. Target Users & Personas\n3. Goals & Success Metrics\n4. User Stories\n5. Functional Requirements\n6. Non-Functional Requirements\n7. UX Notes\n8. Dependencies\n9. Out of Scope\n10. Launch Plan" },
  brd: { title: "Business Requirements Document", outline: "1. Executive Summary\n2. Business Objectives\n3. Stakeholders & RACI\n4. Current State\n5. Future State\n6. Business Requirements\n7. Process Changes\n8. Assumptions & Constraints\n9. Cost / Benefit\n10. Approvals" },
  "api-doc": { title: "API Documentation", outline: "1. Overview\n2. Authentication\n3. Conventions (versioning, errors, pagination)\n4. Endpoints (grouped) with method, path, params, request, response, examples\n5. Webhooks\n6. SDKs\n7. Rate Limits\n8. Changelog" },
  "system-infra": { title: "System Architecture & Infrastructure", outline: "1. Topology Overview\n2. Network Zones\n3. Compute & Runtime\n4. Storage & Data\n5. Identity & Secrets\n6. Observability Stack\n7. DR / Backup\n8. Capacity & Scaling\n9. Cost & FinOps" },
  "user-manual": { title: "User Manual", outline: "1. Getting Started\n2. Key Concepts\n3. Step-by-step Workflows (with screenshots placeholders)\n4. Tips & Best Practices\n5. Troubleshooting\n6. FAQ\n7. Glossary" },
  "kb-article": { title: "Knowledge Base Article", outline: "1. Summary\n2. Symptoms\n3. Cause\n4. Resolution (steps)\n5. Workarounds\n6. Related Articles" },
  sop: { title: "Standard Operating Procedure", outline: "1. Purpose\n2. Scope\n3. Roles & Responsibilities\n4. Procedure (numbered steps)\n5. Controls & Compliance\n6. References\n7. Revision History" },
  runbook: { title: "Operations Runbook", outline: "1. Service Overview\n2. SLOs & SLIs\n3. Dashboards & Alerts\n4. Common Failure Modes\n5. Diagnostic Steps\n6. Mitigations & Rollbacks\n7. Escalation Matrix\n8. Post-Incident" },
};

function stripFences(s: string): string {
  const m = s.match(/```(?:markdown|md)?\s*([\s\S]*?)```\s*$/i);
  return (m ? m[1] : s).trim();
}

async function callGateway(messages: Array<{ role: string; content: string }>, opts?: { temperature?: number; maxTokens?: number }): Promise<string> {
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
      temperature: opts?.temperature ?? 0.4,
      ...(opts?.maxTokens ? { max_tokens: opts.maxTokens } : {}),
    }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("AI is rate-limited. Please retry in a moment.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace settings.");
    throw new Error(`AI gateway error ${res.status}: ${t.slice(0, 200)}`);
  }
  const json = await res.json();
  return String(json?.choices?.[0]?.message?.content ?? "").trim();
}

function safeJson<T>(raw: string, fallback: T): T {
  try {
    const m = raw.match(/[\[{][\s\S]*[\]}]/);
    return m ? (JSON.parse(m[0]) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** AI Document Generator — full doc from prompt + optional context. */
export const generateDocument = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      type: z.enum(DOC_TYPES),
      prompt: z.string().min(3).max(6000),
      context: z.string().max(20000).optional(),
      audience: z.enum(["engineering", "product", "executive", "operations", "mixed"]).default("mixed"),
      tone: z.enum(["concise", "detailed", "formal"]).default("detailed"),
    }),
  )
  .handler(async ({ data }) => {
    const meta = DOC_GUIDE[data.type];
    const system = `You are a Fortune 500 principal architect and technical writer. Produce a complete, professional ${meta.title} in clean GitHub-flavored Markdown.
Rules:
- Start with a single H1 title.
- Follow this section outline EXACTLY using H2 headings:
${meta.outline}
- Use tables for structured data (requirements, APIs, SLAs).
- Use fenced code blocks for examples.
- Be specific: name concrete services, technologies, and metrics.
- Audience: ${data.audience}. Tone: ${data.tone}.
- No prose outside the document. No explanations. Output Markdown only.`;
    const userParts = [`Subject:\n${data.prompt}`];
    if (data.context?.trim()) userParts.push(`Additional context (diagram / code / notes):\n${data.context.trim()}`);
    const md = await callGateway(
      [
        { role: "system", content: system },
        { role: "user", content: userParts.join("\n\n") },
      ],
      { temperature: 0.5, maxTokens: 4096 },
    );
    return { markdown: stripFences(md), type: data.type };
  });

/** AI Architecture-to-Document Converter — Mermaid / arch text => doc. */
export const architectureToDocument = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      type: z.enum(DOC_TYPES),
      architecture: z.string().min(5).max(20000),
    }),
  )
  .handler(async ({ data }) => {
    const meta = DOC_GUIDE[data.type];
    const system = `You are an enterprise architect. Read the architecture description or Mermaid diagram below and write a complete ${meta.title} in clean Markdown.
- Follow these H2 sections:\n${meta.outline}
- Identify every component shown and document it.
- Infer data flow and dependencies from the diagram.
- Output Markdown only.`;
    const md = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.architecture },
    ], { temperature: 0.4, maxTokens: 4096 });
    return { markdown: stripFences(md) };
  });

export interface ReviewFinding { severity: "low" | "medium" | "high" | "critical"; area: string; issue: string; recommendation: string; }
export interface ReviewResult { score: number; summary: string; findings: ReviewFinding[]; }

/** AI Document Review & Quality Checker. */
export const reviewDocument = createServerFn({ method: "POST" })
  .inputValidator(z.object({ markdown: z.string().min(20).max(40000) }))
  .handler(async ({ data }) => {
    const system = `You are a senior reviewer. Evaluate the document for completeness, consistency, clarity, security, compliance and best practices. Reply STRICTLY as JSON:
{ "score": 0-100, "summary": "...", "findings": [ { "severity": "low|medium|high|critical", "area": "...", "issue": "...", "recommendation": "..." } ] }
No prose. JSON only.`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.markdown },
    ], { temperature: 0.2 });
    const parsed = safeJson<ReviewResult>(raw, { score: 0, summary: "Could not parse review.", findings: [] });
    return parsed;
  });

export interface GapItem { section: string; missing: string; impact: "low" | "medium" | "high"; suggestion: string; }

/** AI Gap Analysis Engine. */
export const gapAnalysis = createServerFn({ method: "POST" })
  .inputValidator(z.object({ type: z.enum(DOC_TYPES), markdown: z.string().min(20).max(40000) }))
  .handler(async ({ data }) => {
    const meta = DOC_GUIDE[data.type];
    const system = `You are a documentation auditor. Compare the document below against this expected outline for a ${meta.title}:
${meta.outline}

Identify missing sections, missing requirements, dependencies, risks and architectural gaps. Reply STRICTLY as JSON array:
[ { "section": "...", "missing": "...", "impact": "low|medium|high", "suggestion": "..." } ]`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.markdown },
    ], { temperature: 0.2 });
    return { gaps: safeJson<GapItem[]>(raw, []) };
  });

/** AI Executive Summary Generator. */
export const executiveSummary = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    markdown: z.string().min(20).max(40000),
    audience: z.enum(["board", "leadership", "stakeholders"]).default("leadership"),
  }))
  .handler(async ({ data }) => {
    const system = `Write a ${data.audience}-level executive summary for the document below. Output Markdown with:
- A 3-sentence TL;DR.
- ## Key Outcomes (3-5 bullets).
- ## Risks & Mitigations (table).
- ## Decision Asks (bullets).
Crisp business language. No filler.`;
    const md = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.markdown },
    ], { temperature: 0.4 });
    return { markdown: stripFences(md) };
  });

/** AI Requirements Extraction — transcripts/emails/tickets => structured doc. */
export const extractRequirements = createServerFn({ method: "POST" })
  .inputValidator(z.object({ source: z.string().min(10).max(30000) }))
  .handler(async ({ data }) => {
    const system = `Extract structured requirements from the unstructured source. Output Markdown with:
# Requirements
## Functional Requirements (table: ID | Requirement | Priority | Source)
## Non-Functional Requirements (table: ID | Category | Requirement | Target)
## Open Questions (bullets)
## Assumptions (bullets)
IDs like FR-001, NFR-001. Markdown only.`;
    const md = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.source },
    ], { temperature: 0.3, maxTokens: 3000 });
    return { markdown: stripFences(md) };
  });

/** AI Version Comparison & Change Impact Analysis. */
export const versionImpact = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    previous: z.string().min(5).max(40000),
    current: z.string().min(5).max(40000),
  }))
  .handler(async ({ data }) => {
    const system = `Compare the two document versions. Output Markdown:
## Summary of Changes (bullets)
## Section Diff (table: Section | Change Type | Description)
## Predicted Impact (table: Area | Impact | Mitigation)
No prose outside the sections.`;
    const md = await callGateway([
      { role: "system", content: system },
      { role: "user", content: `PREVIOUS:\n${data.previous}\n\nCURRENT:\n${data.current}` },
    ], { temperature: 0.3 });
    return { markdown: stripFences(md) };
  });

export interface ComplianceItem { framework: string; control: string; status: "pass" | "gap" | "needs-review"; note: string; }

/** AI Compliance & Governance Assistant. */
export const complianceCheck = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    markdown: z.string().min(20).max(40000),
    frameworks: z.array(z.string()).default(["SOC 2", "ISO 27001", "GDPR"]),
  }))
  .handler(async ({ data }) => {
    const system = `You are a compliance reviewer. Assess the document against: ${data.frameworks.join(", ")}.
Reply STRICTLY as JSON array:
[ { "framework": "SOC 2", "control": "CC6.1", "status": "pass|gap|needs-review", "note": "..." } ]
Focus on access control, data protection, audit logging, change management, encryption, retention.`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.markdown },
    ], { temperature: 0.2 });
    return { items: safeJson<ComplianceItem[]>(raw, []) };
  });

export interface CrossRef { name: string; kind: "document" | "api" | "diagram" | "requirement" | "service"; reason: string; }

/** AI Knowledge Graph & Cross-Reference Engine. */
export const crossReferences = createServerFn({ method: "POST" })
  .inputValidator(z.object({ markdown: z.string().min(20).max(40000) }))
  .handler(async ({ data }) => {
    const system = `Extract entities that should be cross-referenced (other documents, APIs, diagrams, requirements, services). Reply STRICTLY as JSON array:
[ { "name": "...", "kind": "document|api|diagram|requirement|service", "reason": "..." } ]
Limit to top 12.`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: data.markdown },
    ], { temperature: 0.3 });
    return { refs: safeJson<CrossRef[]>(raw, []) };
  });

/** Semantic search across an in-memory list of documents. */
export const semanticSearch = createServerFn({ method: "POST" })
  .inputValidator(z.object({
    query: z.string().min(2).max(500),
    docs: z.array(z.object({ id: z.string(), title: z.string(), excerpt: z.string().max(2000) })).max(50),
  }))
  .handler(async ({ data }) => {
    if (data.docs.length === 0) return { results: [] as Array<{ id: string; score: number; why: string }> };
    const system = `Rank the documents by relevance to the user query. Reply STRICTLY as JSON array:
[ { "id": "...", "score": 0-100, "why": "..." } ] sorted desc by score. Only include docs with score >= 30.`;
    const raw = await callGateway([
      { role: "system", content: system },
      { role: "user", content: `Query: ${data.query}\n\nDocs:\n${JSON.stringify(data.docs)}` },
    ], { temperature: 0.1 });
    return { results: safeJson<Array<{ id: string; score: number; why: string }>>(raw, []) };
  });