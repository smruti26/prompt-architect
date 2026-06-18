import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mic, MicOff, Wand2, Download, Copy, Github, Code2, FileText,
  Layers, ZoomIn, ZoomOut, Maximize2, History, Share2, Lightbulb, Network,
  GitBranch, Database, Cloud, Workflow, Users, Map, Boxes, MonitorSmartphone,
  ListTree, Loader2, Save, Plus, Trash2, ImageDown, FileCode2, Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Mermaid, type MermaidApi } from "@/components/mermaid";
import {
  generateDiagram, optimizeDiagram, codeToDiagram, repoToDiagram,
  explainDiagram, suggestShapes, docsFromDiagram,
} from "@/lib/api/diagram-ai.functions";
import { PENDING_TEMPLATE_KEY, type PendingTemplatePayload } from "@/lib/templates/marketplace";
import { trackEvent } from "@/lib/templates/marketplace-store";

export const Route = createFileRoute("/app/studio")({
  head: () => ({ meta: [{ title: "AI Diagram Studio · ArchAI" }] }),
  component: StudioPage,
});

type DType =
  | "ui-tree" | "flowchart" | "architecture" | "mindmap" | "er" | "sequence"
  | "network" | "process" | "org-chart" | "user-journey" | "database" | "cloud" | "wireframe";

const TYPES: { id: DType; label: string; icon: typeof Sparkles; hint: string }[] = [
  { id: "architecture", label: "System Architecture", icon: Boxes, hint: "Services, APIs, data stores" },
  { id: "flowchart", label: "Flowchart", icon: Workflow, hint: "Decisions and steps" },
  { id: "ui-tree", label: "UI Tree", icon: ListTree, hint: "Component hierarchy" },
  { id: "mindmap", label: "Mind Map", icon: Brain, hint: "Branching ideas" },
  { id: "er", label: "ER Diagram", icon: Database, hint: "Entities and relations" },
  { id: "sequence", label: "Sequence", icon: GitBranch, hint: "Time-ordered messages" },
  { id: "network", label: "Network", icon: Network, hint: "Zones and connectivity" },
  { id: "process", label: "Process Flow", icon: Workflow, hint: "Business process" },
  { id: "org-chart", label: "Org Chart", icon: Users, hint: "Reporting lines" },
  { id: "user-journey", label: "User Journey", icon: Map, hint: "Steps and sentiment" },
  { id: "database", label: "DB Schema", icon: Database, hint: "Tables and FKs" },
  { id: "cloud", label: "Cloud Architecture", icon: Cloud, hint: "VPC, regions, services" },
  { id: "wireframe", label: "App Flow", icon: MonitorSmartphone, hint: "Screens and transitions" },
];

const TEMPLATES: { name: string; type: DType; prompt: string }[] = [
  { name: "SaaS Architecture", type: "architecture", prompt: "Multi-tenant SaaS with Next.js frontend, REST API, Postgres, Redis cache, Stripe, S3 storage, and background workers." },
  { name: "E-commerce Checkout", type: "flowchart", prompt: "End-to-end checkout: cart → address → payment → confirmation, including failure paths." },
  { name: "AWS 3-Tier", type: "cloud", prompt: "AWS 3-tier app: Route53, CloudFront, ALB, ECS Fargate, RDS Postgres, ElastiCache, S3." },
  { name: "Auth Sequence", type: "sequence", prompt: "OAuth 2.0 authorization code flow with PKCE between Client, Auth Server, and Resource Server." },
  { name: "Blog DB Schema", type: "database", prompt: "Blog platform: users, posts, comments, tags, post_tags, media, with PK/FK." },
  { name: "Onboarding Journey", type: "user-journey", prompt: "New user onboarding from signup through first value moment in a productivity app." },
  { name: "Microservices Mesh", type: "architecture", prompt: "Event-driven microservices with API gateway, Kafka, 5 services, and observability stack." },
  { name: "React App Tree", type: "ui-tree", prompt: "React dashboard: Layout → Sidebar, Header, Main(Routes(Home, Reports, Settings(Profile, Billing)))." },
];

