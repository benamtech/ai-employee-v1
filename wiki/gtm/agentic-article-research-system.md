# Agentic Article Research System

**Status: active** · _Created 2026-07-04. Handoff/spec for building the AMTECH `amtech-article-research-writer` skill in the website repo. Business truth comes from this wiki, not the live AMTECH site._

## Purpose

Build a volume-first article engine for AMTECH that publishes many high-utility, high-information-gain articles across a large graph around AI agents for small business.

This is not a narrow contractor blog and not an AI spam workflow. The system should pre-empt real questions, explain fast-moving AI news, and materialize the same knowledge into many surfaces: human article, AI Overview-ready answer, schema, OKF/concept node, internal links, image pack, Pinterest pin, social/forum answer, and future tool/calculator nodes.

The website-repo implementation target is a portable skill named:

```text
amtech-article-research-writer
```

## Non-negotiables

1. **Do not use the live AMTECH site as business evidence.** Use this repo wiki for AMTECH positioning, product truth, segments, offer ladder, and graph shape. The live site can be inspected only as an implementation surface if the website repo agent needs local code context.
2. **Traffic first, but not junk.** The engine should publish at volume, but every article must answer a specific valuable question and add information gain.
3. **Source-backed current events.** Any article built from current AI news must use recent sources and carry a claim ledger. Recency-sensitive claims need post-March-2026 sources unless the article explicitly cites older background.
4. **Graph first.** Pick nodes and edges before titles. Titles are outputs of graph strategy, not the strategy.
5. **AMTECH bridge only when natural.** Articles must be useful whether or not the reader buys. The AMTECH bridge should explain how an AI Employee operationalizes the idea, not hijack the article into a sales page.
6. **No clickbait patterns.** Avoid "ultimate guide," "top X tips," "what nobody tells you," Reddit-spam phrasing, and vague curiosity hooks.

## Internal source of truth

Implementation agents should read these local files before building the skill:

- [`../00-decision.md`](../00-decision.md) - AMTECH position, AI Employee ladder, pricing, beachhead, second beachhead.
- [`../segments/contractors.md`](../segments/contractors.md) - contractor graph and estimate pain.
- [`../segments/bookkeeping.md`](../segments/bookkeeping.md) - second beachhead and document-intake graph.
- [`../offers/wedge-offers.md`](../offers/wedge-offers.md) - consultative first work, tuned package, Employee ladder, connector tiers, approval gate.
- [`../offers/skill-catalog.md`](../offers/skill-catalog.md) - contractor skill lanes and graph traversals.
- [`../principle-graph-materialization.md`](../principle-graph-materialization.md) - graph and materialized-view doctrine.
- [`../principle-deliverable-driven-surfaces.md`](../principle-deliverable-driven-surfaces.md) - deliverable types, previews, proof, and approval gates.
- [`../product-agent-platform-architecture.md`](../product-agent-platform-architecture.md) - AMTECH-owned layer over Hermes, Manager, connectors, and event mesh.

## External research foundation

The skill should include a short research doctrine based on these post-March-2026 sources. These are not AMTECH business evidence; they are operating evidence for AI search, agentic research, GEO, and multi-surface publishing.

| Source | Date | What the skill should learn |
|---|---:|---|
| Google Search Central, "Optimizing your website for generative AI features on Google Search" | 2026-06-29 | Google describes RAG, query fan-out, non-commodity content, images/video, technical SEO, local/ecommerce details, and myths around llms.txt/chunking/schema hacks. |
| web.dev, "Build agent-friendly websites" | 2026-04-01 | Browser agents read screenshots, raw HTML, accessibility trees, and combined modalities; pages and tools need stable semantic structure. |
| Google Cloud, "Introducing the Open Knowledge Format" | 2026-06-12 | OKF is a markdown/YAML concept-bundle projection for humans and agents, useful as an orientation surface, not a replacement for crawlable pages. |
| arXiv:2605.12887, EcoGEO | 2026-07-01 | LLM search agents are influenced by evidence ecosystems and browsing trajectories, not just isolated pages. |
| arXiv:2606.20065, GEO at Scale | 2026-06 | AI visibility should be measured across engines by citation, recommendation, and source patterns. |
| arXiv:2604.25707, Citation Selection to Citation Absorption | 2026-04 | A cited source is not always absorbed into the final answer; measure both selection and contribution. |
| arXiv:2605.06635, Cited but Not Verified | 2026-05 | Deep research agents often produce citations that are accessible and relevant but do not fully support factual claims. |
| arXiv:2606.18037, ProvenanceGuard | 2026-06 | Source ownership and claim-to-source mapping are separate factuality axes. |
| Pinterest Business creative best practices | current | Use platform-native creative specs, especially vertical 2:3 assets, titles, descriptions, and clear visual subject matter. |

