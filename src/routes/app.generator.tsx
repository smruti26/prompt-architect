import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBlueprint } from "@/lib/blueprint-store";
import type { TreeNode } from "@/lib/blueprint";
import { ChevronRight, Download, File, Folder, FolderOpen, Sparkles } from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { toast } from "sonner";

export const Route = createFileRoute("/app/generator")({
  head: () => ({ meta: [{ title: "Code Generator — ArchAI" }] }),
  component: Generator,
});

function Generator() {
  const { blueprint } = useBlueprint();
  const fileKeys = useMemo(() => (blueprint ? Object.keys(blueprint.files).sort() : []), [blueprint]);
  const [selected, setSelected] = useState<string | null>(null);

  if (!blueprint) {
    return (
      <div className="mx-auto max-w-3xl p-10">
        <Card className="glass border-border/60">
          <CardContent className="space-y-4 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="font-display text-xl font-semibold">Nothing generated yet</h2>
            <p className="text-sm text-muted-foreground">Run a generation in the AI Workspace to see the code.</p>
            <Link to="/workspace"><Button>Open Workspace</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const current = selected ?? fileKeys[0];
  const code = blueprint.files[current] ?? "";

  const downloadZip = async () => {
    const zip = new JSZip();
    for (const [path, content] of Object.entries(blueprint.files)) {
      zip.file(path, content);
    }
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${blueprint.name.replace(/\s+/g, "-").toLowerCase()}.zip`);
    toast.success("Source code downloaded");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold md:text-4xl">Code Generator</h1>
          <p className="mt-1 text-sm text-muted-foreground">{blueprint.summary}</p>
        </div>
        <Button onClick={downloadZip} className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background">
          <Download className="mr-2 h-4 w-4" />Download source (.zip)
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Card className="glass border-border/60">
          <CardContent className="p-3">
            <div className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">Folder structure</div>
            <Tree node={blueprint.folders} onPick={(p) => setSelected(p)} active={current} />
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-4 py-2.5">
              <div className="truncate font-mono text-xs text-muted-foreground">{current}</div>
            </div>
            <pre className="max-h-[640px] overflow-auto bg-background/60 p-5 font-mono text-xs leading-relaxed">
              <code>{code || `// Folder — select a file to view its source.`}</code>
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Tree({ node, prefix = "", onPick, active, level = 0 }: { node: TreeNode; prefix?: string; onPick: (path: string) => void; active: string; level?: number }) {
  const path = prefix ? `${prefix}/${node.name}` : node.name;
  const [open, setOpen] = useState(level < 2);
  const isFolder = !!node.children;

  if (!isFolder) {
    const isActive = active === path;
    return (
      <button
        onClick={() => onPick(path)}
        className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs transition-colors ${
          isActive ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-card/60"
        }`}
        style={{ paddingLeft: 8 + level * 12 }}
      >
        <File className="h-3.5 w-3.5 opacity-70" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-xs font-medium text-foreground/90 hover:bg-card/60"
        style={{ paddingLeft: 8 + level * 12 }}
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        {open ? <FolderOpen className="h-3.5 w-3.5 text-primary" /> : <Folder className="h-3.5 w-3.5 text-primary" />}
        <span className="truncate">{node.name}</span>
      </button>
      {open && node.children && (
        <div>
          {node.children.map((c) => (
            <Tree key={c.name} node={c} prefix={path} onPick={onPick} active={active} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
