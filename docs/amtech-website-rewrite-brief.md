# AMTECH Public Website Rewrite Brief

Status: canonical implementation brief
Created: 2026-07-17
Scope: first-principles rewrite of the public AMTECH AI website
Primary product truth: `../mvp-build/CODEGRAPH.md`
Design authority: `AMTECH_WEB_DESIGN_SYSTEM.md`
GTM authority: `../mvp-build/docs/gtm/free-infrastructure-managed-workforce-strategy.md`

## 1. Assignment

Rewrite the public AMTECH website from first principles around a new software category:

> **Your business gets an employee that lives in the software.**

AMTECH is not selling “AI tools,” a chatbot, generic automation, or another dashboard. AMTECH installs an always-on intelligent software worker for an owner-operated small business.

The employee notices work, remembers how the business operates, prepares estimates and communication, follows up, organizes proof, and asks the owner before actions that touch customers, money, or reputation.

The website must make that paradigm concrete before it explains the architecture.

## 2. Behavioral goal

Move a skeptical owner through this sequence:

1. **Recognition:** “That is the office work stealing my evenings.”
2. **Category clarity:** “This is not generic AI or another app I have to operate.”
3. **Concrete imagination:** “I could text this like an employee and get an estimate or follow-up back.”
4. **Control:** “It prepares the work and asks me before anything risky happens.”
5. **Economic relevance:** “An evening back or one more won job could justify this.”
6. **Low-friction action:** “I can start free without a massive platform rollout.”

The site succeeds when the owner can explain the product to another owner without using the words model, agent framework, orchestration, MCP, vector database, or workflow automation.

## 3. Audience

### Primary beachhead

Owner-operated painting, landscaping, hardscaping, remodeling, and adjacent service contractors.

Typical reality:

- the owner sells, estimates, schedules, handles customers, and supervises work;
- office work happens after the crew stops;
- estimates and follow-up live across memory, paper, texts, email, photos, and spreadsheets;
- another software dashboard is not welcome;
- the owner cares about speed, control, reputation, cash, and getting home.

### Secondary audience

Other owner-operated small businesses with substantial computer/document work. The homepage should communicate the broad category, while `/contractors` makes the first beachhead unmistakable.

## 4. Category and positioning

### Category statement

AMTECH installs AI Employees: persistent intelligent software workers that operate across the business's connected tools, paperwork, and routines under owner-defined approval gates.

### What it is not

Do not position AMTECH as:

- a chatbot;
- a CRM replacement headline;
- an automation builder;
- a collection of AI tools;
- an estimate generator;
- a virtual assistant subscription;
- a humanoid fantasy or job-destruction story.

The estimate is an excellent first work example. It is not the category.

### Pro-human stance

The employee removes the back-office swamp and preserves the owner for judgment, relationships, craftsmanship, trust, and money decisions.

Never imply that AMTECH replaces the owner or the trade. It should feel like leverage for a capable person, not a threat to them.

## 5. Canonical promise and offer

### Hero concept

**Your business gets an employee that lives in the software.**

### Supporting line

**Text it the job. It writes the estimate, follows up, organizes the proof, and asks before anything leaves your business.**

### Primary CTA

**Build my AI Employee**

### Secondary CTA

**See what it can do**

### Offer line

**Start free. Managed AI Employee from $400.**

### Trust promise

**It can prepare work. You approve the actions that touch customers, money, or reputation.**

## 6. The mechanism to teach

The central visual and narrative loop is:

```text
owner asks or an event arrives
-> AI Employee notices and works
-> proof appears
-> owner approves when required
-> customer/provider action happens
-> result and memory are preserved
```

The homepage should demonstrate this loop before introducing deep technical infrastructure.

A visitor should see a recognizable input, work in progress, a concrete result, an owner gate, and an external action with proof.

## 7. Website architecture

| Route | Job |
|---|---|
| `/` | Explain the paradigm, show the work loop, present the flagship offer, and create desire to build an employee. |
| `/ai-employee` | Define what the employee is, what it remembers, what it can do, and how it differs from tools/chatbots. |
| `/contractors` | Speak directly to painters, landscapers, and service contractors using their office-work pain and lead-to-cash examples. |
| `/how-it-works` | Explain creation, business memory, connected tools, working loop, owner gates, proof, and ongoing management. |
| `/security` | Explain credential custody, scoped access, employee isolation, approval gates, audit/proof, and what the employee cannot do silently. |
| `/pricing` | Present Start Free, Managed from $400, and custom Workforce with plain-English boundaries and no cluttered feature matrix. |
| `/proof` | Show product demonstrations, screenshots, work cards, estimates, messages, approvals, and before/after office-work examples with accurate evidence labels. |
| `/about` | Explain American Marketing Technology's pro-human mission and focus on owner-operated American small businesses. |