URLs:

- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://web.dev/articles/ai-agent-site-ux
- https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
- https://arxiv.org/abs/2605.12887
- https://arxiv.org/abs/2606.20065
- https://arxiv.org/abs/2604.25707
- https://arxiv.org/abs/2605.06635
- https://arxiv.org/abs/2606.18037
- https://business.pinterest.com/creative-best-practices/

## Graph strategy

The article system should maintain a broad AMTECH-tuned knowledge graph. The graph is allowed to extend far beyond the current sales beachhead because the goal is traffic, topical authority, and future agent-readable surface area.

### Core graph clusters

| Cluster | Purpose | Example entities |
|---|---|---|
| AI agents for small business | Own the practical "AI employee" category before buyers know the term. | AI employee, business brain, approval gate, skill, connector, Gmail, Stripe, calendar, files, onboarding, operating context |
| Contractor AI | Capture practical demand and AMTECH's strongest product wedge. | estimate, line item, job photos, customer message, painting, landscaping, hardscaping, deposit invoice, materials, follow-up |
| Business setup with AI | Capture founders and SMB owners at formation moments. | business setup, Stripe account, business email, CRM, website, bookkeeping, first offer, AI employee onboarding |
| Current AI news for SMBs | Turn fast-moving AI news into durable explainers with small-business implications. | sovereign AI, physical AI, AI agents, model releases, agent protocols, AI search changes, robotics, local automation |
| Agentic SEO and GEO | Build authority around the publishing strategy AMTECH is using. | query fan-out, evidence ecosystem, AI citations, OKF, llms.txt, schema, Reddit/forum citation, image SEO, Pinterest |
| Tool and workflow how-tos | Answer exact operational questions people search when they are about to act. | write an estimate in ChatGPT, connect AI to Stripe, build a business brain, use AI to answer emails, create a proposal |

### Node schema

Every planned article node should have this structure:

```yaml
node_id: short-kebab-case
primary_entity: string
cluster: string
audience: string
question: string
search_intent: informational | operational | news-explainer | comparison | setup | troubleshooting
freshness_requirement: evergreen | current | breaking
traffic_thesis: string
information_gain_thesis: string
amtech_bridge: string
fanout_queries:
  - string
internal_edges:
  - target: string
    relationship: string
source_requirements:
  - official
  - primary_reporting
  - research
  - operator_voice
surface_requirements:
  - article
  - schema
  - okf
  - image_pack
  - pinterest_pin
  - social_snippets
  - future_tool_node
publish_priority: 1-5
```

## Article archetypes

The skill should support multiple article shapes so volume does not collapse into one template.

| Archetype | Use when | Required output shape |
|---|---|---|
| News-to-operator explainer | A current AI event is interesting but readers need the mechanism and SMB implication. | What happened, why it matters, mechanism, small-business implication, what to do now, citations. |
| Exact workflow how-to | Searcher wants to do a job with ChatGPT/Claude/AI. | Direct answer, step-by-step, checklist, prompt/template, failure modes, when to use an AI Employee. |
| Category definition | A term is becoming important and under-explained. | Definition, examples, non-examples, graph edges, why SMBs should care, citations. |
| Operational comparison | Buyer compares DIY AI, software, human assistant, and AMTECH-style employee. | Decision table, costs, trust/risk, workflow fit, recommendation by scenario. |
| Business setup playbook | User is forming or reorganizing a business. | Ordered setup path, tool/account explanations, approvals, risks, skill/agent automation points. |
| Agentic SEO field note | AMTECH observes or uses a publishing tactic. | Claim, evidence, method, limitations, tactical checklist, graph implication. |
| Tool/calculator seed | Article implies an interactive asset. | Explanation plus future tool spec and data inputs. |

