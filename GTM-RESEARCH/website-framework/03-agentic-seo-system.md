# 03 — Agentic SEO System

Status: search and answer-system architecture

## Principle

The framework does not attempt to “hack” AI Overviews, AI Mode, ChatGPT, Gemini, or other answer systems.

It creates an unusually strong retrieval corpus:

- technically accessible;
- semantically explicit;
- original and specific;
- internally connected;
- evidence-aware;
- easy to quote, summarize, and verify;
- useful to a human who lands directly on the page.

Google's current guidance says AI features use the same foundational Search requirements and need no special AI markup. Query fan-out makes comprehensive topic graphs and specific subtopic pages valuable, but it does not justify scaled thin content.

## Two-layer model

### Canonical knowledge layer

Stable indexable URLs containing complete answers. These are the only pages intended for search indexing.

### Resolver presentation layer

Ephemeral bounded changes to example choice, module order, emphasis, and CTA. These variants do not create new canonical URLs and do not change the page's principal topic, factual claims, or evidence level.

## Topic graph

Primary entity:

- AMTECH AI Employee.

Primary relationships:

- is_a software employee;
- works_for owner-operated small business;
- performs computer/document office work;
- remembers business context;
- connects to approved tools;
- prepares estimates, follow-up, communication, invoices, reminders, and proof;
- requests owner approval at trust/money/reputation gates;
- offered as Start Free and Managed from $400.

Primary topic clusters:

1. AI Employee category and definition.
2. Contractor office-work problems.
3. Specific tasks and job-lifecycle stages.
4. How creation, memory, tools, approvals, and proof work.
5. Security, credential custody, isolation, and owner control.
6. Pricing and buying decisions.
7. Demonstrations and live evidence.
8. Comparisons with chatbots, CRMs, automation tools, VAs, and human hiring.
9. Implementation/readiness questions.

## Page qualification rule

An indexable page must pass all of these:

- distinct user question or decision;
- unique title/H1 and primary answer;
- at least one original example, model, calculation, diagram, dataset, proof object, or expert synthesis;
- materially different body structure from neighboring pages;
- useful internal links in and out;
- stable canonical URL;
- evidence and revision metadata;
- enough substance to satisfy the query without forcing another click.

A keyword variation alone never qualifies.

## Initial route graph

```text
/
├── /ai-employee
│   ├── future: /ai-employee-vs-chatbot
│   ├── future: /ai-employee-vs-automation
│   └── future: /what-can-an-ai-employee-do
├── /contractors
│   ├── future: /contractors/estimates
│   ├── future: /contractors/follow-up
│   ├── future: /contractors/email
│   └── future: /contractors/invoices-and-deposits
├── /how-it-works
│   ├── future: /business-memory
│   ├── future: /approval-gates
│   └── future: /connected-tools
├── /security
├── /pricing
├── /proof
└── /about
```

Future nodes launch only after the qualification rule and cannibalization review pass.

## Answer-block grammar

Every informational page begins with a concise direct answer that can stand alone, followed by evidence and nuance.

```text
H1 / question
2–4 sentence direct answer
key mechanism or definition
concrete example
limitations / trust boundary
proof or evidence
next related question
```

Use tables only when they improve comparison. Use headings that state the sub-question in natural language.

## Information-gain requirements

Original contribution may include:

- a contractor-specific workflow breakdown;
- a real product UI/proof object;
- a first-principles comparison;
- an explicit approval/risk model;
- a cost/time model with visible assumptions;
- anonymized live proof IDs/artifacts;
- source-code-backed product behavior;
- a diagram or decision tree;
- a failure-mode or implementation explanation;
- new field research or operator interviews.

Paraphrasing public sources is not enough.

## Entity system

Maintain a typed entity registry:

```ts
interface EntityRecord {
  id: string;
  type: "Organization" | "Product" | "Service" | "Audience" | "Task" | "Tool" | "Concept";
  name: string;
  aliases: string[];
  canonicalUrl?: string;
  description: string;
  sameAs: string[];
  relationships: Array<{ predicate: string; targetId: string }>;
  evidenceRefs: string[];
  updatedAt: string;
}
```

Use consistent names and `@id` references in JSON-LD. Do not invent `sameAs` profiles or unsupported relationships.

## Structured data policy

Use only visible, accurate markup.

Likely baseline:

