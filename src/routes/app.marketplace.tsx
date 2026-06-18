import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search, Sparkles, Wand2, Star, Crown, Flame, Filter, TrendingUp,
  Boxes, Workflow, ListTree, Brain, Database, GitBranch, Network,
  Users, Map, Cloud, MonitorSmartphone, ArrowRight, Tag, BadgeCheck,
  Layers, Zap, Bot, Eye, Share2, BookOpen, Shuffle, GitMerge,
  MessageSquareText, ShieldCheck, Activity, Heart, FolderPlus, BarChart3,
  Trash2, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  CATEGORIES, getMarketplaceTemplates, getCategoryCounts, getTemplateById,
  PENDING_TEMPLATE_KEY,
  type MarketplaceTemplate, type TemplateCategoryId, type TemplateType,
  type PendingTemplatePayload,
} from "@/lib/templates/marketplace";
import {
  getFavorites, toggleFavorite, getCollections, createCollection,
  addToCollection, deleteCollection, removeFromCollection, trackEvent,
  type Collection,
} from "@/lib/templates/marketplace-store";

export const Route = createFileRoute("/app/marketplace")({
  head: () => ({
    meta: [
      { title: "AI Template Marketplace - ArchAI" },
      { name: "description", content: "Browse 1000+ AI-generated diagram templates for software architecture, system design, cloud, devops, AI/ML, business and more." },
    ],
  }),
  component: MarketplacePage,
});

const TYPE_ICONS: Record<TemplateType, typeof Sparkles> = {
  architecture: Boxes,
  flowchart: Workflow,
  "ui-tree": ListTree,
  mindmap: Brain,
  er: Database,
  sequence: GitBranch,
  network: Network,
  process: Workflow,
  "org-chart": Users,
  "user-journey": Map,
  database: Database,
  cloud: Cloud,
  wireframe: MonitorSmartphone,
};

type SortKey = "popular" | "new" | "rating" | "alpha";
type DifficultyFilter = "all" | "Starter" | "Intermediate" | "Advanced" | "Enterprise";