Do not create dozens of thin pages before these eight routes are excellent.

## 8. Homepage information architecture

### 8.1 Navigation

Minimal navigation:

- AI Employee
- Contractors
- How it works
- Security
- Pricing
- Proof
- About
- primary CTA: Build my AI Employee

Use a white/glass shell, strong alignment, and one decisive red action. Avoid an overloaded enterprise nav.

### 8.2 Hero — category in one screen

Required content:

- one restrained eyebrow, such as `THE SOFTWARE WORKER FOR SMALL BUSINESS`;
- hero headline;
- supporting line;
- primary and secondary CTAs;
- offer line;
- a living-work product scene, not a stock photo or abstract AI orb.

Hero product scene concept:

```text
Owner text:
“Turn these photos and notes into the Johnson estimate. Use our normal prep rules.”

Employee state:
Working — checked your pricing rules, job photos, and prior exterior jobs

Proof card:
Johnson Exterior Estimate
$8,420 · 11 line items · 3 assumptions

Owner gate:
Ready for your approval
[Review estimate]
```

The scene should feel like an installed worker with calm presence, not a chat demo floating in a browser frame.

### 8.3 Pain section — name the back-office swamp

Lead with specific owner reality:

- estimates after dinner;
- leads waiting while the crew is working;
- customer replies buried in email;
- photos and notes scattered across phones;
- invoices and follow-up delayed because the owner is the bottleneck.

Suggested headline:

**The workday ends. The office work does not.**

Do not use a generic pain-point icon grid. Use a compressed day-in-the-life sequence or a stack of unfinished work transforming into completed proof.

### 8.4 Paradigm section — software used to wait

Teach the shift in plain language:

```text
Old software:
You open it, find the record, enter the data, move the job, and remember the next step.

An AMTECH AI Employee:
It notices the work, prepares the next step, brings you the decision, and records what happened.
```

Suggested headline:

**Software used to wait for you. This employee goes to work.**

### 8.5 Work loop demonstration

Show four or five connected steps:

1. Owner asks or an event arrives.
2. Employee checks business memory and connected tools.
3. Employee prepares a concrete work product.
4. Owner approves a consequential action.
5. Action and proof are recorded.

Use real UI metaphors from the owner product: Tell Avery, Working, Needs your say, Proof, Connected.

### 8.6 Concrete work modules

Use six high-information examples, not a vague capabilities cloud:

1. **Estimate drafted** — job notes/photos -> line items, assumptions, confidence flags.
2. **Customer follow-up prepared** — quiet estimate -> relevant follow-up in the owner's voice.
3. **Gmail reply noticed** — customer response -> summary, next action, draft.
4. **Invoice/deposit prepared** — approved job -> payment request draft with owner gate.
5. **Reminder scheduled** — commitment -> timed follow-up with context.
6. **Proof organized** — files, messages, decisions, and provider result in one work record.

Each module must show input, work, output, and boundary. Avoid feature labels such as “AI email automation.”

### 8.7 Trust module

Suggested headline:

**It works with initiative. It does not get to gamble with your name.**

Required concepts:

- it may read approved business context and prepare work;
- it asks before sending customer communication, spending/collecting money, or taking reputation-sensitive action;
- connected-tool credentials remain in controlled custody;
- access is scoped to the employee/business;
- actions leave an audit/proof trail;
- the owner can disconnect, suspend, reject, or correct.

Visualize the boundary:

```text
Prepare freely within policy
        |
        v
Owner approval gate
        |
        v
Customer / money / provider action
        |
        v
Proof receipt
```

Do not lead this section with cryptography. Lead with what the owner controls; provide technical detail on `/security`.

### 8.8 Contractor module

Suggested headline:

**Built first for the owner who is still writing estimates at the kitchen table.**

Show a lead-to-cash sequence:

```text
lead arrives
-> job facts organized
-> estimate drafted
-> owner approves
-> customer receives it
-> follow-up prepared
-> deposit/invoice prepared
-> job proof preserved
```

CTA: `See AMTECH for contractors`.

### 8.9 Offer/pricing module

Present three simple cards:

#### Start Free

- one useful AI Employee;
- bounded usage;
- real work and owner approvals;
- no enterprise rollout;
- CTA: Build my AI Employee.

#### Managed — from $400/month

- managed connections and business context;
- higher capacity/priority;
- scheduled and event-driven work;
- recovery, maintenance, and support;
- CTA: Talk about managed.

