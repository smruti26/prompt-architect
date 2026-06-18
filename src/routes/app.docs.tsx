import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  FileText, Download, Sparkles, Wand2, ShieldCheck, GitCompare, Network,
  Search, Plus, Trash2, Save, Copy, ListChecks, AlertTriangle,
  ScrollText, Boxes, Clock, History, Loader2, BookOpenCheck,
  Workflow, FileCode2, MessageSquareText, Building2, Cog, LifeBuoy,
  BookText, BadgeCheck, Layers, ChevronRight, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import {
  DOC_TYPES, type DocType,
  generateDocument, architectureToDocument, reviewDocument, gapAnalysis,
  executiveSummary, extractRequirements, versionImpact, complianceCheck,
  crossReferences, semanticSearch,
  type ReviewResult, type GapItem, type ComplianceItem, type CrossRef,
} from "@/lib/api/docs-ai.functions";

export const Route = createFileRoute("/app/docs")({
  head: () => ({
    meta: [
      { title: "Documentation Center — ArchAI" },
      { name: "description", content: "AI-powered enterprise Documentation Center: generate HLDs, LLDs, PRDs, BRDs, runbooks and more from a single prompt." },
    ],
  }),
  component: DocsPage,
});

// ---------- types & meta ----------

interface DocVersion { id: string; ts: number; markdown: string; }
interface DocRecord {
  id: string;
  type: DocType;
  title: string;
  prompt: string;
  markdown: string;
  updatedAt: number;
  versions: DocVersion[];
}

const DOC_META: Record<DocType, { label: string; group: string; icon: typeof FileText; hint: string }> = {
  hld:                    { label: "High-Level Design",         group: "Architecture", icon: Boxes,            hint: "Strategic, multi-system view" },
  lld:                    { label: "Low-Level Design",          group: "Architecture", icon: Layers,           hint: "Component / class / API depth" },
  "solution-architecture":{ label: "Solution Architecture",     group: "Architecture", icon: Building2,        hint: "Business + tech alignment" },
  "technical-design":     { label: "Technical Design",          group: "Architecture", icon: FileCode2,        hint: "RFC-style design doc" },
  prd:                    { label: "Product Requirements",      group: "Product",      icon: ScrollText,       hint: "Outcomes, stories, metrics" },
  brd:                    { label: "Business Requirements",     group: "Product",      icon: BookText,         hint: "Stakeholder business case" },
  "api-doc":              { label: "API Documentation",         group: "Engineering",  icon: Workflow,         hint: "Endpoints, payloads, examples" },
  "system-infra":         { label: "System & Infrastructure",   group: "Engineering",  icon: Network,          hint: "Topology, capacity, DR" },
  "user-manual":          { label: "User Manual",               group: "Knowledge",    icon: BookOpenCheck,    hint: "Step-by-step product usage" },
  "kb-article":           { label: "Knowledge Base Article",    group: "Knowledge",    icon: BookText,         hint: "Symptom-cause-fix article" },
  sop:                    { label: "Standard Operating Procedure", group: "Operations", icon: Cog,             hint: "Process with controls" },
  runbook:                { label: "Operations Runbook",        group: "Operations",   icon: LifeBuoy,         hint: "On-call diagnostic playbook" },
};

const GROUPS = ["Architecture", "Product", "Engineering", "Knowledge", "Operations"] as const;

const STORAGE_KEY = "docs.center.v1";

function loadDocs(): DocRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as DocRecord[]) : [];
  } catch { return []; }
}
function saveDocs(list: DocRecord[]) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch { /* noop */ }
}

