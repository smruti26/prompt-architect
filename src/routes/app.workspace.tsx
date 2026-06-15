import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useBlueprint } from "@/lib/blueprint-store";
import { Github, GitBranch, Upload, Loader2, Sparkles, FileArchive } from "lucide-react";
import { toast } from "sonner";

const EXAMPLES = [
  "Build a modern e-commerce platform with React, TypeScript, Node.js, PostgreSQL, Microfrontend Architecture, JWT Authentication, Payment Gateway Integration, CI/CD Pipeline, Docker, Kubernetes, and Azure Deployment.",
  "Build a SaaS analytics dashboard with Next.js, NestJS, PostgreSQL, Redis, GraphQL, OAuth, and AWS deployment.",
  "Build a multi-tenant CRM with Spring Boot, MySQL, microservices, Kafka events, and Kubernetes.",
];

export const Route = createFileRoute("/app/workspace")({
  head: () => ({ meta: [{ title: "AI Workspace — ArchAI" }] }),
  component: Workspace,
});

function Workspace() {
  const [prompt, setPrompt] = useState(EXAMPLES[0]);
  const [repoUrl, setRepoUrl] = useState("");
  const [zipName, setZipName] = useState("");
  const [source, setSource] = useState<string | undefined>();
  const { generate, generating, logs } = useBlueprint();
  const navigate = useNavigate();

  const run = async () => {
    if (!prompt.trim()) {
      toast.error("Add a prompt or paste a repository URL");
      return;
    }
    await generate(prompt, source);
    toast.success("Blueprint generated");
    navigate({ to: "/diagrams" });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">AI Workspace</h1>
        <p className="mt-1 text-sm text-muted-foreground">Describe what you want, or connect a repository / upload a ZIP. ArchAI analyzes it and generates the full blueprint.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="glass border-border/60">
          <CardContent className="space-y-5 p-6">
            <Tabs defaultValue="prompt">
              <TabsList className="grid w-full grid-cols-5 bg-muted/40">
                <TabsTrigger value="prompt"><Sparkles className="mr-1.5 h-3.5 w-3.5" />Prompt</TabsTrigger>
                <TabsTrigger value="github"><Github className="mr-1.5 h-3.5 w-3.5" />GitHub</TabsTrigger>
                <TabsTrigger value="azure"><GitBranch className="mr-1.5 h-3.5 w-3.5" />Azure</TabsTrigger>
                <TabsTrigger value="bitbucket"><GitBranch className="mr-1.5 h-3.5 w-3.5" />Bitbucket</TabsTrigger>
                <TabsTrigger value="zip"><FileArchive className="mr-1.5 h-3.5 w-3.5" />ZIP</TabsTrigger>
              </TabsList>

              <TabsContent value="prompt" className="mt-4 space-y-3">
                <Textarea
                  value={prompt}
                  onChange={(e) => { setPrompt(e.target.value); setSource(undefined); }}
                  rows={7}
                  className="resize-none bg-background/60 font-mono text-sm"
                  placeholder="Describe the application you want to architect…"
                />
                <div className="flex flex-wrap gap-2">
                  {EXAMPLES.map((e, i) => (
                    <button key={i} type="button" onClick={() => { setPrompt(e); setSource(undefined); }} className="rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs text-muted-foreground hover:text-foreground">
                      Example {i + 1}
                    </button>
                  ))}
                </div>
              </TabsContent>

              {(["github", "azure", "bitbucket"] as const).map((p) => (
                <TabsContent key={p} value={p} className="mt-4 space-y-3">
                  <Input
                    value={repoUrl}
                    onChange={(e) => { setRepoUrl(e.target.value); setSource(`${p}:${e.target.value}`); }}
                    placeholder={
                      p === "github" ? "https://github.com/org/repo" :
                      p === "azure" ? "https://dev.azure.com/org/project/_git/repo" :
                      "https://bitbucket.org/workspace/repo"
                    }
                    className="bg-background/60 font-mono text-sm"
                  />
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Optional: extra context, target stack, modernization goals…"
                    className="resize-none bg-background/60 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">ArchAI will clone, scan, and infer architecture from this repository.</p>
                </TabsContent>
              ))}

              <TabsContent value="zip" className="mt-4 space-y-3">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 p-8 text-center hover:bg-muted/30">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                  <div className="text-sm">{zipName || "Drop a ZIP or click to browse"}</div>
                  <input type="file" accept=".zip" className="hidden" onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setZipName(f.name); setSource(`zip:${f.name}`); }
                  }} />
                </label>
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  placeholder="Optional context…"
                  className="resize-none bg-background/60 text-sm"
                />
              </TabsContent>
            </Tabs>

            <Button
              onClick={run}
              disabled={generating}
              size="lg"
              className="w-full bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background hover:opacity-90"
            >
              {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              {generating ? "Generating blueprint…" : "Generate Blueprint"}
            </Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Generation log</div>
              <span className={`h-2 w-2 rounded-full ${generating ? "animate-pulse bg-primary" : "bg-muted-foreground/40"}`} />
            </div>
            <div className="h-[420px] overflow-y-auto rounded-lg border border-border/60 bg-background/60 p-4 font-mono text-xs leading-relaxed">
              {logs.length === 0 ? (
                <span className="text-muted-foreground">Awaiting input…</span>
              ) : (
                logs.map((l, i) => (
                  <div key={i} className={l.startsWith("✓") ? "text-[color:var(--cyan-glow)]" : "text-foreground/80"}>{l}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
