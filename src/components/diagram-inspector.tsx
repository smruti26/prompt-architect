import { useMemo } from "react";
import { ArrowDownRight, ArrowUpLeft, Boxes, Hash, Layers, Link as LinkIcon, MousePointer2, Tag } from "lucide-react";
import type { ParsedDiagram, ParsedNode } from "@/lib/diagram-parse";

const CLASS_META: Record<string, { label: string; color: string; dot: string }> = {
  user:   { label: "User",         color: "border-amber-500/40 bg-amber-500/10 text-amber-300",     dot: "#fde68a" },
  edge:   { label: "Edge",         color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", dot: "#a7f3d0" },
  web:    { label: "Web",          color: "border-sky-500/40 bg-sky-500/10 text-sky-300",          dot: "#bae6fd" },
  svc:    { label: "Service",      color: "border-indigo-500/40 bg-indigo-500/10 text-indigo-300", dot: "#c7d2fe" },
  api:    { label: "API",          color: "border-violet-500/40 bg-violet-500/10 text-violet-300", dot: "#ddd6fe" },
  data:   { label: "Data Store",   color: "border-pink-500/40 bg-pink-500/10 text-pink-300",       dot: "#fbcfe8" },
  cache:  { label: "Cache",        color: "border-red-500/40 bg-red-500/10 text-red-300",          dot: "#fecaca" },
  queue:  { label: "Queue",        color: "border-orange-500/40 bg-orange-500/10 text-orange-300", dot: "#fed7aa" },
  infra:  { label: "Infra",        color: "border-slate-400/40 bg-slate-500/10 text-slate-300",    dot: "#e2e8f0" },
  accent: { label: "Gateway",      color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300",       dot: "#22d3ee" },
  pay:    { label: "Payments",     color: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300", dot: "#fef9c3" },
};

function statusFor(node: ParsedNode | undefined, inDeg: number, outDeg: number) {
  if (!node) return { label: "Unknown", tone: "border-slate-500/40 bg-slate-500/10 text-slate-300" };
  if (node.cls === "data" || node.cls === "cache") return { label: "Persistent", tone: "border-pink-500/40 bg-pink-500/10 text-pink-300" };
  if (node.cls === "accent" || node.cls === "edge") return { label: "Hot Path", tone: "border-cyan-500/40 bg-cyan-500/10 text-cyan-300" };
  if (inDeg + outDeg === 0) return { label: "Isolated", tone: "border-amber-500/40 bg-amber-500/10 text-amber-300" };
  return { label: "Healthy", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" };
}

export function DiagramInspector({
  parsed,
  selectedId,
  onSelect,
}: {
  parsed: ParsedDiagram;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const node = selectedId ? parsed.nodes.get(selectedId) : undefined;

  const { incoming, outgoing } = useMemo(() => {
    if (!selectedId) return { incoming: [], outgoing: [] };
    return {
      incoming: parsed.edges.filter((e) => e.to === selectedId),
      outgoing: parsed.edges.filter((e) => e.from === selectedId),
    };
  }, [parsed, selectedId]);

  const classMeta = node?.cls ? CLASS_META[node.cls] : undefined;
  const status = statusFor(node, incoming.length, outgoing.length);

  if (!selectedId || !node) {
    return (
      <div className="space-y-5 p-5 text-sm">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <MousePointer2 className="h-3 w-3" /> Inspector
        </div>
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-6 text-center">
          <Boxes className="mx-auto mb-3 h-6 w-6 text-muted-foreground" />
          <div className="text-sm font-medium">Nothing selected</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Click any node in the canvas to inspect metadata, status, and related connections.
          </p>
        </div>
        <div>
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            All nodes · {parsed.nodes.size}
          </div>
          <div className="max-h-[360px] space-y-1 overflow-auto pr-1">
            {Array.from(parsed.nodes.values()).map((n) => (
              <button
                key={n.id}
                onClick={() => onSelect(n.id)}
                className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left text-xs hover:border-border/60 hover:bg-card/40"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ background: n.cls && CLASS_META[n.cls] ? CLASS_META[n.cls].dot : "#94a3b8" }}
                />
                <span className="truncate font-medium">{n.label}</span>
                <span className="ml-auto truncate text-[10px] text-muted-foreground">{n.id}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-5 text-sm">
      <div className="flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        <span className="flex items-center gap-2"><MousePointer2 className="h-3 w-3" /> Inspector</span>
        <span className={`rounded-full border px-2 py-0.5 text-[9px] tracking-[0.16em] ${status.tone}`}>● {status.label}</span>
      </div>

      {/* Header */}
      <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-card/60 to-card/30 p-4">
        <div className="flex items-start gap-3">
          <div
            className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${classMeta?.dot ?? "#94a3b8"}, #6366f1)` }}
          >
            <Hash className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="truncate text-base font-semibold">{node.label}</div>
            <div className="truncate font-mono text-[11px] text-muted-foreground">id: {node.id}</div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {classMeta && (
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${classMeta.color}`}>
              <Tag className="h-3 w-3" /> {classMeta.label}
            </span>
          )}
          {node.shape && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground">
              <Layers className="h-3 w-3" /> {node.shape}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card/40 px-2 py-0.5 text-[10px] text-muted-foreground">
            <LinkIcon className="h-3 w-3" /> {incoming.length + outgoing.length} edges
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "In", value: incoming.length, tone: "text-sky-300" },
          { label: "Out", value: outgoing.length, tone: "text-violet-300" },
          { label: "Deg", value: incoming.length + outgoing.length, tone: "text-cyan-300" },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-border/60 bg-card/40 p-3 text-center">
            <div className={`text-lg font-semibold tabular-nums ${m.tone}`}>{m.value}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Connections */}
      <Section title="Incoming" icon={<ArrowDownRight className="h-3 w-3" />} empty="No upstream callers">
        {incoming.map((e, i) => (
          <ConnRow key={i} id={e.from} label={parsed.nodes.get(e.from)?.label ?? e.from} edgeLabel={e.label} dashed={e.dashed} onClick={onSelect} cls={parsed.nodes.get(e.from)?.cls} />
        ))}
      </Section>

      <Section title="Outgoing" icon={<ArrowUpLeft className="h-3 w-3 rotate-180" />} empty="No downstream targets">
        {outgoing.map((e, i) => (
          <ConnRow key={i} id={e.to} label={parsed.nodes.get(e.to)?.label ?? e.to} edgeLabel={e.label} dashed={e.dashed} onClick={onSelect} cls={parsed.nodes.get(e.to)?.cls} />
        ))}
      </Section>
    </div>
  );
}

function Section({ title, icon, children, empty }: { title: string; icon: React.ReactNode; children: React.ReactNode; empty: string }) {
  const arr = Array.isArray(children) ? children : [children];
  const hasItems = arr.filter(Boolean).length > 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon} {title}
      </div>
      {hasItems ? <div className="space-y-1">{children}</div> : <div className="rounded-lg border border-dashed border-border/50 px-3 py-2 text-[11px] text-muted-foreground">{empty}</div>}
    </div>
  );
}

function ConnRow({
  id, label, edgeLabel, dashed, onClick, cls,
}: { id: string; label: string; edgeLabel?: string; dashed?: boolean; onClick: (id: string) => void; cls?: string }) {
  const dot = cls && CLASS_META[cls] ? CLASS_META[cls].dot : "#94a3b8";
  return (
    <button
      onClick={() => onClick(id)}
      className="group flex w-full items-center gap-2 rounded-lg border border-border/60 bg-card/40 px-2.5 py-1.5 text-left text-xs hover:border-primary/50 hover:bg-primary/10"
    >
      <span className="h-2 w-2 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: dot }} />
      <span className="truncate font-medium">{label}</span>
      {edgeLabel && (
        <span className="truncate rounded-full border border-border/60 bg-background/40 px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
          {edgeLabel}
        </span>
      )}
      {dashed && <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-1.5 py-0.5 text-[9px] text-violet-300">async</span>}
      <span className="ml-auto font-mono text-[10px] text-muted-foreground">{id}</span>
    </button>
  );
}
