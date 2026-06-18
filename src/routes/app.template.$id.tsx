import { createFileRoute, Link, useNavigate, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Wand2, Heart, FolderPlus, Sparkles, Crown, Star, Flame, BadgeCheck,
  Tag, Copy, Loader2, Eye, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Mermaid } from "@/components/mermaid";
import {
  CATEGORIES, getTemplateById, PENDING_TEMPLATE_KEY,
  type PendingTemplatePayload,
} from "@/lib/templates/marketplace";
import {
  toggleFavorite, isFavorite, trackEvent, getCollections, addToCollection,
  createCollection,
} from "@/lib/templates/marketplace-store";
import { generateDiagram } from "@/lib/api/diagram-ai.functions";

export const Route = createFileRoute("/app/template/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Template - ArchAI` },
      { name: "description", content: `Template details for ${params.id}` },
    ],
  }),
  component: TemplateDetail,
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">
      Template not found. <Link to="/app/marketplace" className="underline">Back to marketplace</Link>
    </div>
  ),
});

function TemplateDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const t = getTemplateById(id);
  if (!t) throw notFound();
  const cat = CATEGORIES.find((c) => c.id === t.category);

  const [fav, setFav] = useState(false);
  const [collections, setCollections] = useState(getCollections());
  const [newName, setNewName] = useState("");
  const [preview, setPreview] = useState<string>(WELCOME_PREVIEW(t.name, t.type));
  const [generating, setGenerating] = useState(false);
  const tracked = useRef(false);
  const genFn = useServerFn(generateDiagram);

  useEffect(() => {
    setFav(isFavorite(t.id));
    if (!tracked.current) {
      tracked.current = true;
      trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "detail" });
      trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "view" });
    }
    const refresh = () => setCollections(getCollections());
    window.addEventListener("marketplace:collections", refresh);
    return () => window.removeEventListener("marketplace:collections", refresh);
  }, [t.id, t.name, t.category, t.type]);

  const handleLaunch = (autorun: boolean) => {
    const payload: PendingTemplatePayload = { prompt: t.prompt, type: t.type, name: t.name, autorun };
    try { sessionStorage.setItem(PENDING_TEMPLATE_KEY, JSON.stringify(payload)); } catch { /* noop */ }
    trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "launch" });
    toast.success(autorun ? "Auto-generating in Studio..." : "Loaded in Studio");
    navigate({ to: "/app/studio" });
  };

  const handleGeneratePreview = async () => {
    setGenerating(true);
    try {
      const res = await genFn({ data: { prompt: t.prompt, type: t.type } });
      setPreview(res.mermaid);
      trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "generate" });
      toast.success("Preview generated");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="ghost">
            <Link to="/app/marketplace"><ArrowLeft className="mr-2 h-4 w-4" /> Marketplace</Link>
          </Button>
          <Badge variant="secondary" className={cat?.accent}>{cat?.label}</Badge>
          <Badge variant="outline">{t.type}</Badge>
          {t.isPro && <Badge className="bg-amber-500/20 text-amber-300"><Crown className="mr-1 h-3 w-3" />Pro</Badge>}
          {t.isNew && <Badge className="bg-emerald-500/20 text-emerald-300"><Sparkles className="mr-1 h-3 w-3" />New</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant={fav ? "default" : "outline"} onClick={() => { setFav(toggleFavorite(t.id)); }}>
            <Heart className={`mr-2 h-4 w-4 ${fav ? "fill-current" : ""}`} /> {fav ? "Saved" : "Save"}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline"><FolderPlus className="mr-2 h-4 w-4" /> Add to collection</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Your collections</DropdownMenuLabel>
              {collections.length === 0 && (
                <div className="px-2 py-1 text-xs text-muted-foreground">No collections yet.</div>
              )}
              {collections.map((c) => (
                <DropdownMenuItem key={c.id} onClick={() => { addToCollection(c.id, t.id); toast.success(`Added to "${c.name}"`); }}>
                  {c.name} <span className="ml-auto text-xs text-muted-foreground">{c.templateIds.length}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <div className="flex items-center gap-2 p-2">
                <Input placeholder="New collection name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-8 text-xs" />
                <Button size="sm" onClick={() => {
                  if (!newName.trim()) return;
                  const c = createCollection(newName.trim());
                  addToCollection(c.id, t.id);
                  setNewName("");
                  toast.success(`Created "${c.name}"`);
                }}>Add</Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => handleLaunch(true)} className="bg-gradient-to-r from-cyan-500 to-violet-500 text-background">
            <Wand2 className="mr-2 h-4 w-4" /> Auto-generate in Studio
          </Button>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-4 overflow-auto py-4 lg:grid-cols-3">
        {/* Preview */}
        <div className={`flex min-h-0 flex-col rounded-2xl border bg-gradient-to-br ${cat?.gradient ?? ""} p-3 lg:col-span-2`}>
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3.5 w-3.5" /> Live preview
            </div>
            <Button size="sm" variant="outline" disabled={generating} onClick={handleGeneratePreview}>
              {generating ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
              {generating ? "Generating..." : "Generate example"}
            </Button>
          </div>
          <div className="min-h-[400px] flex-1 overflow-hidden rounded-xl border bg-background/40">
            <Mermaid chart={preview} id={`tpl-${t.id}`} />
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{t.name}</h1>
            <div className="mt-1 text-xs text-muted-foreground">{t.subcategory} - by {t.author}</div>
            <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-lg border bg-background/50 p-3 text-center text-[11px]">
            <Stat icon={Star} label="Rating" value={t.rating.toFixed(1)} accent="text-amber-300" />
            <Stat icon={Flame} label="Uses" value={formatUses(t.uses)} accent="text-rose-300" />
            <Stat icon={BadgeCheck} label="Level" value={t.difficulty} accent="text-sky-300" />
          </div>

          <div className="rounded-lg border bg-background/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium"><Layers className="h-3.5 w-3.5" /> Generation settings</div>
            <Row k="Diagram type" v={t.type} />
            <Row k="Category" v={cat?.label ?? t.category} />
            <Row k="Difficulty" v={t.difficulty} />
            <Row k="Style preset" v="Modern dark, semantic classDef, subgraph grouping" />
            <Row k="Model" v="google/gemini-3-flash-preview" />
          </div>

          <div className="rounded-lg border bg-background/50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium">
              <span>Exact prompt</span>
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => { navigator.clipboard.writeText(t.prompt); toast.success("Prompt copied"); }}>
                <Copy className="mr-1 h-3 w-3" /> Copy
              </Button>
            </div>
            <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded bg-muted/40 p-2 text-[11px] leading-relaxed">{t.prompt}</pre>
          </div>

          <div className="rounded-lg border bg-background/50 p-3">
            <div className="mb-2 text-xs font-medium">Tags</div>
            <div className="flex flex-wrap gap-1">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded-full border bg-background/40 px-2 py-0.5 text-[10px] text-muted-foreground">
                  <Tag className="mr-1 inline h-2.5 w-2.5" />{tag}
                </span>
              ))}
            </div>
          </div>

          <Button onClick={() => handleLaunch(false)} variant="outline" size="sm">Open in Studio without generating</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: typeof Star; label: string; value: string; accent: string }) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1 text-muted-foreground"><Icon className={`h-3 w-3 ${accent}`} /> {label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/40 py-1.5 text-[11px] last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  );
}

function formatUses(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

function WELCOME_PREVIEW(name: string, type: string): string {
  if (type === "mindmap") return `mindmap\n  root((${name}))\n    Concept A\n    Concept B\n    Concept C`;
  if (type === "sequence") return `sequenceDiagram\n  participant U as User\n  participant S as Service\n  U->>S: Request\n  S-->>U: Response`;
  if (type === "er" || type === "database") return `erDiagram\n  USER ||--o{ ITEM : owns\n  USER { string id }\n  ITEM { string id }`;
  if (type === "user-journey") return `journey\n  title ${name}\n  section Discover\n    Browse: 4: User\n  section Use\n    Engage: 5: User`;
  return `flowchart LR\n  A[${name}] --> B[Click Generate example]\n  B --> C[See the real diagram]\n  classDef hl fill:#1e293b,stroke:#22d3ee,color:#e6ecff\n  class A,B,C hl`;
}