// ---------- markdown rendering ----------

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  let tableHeader = false;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>")
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a class="text-primary underline-offset-2 hover:underline" href="$2" target="_blank" rel="noopener">$1</a>');

  const closeTable = () => { if (inTable) { out.push("</tbody></table>"); inTable = false; tableHeader = false; } };

  for (const line of lines) {
    if (line.startsWith("```")) {
      closeTable();
      if (inCode) { out.push("</code></pre>"); inCode = false; }
      else { out.push('<pre class="overflow-auto rounded-lg border bg-background/60 p-4 text-xs"><code class="font-mono">'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(esc(line)); continue; }
    if (/^\|.*\|$/.test(line)) {
      const cells = line.slice(1, -1).split("|").map((c) => c.trim());
      if (cells.every((c) => /^[-:]+$/.test(c))) { tableHeader = true; continue; }
      if (!inTable) {
        out.push('<table class="my-3 w-full border-collapse text-sm"><tbody>');
        inTable = true;
      }
      const tag = tableHeader ? "td" : (out[out.length - 1]?.startsWith("<table") ? "th" : "td");
      out.push("<tr>" + cells.map((c) => `<${tag} class="border border-border px-3 py-1.5 ${tag === "th" ? "bg-muted/40 text-left font-semibold" : ""}">${inline(c)}</${tag}>`).join("") + "</tr>");
      tableHeader = false;
      continue;
    } else { closeTable(); }

    if (/^#\s/.test(line))      out.push(`<h1 class="mt-6 mb-3 text-3xl font-semibold tracking-tight">${inline(line.slice(2))}</h1>`);
    else if (/^##\s/.test(line))  out.push(`<h2 class="mt-6 mb-2 text-2xl font-semibold tracking-tight">${inline(line.slice(3))}</h2>`);
    else if (/^###\s/.test(line)) out.push(`<h3 class="mt-4 mb-1.5 text-lg font-semibold">${inline(line.slice(4))}</h3>`);
    else if (/^-\s/.test(line))   out.push(`<li class="ml-5 list-disc text-sm leading-relaxed">${inline(line.slice(2))}</li>`);
    else if (/^\d+\.\s/.test(line)) out.push(`<li class="ml-5 list-decimal text-sm leading-relaxed">${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
    else if (line.trim() === "")  out.push("<div class='h-2'></div>");
    else                          out.push(`<p class="text-sm leading-relaxed text-foreground/85">${inline(line)}</p>`);
  }
  if (inCode) out.push("</code></pre>");
  closeTable();
  return out.join("\n");
}

// ---------- export helpers ----------

function toConfluence(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "h1. $1")
    .replace(/^## (.+)$/gm, "h2. $1")
    .replace(/^### (.+)$/gm, "h3. $1")
    .replace(/\*\*([^*]+)\*\*/g, "*$1*")
    .replace(/`([^`]+)`/g, "{{$1}}");
}
function toJira(md: string): string {
  return md
    .replace(/^# (.+)$/gm, "h1. $1")
    .replace(/^## (.+)$/gm, "h2. $1")
    .replace(/^### (.+)$/gm, "h3. $1")
    .replace(/^- /gm, "* ")
    .replace(/\*\*([^*]+)\*\*/g, "*$1*");
}
function downloadText(name: string, content: string, mime: string) {
  saveAs(new Blob([content], { type: mime }), name);
}
function exportPdf(title: string, md: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const pageH = pdf.internal.pageSize.getHeight();
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  let y = margin;
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(18);
  pdf.text(title, margin, y); y += 22;
  pdf.setFont("helvetica", "normal"); pdf.setFontSize(10);
  const blocks = md.split("\n");
  for (const line of blocks) {
    const isH1 = /^# /.test(line);
    const isH2 = /^## /.test(line);
    const isH3 = /^### /.test(line);
    const text = line.replace(/^#+\s*/, "").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/`([^`]+)`/g, "$1");
    pdf.setFont("helvetica", isH1 || isH2 || isH3 ? "bold" : "normal");
    pdf.setFontSize(isH1 ? 16 : isH2 ? 13 : isH3 ? 11 : 10);
    const wrapped = pdf.splitTextToSize(text || " ", width);
    for (const w of wrapped) {
      if (y > pageH - margin) { pdf.addPage(); y = margin; }
      pdf.text(w, margin, y); y += isH1 ? 18 : isH2 ? 15 : 13;
    }
  }
  pdf.save(`${title.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
function exportDocx(title: string, md: string) {
  // Lightweight Word-readable HTML (.doc) — broad Word compatibility without adding deps.
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>${title}</title></head><body style="font-family:Calibri,Arial,sans-serif">${renderMarkdown(md)}</body></html>`;
  saveAs(new Blob([html], { type: "application/msword" }), `${title.replace(/\s+/g, "-").toLowerCase()}.doc`);
}
function exportPptxOutline(title: string, md: string) {
  // PPTX outline (text). Importable in PowerPoint via "Insert slides from outline".
  const lines = md.split("\n").filter((l) => /^#/.test(l)).map((l) => l.replace(/^#+\s*/, ""));
  const txt = [title, ...lines].join("\n");
  downloadText(`${title.replace(/\s+/g, "-").toLowerCase()}.outline.txt`, txt, "text/plain");
}

// ---------- main page ----------

function DocsPage() {
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  // composer
  const [docType, setDocType] = useState<DocType>("hld");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [audience, setAudience] = useState<"engineering" | "product" | "executive" | "operations" | "mixed">("mixed");
  const [tone, setTone] = useState<"concise" | "detailed" | "formal">("detailed");

  // AI tools state
  const [review, setReview] = useState<ReviewResult | null>(null);
  const [gaps, setGaps] = useState<GapItem[] | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [compliance, setCompliance] = useState<ComplianceItem[] | null>(null);
  const [refs, setRefs] = useState<CrossRef[] | null>(null);
  const [versionDiff, setVersionDiff] = useState<string>("");
  const [extractSource, setExtractSource] = useState("");
  const [archSource, setArchSource] = useState("");

  // search
  const [aiSearch, setAiSearch] = useState<Array<{ id: string; score: number; why: string }>>([]);

  const [busy, setBusy] = useState<string | null>(null);

  // server fns
  const genFn      = useServerFn(generateDocument);
  const archFn     = useServerFn(architectureToDocument);
  const reviewFn   = useServerFn(reviewDocument);
  const gapFn      = useServerFn(gapAnalysis);
  const summaryFn  = useServerFn(executiveSummary);
  const extractFn  = useServerFn(extractRequirements);
  const diffFn     = useServerFn(versionImpact);
  const complyFn   = useServerFn(complianceCheck);
  const refsFn     = useServerFn(crossReferences);
  const searchFn   = useServerFn(semanticSearch);

  useEffect(() => {
    const list = loadDocs();
    setDocs(list);
    setActiveId(list[0]?.id ?? null);
  }, []);

  const persist = useCallback((next: DocRecord[]) => {
    setDocs(next);
    saveDocs(next);
  }, []);

  const active = useMemo(() => docs.find((d) => d.id === activeId) ?? null, [docs, activeId]);

  const filteredDocs = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    return docs.filter((d) => {
      if (groupFilter !== "All" && DOC_META[d.type].group !== groupFilter) return false;
      if (!q) return true;
      return d.title.toLowerCase().includes(q) || d.prompt.toLowerCase().includes(q) || d.markdown.toLowerCase().includes(q);
    }).sort((a, b) => b.updatedAt - a.updatedAt);
  }, [docs, groupFilter, deferredQuery]);

  const resetAITools = () => {
    setReview(null); setGaps(null); setSummary(""); setCompliance(null);
    setRefs(null); setVersionDiff("");
  };

  const createDoc = (markdown: string, type: DocType, p: string) => {
    const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || DOC_META[type].label;
    const rec: DocRecord = {
      id: crypto.randomUUID(),
      type, title, prompt: p, markdown, updatedAt: Date.now(),
      versions: [{ id: crypto.randomUUID(), ts: Date.now(), markdown }],
    };
    persist([rec, ...docs]);
    setActiveId(rec.id);
    resetAITools();
    return rec;
  };

  const updateActive = (markdown: string, opts?: { snapshot?: boolean }) => {
    if (!active) return;
    const next = docs.map((d) => {
      if (d.id !== active.id) return d;
      const versions = opts?.snapshot
        ? [{ id: crypto.randomUUID(), ts: Date.now(), markdown: d.markdown }, ...d.versions].slice(0, 20)
        : d.versions;
      return { ...d, markdown, updatedAt: Date.now(), title: markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || d.title, versions };
    });
    persist(next);
  };

  const deleteActive = () => {
    if (!active) return;
    const next = docs.filter((d) => d.id !== active.id);
    persist(next);
    setActiveId(next[0]?.id ?? null);
    resetAITools();
  };

  // ---- AI actions ----

  const run = async <T,>(label: string, fn: () => Promise<T>): Promise<T | null> => {
    setBusy(label);
    try { return await fn(); }
    catch (e) {
      toast.error((e as Error).message || "AI request failed");
      return null;
    } finally { setBusy(null); }
  };

  const doGenerate = async () => {
    if (prompt.trim().length < 3) { toast.error("Describe what to document"); return; }
    const res = await run("Generating", () => genFn({ data: { type: docType, prompt, context: context || undefined, audience, tone } }));
    if (!res) return;
    createDoc(res.markdown, res.type, prompt);
    toast.success(`${DOC_META[res.type].label} created`);
  };

  const doArchToDoc = async () => {
    if (archSource.trim().length < 5) { toast.error("Paste architecture/mermaid text"); return; }
    const res = await run("Converting architecture", () => archFn({ data: { type: docType, architecture: archSource } }));
    if (!res) return;
    createDoc(res.markdown, docType, "Architecture-to-Document");
    toast.success("Document generated from architecture");
  };

  const doExtractReqs = async () => {
    if (extractSource.trim().length < 10) { toast.error("Paste source notes / transcript"); return; }
    const res = await run("Extracting requirements", () => extractFn({ data: { source: extractSource } }));
    if (!res) return;
    createDoc(res.markdown, "prd", "Requirements extraction");
    toast.success("Requirements extracted into PRD");
  };

  const doReview = async () => {
    if (!active) return;
    const res = await run("Reviewing", () => reviewFn({ data: { markdown: active.markdown } }));
    if (res) setReview(res);
  };
  const doGap = async () => {
    if (!active) return;
    const res = await run("Gap analysis", () => gapFn({ data: { type: active.type, markdown: active.markdown } }));
    if (res) setGaps(res.gaps);
  };
  const doSummary = async (level: "board" | "leadership" | "stakeholders") => {
    if (!active) return;
    const res = await run("Summarizing", () => summaryFn({ data: { markdown: active.markdown, audience: level } }));
    if (res) setSummary(res.markdown);
  };
  const doCompliance = async () => {
    if (!active) return;
    const res = await run("Compliance check", () => complyFn({ data: { markdown: active.markdown, frameworks: ["SOC 2", "ISO 27001", "GDPR", "HIPAA"] } }));
    if (res) setCompliance(res.items);
  };
  const doRefs = async () => {
    if (!active) return;
    const res = await run("Linking references", () => refsFn({ data: { markdown: active.markdown } }));
    if (res) setRefs(res.refs);
  };
  const doDiff = async (versionId: string) => {
    if (!active) return;
    const v = active.versions.find((x) => x.id === versionId);
    if (!v) return;
    const res = await run("Comparing versions", () => diffFn({ data: { previous: v.markdown, current: active.markdown } }));
    if (res) setVersionDiff(res.markdown);
  };
  const doRestore = (versionId: string) => {
    if (!active) return;
    const v = active.versions.find((x) => x.id === versionId);
    if (!v) return;
    updateActive(v.markdown, { snapshot: true });
    toast.success("Version restored as latest");
  };
  const doSemanticSearch = async () => {
    if (!query.trim()) return;
    const payload = docs.slice(0, 30).map((d) => ({ id: d.id, title: d.title, excerpt: d.markdown.slice(0, 1500) }));
    const res = await run("Semantic search", () => searchFn({ data: { query, docs: payload } }));
    if (res) setAiSearch(res.results);
  };

  // ---------- UI ----------

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col gap-3 p-3 md:p-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/5 p-5">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Documentation Center
              <Badge variant="secondary">AI-first</Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Ship Fortune-500 docs from a single prompt
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              HLD, LLD, PRD, BRD, runbooks, API specs and more — generated, reviewed and exported with 10 AI engines.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm"><Link to="/app/studio"><Wand2 className="mr-2 h-4 w-4" /> Open Studio</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/app/marketplace"><BookOpenCheck className="mr-2 h-4 w-4" /> Templates</Link></Button>
          </div>
        </div>
        <div className="relative mt-4 grid grid-cols-2 gap-2 md:grid-cols-5">
          {AI_FEATURES.map((f) => (
            <div key={f.label} className="flex items-center gap-2 rounded-lg border bg-background/50 px-3 py-2 backdrop-blur">
              <f.icon className="h-4 w-4 shrink-0 text-violet-400" />
              <div className="min-w-0">
                <div className="truncate text-xs font-medium">{f.label}</div>
                <div className="truncate text-[10px] text-muted-foreground">{f.hint}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[260px_minmax(0,1fr)_360px]">
        {/* Sidebar */}
        <div className="flex min-h-0 flex-col rounded-xl border bg-background/40">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search documents…"
                className="h-8 pl-8 text-xs"
              />
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]" onClick={doSemanticSearch} disabled={busy !== null || !query.trim() || docs.length === 0}>
                <Brain className="mr-1 h-3 w-3" /> AI search
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {(["All", ...GROUPS] as const).map((g) => (
                <button key={g} onClick={() => setGroupFilter(g)} className={`rounded-md border px-2 py-0.5 text-[10px] transition ${groupFilter === g ? "border-foreground/40 bg-accent" : "text-muted-foreground hover:bg-accent/40"}`}>{g}</button>
              ))}
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="space-y-1 p-2">
              {aiSearch.length > 0 && (
                <div className="mb-2 rounded-md border border-dashed bg-muted/30 p-2">
                  <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                    <span>AI relevance</span>
                    <button className="hover:text-foreground" onClick={() => setAiSearch([])}>clear</button>
                  </div>
                  {aiSearch.map((r) => {
                    const d = docs.find((x) => x.id === r.id);
                    if (!d) return null;
                    return (
                      <button key={r.id} onClick={() => setActiveId(r.id)} className="flex w-full items-start gap-2 rounded p-1.5 text-left hover:bg-accent/50">
                        <Badge variant="secondary" className="text-[10px]">{r.score}</Badge>
                        <div className="min-w-0">
                          <div className="truncate text-xs font-medium">{d.title}</div>
                          <div className="line-clamp-2 text-[10px] text-muted-foreground">{r.why}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {filteredDocs.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  No documents yet.<br />Generate one with the AI composer.
                </div>
              )}
              {filteredDocs.map((d) => {
                const Meta = DOC_META[d.type];
                const Icon = Meta.icon;
                const isActive = d.id === activeId;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setActiveId(d.id); resetAITools(); }}
                    className={`flex w-full items-start gap-2 rounded-md border p-2 text-left transition ${isActive ? "border-foreground/40 bg-accent" : "border-transparent hover:bg-accent/50"}`}
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-medium">{d.title}</div>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        <span>{Meta.label}</span><span>·</span>
                        <span>{new Date(d.updatedAt).toLocaleDateString()}</span>
                        <span>·</span>
                        <span>v{d.versions.length}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Center: composer + editor */}
        <div className="flex min-h-0 flex-col gap-3">
          {/* Composer */}
          <div className="rounded-xl border bg-background/50 p-3">
            <Tabs defaultValue="prompt" className="w-full">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TabsList className="bg-muted/40">
                  <TabsTrigger value="prompt" className="text-xs"><Wand2 className="mr-1.5 h-3.5 w-3.5" />Prompt-to-Doc</TabsTrigger>
                  <TabsTrigger value="arch" className="text-xs"><Network className="mr-1.5 h-3.5 w-3.5" />Architecture-to-Doc</TabsTrigger>
                  <TabsTrigger value="extract" className="text-xs"><MessageSquareText className="mr-1.5 h-3.5 w-3.5" />Requirements Extract</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1.5">
                  <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                    <SelectTrigger className="h-8 w-[210px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {GROUPS.map((g) => (
                        <div key={g}>
                          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">{g}</div>
                          {DOC_TYPES.filter((t) => DOC_META[t].group === g).map((t) => (
                            <SelectItem key={t} value={t}>{DOC_META[t].label}</SelectItem>
                          ))}
                        </div>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <TabsContent value="prompt" className="mt-3 space-y-2">
                <Textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={`e.g. "${DOC_META[docType].label} for a multi-tenant SaaS billing platform with Stripe, Postgres and event-driven microservices"`}
                />
                <Textarea
                  rows={2}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Optional context: paste diagrams, code snippets, meeting notes…"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={audience} onValueChange={(v) => setAudience(v as typeof audience)}>
                    <SelectTrigger className="h-8 w-[150px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mixed">Mixed audience</SelectItem>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="product">Product</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tone} onValueChange={(v) => setTone(v as typeof tone)}>
                    <SelectTrigger className="h-8 w-[130px] text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="concise">Concise</SelectItem>
                      <SelectItem value="detailed">Detailed</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex-1" />
                  <Button size="sm" onClick={doGenerate} disabled={busy !== null}>
                    {busy === "Generating" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Generate document
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="arch" className="mt-3 space-y-2">
                <Textarea rows={4} value={archSource} onChange={(e) => setArchSource(e.target.value)} placeholder="Paste a Mermaid diagram or describe your architecture (services, data stores, integrations)…" />
                <div className="flex justify-end">
                  <Button size="sm" onClick={doArchToDoc} disabled={busy !== null}>
                    {busy === "Converting architecture" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Network className="mr-2 h-4 w-4" />}
                    Generate {DOC_META[docType].label}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="extract" className="mt-3 space-y-2">
                <Textarea rows={4} value={extractSource} onChange={(e) => setExtractSource(e.target.value)} placeholder="Paste meeting transcript, email thread, Jira tickets, Slack conversation…" />
                <div className="flex justify-end">
                  <Button size="sm" onClick={doExtractReqs} disabled={busy !== null}>
                    {busy === "Extracting requirements" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ListChecks className="mr-2 h-4 w-4" />}
                    Extract requirements
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Editor / Preview */}
          <div className="flex min-h-0 flex-1 flex-col rounded-xl border bg-background/40">
            {!active && (
              <div className="flex flex-1 items-center justify-center p-10 text-center text-sm text-muted-foreground">
                <div>
                  <FileText className="mx-auto mb-2 h-8 w-8 opacity-60" />
                  Generate or import a document to start editing.
                </div>
              </div>
            )}
            {active && (
              <DocumentEditor
                doc={active}
                onChange={(md) => updateActive(md)}
                onSnapshot={() => updateActive(active.markdown, { snapshot: true })}
                onDelete={deleteActive}
              />
            )}
          </div>
        </div>

        {/* AI tools rail */}
        <div className="flex min-h-0 flex-col rounded-xl border bg-background/40">
          <Tabs defaultValue="review" className="flex h-full min-h-0 flex-col">
            <TabsList className="m-2 grid grid-cols-3 bg-muted/40">
              <TabsTrigger value="review" className="text-[11px]"><BadgeCheck className="mr-1 h-3 w-3" />Review</TabsTrigger>
              <TabsTrigger value="gap" className="text-[11px]"><AlertTriangle className="mr-1 h-3 w-3" />Gaps</TabsTrigger>
              <TabsTrigger value="summary" className="text-[11px]"><Sparkles className="mr-1 h-3 w-3" />Summary</TabsTrigger>
              <TabsTrigger value="comply" className="text-[11px]"><ShieldCheck className="mr-1 h-3 w-3" />Comply</TabsTrigger>
              <TabsTrigger value="refs" className="text-[11px]"><Network className="mr-1 h-3 w-3" />Refs</TabsTrigger>
              <TabsTrigger value="versions" className="text-[11px]"><History className="mr-1 h-3 w-3" />Versions</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 px-3 pb-3">
              <TabsContent value="review" className="space-y-2">
                <ActionRow label="Quality review" onRun={doReview} disabled={!active || busy !== null} busy={busy === "Reviewing"} icon={BadgeCheck} />
                {review && (
                  <div className="space-y-2 rounded-md border bg-background/60 p-2">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium">Quality score</div>
                      <Badge className={scoreBadge(review.score)}>{review.score}/100</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{review.summary}</p>
                    {review.findings.map((f, i) => (
                      <div key={i} className="rounded border p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{f.area}</span>
                          <Badge variant="secondary" className={severityBadge(f.severity)}>{f.severity}</Badge>
                        </div>
                        <div className="mt-1 text-muted-foreground">{f.issue}</div>
                        <div className="mt-1 text-[11px] text-foreground/80">↳ {f.recommendation}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="gap" className="space-y-2">
                <ActionRow label="Run gap analysis" onRun={doGap} disabled={!active || busy !== null} busy={busy === "Gap analysis"} icon={AlertTriangle} />
                {gaps && (
                  <div className="space-y-2">
                    {gaps.length === 0 && <div className="text-xs text-muted-foreground">No gaps detected.</div>}
                    {gaps.map((g, i) => (
                      <div key={i} className="rounded border bg-background/60 p-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{g.section}</span>
                          <Badge className={impactBadge(g.impact)}>{g.impact}</Badge>
                        </div>
                        <div className="mt-1 text-muted-foreground">Missing: {g.missing}</div>
                        <div className="mt-1 text-[11px]">↳ {g.suggestion}</div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="summary" className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={!active || busy !== null} onClick={() => doSummary("board")}>Board</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={!active || busy !== null} onClick={() => doSummary("leadership")}>Leadership</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[11px]" disabled={!active || busy !== null} onClick={() => doSummary("stakeholders")}>Stakeholders</Button>
                </div>
                {busy === "Summarizing" && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />Generating…</div>}
                {summary && (
                  <div className="space-y-2 rounded-md border bg-background/60 p-2">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { navigator.clipboard.writeText(summary); toast.success("Summary copied"); }}>
                        <Copy className="mr-1 h-3 w-3" />Copy
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px]" onClick={() => { if (active) { const r = createDoc(summary, "kb-article", `Executive summary of ${active.title}`); setActiveId(r.id); } }}>
                        <Plus className="mr-1 h-3 w-3" />Save as doc
                      </Button>
                    </div>
                    <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(summary) }} />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="comply" className="space-y-2">
                <ActionRow label="Compliance check (SOC 2, ISO 27001, GDPR, HIPAA)" onRun={doCompliance} disabled={!active || busy !== null} busy={busy === "Compliance check"} icon={ShieldCheck} />
                {compliance && compliance.map((c, i) => (
                  <div key={i} className="rounded border bg-background/60 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{c.framework} · {c.control}</span>
                      <Badge className={complianceBadge(c.status)}>{c.status}</Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">{c.note}</div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="refs" className="space-y-2">
                <ActionRow label="Link cross-references" onRun={doRefs} disabled={!active || busy !== null} busy={busy === "Linking references"} icon={Network} />
                {refs && refs.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 rounded border bg-background/60 p-2 text-xs">
                    <Badge variant="secondary" className="text-[10px] capitalize">{r.kind}</Badge>
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.name}</div>
                      <div className="text-[11px] text-muted-foreground">{r.reason}</div>
                    </div>
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="versions" className="space-y-2">
                {!active && <div className="text-xs text-muted-foreground">Select a document.</div>}
                {active && active.versions.length === 1 && (
                  <div className="text-xs text-muted-foreground">Edit and snapshot to track versions.</div>
                )}
                {active && active.versions.map((v, i) => (
                  <div key={v.id} className="rounded border bg-background/60 p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{i === 0 ? "Latest" : `v${active.versions.length - i}`}</span>
                      <span className="text-[10px] text-muted-foreground"><Clock className="mr-1 inline h-3 w-3" />{new Date(v.ts).toLocaleString()}</span>
                    </div>
                    {i > 0 && (
                      <div className="mt-1.5 flex gap-1.5">
                        <Button size="sm" variant="outline" className="h-7 flex-1 text-[11px]" disabled={busy !== null} onClick={() => doDiff(v.id)}>
                          <GitCompare className="mr-1 h-3 w-3" />Diff vs current
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={() => doRestore(v.id)}>
                          Restore
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {versionDiff && (
                  <div className="rounded border bg-background/60 p-2">
                    <div className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">Change impact</div>
                    <div className="prose prose-sm prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(versionDiff) }} />
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------

function DocumentEditor({
  doc, onChange, onSnapshot, onDelete,
}: {
  doc: DocRecord;
  onChange: (md: string) => void;
  onSnapshot: () => void;
  onDelete: () => void;
}) {
  const [view, setView] = useState<"preview" | "edit">("preview");
  const Meta = DOC_META[doc.type];
  const Icon = Meta.icon;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-muted/60 p-1.5"><Icon className="h-4 w-4 text-violet-400" /></div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold">{doc.title}</div>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span>{Meta.label}</span><ChevronRight className="h-3 w-3" /><span>{Meta.group}</span><span>·</span><span>Updated {new Date(doc.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-md border p-0.5">
            <button onClick={() => setView("preview")} className={`rounded px-2 py-1 text-[11px] ${view === "preview" ? "bg-accent" : "text-muted-foreground hover:bg-accent/50"}`}>Preview</button>
            <button onClick={() => setView("edit")} className={`rounded px-2 py-1 text-[11px] ${view === "edit" ? "bg-accent" : "text-muted-foreground hover:bg-accent/50"}`}>Edit</button>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={onSnapshot}><Save className="mr-1 h-3 w-3" />Snapshot</Button>
          <Select onValueChange={(v) => {
            const title = doc.title;
            if (v === "md") downloadText(`${title}.md`, doc.markdown, "text/markdown");
            else if (v === "pdf") { exportPdf(title, doc.markdown); toast.success("PDF exported"); }
            else if (v === "docx") { exportDocx(title, doc.markdown); toast.success("Word document exported"); }
            else if (v === "pptx") { exportPptxOutline(title, doc.markdown); toast.success("Outline exported"); }
            else if (v === "confluence") { navigator.clipboard.writeText(toConfluence(doc.markdown)); toast.success("Confluence markup copied"); }
            else if (v === "jira") { navigator.clipboard.writeText(toJira(doc.markdown)); toast.success("Jira markup copied"); }
          }}>
            <SelectTrigger className="h-7 w-[130px] text-[11px]"><Download className="mr-1 h-3 w-3" /><SelectValue placeholder="Export" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="md">Markdown (.md)</SelectItem>
              <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              <SelectItem value="docx">Word (.doc)</SelectItem>
              <SelectItem value="pptx">PPTX outline</SelectItem>
              <SelectItem value="confluence">Confluence (clipboard)</SelectItem>
              <SelectItem value="jira">Jira (clipboard)</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="ghost" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {view === "preview" ? (
        <ScrollArea className="flex-1">
          <div className="prose prose-sm prose-invert max-w-3xl px-6 py-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.markdown) }} />
        </ScrollArea>
      ) : (
        <Textarea
          value={doc.markdown}
          onChange={(e) => onChange(e.target.value)}
          className="h-full flex-1 resize-none border-0 bg-background/40 font-mono text-xs leading-relaxed focus-visible:ring-0"
        />
      )}
    </div>
  );
}

function ActionRow({ label, onRun, disabled, busy, icon: Icon }: { label: string; onRun: () => void; disabled: boolean; busy: boolean; icon: typeof FileText }) {
  return (
    <Button size="sm" variant="outline" className="w-full justify-start text-[11px]" disabled={disabled} onClick={onRun}>
      {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Icon className="mr-2 h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

// ---------- styling helpers ----------

function scoreBadge(score: number): string {
  if (score >= 80) return "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20";
  if (score >= 60) return "bg-amber-500/20 text-amber-300 hover:bg-amber-500/20";
  return "bg-rose-500/20 text-rose-300 hover:bg-rose-500/20";
}
function severityBadge(s: string): string {
  if (s === "critical") return "bg-rose-500/20 text-rose-300";
  if (s === "high") return "bg-orange-500/20 text-orange-300";
  if (s === "medium") return "bg-amber-500/20 text-amber-300";
  return "bg-sky-500/20 text-sky-300";
}
function impactBadge(i: string): string {
  if (i === "high") return "bg-rose-500/20 text-rose-300 hover:bg-rose-500/20";
  if (i === "medium") return "bg-amber-500/20 text-amber-300 hover:bg-amber-500/20";
  return "bg-sky-500/20 text-sky-300 hover:bg-sky-500/20";
}
function complianceBadge(s: string): string {
  if (s === "pass") return "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20";
  if (s === "gap") return "bg-rose-500/20 text-rose-300 hover:bg-rose-500/20";
  return "bg-amber-500/20 text-amber-300 hover:bg-amber-500/20";
}

const AI_FEATURES: { label: string; hint: string; icon: typeof Sparkles }[] = [
  { label: "Prompt-to-Doc",        hint: "Any doc type from one prompt", icon: Wand2 },
  { label: "Architecture-to-Doc",  hint: "Mermaid / arch → HLD/LLD",     icon: Network },
  { label: "Quality Reviewer",     hint: "Completeness & best practice", icon: BadgeCheck },
  { label: "Gap Analysis",         hint: "Missing sections & risks",     icon: AlertTriangle },
  { label: "Multi-format Export",  hint: "MD · PDF · Word · Confluence", icon: Download },
  { label: "Executive Summary",    hint: "Board / Leadership / Stakehld.", icon: Sparkles },
  { label: "Requirements Extract", hint: "Transcripts → PRD",            icon: MessageSquareText },
  { label: "Version Diff Impact",  hint: "AI change-impact analysis",    icon: GitCompare },
  { label: "Compliance",           hint: "SOC2 · ISO27001 · GDPR",       icon: ShieldCheck },
  { label: "Knowledge Graph",      hint: "Cross-link docs, APIs, reqs",  icon: Brain },
];