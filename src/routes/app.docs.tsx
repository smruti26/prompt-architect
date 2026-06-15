import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBlueprint } from "@/lib/blueprint-store";
import { DOC_ORDER, type DocKey } from "@/lib/blueprint";
import { Download, FileText, Sparkles } from "lucide-react";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import { toast } from "sonner";

export const Route = createFileRoute("/app/docs")({
  head: () => ({ meta: [{ title: "Documentation Center — ArchAI" }] }),
  component: Docs,
});

function renderMarkdown(md: string) {
  // Lightweight markdown renderer for headings, lists, code, tables.
  const lines = md.split("\n");
  const out: string[] = [];
  let inCode = false;
  let inTable = false;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const inline = (s: string) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/_([^_]+)_/g, "<em>$1</em>");

  for (const raw of lines) {
    const line = raw;
    if (line.startsWith("```")) {
      if (inCode) { out.push("</code></pre>"); inCode = false; }
      else { out.push('<pre class="overflow-auto rounded-lg border border-border/60 bg-background/60 p-4 text-xs"><code class="font-mono">'); inCode = true; }
      continue;
    }
    if (inCode) { out.push(esc(line)); continue; }
    if (/^\|.*\|$/.test(line)) {
      const cells = line.slice(1, -1).split("|").map((c) => c.trim());
      if (!inTable) { out.push('<table class="w-full border-collapse text-sm"><tbody>'); inTable = true; }
      if (cells.every((c) => /^-+$/.test(c))) continue;
      out.push("<tr>" + cells.map((c) => `<td class="border border-border/60 px-3 py-1.5">${inline(c)}</td>`).join("") + "</tr>");
      continue;
    } else if (inTable) { out.push("</tbody></table>"); inTable = false; }

    if (/^#\s/.test(line)) out.push(`<h1 class="font-display text-3xl font-semibold mt-6 mb-3">${inline(line.slice(2))}</h1>`);
    else if (/^##\s/.test(line)) out.push(`<h2 class="font-display text-2xl font-semibold mt-6 mb-2">${inline(line.slice(3))}</h2>`);
    else if (/^###\s/.test(line)) out.push(`<h3 class="font-display text-lg font-semibold mt-4 mb-1.5">${inline(line.slice(4))}</h3>`);
    else if (/^-\s/.test(line)) out.push(`<li class="ml-5 list-disc text-sm">${inline(line.slice(2))}</li>`);
    else if (/^\d+\.\s/.test(line)) out.push(`<li class="ml-5 list-decimal text-sm">${inline(line.replace(/^\d+\.\s/, ""))}</li>`);
    else if (line.trim() === "") out.push("<div class='h-2'></div>");
    else out.push(`<p class="text-sm leading-relaxed text-foreground/85">${inline(line)}</p>`);
  }
  if (inCode) out.push("</code></pre>");
  if (inTable) out.push("</tbody></table>");
  return out.join("\n");
}

function Docs() {
  const { blueprint } = useBlueprint();
  const [active, setActive] = useState<DocKey>("hld");

  if (!blueprint) {
    return (
      <div className="mx-auto max-w-3xl p-10">
        <Card className="glass border-border/60">
          <CardContent className="space-y-4 p-10 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary" />
            <h2 className="font-display text-xl font-semibold">No documentation yet</h2>
            <p className="text-sm text-muted-foreground">Generate a blueprint to populate the documentation center.</p>
            <Link to="/workspace"><Button>Generate now</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const doc = blueprint.docs[active];

  const exportMd = () => {
    saveAs(new Blob([doc.markdown], { type: "text/markdown" }), `${active}.md`);
  };

  const exportPdf = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const margin = 48;
    const width = pdf.internal.pageSize.getWidth() - margin * 2;
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(doc.title, margin, margin);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(doc.markdown, width);
    pdf.text(lines, margin, margin + 24);
    pdf.save(`${active}.pdf`);
    toast.success("PDF exported");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-10">
      <div>
        <h1 className="font-display text-3xl font-semibold md:text-4xl">Documentation Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">Auto-generated HLD, LLD, API specs and guides for {blueprint.name}.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <Card className="glass h-fit border-border/60">
          <CardContent className="p-3">
            <div className="mb-2 px-2 text-xs uppercase tracking-wider text-muted-foreground">Documents</div>
            <div className="space-y-1">
              {DOC_ORDER.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setActive(d.key)}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    active === d.key ? "bg-primary/15 text-primary" : "text-foreground/80 hover:bg-card/60"
                  }`}
                >
                  <FileText className="h-4 w-4" />{d.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-border/60">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-3">
              <div className="text-sm font-semibold">{doc.title}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportMd}><Download className="mr-1.5 h-3.5 w-3.5" />Markdown</Button>
                <Button size="sm" className="bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background" onClick={exportPdf}>
                  <Download className="mr-1.5 h-3.5 w-3.5" />PDF
                </Button>
              </div>
            </div>
            <div className="max-h-[720px] overflow-auto p-6 prose-invert" dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.markdown) }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