- `Organization` on homepage/about;
- `WebSite` on homepage;
- `WebPage` on every canonical page;
- `BreadcrumbList` below root routes where useful;
- `Service` where the page genuinely describes the managed AI Employee service;
- `Article` only for true editorial/research pages;
- `FAQPage` only when visible FAQ content exists and current eligibility justifies it.

Never add:

- fake `aggregateRating`;
- invented reviews;
- hidden FAQ content;
- product/offer prices that do not match visible copy;
- schema for ephemeral resolver variants that differs from visible canonical content.

Validate generated JSON-LD against schemas and Google's Rich Results Test where applicable.

## Internal linking engine

The graph compiler proposes links, but editorial rules approve them.

Every page should link to:

- its parent category;
- two to five directly related questions;
- the relevant security/trust explanation when consequential action is discussed;
- the relevant proof object;
- the appropriate CTA.

Anchor text should state the destination meaning. Avoid repeated exact-match keyword blocks.

No orphan indexable pages.

## Sitemaps

Generate separate sitemaps by stable content class when volume justifies it:

- core pages;
- task/use-case pages;
- research/articles;
- proof pages;
- video/images if applicable.

Do not create “cluster-based sitemaps” for ephemeral shapes or variants. Only canonical `200` URLs belong in sitemaps.

Each sitemap build validates:

- canonical self-reference;
- indexability;
- last-modified source date;
- no redirects/404/noindex URLs;
- no duplicate content IDs.

## Metadata rules

- one stable title/H1 per canonical URL;
- metadata describes the canonical page, not the ephemeral variant;
- concise unique descriptions written for click comprehension;
- canonical is absolute and deterministic;
- Open Graph/Twitter assets are route-specific and optimized;
- revision date visible on technical/research content;
- author/reviewer identity shown where it increases trust and is truthful.

## Crawler accessibility

- semantic content in initial HTML;
- no essential copy behind client rendering;
- crawlable `<a>` links;
- correct HTTP status;
- robots and `noindex` used intentionally;
- CSS/JS assets crawlable where needed;
- no session/cookie requirement for canonical content;
- no search-bot-only content.

## Personalization/cloaking guard

For each route, define invariant content blocks that every visitor can access:

- main product/category answer;
- price/offer truth;
- trust boundary;
- evidence labels;
- principal CTA destination.

Resolver variants may:

- choose among equivalent examples;
- reorder secondary modules;
- emphasize a relevant proof card;
- select approved tone/CTA wording;
- collapse low-priority sections after the full HTML remains available or accessible.

Resolver variants may not:

- change the core topic to target a different query;
- show claims to bots that humans cannot see;
- alter price or evidence;
- inject repeated keywords;
- hide contradictory limitations;
- create a doorway experience.

Automated parity tests compare baseline and every variant.

## Content agent system

Agents may assist with research, gap detection, graph proposals, schema validation, internal-link suggestions, and first drafts.

Agents may not autonomously publish indexable pages.

Pipeline:

```text
question/intent proposal
-> corpus and search evidence
-> distinct-intent test
-> original-information plan
-> draft with evidence refs
-> claim/evidence validation
-> similarity/cannibalization scan
-> human/product review
-> build validation
-> publish
-> Search Console and conversion observation
```

Public-data ingestion must honor terms, robots, copyright, rate limits, and privacy. Playwright is not a blanket license to scrape.

## Agent/answer-system exports

Optional machine-readable outputs:

- XML sitemaps;
- RSS/Atom for research updates;
- JSON feed of public evidence-backed entities and pages;
- an `llms.txt` file as an experimental convenience only, not a ranking dependency;
- clean print/text views for long technical pages.

All exports point to canonical human-readable pages and contain no hidden claims.

## Measurement

Track:

- indexed canonical pages;
- crawl/index errors;
- query and page impressions/clicks;
- AI-feature traffic where identifiable in Search Console/analytics;
- branded/entity query coverage;
- citation/referral observations from answer systems;
- page-level conversion;
- content-assisted conversions;
- stale/evidence-invalid content;
- cannibalization and duplicate-intent alerts.

Do not claim causality from citation monitoring alone.

## Anti-spam launch gates

Fail launch if any of the following exist:

- generated thin pages;
- pages differing only by trade/city/keyword substitution;
- hidden machine-targeted copy;
- resolver output materially different for crawlers;
- fake reviews/ratings/proof;
- structured data not represented visibly;
- automated content without original value;
- indexable ephemeral variants;
- unsupported “best”/recommendation claims designed to poison answer systems;
- stale canonical or sitemap contradictions.