type Snapshot = { id: string; ts: number; mermaid: string; type: DType; prompt: string };

function StudioPage() {
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<DType>("architecture");
  const [mermaid, setMermaid] = useState<string>(WELCOME_MERMAID);
  const [loading, setLoading] = useState<string | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [recording, setRecording] = useState(false);
  const [tab, setTab] = useState("prompt");
  const [explanation, setExplanation] = useState<string>("");
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string; why: string }>>([]);
  const [docs, setDocs] = useState<string>("");
  const apiRef = useRef<MermaidApi | null>(null);
  const recogRef = useRef<unknown>(null);

  const genFn = useServerFn(generateDiagram);
  const optFn = useServerFn(optimizeDiagram);
  const codeFn = useServerFn(codeToDiagram);
  const repoFn = useServerFn(repoToDiagram);
  const explainFn = useServerFn(explainDiagram);
  const shapesFn = useServerFn(suggestShapes);
  const docsFn = useServerFn(docsFromDiagram);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("studio.history");
      if (raw) setHistory(JSON.parse(raw));
    } catch { /* noop */ }
  }, []);

  // Load template handed off from the marketplace
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_TEMPLATE_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_TEMPLATE_KEY);
      const payload = JSON.parse(raw) as PendingTemplatePayload;
      setPrompt(payload.prompt);
      setType(payload.type as DType);
      setTab("prompt");
      toast.success(`Template loaded: ${payload.name}`);
      if (payload.autorun) {
        setLoading("generate");
        genFn({ data: { prompt: payload.prompt, type: payload.type as DType } })
          .then((res) => {
            setMermaid(res.mermaid);
            saveSnapshot(res.mermaid, payload.type as DType, payload.prompt);
            try {
              const { getTemplateById } = require("@/lib/templates/marketplace") as typeof import("@/lib/templates/marketplace");
              // best-effort: name field doesn't carry id, so just log a generic event keyed by name
              trackEvent({ templateId: payload.name, name: payload.name, category: "software-architecture", type: payload.type, kind: "generate" });
              void getTemplateById;
            } catch { /* noop */ }
            toast.success("Diagram generated");
          })
          .catch((e: unknown) => toast.error((e as Error).message))
          .finally(() => setLoading(null));
      }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSnapshot = useCallback((m: string, t: DType, p: string) => {
    const snap: Snapshot = { id: crypto.randomUUID(), ts: Date.now(), mermaid: m, type: t, prompt: p };
    setHistory((h) => {
      const next = [snap, ...h].slice(0, 20);
      try { localStorage.setItem("studio.history", JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) { toast.error("Describe what to diagram first"); return; }
    setLoading("generate");
    try {
      const res = await genFn({ data: { prompt, type } });
      setMermaid(res.mermaid);
      saveSnapshot(res.mermaid, type, prompt);
      toast.success("Diagram generated");
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [prompt, type, genFn, saveSnapshot]);

  const handleOptimize = useCallback(async () => {
    setLoading("optimize");
    try {
      const res = await optFn({ data: { mermaid } });
      setMermaid(res.mermaid);
      saveSnapshot(res.mermaid, type, prompt + " (optimized)");
      toast.success("Diagram beautified");
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [mermaid, type, prompt, optFn, saveSnapshot]);

  const handleCode = useCallback(async (code: string) => {
    if (!code.trim()) return;
    setLoading("code");
    try {
      const res = await codeFn({ data: { code } });
      setMermaid(res.mermaid);
      saveSnapshot(res.mermaid, "architecture", "From code");
      toast.success("Diagram from code");
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [codeFn, saveSnapshot]);

  const handleRepo = useCallback(async (url: string) => {
    if (!url.trim()) return;
    setLoading("repo");
    try {
      const res = await repoFn({ data: { repoUrl: url } });
      setMermaid(res.mermaid);
      saveSnapshot(res.mermaid, "architecture", `From repo: ${url}`);
      toast.success("Inferred from repository");
    } catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [repoFn, saveSnapshot]);

  const handleExplain = useCallback(async () => {
    setLoading("explain");
    try { const r = await explainFn({ data: { mermaid } }); setExplanation(r.explanation); setTab("insights"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [mermaid, explainFn]);

  const handleSuggest = useCallback(async () => {
    setLoading("suggest");
    try { const r = await shapesFn({ data: { mermaid } }); setSuggestions(r.suggestions); setTab("insights"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [mermaid, shapesFn]);

  const handleDocs = useCallback(async () => {
    setLoading("docs");
    try { const r = await docsFn({ data: { mermaid } }); setDocs(r.docs); setTab("insights"); }
    catch (e) { toast.error((e as Error).message); }
    finally { setLoading(null); }
  }, [mermaid, docsFn]);

  const exportSvg = useCallback(async () => {
    const svg = apiRef.current?.svg;
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], { type: "image/svg+xml" });
    const fs = await import("file-saver");
    fs.saveAs(blob, "diagram.svg");
  }, []);

  const exportPng = useCallback(async () => {
    const svg = apiRef.current?.svg;
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    const url = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = (svg.clientWidth || 1600) * scale;
      canvas.height = (svg.clientHeight || 900) * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0b1228";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => { if (b) { import("file-saver").then((fs) => fs.saveAs(b, "diagram.png")); } });
    };
    img.src = url;
  }, []);

  const exportPdf = useCallback(async () => {
    const svg = apiRef.current?.svg;
    if (!svg) return;
    const { jsPDF } = await import("jspdf");
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [img.width || 1600, img.height || 900] });
      const canvas = document.createElement("canvas");
      canvas.width = img.width || 1600; canvas.height = img.height || 900;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0b1228"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save("diagram.pdf");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(xml)));
  }, []);

  const exportMermaid = useCallback(async () => {
    const fs = await import("file-saver");
    fs.saveAs(new Blob([mermaid], { type: "text/plain" }), "diagram.mmd");
  }, [mermaid]);

  const exportDrawio = useCallback(async () => {
    const xml = `<?xml version="1.0"?>\n<mxfile><diagram name="ArchAI"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="2" value="${escapeXml(mermaid).slice(0, 200)}…" style="text;html=1;" vertex="1" parent="1"><mxGeometry x="40" y="40" width="600" height="40" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>`;
    const fs = await import("file-saver");
    fs.saveAs(new Blob([xml], { type: "application/xml" }), "diagram.drawio");
    toast.message("Exported (Draw.io shell with embedded Mermaid source).");
  }, [mermaid]);

  const copyMermaid = useCallback(() => {
    navigator.clipboard.writeText(mermaid).then(() => toast.success("Copied Mermaid source"));
  }, [mermaid]);

  const shareLink = useCallback(() => {
    const encoded = btoa(unescape(encodeURIComponent(mermaid)));
    const url = `${location.origin}${location.pathname}#m=${encoded.slice(0, 4000)}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied"));
  }, [mermaid]);

  // Voice → prompt
  const toggleRecord = useCallback(() => {
    const w = window as unknown as { webkitSpeechRecognition?: new () => unknown; SpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) { toast.error("Voice input not supported in this browser"); return; }
    if (recording) {
      (recogRef.current as { stop?: () => void } | null)?.stop?.();
      setRecording(false);
      return;
    }
    const rec = new Ctor() as { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: (e: { results: { transcript: string }[][] }) => void; onend: () => void };
    rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e) => { const text = Array.from(e.results).map((r) => r[0].transcript).join(" "); setPrompt((p) => (p ? p + " " : "") + text); };
    rec.onend = () => setRecording(false);
    rec.start();
    recogRef.current = rec;
    setRecording(true);
  }, [recording]);

  // Load from hash share link
  useEffect(() => {
    if (typeof window === "undefined") return;
    const h = window.location.hash;
    if (h.startsWith("#m=")) {
      try { setMermaid(decodeURIComponent(escape(atob(h.slice(3))))); } catch { /* noop */ }
    }
  }, []);

  const stats = useMemo(() => {
    const nodes = (mermaid.match(/^\s*[A-Za-z0-9_]+(\[|\(|\{)/gm) ?? []).length;
    const edges = (mermaid.match(/-->|---|==>|-\.->/g) ?? []).length;
    return { nodes, edges };
  }, [mermaid]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.08),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(167,139,250,0.10),transparent_55%)]">
      {/* LEFT PANEL */}
      <aside className="hidden h-full w-[360px] shrink-0 flex-col border-r border-border/60 bg-background/60 backdrop-blur-xl md:flex">
        <div className="border-b border-border/60 p-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-violet-500 text-background">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight">AI Diagram Studio</div>
              <div className="text-[11px] text-muted-foreground">Prompt → professional diagram</div>
            </div>
          </div>
        </div>

        <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="mx-3 mt-3 grid grid-cols-4">
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="insights">AI</TabsTrigger>
          </TabsList>

          <ScrollArea className="min-h-0 flex-1">
            <TabsContent value="prompt" className="m-0 space-y-4 p-4">
              <div>
                <div className="mb-2 text-xs font-medium text-muted-foreground">Diagram type</div>
                <div className="grid grid-cols-2 gap-2">
                  {TYPES.map((t) => {
                    const Active = type === t.id;
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setType(t.id)}
                        className={`group rounded-xl border p-2.5 text-left transition ${Active ? "border-cyan-400/60 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.3)]" : "border-border/60 bg-card/40 hover:border-cyan-400/40"}`}
                      >
                        <Icon className={`mb-1.5 h-4 w-4 ${Active ? "text-cyan-300" : "text-muted-foreground"}`} />
                        <div className="text-xs font-medium leading-tight">{t.label}</div>
                        <div className="text-[10px] text-muted-foreground">{t.hint}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground">Describe your diagram</div>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={toggleRecord}>
                    {recording ? <><MicOff className="mr-1 h-3 w-3 text-red-400" /> Stop</> : <><Mic className="mr-1 h-3 w-3" /> Voice</>}
                  </Button>
                </div>
                <Textarea rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="e.g. A multi-tenant SaaS with Next.js, Postgres, Redis, Stripe and S3…" className="resize-none bg-background/50" />
              </div>
              <Button onClick={handleGenerate} disabled={loading === "generate"} className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 text-background hover:opacity-90">
                {loading === "generate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Generate diagram
              </Button>
            </TabsContent>

            <TabsContent value="library" className="m-0 space-y-2 p-4">
              <div className="text-xs text-muted-foreground">Pre-built professional templates</div>
              {TEMPLATES.map((t) => (
                <button
                  key={t.name}
                  onClick={() => { setPrompt(t.prompt); setType(t.type); setTab("prompt"); }}
                  className="w-full rounded-lg border border-border/60 bg-card/40 p-3 text-left transition hover:border-cyan-400/50 hover:bg-cyan-400/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{t.name}</div>
                    <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{t.prompt}</div>
                </button>
              ))}
            </TabsContent>

            <TabsContent value="import" className="m-0 space-y-4 p-4">
              <ImportSection
                title="Code → Diagram"
                icon={Code2}
                placeholder="Paste source code (any language)…"
                buttonLabel="Diagram this code"
                loading={loading === "code"}
                onSubmit={handleCode}
              />
              <ImportSection
                title="Git Repo → Architecture"
                icon={Github}
                placeholder="https://github.com/user/repo"
                buttonLabel="Infer architecture"
                singleLine
                loading={loading === "repo"}
                onSubmit={handleRepo}
              />
            </TabsContent>

            <TabsContent value="insights" className="m-0 space-y-4 p-4">
              {explanation && (
                <Section title="AI Explanation" icon={Brain}>
                  <Markdownish text={explanation} />
                </Section>
              )}
              {suggestions.length > 0 && (
                <Section title="Shape Suggestions" icon={Lightbulb}>
                  <div className="space-y-2">
                    {suggestions.map((s) => (
                      <div key={s.id} className="rounded-md border border-border/50 bg-card/40 p-2 text-xs">
                        <div className="font-medium text-cyan-300">{s.label}</div>
                        <div className="text-muted-foreground">{s.why}</div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
              {docs && (
                <Section title="Auto Documentation" icon={FileText}>
                  <Markdownish text={docs} />
                </Section>
              )}
              {!explanation && !docs && suggestions.length === 0 && (
                <div className="rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground">
                  Run an AI action from the canvas toolbar to see insights here.
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </aside>

      {/* CANVAS */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 bg-background/40 px-4 py-2 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border/60 bg-background/40 px-2 py-1 text-[11px] text-muted-foreground">
              <Layers className="mr-1 inline h-3 w-3" /> {stats.nodes} nodes · {stats.edges} edges
            </div>
          </div>
          <div className="mx-2 h-5 w-px bg-border/60" />
          <ToolBtn icon={Wand2} label="Beautify" loading={loading === "optimize"} onClick={handleOptimize} />
          <ToolBtn icon={Brain} label="Explain" loading={loading === "explain"} onClick={handleExplain} />
          <ToolBtn icon={Lightbulb} label="Suggest" loading={loading === "suggest"} onClick={handleSuggest} />
          <ToolBtn icon={FileText} label="Docs" loading={loading === "docs"} onClick={handleDocs} />
          <div className="mx-2 h-5 w-px bg-border/60" />
          <ToolBtn icon={ZoomIn} label="Zoom in" onClick={() => apiRef.current?.zoomIn()} />
          <ToolBtn icon={ZoomOut} label="Zoom out" onClick={() => apiRef.current?.zoomOut()} />
          <ToolBtn icon={Maximize2} label="Fit" onClick={() => apiRef.current?.fit()} />
          <div className="ml-auto flex items-center gap-1.5">
            <ToolBtn icon={Copy} label="Copy" onClick={copyMermaid} />
            <ToolBtn icon={Share2} label="Share" onClick={shareLink} />
            <ExportMenu onSvg={exportSvg} onPng={exportPng} onPdf={exportPdf} onMermaid={exportMermaid} onDrawio={exportDrawio} />
          </div>
        </div>

        {/* Canvas */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)] [background-size:24px_24px] opacity-40" />
          <AnimatePresence mode="wait">
            <motion.div
              key={mermaid.slice(0, 64)}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="relative h-full w-full"
            >
              <Mermaid chart={mermaid} id="studio" onReady={(api) => (apiRef.current = api)} />
            </motion.div>
          </AnimatePresence>

          {/* Floating history */}
          <HistoryDock history={history} onPick={(s) => { setMermaid(s.mermaid); setType(s.type); setPrompt(s.prompt); }} onClear={() => { setHistory([]); try { localStorage.removeItem("studio.history"); } catch { /* noop */ } }} onSave={() => saveSnapshot(mermaid, type, prompt || "Snapshot")} />
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, onClick, loading }: { icon: typeof Sparkles; label: string; onClick: () => void; loading?: boolean }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={loading} className="h-8 gap-1.5 px-2 text-xs">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}

function ExportMenu({ onSvg, onPng, onPdf, onMermaid, onDrawio }: { onSvg: () => void; onPng: () => void; onPdf: () => void; onMermaid: () => void; onDrawio: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button size="sm" onClick={() => setOpen((o) => !o)} className="h-8 gap-1.5 bg-gradient-to-r from-cyan-500 to-violet-500 px-3 text-xs text-background hover:opacity-90">
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
      {open && (
        <div className="absolute right-0 top-10 z-30 w-44 overflow-hidden rounded-lg border border-border/60 bg-popover/95 shadow-2xl backdrop-blur-xl">
          {[
            { l: "PNG", icon: ImageDown, fn: onPng },
            { l: "SVG", icon: ImageDown, fn: onSvg },
            { l: "PDF", icon: FileText, fn: onPdf },
            { l: "Mermaid (.mmd)", icon: FileCode2, fn: onMermaid },
            { l: "Draw.io / Visio", icon: FileCode2, fn: onDrawio },
          ].map((i) => (
            <button key={i.l} onClick={() => { i.fn(); setOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-accent">
              <i.icon className="h-3.5 w-3.5" /> {i.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryDock({ history, onPick, onClear, onSave }: { history: Snapshot[]; onPick: (s: Snapshot) => void; onClear: () => void; onSave: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="absolute bottom-4 left-4 z-20">
      <div className="flex items-center gap-1.5 rounded-full border border-border/60 bg-background/70 p-1 shadow-2xl backdrop-blur-xl">
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs" onClick={() => setOpen((o) => !o)}>
          <History className="h-3.5 w-3.5" /> Versions · {history.length}
        </Button>
        <Button size="sm" variant="ghost" className="h-8 gap-1.5 rounded-full px-3 text-xs" onClick={onSave}>
          <Save className="h-3.5 w-3.5" /> Snapshot
        </Button>
      </div>
      {open && (
        <div className="absolute bottom-12 left-0 max-h-80 w-80 overflow-auto rounded-xl border border-border/60 bg-popover/95 p-2 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between px-1 pb-2">
            <div className="text-xs font-medium">Version history</div>
            <button onClick={onClear} className="rounded p-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
          {history.length === 0 && <div className="px-2 py-6 text-center text-xs text-muted-foreground">No snapshots yet</div>}
          {history.map((s) => (
            <button key={s.id} onClick={() => onPick(s)} className="block w-full rounded-md p-2 text-left text-xs hover:bg-accent">
              <div className="font-medium">{s.prompt || "Untitled"}</div>
              <div className="text-[10px] text-muted-foreground">{new Date(s.ts).toLocaleString()} · {s.type}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ImportSection({ title, icon: Icon, placeholder, buttonLabel, onSubmit, loading, singleLine }: { title: string; icon: typeof Sparkles; placeholder: string; buttonLabel: string; onSubmit: (val: string) => void; loading?: boolean; singleLine?: boolean }) {
  const [val, setVal] = useState("");
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Icon className="h-3.5 w-3.5 text-cyan-300" /> {title}</div>
      {singleLine
        ? <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} className="bg-background/50 text-xs" />
        : <Textarea value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder} rows={5} className="resize-none bg-background/50 font-mono text-[11px]" />}
      <Button size="sm" disabled={loading} onClick={() => onSubmit(val)} className="mt-2 h-8 w-full text-xs">
        {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
        {buttonLabel}
      </Button>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: typeof Sparkles; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card/40 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold"><Icon className="h-3.5 w-3.5 text-cyan-300" /> {title}</div>
      <div className="text-xs leading-relaxed text-foreground/85">{children}</div>
    </div>
  );
}

function Markdownish({ text }: { text: string }) {
  return (
    <div className="space-y-1">
      {text.split("\n").filter(Boolean).map((line, i) => {
        if (/^##\s+/.test(line)) return <div key={i} className="mt-2 text-xs font-semibold text-foreground">{line.replace(/^##\s+/, "")}</div>;
        if (/^[-*]\s+/.test(line)) return <div key={i} className="pl-2">• {line.replace(/^[-*]\s+/, "")}</div>;
        return <div key={i}>{line}</div>;
      })}
    </div>
  );
}

function escapeXml(s: string) {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c] as string));
}

const WELCOME_MERMAID = `flowchart LR
  classDef hero fill:#0b1228,stroke:#22d3ee,color:#e6ecff,stroke-width:2px;
  classDef accent fill:#3b1d6b,stroke:#a78bfa,color:#e6ecff;
  subgraph S[" "]
    A[Describe in plain English]:::hero --> B[AI Diagram Studio]:::accent
    B --> C[Architecture]:::hero
    B --> D[Flowchart]:::hero
    B --> E[ER / DB]:::hero
    B --> F[Sequence]:::hero
    B --> G[Cloud]:::hero
  end
`;