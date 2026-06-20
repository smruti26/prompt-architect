import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Mic, MicOff, GitCompare, PlayCircle, Pause, Sparkles, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mermaid } from "@/components/mermaid";
import { voiceToDiagram, diagramDiff, narrateDiagram } from "@/lib/api/labs-ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/app/labs")({
  component: LabsPage,
  head: () => ({ meta: [{ title: "AI Labs · Voice, Diff & Narration" }] }),
});

const SAMPLE_BEFORE = `flowchart LR
  U[User] --> API[API Gateway]
  API --> S[Service]
  S --> DB[(Postgres)]`;
const SAMPLE_AFTER = `flowchart LR
  U[User] --> CDN[CDN]
  CDN --> API[API Gateway]
  API --> S[Service]
  API --> Q[(Queue)]
  S --> DB[(Postgres)]
  S --> Cache[(Redis)]`;

function LabsPage() {
  return (
    <div className="flex min-h-full flex-col gap-4 p-4">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold tracking-tight">AI Labs</h1>
            <Badge variant="secondary" className="ml-2">Experimental</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Capabilities most diagramming tools do not ship: speak a diagram, diff two architectures semantically, and let AI narrate the system.
          </p>
        </div>
      </header>

      <Tabs defaultValue="voice" className="flex flex-1 flex-col">
        <TabsList className="self-start">
          <TabsTrigger value="voice"><Mic className="mr-1.5 h-4 w-4" /> Voice → Diagram</TabsTrigger>
          <TabsTrigger value="diff"><GitCompare className="mr-1.5 h-4 w-4" /> Semantic Diff</TabsTrigger>
          <TabsTrigger value="narrate"><PlayCircle className="mr-1.5 h-4 w-4" /> AI Narration</TabsTrigger>
        </TabsList>
        <TabsContent value="voice" className="mt-4"><VoiceTab /></TabsContent>
        <TabsContent value="diff" className="mt-4"><DiffTab /></TabsContent>
        <TabsContent value="narrate" className="mt-4"><NarrateTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ------------------------------- Voice → Diagram ------------------------------- */
function VoiceTab() {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [mermaid, setMermaid] = useState("");
  const [loading, setLoading] = useState(false);
  const recogRef = useRef<any>(null);
  const supported = typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  const run = useServerFn(voiceToDiagram);

  const start = useCallback(() => {
    if (!supported) { toast.error("Speech recognition not supported in this browser."); return; }
    const Ctor: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new Ctor();
    r.continuous = true; r.interimResults = true; r.lang = "en-US";
    r.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript + " ";
      setTranscript(full.trim());
    };
    r.onerror = (e: any) => { toast.error("Mic error: " + (e?.error ?? "unknown")); setListening(false); };
    r.onend = () => setListening(false);
    recogRef.current = r;
    r.start();
    setListening(true);
  }, [supported]);

  const stop = useCallback(() => { recogRef.current?.stop?.(); setListening(false); }, []);

  const generate = async () => {
    if (transcript.trim().length < 4) { toast.error("Speak or type something first."); return; }
    setLoading(true);
    try {
      const out = await run({ data: { transcript } });
      setMermaid(out.mermaid);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-base">
            <span>Spoken brainstorm</span>
            {!supported && <Badge variant="outline" className="gap-1"><AlertTriangle className="h-3 w-3" /> Mic unsupported</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            {!listening ? (
              <Button onClick={start} disabled={!supported}><Mic className="mr-1.5 h-4 w-4" /> Start listening</Button>
            ) : (
              <Button onClick={stop} variant="destructive"><MicOff className="mr-1.5 h-4 w-4" /> Stop</Button>
            )}
            <Button onClick={generate} disabled={loading || transcript.trim().length < 4}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Generate diagram
            </Button>
          </div>
          <Textarea
            placeholder="Speak: 'Users hit a CDN, then API gateway forwards to auth service which reads Postgres…'"
            value={transcript} onChange={(e) => setTranscript(e.target.value)}
            className="min-h-[220px] font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            Tip: describe entities, then relationships. The AI strips filler words and infers diagram type.
          </p>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader><CardTitle className="text-base">AI-generated diagram</CardTitle></CardHeader>
        <CardContent className="h-[400px]">
          {mermaid ? (
            <Mermaid id="labs-voice" chart={mermaid} />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Your diagram will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------- Semantic Diff ------------------------------- */
type DiffResult = {
  summary: string;
  added: string[]; removed: string[]; modified: string[];
  risks: { level: "low" | "medium" | "high"; note: string }[];
  blastRadius: "low" | "medium" | "high";
  migrationSteps: string[];
};
function DiffTab() {
  const [before, setBefore] = useState(SAMPLE_BEFORE);
  const [after, setAfter] = useState(SAMPLE_AFTER);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(false);
  const run = useServerFn(diagramDiff);
  const compare = async () => {
    setLoading(true);
    try {
      const out = await run({ data: { before, after } });
      setDiff(out.diff as DiffResult);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  };
  const riskColor = (l: string) => l === "high" ? "destructive" : l === "medium" ? "default" : "secondary";
  return (
    <div className="space-y-4">
      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Before</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[220px] font-mono text-xs" value={before} onChange={(e) => setBefore(e.target.value)} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">After</CardTitle></CardHeader>
          <CardContent>
            <Textarea className="min-h-[220px] font-mono text-xs" value={after} onChange={(e) => setAfter(e.target.value)} />
          </CardContent>
        </Card>
      </div>
      <div>
        <Button onClick={compare} disabled={loading}>
          {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <GitCompare className="mr-1.5 h-4 w-4" />}
          Run semantic diff
        </Button>
      </div>
      {diff && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              <span>Change analysis</span>
              <Badge variant={riskColor(diff.blastRadius) as any}>Blast radius: {diff.blastRadius}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{diff.summary}</p>
            <div className="grid gap-3 md:grid-cols-3">
              <DiffList title="Added" items={diff.added} tone="text-emerald-500" />
              <DiffList title="Removed" items={diff.removed} tone="text-rose-500" />
              <DiffList title="Modified" items={diff.modified} tone="text-amber-500" />
            </div>
            {!!diff.risks?.length && (
              <div>
                <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Risks</div>
                <ul className="space-y-1.5">
                  {diff.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Badge variant={riskColor(r.level) as any}>{r.level}</Badge>
                      <span>{r.note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!!diff.migrationSteps?.length && (
              <div>
                <div className="mb-1.5 text-xs font-medium uppercase text-muted-foreground">Migration steps</div>
                <ol className="list-decimal space-y-1 pl-5">
                  {diff.migrationSteps.map((s, i) => <li key={i}>{s}</li>)}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
function DiffList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div>
      <div className={`mb-1.5 text-xs font-semibold uppercase ${tone}`}>{title} ({items?.length ?? 0})</div>
      {items?.length ? (
        <ul className="space-y-1 text-xs">{items.map((x, i) => <li key={i} className="rounded bg-muted/40 px-2 py-1 font-mono">{x}</li>)}</ul>
      ) : <div className="text-xs text-muted-foreground">None</div>}
    </div>
  );
}

/* ------------------------------- AI Narration ------------------------------- */
const NARR_SAMPLE = `flowchart LR
  U[User] --> W[Web App]
  W --> API[API Gateway]
  API --> A[Auth Service]
  API --> O[Orders Service]
  O --> DB[(Postgres)]
  O --> Q[(Kafka)]
  Q --> N[Notifier]`;
function NarrateTab() {
  const [mermaid, setMermaid] = useState(NARR_SAMPLE);
  const [audience, setAudience] = useState<"executive" | "engineer" | "newHire" | "customer">("engineer");
  const [steps, setSteps] = useState<{ node: string; narration: string }[]>([]);
  const [title, setTitle] = useState("");
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const run = useServerFn(narrateDiagram);

  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;

  const generate = async () => {
    setLoading(true); setSteps([]); setActive(-1);
    try {
      const out = await run({ data: { mermaid, audience } });
      setTitle(out.walkthrough?.title ?? "Walkthrough");
      setSteps(out.walkthrough?.steps ?? []);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const speakIndex = useCallback((i: number) => {
    if (!synth || !steps[i]) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(steps[i].narration);
    u.rate = 1; u.pitch = 1;
    u.onend = () => {
      if (i + 1 < steps.length) { setActive(i + 1); speakIndex(i + 1); }
      else { setPlaying(false); setActive(-1); }
    };
    synth.speak(u);
  }, [steps, synth]);

  const play = () => {
    if (!steps.length) return;
    if (!synth) { toast.error("Speech synthesis not supported."); return; }
    setPlaying(true); setActive(0); speakIndex(0);
  };
  const pause = () => { synth?.cancel(); setPlaying(false); };

  useEffect(() => () => { synth?.cancel(); }, [synth]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Diagram source</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Textarea className="min-h-[220px] font-mono text-xs" value={mermaid} onChange={(e) => setMermaid(e.target.value)} />
          <div className="flex items-center gap-2">
            <Select value={audience} onValueChange={(v) => setAudience(v as any)}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="executive">Executive</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="newHire">New hire</SelectItem>
                <SelectItem value="customer">Customer</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generate} disabled={loading}>
              {loading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
              Generate walkthrough
            </Button>
            {steps.length > 0 && (playing
              ? <Button variant="secondary" onClick={pause}><Pause className="mr-1.5 h-4 w-4" /> Pause</Button>
              : <Button variant="secondary" onClick={play}><PlayCircle className="mr-1.5 h-4 w-4" /> Play narration</Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title || "Narration"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {steps.length === 0 && <div className="text-sm text-muted-foreground">Generate to see narrated steps with TTS playback.</div>}
          {steps.map((s, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm transition ${active === i ? "border-primary bg-primary/10" : "border-border/60 bg-card/40"}`}
            >
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="outline">{i + 1}</Badge>
                <span className="font-mono text-xs text-muted-foreground">{s.node}</span>
              </div>
              <p>{s.narration}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}