function MarketplacePage() {
  const navigate = useNavigate();
  const all = useMemo(() => getMarketplaceTemplates(), []);
  const counts = useMemo(() => getCategoryCounts(), []);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<TemplateCategoryId | "all">("all");
  const [activeType, setActiveType] = useState<TemplateType | "all">("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [sort, setSort] = useState<SortKey>("popular");
  const [proOnly, setProOnly] = useState(false);
  const [newOnly, setNewOnly] = useState(false);
  const [favOnly, setFavOnly] = useState(false);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState("");
  const viewLogged = useRef<Set<string>>(new Set());

  useEffect(() => {
    const refreshFavs = () => setFavorites(getFavorites());
    const refreshCols = () => setCollections(getCollections());
    refreshFavs(); refreshCols();
    window.addEventListener("marketplace:favs", refreshFavs);
    window.addEventListener("marketplace:collections", refreshCols);
    return () => {
      window.removeEventListener("marketplace:favs", refreshFavs);
      window.removeEventListener("marketplace:collections", refreshCols);
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (activeType !== "all" && t.type !== activeType) return false;
      if (difficulty !== "all" && t.difficulty !== difficulty) return false;
      if (proOnly && !t.isPro) return false;
      if (newOnly && !t.isNew) return false;
      if (favOnly && !favorites.includes(t.id)) return false;
      if (activeCollection) {
        const c = collections.find((x) => x.id === activeCollection);
        if (!c || !c.templateIds.includes(t.id)) return false;
      }
      if (!q) return true;
      const hay = `${t.name} ${t.description} ${t.subcategory} ${t.tags.join(" ")}`.toLowerCase();
      return hay.includes(q);
    });
    list = [...list].sort((a, b) => {
      if (sort === "popular") return b.popularity - a.popularity || b.uses - a.uses;
      if (sort === "new") return Number(b.isNew) - Number(a.isNew) || b.popularity - a.popularity;
      if (sort === "rating") return b.rating - a.rating || b.uses - a.uses;
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [all, query, activeCategory, activeType, difficulty, sort, proOnly, newOnly, favOnly, favorites, activeCollection, collections]);

  const visible = filtered.slice(0, 120);

  // Log a single view event per template per session as it appears in the list.
  useEffect(() => {
    for (const t of visible) {
      if (!viewLogged.current.has(t.id)) {
        viewLogged.current.add(t.id);
        trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "view" });
      }
    }
  }, [visible]);

  const launch = (t: MarketplaceTemplate, autorun: boolean) => {
    const payload: PendingTemplatePayload = { prompt: t.prompt, type: t.type, name: t.name, autorun, id: t.id, category: t.category };
    try { sessionStorage.setItem(PENDING_TEMPLATE_KEY, JSON.stringify(payload)); } catch { /* noop */ }
    trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "launch" });
    toast.success(`Loaded "${t.name}" into Studio`);
    navigate({ to: "/app/studio" });
  };

  const openDetail = (t: MarketplaceTemplate) => {
    trackEvent({ templateId: t.id, name: t.name, category: t.category, type: t.type, kind: "detail" });
    navigate({ to: "/app/template/$id", params: { id: t.id } });
  };

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-violet-500/10 via-background to-cyan-500/5 px-6 py-6">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-48 w-48 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              AI Template Marketplace
              <Badge variant="secondary" className="ml-1">{all.length.toLocaleString()}+ templates</Badge>
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
              Ship diagrams in seconds, not days
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Professionally designed, AI-augmented templates across architecture, cloud, product, data, AI/ML and ops. Remix, generate or extend with one click.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/app/studio" })}>
              <Wand2 className="mr-2 h-4 w-4" /> Open Studio
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/marketplace-analytics"><BarChart3 className="mr-2 h-4 w-4" /> Analytics</Link>
            </Button>
            <Button size="sm" onClick={() => { setSort("new"); setNewOnly(true); }}>
              <Flame className="mr-2 h-4 w-4" /> What's new
            </Button>
          </div>
        </div>

        {/* Differentiator AI features */}
        <div className="relative mt-5 grid grid-cols-2 gap-2 md:grid-cols-5">
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

      {/* Controls */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[260px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 1000+ templates by name, tag, industry, or stack..."
            className="pl-9"
          />
        </div>
        <Select value={activeType} onValueChange={(v) => setActiveType(v as TemplateType | "all")}>
          <SelectTrigger className="w-[160px]"><Filter className="mr-2 h-4 w-4" /><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {Object.keys(TYPE_ICONS).map((t) => (
              <SelectItem key={t} value={t}>{labelForType(t as TemplateType)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={difficulty} onValueChange={(v) => setDifficulty(v as DifficultyFilter)}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Difficulty" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any difficulty</SelectItem>
            <SelectItem value="Starter">Starter</SelectItem>
            <SelectItem value="Intermediate">Intermediate</SelectItem>
            <SelectItem value="Advanced">Advanced</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[150px]"><TrendingUp className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Most popular</SelectItem>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="rating">Top rated</SelectItem>
            <SelectItem value="alpha">A-Z</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={proOnly ? "default" : "outline"} size="sm" onClick={() => setProOnly((v) => !v)}>
          <Crown className="mr-2 h-3.5 w-3.5" /> Pro
        </Button>
        <Button variant={newOnly ? "default" : "outline"} size="sm" onClick={() => setNewOnly((v) => !v)}>
          <Sparkles className="mr-2 h-3.5 w-3.5" /> New
        </Button>
        <Button variant={favOnly ? "default" : "outline"} size="sm" onClick={() => setFavOnly((v) => !v)}>
          <Heart className={`mr-2 h-3.5 w-3.5 ${favOnly ? "fill-current" : ""}`} /> Favorites
          {favorites.length > 0 && <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">{favorites.length}</Badge>}
        </Button>
      </div>

      {/* Category tabs */}
      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as TemplateCategoryId | "all")} className="mt-3">
        <ScrollArea className="w-full whitespace-nowrap">
          <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
            <TabsTrigger value="all" className="data-[state=active]:bg-accent">
              All <Badge variant="secondary" className="ml-2">{all.length}</Badge>
            </TabsTrigger>
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.id} value={c.id} className="data-[state=active]:bg-accent">
                {c.label} <Badge variant="secondary" className="ml-2">{counts[c.id]}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>
      </Tabs>

      {/* Collections bar */}
      <CollectionsBar
        collections={collections}
        active={activeCollection}
        onSelect={setActiveCollection}
        onCreate={() => {
          if (!newCollectionName.trim()) { toast.error("Name your collection first"); return; }
          createCollection(newCollectionName.trim());
          setNewCollectionName("");
          toast.success("Collection created");
        }}
        onDelete={(id) => { deleteCollection(id); if (activeCollection === id) setActiveCollection(null); }}
        name={newCollectionName}
        onName={setNewCollectionName}
      />

      {/* Category strip when "all" */}
      {activeCategory === "all" && (
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`group relative overflow-hidden rounded-xl border bg-gradient-to-br ${c.gradient} p-4 text-left transition hover:border-foreground/20`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-xs font-medium ${c.accent}`}>{c.label}</div>
                <ArrowRight className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-100" />
              </div>
              <div className="mt-2 text-sm text-foreground/80">{c.description}</div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Layers className="h-3 w-3" /> {counts[c.id]} templates
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing <span className="font-medium text-foreground">{visible.length}</span> of {filtered.length} matches
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Shuffle className="h-3.5 w-3.5" />
          <button className="underline-offset-2 hover:underline" onClick={() => {
            const t = filtered[Math.floor(Math.random() * Math.max(1, filtered.length))];
            if (t) launch(t, true);
          }}>Surprise me</button>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 overflow-auto pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((t) => (
          <TemplateCard
            key={t.id}
            t={t}
            fav={favorites.includes(t.id)}
            collections={collections}
            activeCollection={activeCollection}
            onToggleFav={() => { setFavorites((cur) => toggleFavorite(t.id) ? [t.id, ...cur.filter((x) => x !== t.id)] : cur.filter((x) => x !== t.id)); }}
            onAddToCollection={(cid) => { addToCollection(cid, t.id); toast.success("Added to collection"); }}
            onRemoveFromCollection={(cid) => { removeFromCollection(cid, t.id); toast.success("Removed"); }}
            onUse={() => launch(t, true)}
            onOpen={() => openDetail(t)}
          />
        ))}
        {visible.length === 0 && (
          <div className="col-span-full rounded-xl border bg-muted/20 p-10 text-center text-sm text-muted-foreground">
            No templates match. Try clearing filters or a different search term.
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({
  t, fav, collections, activeCollection, onToggleFav, onAddToCollection,
  onRemoveFromCollection, onUse, onOpen,
}: {
  t: MarketplaceTemplate; fav: boolean; collections: Collection[];
  activeCollection: string | null;
  onToggleFav: () => void; onAddToCollection: (cid: string) => void;
  onRemoveFromCollection: (cid: string) => void;
  onUse: () => void; onOpen: () => void;
}) {
  const Icon = TYPE_ICONS[t.type];
  const cat = CATEGORIES.find((c) => c.id === t.category);
  return (
    <div className={`group relative flex flex-col overflow-hidden rounded-xl border bg-gradient-to-br ${cat?.gradient ?? ""} transition hover:border-foreground/30`}>
      <div className="flex items-start justify-between gap-2 border-b bg-background/40 p-3 backdrop-blur">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-background/60 p-1.5">
            <Icon className={`h-4 w-4 ${cat?.accent ?? ""}`} />
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{t.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{t.subcategory} - {labelForType(t.type)}</div>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {t.isPro && <Badge className="bg-amber-500/20 text-amber-300 hover:bg-amber-500/20"><Crown className="mr-1 h-3 w-3" />Pro</Badge>}
          {t.isNew && !t.isPro && <Badge className="bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20"><Sparkles className="mr-1 h-3 w-3" />New</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {t.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border bg-background/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
              <Tag className="mr-1 inline h-2.5 w-2.5" />{tag}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center"><Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />{t.rating.toFixed(1)}</span>
            <span className="inline-flex items-center"><Flame className="mr-1 h-3 w-3 text-rose-400" />{formatUses(t.uses)}</span>
            <span className="inline-flex items-center"><BadgeCheck className="mr-1 h-3 w-3 text-sky-400" />{t.difficulty}</span>
          </div>
          <div className="hidden md:block">by {t.author}</div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" className="flex-1" onClick={onUse}>
            <Wand2 className="mr-2 h-3.5 w-3.5" /> Auto-generate
          </Button>
          <Button size="sm" variant="outline" onClick={onOpen} title="View details">
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant={fav ? "default" : "outline"} onClick={onToggleFav} title={fav ? "Unfavorite" : "Favorite"}>
            <Heart className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" title="Add to collection"><FolderPlus className="h-3.5 w-3.5" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel>Collections</DropdownMenuLabel>
              {collections.length === 0 && <div className="px-2 py-1 text-xs text-muted-foreground">No collections yet.</div>}
              {collections.map((c) => {
                const isIn = c.templateIds.includes(t.id);
                return (
                  <DropdownMenuItem key={c.id} onClick={() => isIn ? onRemoveFromCollection(c.id) : onAddToCollection(c.id)}>
                    {isIn ? "Remove from" : "Add to"} {c.name}
                  </DropdownMenuItem>
                );
              })}
              {activeCollection && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onRemoveFromCollection(activeCollection)}>
                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Remove from current
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function CollectionsBar({
  collections, active, onSelect, onCreate, onDelete, name, onName,
}: {
  collections: Collection[]; active: string | null;
  onSelect: (id: string | null) => void; onCreate: () => void;
  onDelete: (id: string) => void; name: string; onName: (v: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border bg-background/40 p-2">
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <FolderPlus className="h-3.5 w-3.5" /> Collections
      </div>
      <Button size="sm" variant={active === null ? "default" : "outline"} className="h-7 px-2 text-[11px]" onClick={() => onSelect(null)}>All</Button>
      {collections.map((c) => (
        <div key={c.id} className="flex items-center gap-1">
          <Button size="sm" variant={active === c.id ? "default" : "outline"} className="h-7 px-2 text-[11px]" onClick={() => onSelect(c.id)}>
            {c.name} <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{c.templateIds.length}</Badge>
          </Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => onDelete(c.id)} title="Delete collection">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="ml-auto flex items-center gap-1">
        <Input value={name} onChange={(e) => onName(e.target.value)} placeholder="New collection" className="h-7 w-44 text-[11px]" />
        <Button size="sm" className="h-7 px-2 text-[11px]" onClick={onCreate}><Plus className="mr-1 h-3 w-3" /> Add</Button>
      </div>
    </div>
  );
}

const AI_FEATURES: { label: string; hint: string; icon: typeof Sparkles }[] = [
  { label: "Prompt-to-Diagram", hint: "Natural language to visuals", icon: Wand2 },
  { label: "Smart Remix", hint: "Mutate any template instantly", icon: Shuffle },
  { label: "Auto-Layout AI", hint: "Beautify and optimize", icon: Layers },
  { label: "Explain-It Mode", hint: "Narrate any diagram", icon: MessageSquareText },
  { label: "Code -> Diagram", hint: "Repo or file to architecture", icon: GitMerge },
  { label: "AI Critique", hint: "Risks, gaps, anti-patterns", icon: ShieldCheck },
  { label: "Realtime Co-edit", hint: "Multiplayer with cursors", icon: Users },
  { label: "Smart Shapes", hint: "Suggest next components", icon: Zap },
  { label: "Docs Generator", hint: "Diagrams to spec / ADR", icon: BookOpen },
  { label: "Drift Detector", hint: "Compare diagram vs code", icon: Activity },
];

function labelForType(t: TemplateType): string {
  const map: Record<TemplateType, string> = {
    architecture: "Architecture", flowchart: "Flowchart", "ui-tree": "UI Tree",
    mindmap: "Mind Map", er: "ER Diagram", sequence: "Sequence", network: "Network",
    process: "Process", "org-chart": "Org Chart", "user-journey": "User Journey",
    database: "Database", cloud: "Cloud", wireframe: "Wireframe",
  };
  return map[t];
}
function formatUses(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}
