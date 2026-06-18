// Programmatic catalog of 1000+ AI diagram templates.
// Each template is generated from a base recipe combined with industry,
// scale, and style modifiers to produce a rich, searchable marketplace.

export type TemplateType =
  | "architecture" | "flowchart" | "ui-tree" | "mindmap" | "er" | "sequence"
  | "network" | "process" | "org-chart" | "user-journey" | "database"
  | "cloud" | "wireframe";

export type TemplateCategoryId =
  | "software-architecture"
  | "system-design"
  | "cloud-infrastructure"
  | "business-process"
  | "product-management"
  | "user-journey"
  | "database-design"
  | "devops"
  | "ai-ml"
  | "enterprise-architecture"
  | "organizational";

export interface TemplateCategory {
  id: TemplateCategoryId;
  label: string;
  description: string;
  accent: string;
  gradient: string;
  defaultType: TemplateType;
}

export interface MarketplaceTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryId;
  subcategory: string;
  type: TemplateType;
  prompt: string;
  tags: string[];
  difficulty: "Starter" | "Intermediate" | "Advanced" | "Enterprise";
  popularity: number;
  rating: number;
  uses: number;
  isPro: boolean;
  isNew: boolean;
  author: string;
}

export const CATEGORIES: TemplateCategory[] = [
  { id: "software-architecture", label: "Software Architecture", description: "Service maps, microservices, modular monoliths, event meshes.", accent: "text-violet-400", gradient: "from-violet-500/20 to-fuchsia-500/10", defaultType: "architecture" },
  { id: "system-design", label: "System Design", description: "Interview-grade designs for scalable, resilient systems.", accent: "text-sky-400", gradient: "from-sky-500/20 to-cyan-500/10", defaultType: "architecture" },
  { id: "cloud-infrastructure", label: "Cloud Infrastructure", description: "AWS, Azure, GCP and multi-cloud reference architectures.", accent: "text-amber-400", gradient: "from-amber-500/20 to-orange-500/10", defaultType: "cloud" },
  { id: "business-process", label: "Business Process Mapping", description: "BPMN-style flows for operations, finance and customer ops.", accent: "text-emerald-400", gradient: "from-emerald-500/20 to-teal-500/10", defaultType: "process" },
  { id: "product-management", label: "Product Management", description: "Roadmaps, opportunity trees, RICE flows and launch plans.", accent: "text-pink-400", gradient: "from-pink-500/20 to-rose-500/10", defaultType: "mindmap" },
  { id: "user-journey", label: "User Journey Mapping", description: "End-to-end journeys with emotion, touchpoints and metrics.", accent: "text-rose-400", gradient: "from-rose-500/20 to-pink-500/10", defaultType: "user-journey" },
  { id: "database-design", label: "Database Design", description: "Relational, NoSQL, time-series and graph schemas.", accent: "text-indigo-400", gradient: "from-indigo-500/20 to-blue-500/10", defaultType: "er" },
  { id: "devops", label: "DevOps", description: "CI/CD pipelines, GitOps, IaC, blue/green and canary flows.", accent: "text-lime-400", gradient: "from-lime-500/20 to-green-500/10", defaultType: "flowchart" },
  { id: "ai-ml", label: "AI / ML Pipelines", description: "Training, inference, RAG, agents and evaluation pipelines.", accent: "text-fuchsia-400", gradient: "from-fuchsia-500/20 to-purple-500/10", defaultType: "flowchart" },
  { id: "enterprise-architecture", label: "Enterprise Architecture", description: "TOGAF-aligned capability, application and data landscapes.", accent: "text-cyan-400", gradient: "from-cyan-500/20 to-sky-500/10", defaultType: "architecture" },
  { id: "organizational", label: "Organizational Planning", description: "Org charts, RACI, squad topologies and operating models.", accent: "text-orange-400", gradient: "from-orange-500/20 to-amber-500/10", defaultType: "org-chart" },
];

interface Recipe {
  category: TemplateCategoryId;
  subcategory: string;
  type: TemplateType;
  name: string;
  description: string;
  prompt: string;
  tags: string[];
  difficulty: MarketplaceTemplate["difficulty"];
}

