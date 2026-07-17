# AMTECH Next-Generation Website Framework

Status: canonical implementation workspace
Created: 2026-07-17
Implementation root: `GTM-RESEARCH/website-framework/`

## Mission

Build a hyper-performant, hyper-specialized, agentic-search-ready public website from first principles.

The website is not a skin over the old site and not a generic SaaS template. It is a purpose-built category engine for AMTECH's AI Employee:

> **Your business gets an employee that lives in the software.**

The site must simultaneously do four jobs:

1. make a contractor recognize the office work stealing their evenings;
2. teach the new AI Employee category through concrete work;
3. establish trust through owner gates, credential custody, proof, and honest evidence labels;
4. publish a machine-legible, deeply linked body of original answers that search engines and answer systems can retrieve, cite, and fan out across.

## Read order

1. `../../identity.md`
2. `../../CODEGRAPH.md`
3. `../../mvp-build/CODEGRAPH.md`
4. `../../mvp-build/memory/MEMORY.md`
5. `../../docs/AMTECH_WEB_DESIGN_SYSTEM.md`
6. `../../docs/amtech-website-rewrite-brief.md`
7. `../../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`
8. `01-performance-architecture.md`
9. `02-agentic-seo-system.md`
10. `03-specialized-page-system.md`
11. `04-implementation-and-acceptance.md`
12. `site-manifest.yaml`

## First-principles decisions

### The site is content-first, not application-first

The public website should ship semantic HTML, readable copy, links, metadata, and structured data in the initial response. JavaScript is reserved for the living-worker demonstration, forms, analytics, and genuinely interactive state.

### Zero JavaScript is the default

Every component starts as static/server-rendered HTML and CSS. Add an island only when the user gains a meaningful interaction that cannot be achieved otherwise.

### The category is taught through work

Every major page should show:

```text
owner situation or business event
-> employee interprets context
-> concrete work appears
-> owner gate when consequential
-> external action
-> proof receipt
```

### Search architecture follows the product graph

Do not generate pages from keyword permutations. Build a graph of useful answers around:

- the AI Employee category;
- contractor office work;
- specific tasks and job-lifecycle moments;
- owner control and security;
- connected business systems;
- proof and implementation questions;
- pricing and buying decisions.

A page exists only when it resolves a distinct owner question or decision with original information.

### Evidence is data

Every proof object carries one required evidence level:

- `live_production_proof`
- `product_demonstration`
- `source_wired_preview`
- `concept`

The rendering system must not silently promote a lower evidence level into a stronger claim.

## Canonical routes

Initial launch routes:

- `/`
- `/ai-employee`
- `/contractors`
- `/how-it-works`
- `/security`
- `/pricing`
- `/proof`
- `/about`

The content graph may later add task, comparison, implementation, and vertical nodes only when each page has enough unique evidence and information gain to deserve indexing.

## Architecture default

Use a static-first architecture with TypeScript, content collections, componentized semantic HTML, and selective islands. Astro is the default candidate for a standalone public site because it makes zero-JavaScript output and content collections the normal path. Preserve an existing framework only if it can meet the same budgets without turning the marketing site into a hydrated application shell.

The real `/create-ai-employee` onboarding remains the product destination. The website can link or proxy to it, but must not replace it with a fake front-end demo.

## Performance contract

Minimum field targets at the 75th percentile, mobile and desktop:

- LCP <= 2.5 seconds;
- INP <= 200 milliseconds;
- CLS <= 0.1.

Internal launch targets should be stricter:

- LCP <= 1.8 seconds on the primary landing pages;
- INP <= 150 milliseconds;
- CLS <= 0.05;
- initial JavaScript <= 75 KB gzip on the homepage, with a zero-JS path for non-interactive pages;
- initial CSS <= 30 KB gzip;
- no third-party script on the critical rendering path;
- no render-blocking web font dependency;
- no hero video or image that becomes the performance bottleneck;
- no layout shift from media, fonts, cookie banners, or late personalization.

Budgets are enforced in CI, not treated as cleanup goals.

## Agentic SEO contract

“Agentic SEO” does not mean special markup that guarantees inclusion in AI answers. It means producing the strongest retrievable answer system:

- crawlable server-rendered content;
- distinct pages with clear intent;
- original, specific, people-first information;
- explicit entities and relationships;
- concise answer blocks plus deeper evidence;
- logical crawlable internal links;
- accurate visible structured data;
- stable canonical URLs and metadata;
- proof labels and revision dates;
- no thin permutations, hidden text, fake FAQs, or schema spam.

Google's current guidance states that AI Overviews and AI Mode use the same foundational SEO requirements as Search and may fan queries out across related subtopics. The site therefore needs a coherent evidence-backed topic graph, not an “AI Overview hack.”

## Conversion contract

The website should cause a qualified owner to think:

- this is not generic AI;
- this does the computer and paperwork jobs I hate;
- I can text it like an employee;
- it asks before anything risky;
- I can start without a platform rollout;
- an evening back or one more job could make this worthwhile.

Primary CTA: **Build my AI Employee**

Offer: **Start free. Managed AI Employee from $400.**

## Public estimator rule

The public estimator is an outdated acquisition/regression experiment. It is not the site's category model, flagship experience, pricing model, or launch proof.

## Implementation posture

This folder is the implementation authority for the public website. During the implementation session, place the site source here or create an explicitly documented app subdirectory here. Do not scatter the new public site across unrelated root folders.

Before code is written, inspect the current public-site source, deployment/DNS arrangement, onboarding destination, analytics, forms, routes, redirects, and canonical metadata. Preserve only what is still useful and true.