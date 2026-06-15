// Mock "AI" project blueprint generator. Deterministic + realistic.

export type Blueprint = {
  prompt: string;
  name: string;
  summary: string;
  stack: { frontend: string[]; backend: string[]; database: string[]; infra: string[] };
  folders: TreeNode;
  files: Record<string, string>;
  diagrams: Record<DiagramKey, { title: string; description: string; mermaid: string }>;
  docs: Record<DocKey, { title: string; markdown: string }>;
  apis: { method: string; path: string; description: string }[];
  entities: { name: string; fields: { name: string; type: string }[] }[];
};

export type TreeNode = { name: string; children?: TreeNode[] };
export type DiagramKey =
  | "architecture"
  | "component"
  | "folder"
  | "microfrontend"
  | "apiflow"
  | "er"
  | "sequence"
  | "deployment"
  | "cicd";
export type DocKey = "hld" | "lld" | "api" | "onboarding" | "deployment";

function pickName(prompt: string) {
  const m = prompt.match(/build (?:a |an )?([a-z0-9\-\s]+?)(?:\s+(?:with|using|for)|\.|$)/i);
  const base = (m?.[1] || "Generated Platform").trim();
  return base
    .split(/\s+/)
    .slice(0, 4)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function detect(prompt: string) {
  const p = prompt.toLowerCase();
  const has = (...k: string[]) => k.some((x) => p.includes(x));
  return {
    next: has("next.js", "nextjs", "next "),
    react: has("react"),
    ts: has("typescript", " ts ", "type-safe"),
    node: has("node", "express", "nestjs"),
    nest: has("nestjs", "nest "),
    spring: has("spring", "java"),
    dotnet: has(".net", "dotnet"),
    pg: has("postgres", "postgresql"),
    mysql: has("mysql"),
    mongo: has("mongo"),
    redis: has("redis"),
    docker: has("docker"),
    k8s: has("kubernet", "k8s"),
    azure: has("azure"),
    aws: has("aws"),
    gcp: has("gcp", "google cloud"),
    micro: has("micro", "microfrontend", "microservice"),
    jwt: has("jwt", "auth"),
    payments: has("payment", "stripe"),
    cicd: has("ci/cd", "cicd", "github actions", "pipeline"),
    ecommerce: has("ecommerce", "e-commerce", "shop", "store"),
    saas: has("saas", "subscription"),
  };
}

export function generateBlueprint(prompt: string): Blueprint {
  const d = detect(prompt);
  const name = pickName(prompt);
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const frontend = [
    d.next ? "Next.js 16" : "React 19",
    d.ts ? "TypeScript 5" : "JavaScript",
    "Tailwind CSS 4",
    "shadcn/ui",
    "TanStack Query",
    "Zustand",
  ];
  const backend = [
    d.spring ? "Java Spring Boot 3" : d.dotnet ? ".NET Core 8" : d.nest ? "NestJS 11" : "Node.js + Express 5",
    "REST + GraphQL",
    d.jwt ? "JWT + OAuth 2.0" : "Session Auth",
    "OpenAPI 3.1",
  ];
  const database = [
    d.mongo ? "MongoDB 7" : d.mysql ? "MySQL 8" : "PostgreSQL 16",
    d.redis ? "Redis 7 (cache)" : "In-memory cache",
    "Prisma ORM",
  ];
  const infra = [
    d.docker ? "Docker" : "Containerized",
    d.k8s ? "Kubernetes" : "Managed runtime",
    d.azure ? "Azure (AKS + ACR)" : d.aws ? "AWS (EKS + ECR)" : "Cloud-agnostic",
    "GitHub Actions CI/CD",
    "Terraform IaC",
  ];

  const entities = d.ecommerce
    ? [
        { name: "User", fields: [{ name: "id", type: "uuid" }, { name: "email", type: "varchar" }, { name: "passwordHash", type: "varchar" }, { name: "role", type: "enum" }] },
        { name: "Product", fields: [{ name: "id", type: "uuid" }, { name: "name", type: "varchar" }, { name: "price", type: "decimal" }, { name: "stock", type: "int" }] },
        { name: "Order", fields: [{ name: "id", type: "uuid" }, { name: "userId", type: "uuid" }, { name: "total", type: "decimal" }, { name: "status", type: "enum" }] },
        { name: "OrderItem", fields: [{ name: "id", type: "uuid" }, { name: "orderId", type: "uuid" }, { name: "productId", type: "uuid" }, { name: "qty", type: "int" }] },
        { name: "Payment", fields: [{ name: "id", type: "uuid" }, { name: "orderId", type: "uuid" }, { name: "provider", type: "varchar" }, { name: "status", type: "enum" }] },
      ]
    : [
        { name: "User", fields: [{ name: "id", type: "uuid" }, { name: "email", type: "varchar" }, { name: "name", type: "varchar" }] },
        { name: "Workspace", fields: [{ name: "id", type: "uuid" }, { name: "ownerId", type: "uuid" }, { name: "name", type: "varchar" }] },
        { name: "Project", fields: [{ name: "id", type: "uuid" }, { name: "workspaceId", type: "uuid" }, { name: "name", type: "varchar" }] },
      ];

  const apis = d.ecommerce
    ? [
        { method: "POST", path: "/auth/login", description: "Issue JWT for valid credentials." },
        { method: "POST", path: "/auth/register", description: "Create new user account." },
        { method: "GET", path: "/products", description: "List paginated products." },
        { method: "GET", path: "/products/:id", description: "Retrieve product details." },
        { method: "POST", path: "/cart/items", description: "Add line item to cart." },
        { method: "POST", path: "/orders", description: "Create order from cart." },
        { method: "POST", path: "/payments/intent", description: "Create Stripe payment intent." },
        { method: "POST", path: "/webhooks/stripe", description: "Verify and process Stripe events." },
      ]
    : [
        { method: "POST", path: "/auth/login", description: "Authenticate and issue JWT." },
        { method: "GET", path: "/me", description: "Current user profile." },
        { method: "GET", path: "/workspaces", description: "List user workspaces." },
        { method: "POST", path: "/projects", description: "Create new project." },
      ];

  const folders: TreeNode = {
    name: slug,
    children: [
      {
        name: "apps",
        children: [
          {
            name: "web",
            children: [
              { name: "public", children: [{ name: "favicon.ico" }] },
              {
                name: "src",
                children: [
                  { name: "app", children: [{ name: "App.tsx" }, { name: "routes.tsx" }] },
                  { name: "components", children: [{ name: "Button.tsx" }, { name: "Card.tsx" }] },
                  { name: "features", children: [{ name: "auth" }, { name: "dashboard" }] },
                  { name: "hooks", children: [{ name: "useAuth.ts" }] },
                  { name: "services", children: [{ name: "apiClient.ts" }] },
                  { name: "store", children: [{ name: "store.ts" }] },
                  { name: "styles", children: [{ name: "globals.css" }] },
                  { name: "main.tsx" },
                ],
              },
              { name: "package.json" },
              { name: "tsconfig.json" },
            ],
          },
          {
            name: "api",
            children: [
              {
                name: "src",
                children: [
                  { name: "modules", children: [{ name: "auth" }, { name: "users" }, ...(d.ecommerce ? [{ name: "products" }, { name: "orders" }, { name: "payments" }] : [])] },
                  { name: "common", children: [{ name: "guards" }, { name: "interceptors" }] },
                  { name: "main.ts" },
                ],
              },
              { name: "prisma", children: [{ name: "schema.prisma" }, { name: "seed.ts" }] },
              { name: "package.json" },
            ],
          },
        ],
      },
      { name: "infra", children: [{ name: "docker-compose.yml" }, { name: "k8s", children: [{ name: "web.yaml" }, { name: "api.yaml" }] }, { name: "terraform", children: [{ name: "main.tf" }] }] },
      { name: ".github", children: [{ name: "workflows", children: [{ name: "ci.yml" }, { name: "cd.yml" }] }] },
      { name: "docs", children: [{ name: "HLD.md" }, { name: "LLD.md" }, { name: "API.md" }] },
      { name: "README.md" },
      { name: "package.json" },
    ],
  };

  // ---------- Files ----------
  const files: Record<string, string> = {};

  files[`${slug}/README.md`] = `# ${name}\n\n${prompt}\n\nGenerated by ArchAI · Enterprise Application Architect.\n`;

  files[`${slug}/apps/web/package.json`] = JSON.stringify(
    {
      name: `${slug}-web`,
      private: true,
      version: "0.1.0",
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
    },
    null,
    2,
  );

  files[`${slug}/apps/web/src/main.tsx`] = `import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(<App />);
`;

  files[`${slug}/apps/web/src/app/App.tsx`] = `import { Routes } from "./routes";

export function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Routes />
    </div>
  );
}
`;

  files[`${slug}/apps/web/src/services/apiClient.ts`] = `const BASE = import.meta.env.VITE_API_URL ?? "/api";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(\`API \${res.status}\`);
  return res.json() as Promise<T>;
}
`;

  files[`${slug}/apps/api/src/main.ts`] = d.nest
    ? `import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
`
    : `import express from "express";
import { authRouter } from "./modules/auth/router";

const app = express();
app.use(express.json());
app.use("/auth", authRouter);

app.listen(process.env.PORT ?? 4000, () => {
  console.log("API listening");
});
`;

  files[`${slug}/apps/api/prisma/schema.prisma`] =
    `generator client { provider = "prisma-client-js" }
datasource db { provider = "${d.mongo ? "mongodb" : d.mysql ? "mysql" : "postgresql"}"; url = env("DATABASE_URL") }

` +
    entities
      .map(
        (e) =>
          `model ${e.name} {\n` +
          e.fields
            .map((f) => {
              const t = f.type === "uuid" ? "String @id @default(uuid())" : f.type === "varchar" ? "String" : f.type === "int" ? "Int" : f.type === "decimal" ? "Decimal" : f.type === "enum" ? "String" : "String";
              return `  ${f.name} ${t}`;
            })
            .join("\n") +
          `\n}\n`,
      )
      .join("\n");

  files[`${slug}/infra/docker-compose.yml`] = `version: "3.9"
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
  api:
    build: ./apps/api
    ports: ["4000:4000"]
    environment:
      DATABASE_URL: \${DATABASE_URL}
  db:
    image: ${d.mongo ? "mongo:7" : d.mysql ? "mysql:8" : "postgres:16"}
    ports: ["${d.mongo ? "27017:27017" : d.mysql ? "3306:3306" : "5432:5432"}"]
`;

  files[`${slug}/.github/workflows/ci.yml`] = `name: CI
on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test --if-present
`;

  files[`${slug}/infra/k8s/web.yaml`] = `apiVersion: apps/v1
kind: Deployment
metadata: { name: web }
spec:
  replicas: 3
  selector: { matchLabels: { app: web } }
  template:
    metadata: { labels: { app: web } }
    spec:
      containers:
        - name: web
          image: ${slug}-web:latest
          ports: [{ containerPort: 3000 }]
`;

  // ---------- Diagrams ----------
  // Shared vibrant palette for all diagrams — applied via Mermaid classDef.
  const PALETTE = `
  classDef user fill:#fde68a,stroke:#f59e0b,stroke-width:1.5px,color:#451a03,rx:14,ry:14;
  classDef edge fill:#a7f3d0,stroke:#10b981,stroke-width:1.5px,color:#064e3b,rx:14,ry:14;
  classDef web fill:#bae6fd,stroke:#0ea5e9,stroke-width:1.5px,color:#0c4a6e,rx:14,ry:14;
  classDef svc fill:#c7d2fe,stroke:#6366f1,stroke-width:1.5px,color:#1e1b4b,rx:14,ry:14;
  classDef api fill:#ddd6fe,stroke:#8b5cf6,stroke-width:1.5px,color:#2e1065,rx:14,ry:14;
  classDef data fill:#fbcfe8,stroke:#ec4899,stroke-width:1.5px,color:#500724,rx:14,ry:14;
  classDef cache fill:#fecaca,stroke:#ef4444,stroke-width:1.5px,color:#450a0a,rx:14,ry:14;
  classDef queue fill:#fed7aa,stroke:#f97316,stroke-width:1.5px,color:#431407,rx:14,ry:14;
  classDef infra fill:#e2e8f0,stroke:#64748b,stroke-width:1.5px,color:#0f172a,rx:14,ry:14;
  classDef accent fill:#22d3ee,stroke:#0891b2,stroke-width:2px,color:#0f172a,rx:14,ry:14;
  classDef pay fill:#fef9c3,stroke:#eab308,stroke-width:1.5px,color:#422006,rx:14,ry:14;
  `;

  const diagrams: Blueprint["diagrams"] = {
    architecture: {
      title: "Application Architecture",
      description: "High-level system view across client, edge, services, and data tiers.",
      mermaid: `flowchart LR
  U([Users]) --> CDN[CDN / Edge]
  CDN --> WEB[${d.next ? "Next.js" : "React"} Web App]
  WEB --> GW[API Gateway]
  GW --> AUTH[Auth Service]
  GW --> API[Core API]
  ${d.ecommerce ? "GW --> PAY[Payments Service]\n  PAY --> STRIPE[(Stripe)]\n  " : ""}API --> DB[(${d.mongo ? "MongoDB" : d.mysql ? "MySQL" : "PostgreSQL"})]
  API --> CACHE[(Redis)]
  API --> Q[[Event Bus]]
  Q --> WRK[Background Workers]
  ${PALETTE}
  class U user; class CDN edge; class WEB web; class GW accent;
  class AUTH,API svc; class DB data; class CACHE cache; class Q queue; class WRK infra;
  ${d.ecommerce ? "class PAY pay; class STRIPE pay;" : ""}`,
    },
    component: {
      title: "Component Tree",
      description: "Frontend component hierarchy.",
      mermaid: `flowchart LR
  App --> Router
  Router --> Layout
  Layout --> Header
  Layout --> Sidebar
  Layout --> Page
  Page --> Dashboard
  Page --> Products
  Page --> Cart
  Page --> Profile
  Dashboard --> StatCard
  Dashboard --> Chart
  Products --> ProductGrid
  ProductGrid --> ProductCard
  ${PALETTE}
  class App accent; class Router edge;
  class Layout,Header,Sidebar,Page web;
  class Dashboard,Products,Cart,Profile svc;
  class StatCard,Chart,ProductGrid,ProductCard api;`,
    },
    folder: {
      title: "Folder Structure",
      description: "Monorepo layout.",
      mermaid: `flowchart TB
  R[${slug}/] --> A[apps/]
  A --> W[web/]
  A --> AP[api/]
  R --> I[infra/]
  I --> D[docker-compose.yml]
  I --> K[k8s/]
  I --> TF[terraform/]
  R --> G[.github/workflows/]
  R --> DC[docs/]
  ${PALETTE}
  class R accent; class A,I,G,DC edge;
  class W,AP web; class D,K,TF infra;`,
    },
    microfrontend: {
      title: "Microfrontend Architecture",
      description: "Module-federated shells and remotes.",
      mermaid: `flowchart LR
  SHELL[Host Shell] --> MF1[Catalog MFE]
  SHELL --> MF2[Cart MFE]
  SHELL --> MF3[Account MFE]
  SHELL --> MF4[Checkout MFE]
  MF1 -. shared lib .-> DS[Design System]
  MF2 -.-> DS
  MF3 -.-> DS
  MF4 -.-> DS
  ${PALETTE}
  class SHELL accent; class MF1,MF2,MF3,MF4 web; class DS api;`,
    },
    apiflow: {
      title: "API Flow",
      description: "Request lifecycle from client to data store.",
      mermaid: `flowchart LR
  C[Client] --> LB[Load Balancer]
  LB --> GW[API Gateway]
  GW --> MW[Auth Middleware]
  MW --> CTRL[Controller]
  CTRL --> SVC[Service Layer]
  SVC --> REPO[Repository]
  REPO --> DB[(Database)]
  SVC --> CACHE[(Redis)]
  ${PALETTE}
  class C user; class LB,GW edge; class MW accent;
  class CTRL,SVC,REPO svc; class DB data; class CACHE cache;`,
    },
    er: {
      title: "Entity Relationship",
      description: "Database schema.",
      mermaid:
        `erDiagram\n` +
        entities
          .map(
            (e) =>
              `  ${e.name.toUpperCase()} {\n` +
              e.fields.map((f) => `    ${f.type} ${f.name}`).join("\n") +
              `\n  }`,
          )
          .join("\n") +
        (d.ecommerce
          ? `\n  USER ||--o{ ORDER : places\n  ORDER ||--|{ ORDERITEM : contains\n  PRODUCT ||--o{ ORDERITEM : "sold as"\n  ORDER ||--|| PAYMENT : "paid by"`
          : `\n  USER ||--o{ WORKSPACE : owns\n  WORKSPACE ||--o{ PROJECT : has`),
    },
    sequence: {
      title: "Sequence — Login + Fetch",
      description: "Authenticated request flow.",
      mermaid: `sequenceDiagram
  participant U as User
  participant W as Web App
  participant G as API Gateway
  participant A as Auth Service
  participant S as Core API
  participant D as Database
  U->>W: Submit credentials
  W->>G: POST /auth/login
  G->>A: Validate
  A-->>G: JWT
  G-->>W: 200 { token }
  W->>G: GET /me (Bearer)
  G->>S: Verified request
  S->>D: SELECT user
  D-->>S: row
  S-->>W: profile`,
    },
    deployment: {
      title: "Deployment Architecture",
      description: `Production topology on ${d.azure ? "Azure" : d.aws ? "AWS" : "Cloud"}.`,
      mermaid: `flowchart TB
  subgraph Edge
    CDN[CDN]
    WAF[WAF]
  end
  subgraph Cluster[${d.k8s ? "Kubernetes Cluster" : "Container Runtime"}]
    WEB[web pods x3]
    API[api pods x3]
    WRK[workers x2]
  end
  subgraph Data
    DB[(Primary DB)]
    REPL[(Read Replica)]
    CACHE[(Redis)]
    OBS[(Object Storage)]
  end
  CDN --> WAF --> WEB
  WEB --> API
  API --> DB
  API --> REPL
  API --> CACHE
  API --> OBS
  ${PALETTE}
  class CDN,WAF edge; class WEB web; class API,WRK svc;
  class DB,REPL data; class CACHE cache; class OBS infra;`,
    },
    cicd: {
      title: "CI/CD Pipeline",
      description: "GitHub Actions pipeline.",
      mermaid: `flowchart LR
  PR[Pull Request] --> LINT[Lint]
  LINT --> TEST[Unit + E2E Tests]
  TEST --> BUILD[Build Images]
  BUILD --> SCAN[Security Scan]
  SCAN --> PUSH[Push to Registry]
  PUSH --> STG[Deploy Staging]
  STG --> SMOKE[Smoke Tests]
  SMOKE --> PROD[Deploy Production]
  ${PALETTE}
  class PR user; class LINT,TEST,SMOKE edge;
  class BUILD,SCAN svc; class PUSH api;
  class STG queue; class PROD accent;`,
    },
  };

  // ---------- Docs ----------
  const docs: Blueprint["docs"] = {
    hld: {
      title: "High-Level Design",
      markdown: `# ${name} — High-Level Design

## 1. Overview
${name} is generated from the prompt: _"${prompt}"_. It is a ${d.micro ? "microfrontend + microservice" : "modular monolith with service boundaries"} architecture targeting ${d.azure ? "Azure" : d.aws ? "AWS" : "cloud-agnostic"} infrastructure.

## 2. Goals
- Scalable to 10x baseline traffic with horizontal scaling.
- 99.9% availability SLO.
- Sub-200ms p95 API latency.
- Secure-by-default with ${d.jwt ? "JWT + OAuth 2.0" : "session auth"}.

## 3. Architecture
- **Client tier**: ${frontend.join(", ")}.
- **Service tier**: ${backend.join(", ")}.
- **Data tier**: ${database.join(", ")}.
- **Platform**: ${infra.join(", ")}.

## 4. Non-Functional Requirements
| Concern | Approach |
|---|---|
| Observability | OpenTelemetry, Prometheus, Grafana |
| Security | OWASP top-10 hardening, secrets in KMS |
| Performance | CDN edge cache, query indexes, Redis cache |
| Resilience | Circuit breakers, retries with jitter |
| Compliance | GDPR data export + deletion |

## 5. Risks
- Cold-start latency on serverless invocations.
- Data migration windows for breaking schema changes.
`,
    },
    lld: {
      title: "Low-Level Design",
      markdown: `# ${name} — Low-Level Design

## Modules
${entities.map((e) => `### ${e.name}\n- Fields: ${e.fields.map((f) => `\`${f.name}: ${f.type}\``).join(", ")}\n- Repository: \`${e.name}Repository\`\n- Service: \`${e.name}Service\``).join("\n\n")}

## Auth Flow
1. Client posts credentials to \`/auth/login\`.
2. Service verifies password hash (argon2id).
3. Issues short-lived access JWT (15m) + refresh token (7d, httpOnly cookie).
4. Refresh rotation on every use.

## Caching Strategy
- Read-through Redis cache, TTL 60s on hot product reads.
- Write-through invalidation on entity mutation.

## Error Handling
- Domain errors mapped to RFC 7807 \`application/problem+json\`.
- Correlation IDs propagated via \`x-request-id\`.
`,
    },
    api: {
      title: "API Documentation",
      markdown:
        `# ${name} — API Reference\n\nBase URL: \`https://api.${slug}.example.com\`\n\n` +
        apis
          .map(
            (a) =>
              `## ${a.method} \`${a.path}\`\n${a.description}\n\n**Auth**: Bearer JWT\n\n**Response** \`200 OK\`\n\`\`\`json\n{\n  "ok": true\n}\n\`\`\`\n`,
          )
          .join("\n"),
    },
    onboarding: {
      title: "Developer Onboarding",
      markdown: `# Onboarding — ${name}

## Prerequisites
- Node.js 20+, ${d.docker ? "Docker Desktop" : "container runtime"}, ${d.mongo ? "Mongo" : d.mysql ? "MySQL" : "Postgres"} CLI.

## Setup
\`\`\`bash
git clone <repo>
cd ${slug}
cp .env.example .env
docker compose up -d
pnpm install
pnpm dev
\`\`\`

## Conventions
- Conventional Commits.
- Trunk-based development with short-lived branches.
- All PRs require 1 reviewer + green CI.
`,
    },
    deployment: {
      title: "Deployment Guide",
      markdown: `# Deployment — ${name}

## Environments
| Env | URL | Branch |
|---|---|---|
| dev | https://dev.${slug}.example.com | develop |
| staging | https://staging.${slug}.example.com | release/* |
| prod | https://${slug}.example.com | main |

## Pipeline
1. CI builds + tests on every push.
2. Tag \`v*\` triggers production deploy.
3. Blue/green rollout with automated rollback on SLO breach.

## Rollback
\`\`\`bash
kubectl rollout undo deployment/web -n prod
kubectl rollout undo deployment/api -n prod
\`\`\`
`,
    },
  };

  return {
    prompt,
    name,
    summary: `${name} — ${d.micro ? "microfrontend + microservices" : "modular full-stack"} architecture with ${database[0]} and ${infra[2]}.`,
    stack: { frontend, backend, database, infra },
    folders,
    files,
    diagrams,
    docs,
    apis,
    entities,
  };
}

export const DIAGRAM_ORDER: { key: DiagramKey; label: string }[] = [
  { key: "architecture", label: "Architecture" },
  { key: "component", label: "Component Tree" },
  { key: "folder", label: "Folder Structure" },
  { key: "microfrontend", label: "Microfrontends" },
  { key: "apiflow", label: "API Flow" },
  { key: "er", label: "Database ER" },
  { key: "sequence", label: "Sequence" },
  { key: "deployment", label: "Deployment" },
  { key: "cicd", label: "CI/CD" },
];

export const DOC_ORDER: { key: DocKey; label: string }[] = [
  { key: "hld", label: "HLD" },
  { key: "lld", label: "LLD" },
  { key: "api", label: "API Docs" },
  { key: "onboarding", label: "Onboarding" },
  { key: "deployment", label: "Deployment" },
];