#### Workforce — custom

- multiple roles, locations, or higher volume;
- custom approval and operating model;
- CTA: Design a workforce.

Do not publish hard quotas that are not enforced. Do not use a 40-row feature comparison.

### 8.10 Proof section

Suggested headline:

**Do not take our word for it. Look at the work.**

Show work artifacts and product demonstrations. Every item must carry an evidence label:

- `Live production proof` only when current real IDs/artifacts exist;
- `Product demonstration` for controlled examples;
- `Source-wired preview` for implemented but not live-accepted flows;
- `Concept` only for future behavior.

Never imply a demonstration came from a real customer or provider when it did not.

### 8.11 Final CTA

Suggested headline:

**Give the office work somewhere else to go.**

Support:

**Build an employee around your business, your rules, and the work you already do.**

Primary CTA: Build my AI Employee.

## 9. Page briefs

### `/ai-employee`

Answer:

- What is an AI Employee?
- What makes it persistent rather than a one-off chat?
- What can it notice, remember, prepare, and do?
- How does it use the business's language and rules?
- Where does the owner remain in control?
- Why is this different from a chatbot, CRM, or automation recipe?

Recommended structure:

1. category definition;
2. employee anatomy: presence, memory, connected tools, work, approvals, proof;
3. a day of work;
4. capability examples;
5. comparison with ordinary software;
6. trust boundary;
7. CTA.

### `/contractors`

Use contractor-readable language. Lead with evenings, estimates, leads, follow-up, photos, invoices, and deposits.

Show scenarios for painting and landscaping without making the platform appear limited to those trades.

Required proof story:

```text
owner sends voice note + photos
-> employee uses company pricing/prep rules
-> estimate draft appears
-> owner corrects/approves
-> follow-up and proof continue from the same job context
```

Avoid “streamline operations” and “increase efficiency.” Name the actual task and moment.

### `/how-it-works`

Explain six steps:

1. tell AMTECH about the business;
2. the employee is created with scoped identity and business memory;
3. connect approved tools;
4. text or talk to the employee, or let approved events wake it;
5. review consequential actions;
6. see proof and continue from durable memory.

Technical architecture belongs below this explanation in an optional “What is under the hood?” section.

### `/security`

Lead with owner questions:

- Can it send something without me?
- Where are my credentials?
- Can one employee see another business?
- Can I see what it did?
- What happens when something fails?

Explain:

- scoped employee identity;
- controlled credential custody;
- no provider master keys in employee runtime;
- isolated runtime/profile/workspace boundaries;
- approval gates;
- audit/proof;
- revocation, suspension, rotation, and repair;
- honest current status: source-wired controls are not represented as live-accepted until proof exists.

Do not expose exploitable operational detail or secrets.

### `/pricing`

Lead with the buying model, not a feature matrix:

- Start free to experience a useful employee.
- Managed from $400 when the employee becomes part of daily operations.
- Custom workforce for multi-role/location/high-volume needs.

Explain what changes operationally at each level and state that unusual integrations or high-volume computer use may require custom scope.

No fake discounts, crossed-out prices, “most popular” manipulation, or unsupported ROI claims.

### `/proof`

Organize by work, not testimonial count:

- estimates;
- customer communication;
- connected-tool events;
- invoices/payments;
- reminders/follow-up;
- owner approvals;
- proof/audit records.

Each item includes:

- what arrived;
- what the employee did;
- what the owner decided;
- what happened externally;
- evidence label and IDs/artifacts when publishable.

Redact customer/private data.

### `/about`

Position American Marketing Technology as pro-human, operator-oriented, and focused on giving small-business owners leverage once reserved for larger companies.

Avoid generic founder-story filler. Explain the conviction:

- small-business owners should not have to become software operators;
- improving intelligence should be installed around real work;
- humans remain at trust, taste, relationship, and money gates;
- AMTECH builds for American owner-operated businesses first.

## 10. Design system application

The website must use `AMTECH_WEB_DESIGN_SYSTEM.md` without reinterpretation unless that document is explicitly updated.

### Palette

- `ink` `#111111` — primary text/high contrast;
- `white` `#FFFFFF` — base/card surfaces;
- `canvas` `#F7F9FC` — page background;
- `red` `#E11D2A` — brand and primary action;
- `blue` `#2563EB` — system/information;
- `cyan` `#DFF6FF` — cool highlight;
- `green` `#168A57` — success/verified.

No orange, gold, beige, rainbow palette, or dark mode.

### Typography

- Inter/system sans;
- large, bold, tightly tracked headlines;
- compact, readable body copy;
- one small uppercase/mono eyebrow maximum per section;
- no stacked headline/subheadline/pill clutter.

