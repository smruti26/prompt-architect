import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Boxes, Brain, Code2, FileText, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ArchAI — From prompt to production architecture" },
      { name: "description", content: "Generate enterprise application architecture, diagrams, code and documentation from a single prompt, Git repository, or ZIP." },
      { property: "og:title", content: "ArchAI — AI Application Architect" },
      { property: "og:description", content: "From prompt to production-ready architecture, code, diagrams, and docs." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="dark relative flex h-screen min-h-[640px] flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 dotted-bg opacity-30" />
      <div className="pointer-events-none absolute inset-x-0 -top-24 h-[620px] aurora opacity-80" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-5">
        <Logo />
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#capabilities" className="transition-colors hover:text-foreground">Capabilities</a>
          <a href="#stack" className="transition-colors hover:text-foreground">Stack</a>
          <a href="#workflow" className="transition-colors hover:text-foreground">Workflow</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden sm:block">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Sign in</Button>
          </Link>
          <Link to="/auth">
            <Button className="rounded-full bg-foreground px-5 text-background hover:bg-foreground/90">
              Get started <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-8">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          {/* Left: copy */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/40 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--cyan-glow)] opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--cyan-glow)]" />
              </span>
              Enterprise AI Architect · v1.0
            </div>
            <h1 className="text-[clamp(2.5rem,5vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.035em]">
              From a prompt to a{" "}
              <span className="font-display italic font-normal gradient-text">production-ready</span>{" "}
              architecture.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-[17px]">
              Connect a repository, drop a ZIP, or describe what you want. ArchAI returns the full system blueprint —
              diagrams, code, schema, and docs — in minutes.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="group h-12 rounded-full bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] px-7 text-base font-medium text-background shadow-[0_10px_40px_-12px_var(--cyan-glow)] hover:opacity-95">
                  Launch the platform
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
              <a href="#capabilities">
                <Button size="lg" variant="outline" className="h-12 rounded-full border-border/70 bg-card/30 px-6 text-base backdrop-blur hover:bg-card/60">
                  See what it builds
                </Button>
              </a>
            </div>
            <div className="mt-8 flex items-center gap-5 text-xs text-muted-foreground/80">
              <div className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[var(--cyan-glow)]" /> SOC 2 ready</div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 text-[var(--cyan-glow)]" /> Git-native</div>
              <div className="h-3 w-px bg-border" />
              <div className="flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-[var(--cyan-glow)]" /> 9 diagrams</div>
            </div>
          </div>

          {/* Right: capability stack */}
          <div id="capabilities" className="relative">
            <div className="absolute -inset-6 -z-10 rounded-3xl bg-gradient-to-br from-[var(--cyan-glow)]/20 via-transparent to-[var(--violet-glow)]/20 blur-2xl" />
            <div className="glass gradient-border rounded-2xl p-2">
              <div className="flex items-center justify-between border-b border-border/40 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">archai · blueprint</span>
              </div>
              <div className="grid grid-cols-2 gap-2 p-2">
                {[
                  { icon: Brain, title: "AI Analysis", body: "Frameworks & patterns" },
                  { icon: GitBranch, title: "9 Diagrams", body: "Architecture · ERD · CI/CD" },
                  { icon: Code2, title: "Full-Stack Code", body: "React · Nest · Spring" },
                  { icon: FileText, title: "Living Docs", body: "HLD · LLD · API · PDF" },
                  { icon: Boxes, title: "Microfrontends", body: "Federated & independent" },
                  { icon: ShieldCheck, title: "Secure Default", body: "JWT · RBAC · OWASP" },
                ].map(({ icon: Icon, title, body }) => (
                  <div key={title} className="group rounded-xl border border-border/40 bg-card/30 p-3 transition-all hover:border-[var(--cyan-glow)]/40 hover:bg-card/60">
                    <Icon className="mb-2 h-4 w-4 text-[var(--cyan-glow)] transition-transform group-hover:scale-110" />
                    <div className="text-sm font-medium leading-tight">{title}</div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground">{body}</div>
                  </div>
                ))}
              </div>
              <div id="stack" className="border-t border-border/40 px-4 py-3">
                <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Generated stack</div>
                <div className="mt-1.5 line-clamp-2 text-xs text-foreground/80">
                  React 19 · Next 16 · TypeScript · NestJS · Spring · PostgreSQL · MongoDB · Redis · Docker · Kubernetes · AWS · Terraform
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer id="workflow" className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-border/40 px-8 py-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <Logo size={18} />
          <span className="hidden sm:inline">© {new Date().getFullYear()} ArchAI. All rights reserved.</span>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden md:inline">Prompt → Analyze → Generate → Ship</span>
          <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-400" /> All systems normal</span>
        </div>
      </footer>
    </div>
  );
}
