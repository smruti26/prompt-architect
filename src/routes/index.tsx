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
    <div className="dark relative min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 dotted-bg opacity-40" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] aurora opacity-70" />

      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Logo />
        <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground">Features</a>
          <a href="#stack" className="hover:text-foreground">Stack</a>
          <a href="#workflow" className="hover:text-foreground">Workflow</a>
        </nav>
        <Link to="/auth">
          <Button variant="outline" className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary">
            Sign in
          </Button>
        </Link>
      </header>

      <section className="relative z-10 mx-auto max-w-5xl px-6 pt-16 pb-24 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Enterprise AI Architect · v1.0
        </div>
        <h1 className="font-display text-5xl font-semibold tracking-tight md:text-7xl">
          From a single prompt to a <span className="gradient-text">production-ready</span> architecture.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          Connect a Git repository, drop a ZIP, or describe what you want. ArchAI returns full system architecture,
          diagrams, source code, database schema, and documentation — in minutes.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link to="/auth">
            <Button size="lg" className="glow bg-gradient-to-r from-[var(--cyan-glow)] to-[var(--violet-glow)] text-background hover:opacity-90">
              Launch the platform <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <a href="#features">
            <Button size="lg" variant="outline" className="border-border bg-card/40">
              See what it generates
            </Button>
          </a>
        </div>
      </section>

      <section id="features" className="relative z-10 mx-auto grid max-w-6xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          { icon: Brain, title: "AI Code Analysis", body: "Detects frameworks, patterns, and dependencies across frontend, backend, and infra." },
          { icon: GitBranch, title: "9 Visual Diagrams", body: "Architecture, component tree, ER, sequence, deployment, CI/CD — all interactive." },
          { icon: Code2, title: "Full-Stack Generation", body: "React/Next, Node/Nest/Spring, PostgreSQL/Mongo, Docker, K8s, Terraform." },
          { icon: FileText, title: "Documentation Engine", body: "HLD, LLD, API docs, onboarding and deployment guides — exportable as PDF." },
          { icon: Boxes, title: "Microfrontend-Ready", body: "Module-federated shells, shared design system, independent deployments." },
          { icon: ShieldCheck, title: "Secure by Default", body: "JWT + OAuth, RBAC, OWASP-aligned defaults, secrets via KMS." },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="glass gradient-border rounded-2xl p-6">
            <Icon className="mb-4 h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section id="stack" className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="glass rounded-3xl p-10">
          <h2 className="font-display text-3xl font-semibold">A complete enterprise stack, generated.</h2>
          <p className="mt-2 text-muted-foreground">React 19 · Next.js 16 · TypeScript · Tailwind · NestJS · Spring · PostgreSQL · MongoDB · Redis · Docker · Kubernetes · Azure · AWS · GitHub Actions · Terraform</p>
        </div>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-t border-border/60 px-6 py-6 text-sm text-muted-foreground">
        <Logo size={22} />
        <span>© {new Date().getFullYear()} ArchAI</span>
      </footer>
    </div>
  );
}