### Surfaces

- light operational canvas;
- white/glass panels with restrained blur, border, and shadow;
- 16–24px card radii;
- tactile but calm controls;
- strong alignment and generous space;
- information-rich rather than decorative.

### Motion

Use motion to communicate work state:

- subtle progress/arrival;
- proof card materialization;
- owner-gate transition;
- connected-tool receipt.

Use 180–300ms opacity/translate/scale. No bouncing, glowing AI spectacle, particle fields, or endless typing animation.

### Living-worker feel

The product should feel present through status and work, not through an uncanny avatar.

Useful metaphors:

- Working;
- Watching;
- Needs your say;
- Ready for review;
- Sent/recorded proof;
- Connected capability.

Avoid robot heads, brains, magic wands, circuit-board stock art, and abstract purple gradients.

## 11. Component system

Build reusable components around the category:

- `EmployeePresence` — calm current state and next action;
- `OwnerRequest` — recognizable text/voice/job input;
- `WorkProgress` — bounded explanation of what is being checked/prepared;
- `ProofCard` — concrete artifact/result with evidence and source facts;
- `ApprovalGate` — exact consequential action and owner controls;
- `ActionReceipt` — provider/customer/system result and timestamp;
- `ConnectedTool` — plain-language capability state, not OAuth jargon;
- `WorkExample` — input -> work -> result -> gate -> receipt;
- `EvidenceLabel` — live proof / product demonstration / source-wired preview / concept;
- `OfferCard` — simple buying boundary;
- `ContractorLifecycle` — lead-to-cash sequence;
- `SecurityBoundary` — visual owner/scoped-credential/isolation/audit model.

Reuse the visual grammar of current owner-product work resources where appropriate. Do not copy internal admin density into the marketing site.

## 12. Copy system

### Voice

Direct, specific, calm, pro-human, contractor-readable, and economically literate.

### Preferred sentence pattern

Owner situation -> work performed -> concrete result -> control/proof.

Example:

> A customer replies while you are on a ladder. Your employee notices the email, checks the job, prepares the answer, and puts the exact send in front of you.

### Words and phrases to avoid

- unlock productivity;
- revolutionize your workflow;
- AI-powered solutions;
- seamless automation;
- transform your business;
- leverage cutting-edge technology;
- supercharge;
- game-changing;
- one platform for everything;
- autonomous without a precise boundary.

### Copy constraints

- No unsupported customer counts, savings, revenue, accuracy, or uptime.
- No synthetic testimonials presented as real.
- No “24/7” claim unless the actual service boundary supports it.
- No provider/runtime acceptance claim without current proof.
- No dense technical acronym in the first two homepage sections.
- Every section must add new information rather than rephrase the hero.

## 13. Proof and claim policy

The website is governed by the same realness rule as engineering documentation.

### Allowed

- clearly labeled product demonstrations;
- source-wired previews accurately described as such;
- real screenshots with private data redacted;
- live proof with publishable provider/runtime IDs or linked proof artifacts;
- factual architecture/security statements supported by current source and acceptance status.

### Not allowed

- implying a demo was generated by a live customer employee;
- using old public-estimator proof as normal-employee acceptance;
- presenting historical stack proof as acceptance of new WS1/WS2 boundaries;
- fabricated provider IDs, testimonials, conversations, or metrics;
- saying “fully autonomous” while owner gates remain part of the product contract.

A future content source should carry evidence metadata with every proof item:

```ts
type EvidenceLevel =
  | "live_production_proof"
  | "product_demonstration"
  | "source_wired_preview"
  | "concept";
```

## 14. Responsive behavior

Mobile is not a compressed desktop dashboard.

- Hero copy and CTA remain above the first product scene.
- Work-loop steps stack into a readable sequence.
- Proof and approval cards preserve exact action context.
- Navigation collapses to a simple menu with persistent primary CTA.
- Tap targets meet accessible size expectations.
- Tables become cards or horizontal detail groups.
- No critical meaning depends on hover.
- Motion respects reduced-motion preferences.

Contractors may first see the site from a phone in a truck or on a job. The core category must land within the first screen and first scroll.

## 15. Accessibility and performance

Required:

- semantic heading order;
- keyboard-accessible controls;
- visible focus states;
- contrast compliant with WCAG AA for normal text/actions;
- meaningful alt text or decorative-image omission;
- reduced-motion support;
- server-rendered, indexable route copy and metadata;
- optimized images/video with explicit dimensions;
- no autoplay audio;
- no heavy 3D/WebGL dependency for the core explanation;
- good Core Web Vitals on mid-range mobile devices.