## Current-event pattern

Use current AI news as traffic acquisition when it can be converted into a durable node.

Example: Japan's 2026 sovereign/physical AI push.

Reported facts to verify from current sources before publishing:

- Japan is backing a domestic AI or physical-AI model effort.
- Noetra is reported as the consortium/project vehicle.
- Reporting names companies such as SoftBank, Sony, NEC, Honda, and AIST/METI involvement.
- Reported funding figures and dates vary by source and must be attributed precisely.

Potential article node:

```yaml
node_id: japan-sovereign-ai-small-business
primary_entity: sovereign AI
cluster: current-ai-news-for-smbs
question: "What does Japan's sovereign AI push mean for small business AI agents?"
traffic_thesis: "AI policy news gets attention; the information gain is translating national AI infrastructure into the practical idea of a business-owned operational AI layer."
information_gain_thesis: "Sovereign AI is the country-scale version of the same control problem a business has: context, tools, trust boundaries, and action rights."
amtech_bridge: "A small business does not need a national model, but it does need an AI employee that knows its business, connects to tools, and acts only behind approvals."
fanout_queries:
  - "what is sovereign AI"
  - "what is physical AI"
  - "why is Japan funding AI robots"
  - "do small businesses need their own AI agents"
  - "what does an AI employee connect to"
```

Possible title style:

```text
What Japan's Sovereign AI Push Means for Small Business AI Agents
```

Not:

```text
Japan Just Changed AI Forever
```

## Production pipeline

### 1. Select a graph node

Rank candidate nodes by:

- traffic potential
- freshness opportunity
- query fan-out richness
- internal-link value
- image/social surface potential
- AMTECH strategic relevance
- ability to produce a useful answer without selling

Do not start with a title. Start with a node.

### 2. Build a research ledger

The skill must produce a ledger before drafting:

```yaml
sources:
  - source_id: S1
    url: string
    title: string
    publisher: string
    published_or_updated: YYYY-MM-DD
    accessed: YYYY-MM-DD
    source_type: official | primary_reporting | research_paper | operator_voice | job_posting | commentary | vendor | social
    trust_tier: high | medium | low
    claims:
      - claim_id: C1
        claim: string
        evidence_span_summary: string
        use_in_article: true
        caveat: string
```

Rules:

- Vendor pages can support product/category context, not market pain unless they provide primary data.
- Social/forum evidence can support language and discovery patterns, but should be labeled and not overgeneralized.
- Current-event numbers must be attributed to the publisher that reported them.
- If sources conflict, state the conflict rather than smoothing it out.

### 3. Simulate query fan-out

Generate:

- direct query
- definitional fan-outs
- practical fan-outs
- comparison fan-outs
- risk/compliance fan-outs
- image/video fan-outs
- local/industry fan-outs if relevant

Then decide which fan-outs belong in the article and which should become separate nodes.

### 4. Choose the information-gain thesis

The article cannot proceed unless it can state:

```text
This article adds information gain because ...
```

Good information gain:

- connects a news event to a durable operating principle
- explains a practical workflow step-by-step
- makes a useful distinction competitors skip
- gives a table, checklist, or decision framework
- exposes a failure mode in naive AI use
- translates enterprise AI news into SMB action
- creates a reusable graph/concept node

Bad information gain:

- summarizing the same news everyone else summarized
- generic "AI will transform small business"
- "top tools" list without a decision framework
- weak trend article with no action path

### 5. Draft from the ledger

Default article structure:

```text
Direct answer
What happened / what the question means
Why it matters
The practical mechanism
Actionable steps or decision framework
What not to do
Where an AI employee fits
Internal graph links
FAQ
External research cited
```

For exact how-to articles, use:

```text
Direct answer
Before you start
Step-by-step workflow
Copy/paste prompt or checklist
Common failure modes
When ChatGPT is enough vs when an AI Employee is better
FAQ
External research cited
```

### 6. Create the surface pack

Every article must produce:

```yaml
surface_pack:
  seo:
    title: string
    meta_description: string
    canonical_slug: string
    target_queries: []
  schema:
    article: true
    faq_page: true_or_false
    breadcrumbs: true
    about_entities: []
    visible_claim_check: passed_or_failed
  internal_links:
    - url_or_slug: string
      anchor: string
      relationship_reason: string
  okf_projection:
    concepts: []
    edges: []
    source_notes: []
  image_pack:
    hero_image_brief: string
    explanatory_diagram_brief: string
    workflow_visual_brief: string
    alt_texts: []
    captions: []
  pinterest_pack:
    pin_title: string
    pin_description: string
    visual_brief: string
    aspect_ratio: "2:3"
    destination_slug: string
  social_snippets:
    linkedin: string
    reddit_style_answer: string
    youtube_description: string
  future_tool_node:
    should_create: true_or_false
    tool_name: string
    inputs: []
    output: string
```

### 7. Run the citation audit

Block publication if:

- a factual claim has no supporting source
- a citation is only topically related but does not support the claim
- a current-event claim uses stale sources
- the title promises a claim the article does not prove
- schema describes content that is not visible
- the AMTECH bridge claims capabilities not supported by the wiki/product docs

## Esoteric SEO as surface arbitrage

Do not encode "hacks" as magic ranking factors. Encode repeatable surface arbitrage.

### Evidence ecosystem

One article should create or strengthen:

- one primary article URL
- adjacent article nodes
- concept/OKF nodes
- image assets
- schema
- internal links with relationship reasons
- social/forum answers
- future tool/calculator nodes

This follows the EcoGEO idea: influence comes from the broader evidence environment and the path agents take through it, not one page in isolation.

### Trajectory design

Every article should point agents and readers along useful paths:

```text
AI news event -> durable concept -> SMB workflow -> AMTECH product concept -> practical tool/checklist
```

Example:

```text
Japan sovereign AI -> sovereign AI -> business-owned AI layer -> AI Employee -> business brain setup checklist
```

### Image and Pinterest system

Every major article gets at least three image concepts:

1. A clean explanatory diagram.
2. A workflow/operator visual.
3. A vertical Pinterest pin.

Pin constraints:

- default 2:3 aspect ratio
- clear subject, not vague atmosphere
- visible headline only if it can be read cleanly
- article entity in title and description
- no misleading "viral" phrasing

### Forum/social answer system

Produce reusable helpful answers for:

- Reddit-style communities
- LinkedIn posts
- YouTube descriptions
- short social explainers

These must be useful standalone answers, not disguised ads. Mention AMTECH only when the venue and context make it natural.

### Tool/calculator expansion

If an article teaches a repeatable process, propose a future interactive asset:

- estimate prompt builder
- estimate confidence checklist
- AI business setup checklist
- Stripe readiness checklist
- AI Employee readiness quiz
- business brain completeness score
- contractor follow-up planner

Articles should seed tools; tools should link back to articles; both should project into the graph.

## Title rules

Titles should name the actual question or mechanism.

Good:

```text
What Japan's Sovereign AI Push Means for Small Business AI Agents
How to Write an Estimate in ChatGPT Without Trusting a Fake Number
The Easiest Way to Set Up a New Business With AI
What an AI Employee Can Actually Do for a Contractor
How to Connect AI to Stripe Without Letting It Move Money Unapproved
```

Bad:

```text
Japan Just Changed AI Forever
7 AI Secrets Every Contractor Must Know
This One AI Trick Will Save Your Business
The Ultimate Guide to AI for Small Business
```