const RECIPES: Recipe[] = [
  { category: "software-architecture", subcategory: "Microservices", type: "architecture", name: "Microservices Mesh", description: "Polyglot services with event bus, gateway and observability.", prompt: "Polyglot microservices with API gateway, service mesh, Kafka, 6 domain services (orders, payments, inventory, identity, notifications, search), Postgres + Redis per service, and centralized observability.", tags: ["microservices", "kafka", "api-gateway"], difficulty: "Advanced" },
  { category: "software-architecture", subcategory: "Monolith", type: "architecture", name: "Modular Monolith", description: "Bounded contexts inside one deployable.", prompt: "Modular monolith with bounded contexts for billing, catalog, identity, and shipping, in-process commands, outbox events, single web layer.", tags: ["monolith", "ddd"], difficulty: "Intermediate" },
  { category: "software-architecture", subcategory: "Event-Driven", type: "architecture", name: "Event-Driven Backbone", description: "CQRS plus event sourcing with streaming backbone.", prompt: "Event-driven architecture with Kafka, CQRS command/query services, event sourcing for orders, read-model projections, schema registry.", tags: ["cqrs", "event-sourcing"], difficulty: "Advanced" },
  { category: "software-architecture", subcategory: "Serverless", type: "architecture", name: "Serverless API", description: "Managed serverless backend.", prompt: "Serverless backend: API Gateway, Lambda per route, DynamoDB single-table, S3 media, Cognito auth, EventBridge async workflows.", tags: ["serverless", "lambda"], difficulty: "Intermediate" },
  { category: "software-architecture", subcategory: "Hexagonal", type: "architecture", name: "Hexagonal Ports and Adapters", description: "Domain core with inbound/outbound adapters.", prompt: "Hexagonal architecture: pure domain core, inbound adapters HTTP/gRPC/CLI, outbound adapters Postgres/Stripe/SendGrid, dependency inversion.", tags: ["hexagonal", "clean"], difficulty: "Intermediate" },
  { category: "software-architecture", subcategory: "BFF", type: "architecture", name: "Backend For Frontend", description: "Per-client BFFs composing services.", prompt: "BFF pattern: separate BFFs for web, mobile and partner clients composing 8 downstream services via GraphQL and gRPC.", tags: ["bff", "graphql"], difficulty: "Intermediate" },
  { category: "software-architecture", subcategory: "CQRS", type: "architecture", name: "CQRS Split", description: "Command and query sides with separate stores.", prompt: "CQRS architecture: commands write to Postgres, events stream to read projections in Elasticsearch and Redis, served by query API.", tags: ["cqrs"], difficulty: "Advanced" },
  { category: "software-architecture", subcategory: "Plugin Platform", type: "architecture", name: "Extensible Plugin Platform", description: "Host with sandboxed plugins.", prompt: "Plugin platform: host runtime, plugin registry, signed bundles, WASM sandbox, capability permissions, marketplace UI.", tags: ["plugins", "wasm"], difficulty: "Advanced" },
  { category: "software-architecture", subcategory: "Realtime", type: "architecture", name: "Realtime Collaboration", description: "CRDT multiplayer editing.", prompt: "Realtime collab backend: WebSockets, CRDTs (Yjs), presence service, persistence to object storage, version history.", tags: ["realtime", "crdt"], difficulty: "Advanced" },
  { category: "software-architecture", subcategory: "Multi-Tenant SaaS", type: "architecture", name: "Multi-Tenant SaaS", description: "Tenant isolation with shared compute.", prompt: "Multi-tenant SaaS: shared app tier, per-tenant Postgres schemas, tenant-aware routing, row-level security, Stripe billing, admin control plane.", tags: ["saas", "multi-tenant"], difficulty: "Advanced" },

  { category: "system-design", subcategory: "Scalability", type: "architecture", name: "URL Shortener", description: "Sharded storage with cache and analytics.", prompt: "URL shortener: API tier, base62 key generator with coordinated ranges, sharded Postgres, Redis cache, Kafka click pipeline, ClickHouse analytics.", tags: ["scalability", "sharding"], difficulty: "Intermediate" },
  { category: "system-design", subcategory: "Feeds", type: "architecture", name: "News Feed", description: "Hybrid fan-out feed.", prompt: "Social news feed: write path fans out to followers for normal users, pull for celebrities; ranking with ML; Redis timeline cache; Cassandra storage.", tags: ["feed", "ranking"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Chat", type: "architecture", name: "Realtime Chat", description: "Messaging with presence and delivery.", prompt: "Realtime chat: WebSocket gateways, Kafka broker, per-user inbox in Cassandra, Redis presence, push notifications, E2E envelope.", tags: ["chat", "websockets"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Rate Limiting", type: "flowchart", name: "Distributed Rate Limiter", description: "Token bucket across cluster.", prompt: "Distributed rate limiter: token bucket in Redis via Lua, sidecar enforcement, per-tenant and per-route quotas, overflow handling.", tags: ["rate-limit"], difficulty: "Intermediate" },
  { category: "system-design", subcategory: "Search", type: "architecture", name: "Search Platform", description: "Indexing with relevance and personalization.", prompt: "Search platform: ingestion workers, Kafka pipeline, Elasticsearch primary, vector store, query rewriter, ranker, A/B layer.", tags: ["search", "vector"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Notifications", type: "architecture", name: "Notification Service", description: "Channel-agnostic delivery.", prompt: "Notification system: push, email, SMS, in-app; template service, preference center, quiet hours, dedup, retries, delivery analytics.", tags: ["notifications"], difficulty: "Intermediate" },
  { category: "system-design", subcategory: "Video", type: "architecture", name: "Video Streaming", description: "VOD with adaptive bitrate.", prompt: "VOD platform: upload pipeline, transcoder workers, HLS/DASH packaging, multi-CDN, DRM, analytics, recommendations.", tags: ["video", "cdn"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Payments", type: "sequence", name: "Idempotent Payments", description: "Exactly-once intent with reconciliation.", prompt: "Payment sequence between Client, Order Service, Payment Service, PSP and Ledger, with idempotency keys, 3DS, async webhook, double-entry ledger.", tags: ["payments"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Geo", type: "architecture", name: "Ride-Hailing Dispatch", description: "Geo-indexed matching.", prompt: "Ride-hailing dispatch: geo-hashed driver index in Redis, matching service, surge pricing, trip state machine, post-trip ledger.", tags: ["geo", "dispatch"], difficulty: "Advanced" },
  { category: "system-design", subcategory: "Storage", type: "architecture", name: "Object Storage", description: "S3-like with erasure coding.", prompt: "Distributed object storage: metadata service, placement service, storage nodes with erasure coding, quorum reads/writes, GC, lifecycle.", tags: ["storage"], difficulty: "Enterprise" },

  { category: "cloud-infrastructure", subcategory: "AWS", type: "cloud", name: "AWS 3-Tier Web App", description: "Public/private/data tier with autoscale.", prompt: "AWS 3-tier: Route53, CloudFront, WAF, ALB public subnets, ECS Fargate private across 3 AZs, RDS Postgres Multi-AZ, ElastiCache Redis, S3, Secrets Manager.", tags: ["aws", "ecs"], difficulty: "Intermediate" },
  { category: "cloud-infrastructure", subcategory: "AWS", type: "cloud", name: "AWS Serverless Stack", description: "Fully managed serverless.", prompt: "AWS serverless: CloudFront + S3 SPA, API Gateway, Lambda, DynamoDB, Cognito, EventBridge, Step Functions, SQS DLQs, CloudWatch.", tags: ["aws", "serverless"], difficulty: "Intermediate" },
  { category: "cloud-infrastructure", subcategory: "AWS", type: "cloud", name: "AWS Data Lakehouse", description: "Ingestion, catalog, and serving.", prompt: "AWS lakehouse: Kinesis ingest, S3 raw/curated/serving, Glue catalog, Lake Formation, EMR/Spark transforms, Athena and Redshift Spectrum.", tags: ["aws", "data-lake"], difficulty: "Advanced" },
  { category: "cloud-infrastructure", subcategory: "Azure", type: "cloud", name: "Azure AKS Platform", description: "AKS landing zone hub-spoke.", prompt: "Azure AKS landing zone: hub-spoke VNets, Azure Firewall, App Gateway with WAF, AKS per env, Azure SQL, Cosmos DB, Key Vault, Log Analytics.", tags: ["azure", "aks"], difficulty: "Advanced" },
  { category: "cloud-infrastructure", subcategory: "GCP", type: "cloud", name: "GCP GKE Microservices", description: "GKE Autopilot with Cloud SQL and Pub/Sub.", prompt: "GCP: External HTTPS LB, Cloud Armor, GKE Autopilot, Cloud SQL Postgres, Memorystore, Pub/Sub, Cloud Storage, Logging and Monitoring.", tags: ["gcp", "gke"], difficulty: "Intermediate" },
  { category: "cloud-infrastructure", subcategory: "Multi-Cloud", type: "cloud", name: "Multi-Cloud Active-Active", description: "Workloads spanning clouds.", prompt: "Multi-cloud active-active across AWS and GCP with Cloudflare DNS/routing, Postgres logical replication, OIDC identity, Datadog observability.", tags: ["multi-cloud"], difficulty: "Enterprise" },
  { category: "cloud-infrastructure", subcategory: "Networking", type: "network", name: "Hub-and-Spoke VPC", description: "Centralized egress across accounts.", prompt: "Hub-and-spoke VPC: transit gateway, central egress with NAT and firewall, spoke VPCs per workload, PrivateLink for shared services.", tags: ["networking"], difficulty: "Advanced" },
  { category: "cloud-infrastructure", subcategory: "Edge", type: "cloud", name: "Edge Compute Platform", description: "Cloudflare Workers globally distributed.", prompt: "Edge platform on Cloudflare: Workers, R2, D1, KV, Durable Objects, Queues, Pages frontend.", tags: ["edge", "cloudflare"], difficulty: "Intermediate" },
  { category: "cloud-infrastructure", subcategory: "DR", type: "cloud", name: "Cross-Region DR", description: "Pilot-light DR with RPO/RTO.", prompt: "Cross-region DR: primary active, secondary pilot-light with RDS read replicas, S3 CRR, Route53 failover, runbooks.", tags: ["dr"], difficulty: "Advanced" },
  { category: "cloud-infrastructure", subcategory: "Security", type: "cloud", name: "Zero Trust Network", description: "BeyondCorp-style access.", prompt: "Zero trust: identity-aware proxy, device posture, short-lived workload identities, mesh mTLS, secrets broker, continuous verification.", tags: ["zero-trust"], difficulty: "Advanced" },

  { category: "business-process", subcategory: "Order to Cash", type: "process", name: "Order to Cash", description: "Full O2C with credit check and fulfillment.", prompt: "Order-to-cash: lead, quote, order, credit check, fulfillment, invoicing, payment, collections with dunning.", tags: ["o2c"], difficulty: "Intermediate" },
  { category: "business-process", subcategory: "Procure to Pay", type: "process", name: "Procure to Pay", description: "P2P with three-way match.", prompt: "Procure-to-pay: requisition, multi-level approval, PO creation, goods receipt, three-way match, invoice processing and payment.", tags: ["p2p"], difficulty: "Intermediate" },
  { category: "business-process", subcategory: "Hire to Retire", type: "process", name: "Hire to Retire", description: "Employee lifecycle.", prompt: "Hire-to-retire HR: sourcing, screening, offer, onboarding, performance, learning, promotion, offboarding, alumni.", tags: ["hr"], difficulty: "Intermediate" },
  { category: "business-process", subcategory: "Customer Support", type: "process", name: "Support Ticket Triage", description: "Tiered support with SLAs.", prompt: "Support process: multi-channel intake, AI triage, tier 1/2/3 escalation, SLA timers, resolution, CSAT, knowledge update.", tags: ["support", "sla"], difficulty: "Starter" },
  { category: "business-process", subcategory: "KYC", type: "process", name: "KYC AML Onboarding", description: "Risk-based due diligence.", prompt: "KYC/AML onboarding: identity verification, doc capture, liveness check, PEP/sanctions screening, risk scoring, EDD path, periodic review.", tags: ["kyc", "compliance"], difficulty: "Advanced" },
  { category: "business-process", subcategory: "Insurance Claims", type: "process", name: "Insurance Claims", description: "FNOL through settlement.", prompt: "Insurance claims: FNOL intake, triage, assignment, investigation, fraud screening, reserves, settlement, recovery.", tags: ["insurance"], difficulty: "Advanced" },
  { category: "business-process", subcategory: "Loan Origination", type: "process", name: "Loan Origination", description: "Application to funding.", prompt: "Loan origination: application, document collection, credit pull, automated decisioning, manual underwriting, approval, closing, funding.", tags: ["lending"], difficulty: "Advanced" },
  { category: "business-process", subcategory: "Returns", type: "process", name: "Returns and Refunds", description: "RMA lifecycle.", prompt: "Returns process: customer RMA, eligibility, label, warehouse receipt, inspection, restock/scrap, refund or replacement.", tags: ["returns"], difficulty: "Starter" },
  { category: "business-process", subcategory: "Manufacturing", type: "process", name: "Production Planning", description: "MRP-driven planning.", prompt: "Manufacturing planning: demand forecast, MPS, MRP, capacity planning, work orders, shop floor execution, QA, reporting.", tags: ["manufacturing"], difficulty: "Advanced" },
  { category: "business-process", subcategory: "Compliance", type: "process", name: "Incident Response Process", description: "Security incident workflow.", prompt: "Security incident response: detection, triage, containment, eradication, recovery, customer comms, regulatory reporting, post-mortem.", tags: ["incident"], difficulty: "Advanced" },

  { category: "product-management", subcategory: "Discovery", type: "mindmap", name: "Opportunity Solution Tree", description: "Outcome to experiments mapping.", prompt: "Opportunity solution tree mind map: top-level outcome, branches for opportunities, candidate solutions per opportunity, experiments per solution.", tags: ["discovery"], difficulty: "Intermediate" },
  { category: "product-management", subcategory: "Roadmap", type: "flowchart", name: "Now Next Later Roadmap", description: "Outcome-based roadmap.", prompt: "Outcome-based roadmap with three swimlanes Now, Next, Later, each holding 3-4 outcome-themed initiatives with measurable goals.", tags: ["roadmap"], difficulty: "Starter" },
  { category: "product-management", subcategory: "Prioritization", type: "flowchart", name: "RICE Prioritization", description: "RICE scoring flow.", prompt: "RICE flow: ingest backlog item, score reach, impact, confidence, effort, compute RICE, compare threshold, route to roadmap or parking.", tags: ["rice"], difficulty: "Starter" },
  { category: "product-management", subcategory: "Launch", type: "process", name: "Product Launch Plan", description: "Cross-functional launch checklist.", prompt: "Product launch process across PM, eng, design, marketing, sales, support with pre-launch, launch, post-launch phases and exit criteria.", tags: ["launch", "gtm"], difficulty: "Intermediate" },
  { category: "product-management", subcategory: "Metrics", type: "mindmap", name: "North Star Framework", description: "North star with inputs and levers.", prompt: "North star metric mind map: north star at center, input metrics as branches, levers and initiatives as leaves, guardrails to the side.", tags: ["north-star"], difficulty: "Intermediate" },
  { category: "product-management", subcategory: "Research", type: "user-journey", name: "Jobs To Be Done", description: "JTBD with forces of progress.", prompt: "JTBD journey: trigger, current solution, push, pull, anxieties, habits, decision, outcome with sentiment per stage.", tags: ["jtbd"], difficulty: "Intermediate" },
  { category: "product-management", subcategory: "Experiments", type: "flowchart", name: "Experiment Lifecycle", description: "Hypothesis to decision flow.", prompt: "Experiment lifecycle: hypothesis, design, power analysis, instrumentation, rollout, monitoring, decision to ship/iterate/kill.", tags: ["ab-test"], difficulty: "Intermediate" },
  { category: "product-management", subcategory: "OKRs", type: "mindmap", name: "OKR Tree", description: "Company to individual OKR alignment.", prompt: "OKR alignment tree: company objectives at top, team objectives mapped, key results per team, supporting individual KRs.", tags: ["okr"], difficulty: "Starter" },
  { category: "product-management", subcategory: "Personas", type: "mindmap", name: "Persona Map", description: "Personas with goals and pains.", prompt: "Persona mind map with 3 personas, each with goals, pains, channels, JTBD, key quotes.", tags: ["personas"], difficulty: "Starter" },
  { category: "product-management", subcategory: "Strategy", type: "mindmap", name: "Product Strategy Canvas", description: "Vision, bets and moats.", prompt: "Product strategy canvas: vision, market insight, target segments, key bets, differentiators, moats, metrics that matter.", tags: ["strategy"], difficulty: "Advanced" },

  { category: "user-journey", subcategory: "Onboarding", type: "user-journey", name: "SaaS Onboarding", description: "Signup to first value moment.", prompt: "SaaS onboarding journey from signup through first value moment, with touchpoints, emotions per step, friction, metric per stage.", tags: ["onboarding"], difficulty: "Starter" },
  { category: "user-journey", subcategory: "E-commerce", type: "user-journey", name: "Checkout Journey", description: "Browse to repeat purchase.", prompt: "E-commerce journey: discovery, PDP, cart, checkout, payment, post-purchase, repeat, with abandonment recovery loops.", tags: ["ecommerce"], difficulty: "Intermediate" },
  { category: "user-journey", subcategory: "Banking", type: "user-journey", name: "Account Opening", description: "Mobile-first deposit account opening.", prompt: "Mobile-first bank account opening: discovery, ID capture, KYC, funding, card issuance, first transaction with emotions and drop-off risks.", tags: ["banking"], difficulty: "Intermediate" },
  { category: "user-journey", subcategory: "Healthcare", type: "user-journey", name: "Patient Journey", description: "Symptom to follow-up.", prompt: "Patient journey from symptom onset through telehealth visit, in-person follow-up, prescription, recovery with emotions and channel per step.", tags: ["healthcare"], difficulty: "Intermediate" },
  { category: "user-journey", subcategory: "Travel", type: "user-journey", name: "Trip Booking", description: "Inspiration to post-trip.", prompt: "Travel journey: inspiration, research, booking, pre-trip, in-trip, post-trip with channels and emotion arc.", tags: ["travel"], difficulty: "Starter" },
  { category: "user-journey", subcategory: "B2B", type: "user-journey", name: "B2B Buyer Journey", description: "Awareness through expansion.", prompt: "B2B buyer journey: awareness, consideration, evaluation, purchase, onboarding, expansion with stakeholders at each step.", tags: ["b2b"], difficulty: "Advanced" },
  { category: "user-journey", subcategory: "Education", type: "user-journey", name: "Student Journey", description: "Discovery through certification.", prompt: "Online learning journey: course discovery, enrollment, learning, assessment, certification, career outcome with emotions and support.", tags: ["edtech"], difficulty: "Starter" },
  { category: "user-journey", subcategory: "Support", type: "user-journey", name: "Support Journey", description: "Issue to recovery.", prompt: "Support journey: issue noticed, channel selection, self-serve, agent contact, resolution, follow-up with emotions per step.", tags: ["support"], difficulty: "Intermediate" },
  { category: "user-journey", subcategory: "Mobile App", type: "user-journey", name: "Mobile Engagement", description: "Install through habitual use.", prompt: "Mobile engagement journey: install, first session, day-1 return, week-1, habit formation with notifications and churn risks.", tags: ["mobile"], difficulty: "Intermediate" },
  { category: "user-journey", subcategory: "Marketplace", type: "user-journey", name: "Two-Sided Marketplace", description: "Buyer and seller side by side.", prompt: "Two-sided marketplace journey showing buyer and seller from discovery to post-transaction with intersection points.", tags: ["marketplace"], difficulty: "Advanced" },

  { category: "database-design", subcategory: "Relational", type: "er", name: "Blog Platform Schema", description: "Users, posts, comments, tags.", prompt: "ER diagram for blog: users, posts, comments, tags, post_tags junction, media with PK/FK and cardinalities.", tags: ["postgres"], difficulty: "Starter" },
  { category: "database-design", subcategory: "Relational", type: "er", name: "E-commerce Schema", description: "Catalog, orders, payments.", prompt: "E-commerce schema: products, variants, categories, inventory, customers, addresses, orders, order_items, payments, shipments.", tags: ["ecommerce"], difficulty: "Intermediate" },
  { category: "database-design", subcategory: "Relational", type: "er", name: "Banking Core Schema", description: "Accounts, transactions, ledger.", prompt: "Banking core: customers, accounts, account_holders, transactions, ledger entries, limits, statements with double-entry constraints.", tags: ["ledger"], difficulty: "Advanced" },
  { category: "database-design", subcategory: "Relational", type: "er", name: "SaaS Multi-Tenant Schema", description: "Tenants, plans, usage.", prompt: "Multi-tenant SaaS schema: tenants, users, memberships, roles, plans, subscriptions, invoices, usage_events with tenant column.", tags: ["saas"], difficulty: "Intermediate" },
  { category: "database-design", subcategory: "NoSQL", type: "database", name: "DynamoDB Single Table", description: "Access-pattern-driven design.", prompt: "DynamoDB single-table for an event-ticketing app with PK/SK overloading, GSIs, and access patterns annotated.", tags: ["dynamodb"], difficulty: "Advanced" },
  { category: "database-design", subcategory: "Document", type: "database", name: "MongoDB Collections", description: "Embedded vs referenced.", prompt: "MongoDB schema for a headless CMS: sites, pages, blocks, media with embedded vs referenced choices annotated.", tags: ["mongodb"], difficulty: "Intermediate" },
  { category: "database-design", subcategory: "Graph", type: "database", name: "Neo4j Social Graph", description: "Property graph for social.", prompt: "Neo4j property graph: User, Post, Tag nodes with FOLLOWS, POSTED, LIKES, TAGGED relationships and properties.", tags: ["neo4j"], difficulty: "Intermediate" },
  { category: "database-design", subcategory: "Time-Series", type: "database", name: "Time-Series Metrics", description: "Hypertables and aggregates.", prompt: "TimescaleDB schema for IoT metrics: device table, metric hypertable partitioned by time, continuous aggregates 1m/1h/1d, retention policy.", tags: ["timescale"], difficulty: "Advanced" },
  { category: "database-design", subcategory: "Warehouse", type: "er", name: "Star Schema", description: "Fact and dimension tables.", prompt: "Star schema for sales analytics: fact_sales with FKs to dim_date, dim_product, dim_customer, dim_store, dim_promotion with grain noted.", tags: ["warehouse"], difficulty: "Intermediate" },
  { category: "database-design", subcategory: "Vector", type: "database", name: "Vector and Relational", description: "pgvector alongside entities.", prompt: "Hybrid schema with Postgres + pgvector: documents, chunks with embedding column, IVFFlat index, filter metadata.", tags: ["pgvector"], difficulty: "Intermediate" },

  { category: "devops", subcategory: "CI/CD", type: "flowchart", name: "GitHub Actions CI/CD", description: "PR checks through canary deploy.", prompt: "CI/CD with GitHub Actions: lint, unit tests, build, security scan, container build, registry push, staging deploy, smoke tests, prod canary.", tags: ["github-actions"], difficulty: "Intermediate" },
  { category: "devops", subcategory: "GitOps", type: "flowchart", name: "Argo CD GitOps", description: "Repo to cluster reconciliation.", prompt: "GitOps with Argo CD: app repo, manifests repo, image updater, sync across dev/stage/prod with PR-based promotion.", tags: ["gitops"], difficulty: "Advanced" },
  { category: "devops", subcategory: "IaC", type: "flowchart", name: "Terraform Workflow", description: "Plan, review, apply with state.", prompt: "Terraform workflow: branch plan, OPA checks, review, merge, atlantis apply to envs, remote state with locking.", tags: ["terraform"], difficulty: "Intermediate" },
  { category: "devops", subcategory: "Releases", type: "flowchart", name: "Blue Green Deploy", description: "Zero-downtime cutover.", prompt: "Blue/green deployment: deploy green, smoke and integration tests, shift traffic from blue, monitor, rollback path.", tags: ["blue-green"], difficulty: "Intermediate" },
  { category: "devops", subcategory: "Releases", type: "flowchart", name: "Canary Release", description: "Progressive delivery with rollback.", prompt: "Canary release: deploy to 1%, evaluate SLO error budget, ramp 10/25/50/100 with automated rollback on regression.", tags: ["canary"], difficulty: "Advanced" },
  { category: "devops", subcategory: "Observability", type: "architecture", name: "Observability Stack", description: "Metrics, logs, traces with SLOs.", prompt: "Observability: OpenTelemetry collectors, Prometheus metrics, Loki logs, Tempo traces, Grafana, alertmanager and SLO burn-rate alerts.", tags: ["observability"], difficulty: "Advanced" },
  { category: "devops", subcategory: "Incident", type: "process", name: "Incident Response Runbook", description: "Detection through post-mortem.", prompt: "Incident runbook flow: alert, acknowledge, declare, page commander, mitigate, communicate, resolve, post-incident review.", tags: ["incident"], difficulty: "Intermediate" },
  { category: "devops", subcategory: "Secrets", type: "flowchart", name: "Secrets Rotation", description: "Auto-rotation with cache invalidation.", prompt: "Secrets rotation: scheduler, rotation lambda, new version stored, dependents notified, cache invalidated, audit logged.", tags: ["secrets"], difficulty: "Advanced" },
  { category: "devops", subcategory: "Containers", type: "architecture", name: "Kubernetes Production Cluster", description: "Ingress and service mesh.", prompt: "Production K8s cluster: ingress with cert-manager, Istio mesh, HPA/VPA, cluster autoscaler, External Secrets, Velero backups.", tags: ["kubernetes"], difficulty: "Advanced" },
  { category: "devops", subcategory: "Cost", type: "mindmap", name: "FinOps Practice", description: "Visibility and accountability.", prompt: "FinOps mind map: visibility (tagging, dashboards), optimization (rightsizing, savings plans), accountability (showback, chargeback, budgets).", tags: ["finops"], difficulty: "Intermediate" },

  { category: "ai-ml", subcategory: "Training", type: "flowchart", name: "ML Training Pipeline", description: "Data to registry.", prompt: "ML training pipeline: ingestion, validation, feature store materialization, training job, evaluation, model registry, approval, deployment.", tags: ["mlops"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Inference", type: "architecture", name: "Online Inference Service", description: "Low-latency serving.", prompt: "Online inference: feature retrieval from feature store, model server (KServe/Triton), autoscaling, shadow deploy, drift monitoring.", tags: ["inference"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "RAG", type: "architecture", name: "RAG Pipeline", description: "Retrieval-augmented generation.", prompt: "RAG architecture: loaders, chunker, embedder, vector store, retriever, reranker, LLM, response cache, eval harness, feedback loop.", tags: ["rag", "llm"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Agents", type: "flowchart", name: "Agent Orchestration", description: "Planner/executor/critic loop.", prompt: "Agent flow: planner decomposes task, executor calls tools, critic reviews, memory store, guardrails, human-in-the-loop on risky actions.", tags: ["agents"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Eval", type: "flowchart", name: "LLM Evaluation Harness", description: "Offline and online eval.", prompt: "LLM eval harness: golden dataset, offline metrics (faithfulness, helpfulness, safety), online A/B with guardrails, regression gates.", tags: ["llm-eval"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Data", type: "flowchart", name: "Data Labeling Workflow", description: "Active learning with reviewers.", prompt: "Data labeling: raw data, active learning sampler, labeler queue, review, gold set, retraining trigger, quality dashboard.", tags: ["labeling"], difficulty: "Intermediate" },
  { category: "ai-ml", subcategory: "Vision", type: "flowchart", name: "Computer Vision Pipeline", description: "Detection, tracking, analytics.", prompt: "CV pipeline: video ingest, frame sampling, object detection, tracking, event extraction, analytics warehouse, dashboarding.", tags: ["vision"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Speech", type: "flowchart", name: "Voice AI Assistant", description: "ASR, NLU, dialog, TTS.", prompt: "Voice assistant: ASR, NLU, dialog manager, tool calling, TTS with barge-in and PII redaction.", tags: ["voice"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Recsys", type: "architecture", name: "Recommendation System", description: "Candidate gen and ranking.", prompt: "Recsys: candidate generators (collaborative, content, popularity), ranker model, re-ranker for diversity, online learning from feedback.", tags: ["recsys"], difficulty: "Advanced" },
  { category: "ai-ml", subcategory: "Safety", type: "flowchart", name: "AI Safety Guardrails", description: "Input/output filtering.", prompt: "AI safety pipeline: input classifier (PII, jailbreak, toxicity), policy engine, model call, output classifier, rewriter, audit log.", tags: ["safety"], difficulty: "Advanced" },

  { category: "enterprise-architecture", subcategory: "Capability", type: "mindmap", name: "Business Capability Map", description: "L1-L3 capability decomposition.", prompt: "Business capability map for retail enterprise: customer, product, supply chain, finance, HR with L2 and L3 capabilities.", tags: ["togaf"], difficulty: "Advanced" },
  { category: "enterprise-architecture", subcategory: "Application", type: "architecture", name: "Application Landscape", description: "App portfolio with integration.", prompt: "Application landscape: core systems (ERP, CRM, HRIS, CDP), channels, integration backbone (ESB + iPaaS), data platform and analytics.", tags: ["landscape"], difficulty: "Advanced" },
  { category: "enterprise-architecture", subcategory: "Data", type: "architecture", name: "Enterprise Data Mesh", description: "Domain-owned data products.", prompt: "Data mesh: domain-owned data products, self-serve data platform, federated governance, data catalog and contracts.", tags: ["data-mesh"], difficulty: "Enterprise" },
  { category: "enterprise-architecture", subcategory: "Integration", type: "architecture", name: "iPaaS Integration", description: "Hub-and-spoke with APIs/events.", prompt: "Enterprise integration via iPaaS: API gateway, event broker, SaaS connectors, B2B EDI gateway, integration registry.", tags: ["ipaas"], difficulty: "Advanced" },
  { category: "enterprise-architecture", subcategory: "Security", type: "architecture", name: "Enterprise Security Reference", description: "Identity, network, data, app layers.", prompt: "Enterprise security reference: identity (IdP, PAM), network (Zero Trust, SASE), data (DLP, encryption), application (WAF, SAST/DAST), monitoring (SIEM, SOAR).", tags: ["security"], difficulty: "Enterprise" },
  { category: "enterprise-architecture", subcategory: "Reference", type: "architecture", name: "Layered Reference Architecture", description: "Layered reference for greenfield.", prompt: "Layered reference: channels, experience, business services, domain services, integration, data, infrastructure, cross-cutting (security, observability, governance).", tags: ["reference"], difficulty: "Advanced" },
  { category: "enterprise-architecture", subcategory: "Roadmap", type: "flowchart", name: "Transformation Roadmap", description: "Multi-year program with workstreams.", prompt: "Enterprise transformation roadmap: workstreams for cloud, data, security, ways-of-working with phased milestones across 3 years.", tags: ["transformation"], difficulty: "Enterprise" },
  { category: "enterprise-architecture", subcategory: "Governance", type: "flowchart", name: "Architecture Review Board", description: "ARB intake to decision.", prompt: "ARB workflow: intake, pre-review, ARB session, decision (approve/conditional/reject), exception register, follow-up.", tags: ["arb"], difficulty: "Intermediate" },
  { category: "enterprise-architecture", subcategory: "Risk", type: "mindmap", name: "Technology Risk Map", description: "Strategic and operational risks.", prompt: "Technology risk mind map: strategic, operational, security, compliance, third-party risks with controls and owners.", tags: ["risk"], difficulty: "Advanced" },
  { category: "enterprise-architecture", subcategory: "Sustainability", type: "mindmap", name: "Green IT Strategy", description: "Sustainable IT levers.", prompt: "Green IT strategy mind map: workload placement, efficient code, renewable regions, hardware lifecycle, measurement and reporting.", tags: ["green-it"], difficulty: "Intermediate" },

  { category: "organizational", subcategory: "Org Chart", type: "org-chart", name: "Startup Org Chart", description: "Founders to functional leads.", prompt: "Startup org chart: founders, VPs of Engineering, Product, Design, Sales, Marketing, Ops with teams under each.", tags: ["org-chart"], difficulty: "Starter" },
  { category: "organizational", subcategory: "Org Chart", type: "org-chart", name: "Enterprise Matrix Org", description: "Functional + BU matrix.", prompt: "Enterprise matrix: business units (Retail, Wholesale, Digital) across functions (Tech, Finance, HR, Legal) with dotted lines.", tags: ["matrix"], difficulty: "Advanced" },
  { category: "organizational", subcategory: "Squads", type: "org-chart", name: "Spotify Model", description: "Squads, tribes, chapters, guilds.", prompt: "Spotify-model engineering org: tribes, squads per mission, chapters across squads, guilds as communities of practice.", tags: ["spotify"], difficulty: "Intermediate" },
  { category: "organizational", subcategory: "Team Topologies", type: "org-chart", name: "Team Topologies", description: "Four team types with interactions.", prompt: "Team Topologies: stream-aligned teams, platform team, enabling team, complicated-subsystem team with interaction modes.", tags: ["team-topologies"], difficulty: "Advanced" },
  { category: "organizational", subcategory: "RACI", type: "flowchart", name: "RACI Matrix Flow", description: "Decision flow with RACI.", prompt: "Decision flow showing RACI for a product launch across PM, Eng, Design, Marketing, Legal.", tags: ["raci"], difficulty: "Intermediate" },
  { category: "organizational", subcategory: "Operating Model", type: "architecture", name: "Target Operating Model", description: "People, process, tech, governance.", prompt: "Target operating model: people (roles, skills), process (value streams), technology (platforms), governance (decision rights, metrics).", tags: ["tom"], difficulty: "Enterprise" },
  { category: "organizational", subcategory: "Hiring", type: "flowchart", name: "Hiring Pipeline", description: "Sourcing through offer.", prompt: "Hiring pipeline: sourcing, recruiter screen, hiring manager screen, technical loop, bar-raiser, debrief, offer with SLAs per stage.", tags: ["hiring"], difficulty: "Intermediate" },
  { category: "organizational", subcategory: "Performance", type: "process", name: "Performance Review Cycle", description: "Goals through calibration.", prompt: "Performance review cycle: goal setting, mid-year, self-review, peer reviews, manager review, calibration, compensation, communication.", tags: ["performance"], difficulty: "Intermediate" },
  { category: "organizational", subcategory: "Decision", type: "flowchart", name: "Decision-Making Framework", description: "DACI-style decision flow.", prompt: "Decision-making with DACI: Driver, Approver, Contributors, Informed with decision log and revisit triggers.", tags: ["daci"], difficulty: "Intermediate" },
  { category: "organizational", subcategory: "Comms", type: "mindmap", name: "Internal Comms Plan", description: "Audiences and cadence.", prompt: "Internal communications plan mind map: audiences, channels, cadence, owners, feedback loops, escalation paths.", tags: ["comms"], difficulty: "Starter" },
];

const INDUSTRIES = [
  "FinTech", "Healthcare", "Retail", "Logistics", "Media", "Education",
  "Gaming", "Travel", "Real Estate", "Manufacturing", "Energy", "Insurance",
  "Government", "Telecom", "Non-Profit",
];

const SCALES = [
  { id: "startup", label: "Startup", note: "small team, fast iteration, cost-sensitive" },
  { id: "growth", label: "Growth Stage", note: "scaling teams, multi-region, evolving compliance" },
  { id: "enterprise", label: "Enterprise", note: "regulated, multi-BU, global, strict governance" },
  { id: "hyperscale", label: "Hyperscale", note: "global, billions of events, sub-100ms SLOs" },
];

const STYLES = [
  { id: "modern", label: "Modern" },
  { id: "regulated", label: "Regulated" },
  { id: "ai-native", label: "AI-Native" },
  { id: "event-driven", label: "Event-Driven" },
  { id: "cost-optimized", label: "Cost-Optimized" },
  { id: "high-trust", label: "High-Trust" },
  { id: "mobile-first", label: "Mobile-First" },
];

const AUTHORS = [
  "ArchAI Studio", "Kira Nakamura", "Diego Vargas", "Priya Shah",
  "Mei Lin", "Jordan Reed", "Aisha Bello", "Tomas Novak",
];

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h;
}
function pickPopularity(seed: number) { return 30 + (seed % 70); }
function pickRating(seed: number) { return Math.min(5, Math.round((3.8 + ((seed % 13) / 10)) * 10) / 10); }
function pickUses(seed: number) { return (120 + (seed % 9000)) * (1 + (seed % 4)); }
function slug(s: string): string { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

let _cache: MarketplaceTemplate[] | null = null;

export function getMarketplaceTemplates(): MarketplaceTemplate[] {
  if (_cache) return _cache;
  const out: MarketplaceTemplate[] = [];

  for (const recipe of RECIPES) {
    const baseId = `${recipe.category}-${slug(recipe.name)}`;
    const baseSeed = hashStr(baseId);
    out.push({
      id: baseId,
      name: recipe.name,
      description: recipe.description,
      category: recipe.category,
      subcategory: recipe.subcategory,
      type: recipe.type,
      prompt: recipe.prompt,
      tags: recipe.tags,
      difficulty: recipe.difficulty,
      popularity: 70 + (baseSeed % 30),
      rating: pickRating(baseSeed),
      uses: pickUses(baseSeed) + 2000,
      isPro: false,
      isNew: baseSeed % 7 === 0,
      author: AUTHORS[baseSeed % AUTHORS.length],
    });

    for (const industry of INDUSTRIES) {
      const id = `${baseId}-${slug(industry)}`;
      const seed = hashStr(id);
      out.push({
        id,
        name: `${industry} ${recipe.name}`,
        description: `${recipe.description} Tailored for ${industry}.`,
        category: recipe.category,
        subcategory: recipe.subcategory,
        type: recipe.type,
        prompt: `${recipe.prompt} Tailor components, regulations and risks for the ${industry} industry.`,
        tags: [...recipe.tags, slug(industry)],
        difficulty: recipe.difficulty,
        popularity: pickPopularity(seed),
        rating: pickRating(seed),
        uses: pickUses(seed),
        isPro: seed % 5 === 0,
        isNew: seed % 11 === 0,
        author: AUTHORS[seed % AUTHORS.length],
      });
    }

    for (const scale of SCALES) {
      const id = `${baseId}-scale-${scale.id}`;
      const seed = hashStr(id);
      out.push({
        id,
        name: `${recipe.name} - ${scale.label}`,
        description: `${recipe.description} Sized for ${scale.label.toLowerCase()} organizations.`,
        category: recipe.category,
        subcategory: recipe.subcategory,
        type: recipe.type,
        prompt: `${recipe.prompt} Optimize for a ${scale.label} organization: ${scale.note}.`,
        tags: [...recipe.tags, scale.id],
        difficulty: scale.id === "hyperscale" ? "Enterprise" : recipe.difficulty,
        popularity: pickPopularity(seed),
        rating: pickRating(seed),
        uses: pickUses(seed),
        isPro: scale.id === "enterprise" || scale.id === "hyperscale",
        isNew: seed % 13 === 0,
        author: AUTHORS[seed % AUTHORS.length],
      });
    }

    for (const style of STYLES) {
      const id = `${baseId}-style-${style.id}`;
      const seed = hashStr(id);
      out.push({
        id,
        name: `${style.label} ${recipe.name}`,
        description: `${recipe.description} ${style.label} approach.`,
        category: recipe.category,
        subcategory: recipe.subcategory,
        type: recipe.type,
        prompt: `${recipe.prompt} Apply a ${style.label} approach throughout.`,
        tags: [...recipe.tags, style.id],
        difficulty: recipe.difficulty,
        popularity: pickPopularity(seed),
        rating: pickRating(seed),
        uses: pickUses(seed),
        isPro: style.id === "ai-native" && seed % 2 === 0,
        isNew: style.id === "ai-native" || seed % 9 === 0,
        author: AUTHORS[seed % AUTHORS.length],
      });
    }
  }

  _cache = out;
  return out;
}

export function getTemplateById(id: string): MarketplaceTemplate | undefined {
  return getMarketplaceTemplates().find((t) => t.id === id);
}

export function getCategoryCounts(): Record<TemplateCategoryId, number> {
  const counts = {} as Record<TemplateCategoryId, number>;
  for (const c of CATEGORIES) counts[c.id] = 0;
  for (const t of getMarketplaceTemplates()) counts[t.category]++;
  return counts;
}

export const PENDING_TEMPLATE_KEY = "studio.pendingTemplate";

export interface PendingTemplatePayload {
  prompt: string;
  type: TemplateType;
  name: string;
  autorun?: boolean;
}