The site must still explain the product if JavaScript animation fails.

## 16. SEO and information architecture

Write for category understanding and owner questions, not keyword stuffing.

Each route needs a distinct search intent and title:

- homepage: AI Employee for small business;
- AI Employee: definition/category/mechanism;
- contractors: AI office worker for service contractors;
- how it works: creation, tools, approval, proof;
- security: access, credentials, approvals, isolation;
- pricing: free and managed AI Employee pricing;
- proof: examples and demonstrations;
- about: American Marketing Technology/company mission.

Use structured data only when truthful. Do not add fake review/aggregate-rating schema.

Cross-link naturally between work examples, security boundaries, pricing, and contractor use cases.

## 17. Content/data architecture

Keep claims and proof maintainable.

Recommended content objects:

```ts
interface WorkExample {
  slug: string;
  audience: "contractor" | "general";
  trigger: string;
  work: string[];
  result: string;
  approval?: string;
  receipt?: string;
  evidenceLevel: EvidenceLevel;
  proofRefs?: string[];
}

interface Offer {
  name: string;
  priceLabel: string;
  buyerOutcome: string;
  operationalBoundary: string[];
  cta: string;
}
```

Keep proof references and evidence level separate from promotional copy so the UI cannot accidentally promote an unaccepted example.

## 18. Implementation sequence

### Phase 0 — inventory and route decision

- identify the current public-site code and deployment target;
- preserve required auth/onboarding paths;
- inventory reusable design tokens/components and recent owner-product patterns;
- identify redirects/canonicals from replaced routes;
- record current analytics/SEO metadata and forms.

### Phase 1 — foundation

- establish global tokens, typography, layout, nav/footer, metadata, accessibility primitives, and evidence-label contract;
- build the reusable worker-loop components;
- create content objects rather than hardcoding repeated claims.

### Phase 2 — homepage

Implement the entire category story and validate it on mobile before adding secondary routes.

### Phase 3 — product/contractor/mechanism

Build `/ai-employee`, `/contractors`, and `/how-it-works` from the same work-example and boundary components.

### Phase 4 — trust, pricing, and proof

Build `/security`, `/pricing`, and `/proof`. Proof ingestion must require evidence level.

### Phase 5 — about, SEO, analytics, polish

Complete `/about`, redirects, structured metadata, performance, accessibility, analytics events, and final copy audit.

## 19. Analytics events

Track intent without turning the site into a surveillance surface:

- primary CTA click by route/section;
- secondary demo/proof click;
- contractor page entry;
- pricing tier CTA;
- security-detail expansion;
- onboarding start;
- onboarding completion milestones where privacy-safe;
- contact/managed-interest submission.

Do not log free-text business/customer content into marketing analytics.

## 20. Acceptance criteria

### Category comprehension

- A cold contractor can explain the product as a software employee, not a chatbot or estimator.
- The first screen communicates worker, concrete work, owner control, free start, and managed price.

### Information quality

- Every section adds distinct information.
- Every capability is expressed through recognizable work.
- No generic AI filler or unsupported metric remains.

### Product truth

- Public estimator is not positioned as the product.
- Free + $400 managed strategy is consistent across routes.
- Approval gates, credential custody, and evidence labels are accurate.
- Source-wired examples are not presented as live production proof.

### Design

- Canonical light AMTECH palette and typography are used.
- No dark mode, purple AI gradient, decorative robot, or template-SaaS hero.
- The site feels like a calm command center/living worker rather than a dashboard catalog.

### Interaction

- Owner ask -> work -> proof -> approval -> action loop is visible and understandable.
- Mobile interaction preserves the loop and action context.
- Motion clarifies work state and respects reduced motion.

### Technical

- All eight routes render and have unique metadata.
- Core copy is server-rendered/indexable.
- Accessibility and performance checks pass.
- Forms and CTA destinations work.
- Redirects/canonicals preserve existing useful URLs.
- Proof content cannot ship without an evidence label.

## 21. Non-goals for the first rewrite

- a full customer dashboard redesign;
- a 3D avatar/voice character experience;
- an exhaustive capability marketplace;
- dozens of programmatic vertical pages;
- speculative enterprise architecture marketing;
- replacing the real `/create-ai-employee` onboarding with a fake demo;
- claiming production acceptance not established by current proof.

## 22. Final direction

The website should make intelligence feel installed, calm, useful, and controlled.

The owner should not leave thinking, “AMTECH has impressive AI.”

The owner should leave thinking:

> **I could hand this the office work I hate, review the important decisions, and get my evening back.**