## Skill output contract

The implemented skill should return a structured bundle:

```yaml
article_brief: {}
research_ledger: {}
entity_graph: {}
fanout_map: {}
information_gain_thesis: string
draft_article: markdown
citation_audit: {}
schema_plan: {}
internal_link_plan: []
okf_projection: {}
image_and_pin_pack: {}
social_snippet_pack: {}
future_tool_node: {}
publish_checklist: []
blocked: boolean
block_reasons: []
```

## Website-repo implementation notes

The website-repo agent should adapt names and paths to the actual repo, but the implementation should usually create:

```text
skills/amtech-article-research-writer/SKILL.md
docs/seo/ARTICLE_RESEARCH_WRITER_SYSTEM.md
docs/seo/ARTICLE_GRAPH_NODES.md
docs/seo/ARTICLE_SURFACE_PACK_SPEC.md
```

If the website repo already has a skill registry, install/register the skill there instead of inventing a parallel registry.

The `SKILL.md` should contain the operational workflow; the docs should preserve the doctrine, graph node schema, surface pack contract, and examples.

## Copy-ready implementation prompt

Use this in the website repo:

```text
Build the AMTECH `amtech-article-research-writer` skill.

Do not use the live AMTECH site as business evidence. Use the local repo docs and the GTM-RESEARCH wiki handoff as the source of truth for AMTECH positioning, AI Employee capabilities, approval gates, skills, and graph materialization. The live site is only implementation context.

The skill must create volume-first, high-information-gain articles across a broad AMTECH knowledge graph: AI agents for small business, AI employees, contractor AI, business setup with AI, current AI news interpreted for SMBs, agentic SEO/GEO, and practical AI workflow how-tos.

Implement:
1. graph node schema
2. research ledger schema
3. query fan-out workflow
4. information-gain gate
5. claim-grounded drafting workflow
6. surface pack output: SEO, schema, internal links, OKF/concept projection, images, Pinterest, social/forum snippets, future tool node
7. citation audit and publish-block rules
8. acceptance tests using these article briefs:
   - What Japan's Sovereign AI Push Means for Small Business AI Agents
   - How to Write an Estimate in ChatGPT Without Trusting a Fake Number
   - The Easiest Way to Set Up a New Business With AI
   - What an AI Employee Can Actually Do for a Contractor
   - How to Connect AI to Stripe Without Letting It Move Money Unapproved

The skill should block generic clickbait, unsupported claims, vendor SEO treated as demand evidence, invisible schema claims, and any article that cannot state its information-gain thesis.
```

## Acceptance tests

Run the skill against five briefs:

| Brief | Must prove |
|---|---|
| What Japan's Sovereign AI Push Means for Small Business AI Agents | Current-event sourcing, mechanism translation, SMB implication, AMTECH bridge without fake direct relevance. |
| How to Write an Estimate in ChatGPT Without Trusting a Fake Number | Practical how-to, contractor graph, line-item/assumption discipline, clear DIY vs AI Employee threshold. |
| The Easiest Way to Set Up a New Business With AI | Business setup graph, Stripe/email/website/bookkeeping explanation, AMTECH onboarding bridge. |
| What an AI Employee Can Actually Do for a Contractor | Clear category definition, examples, approval gate, connectors, graph traversals. |
| How to Connect AI to Stripe Without Letting It Move Money Unapproved | Tool connection explanation, money-movement risk, approval gate, auditability. |

Pass criteria:

- article is useful without becoming an AMTECH customer
- source ledger exists
- every factual claim maps to a source ID
- title is specific and non-clickbait
- article maps to at least three graph nodes
- internal links have relationship reasons
- image/Pinterest pack exists
- schema describes only visible content
- OKF/concept projection exists
- future tool node is considered
- no live AMTECH site content is used as business evidence

## Operating line

> Pick the graph node first, prove the current claim, write the useful answer, then materialize every surface that can help a human, crawler, AI system, or future AMTECH agent traverse the same knowledge.
