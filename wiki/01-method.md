# 01 - Research Method

**Status: complete** · _Revised 2026-06-27._

## ⚠️ Evidence-quality warning — read before trusting any Reddit-derived claim

A large share of the segment pain evidence in this wiki was captured as **`reddit-search-capture`**: Firecrawl returned a Reddit thread's **title and a search snippet only — the full threads were never read.** Two problems compound this:

1. **The subs leaned on (r/smallbusiness, r/Entrepreneur, marketing/agency subs especially) are heavily astroturfed** by content marketers and vendor seed-posts. A title like "Overwhelmed by repair requests" can be a genuine operator *or* a marketing plant, and a snippet gives no way to tell.
2. **The brief explicitly warned that a prior pass was "ruined by vendor SEO."** This pass partially repeated that failure by treating unread snippets as operator evidence.

**Therefore:** treat every `reddit-search-capture` row in [`evidence/sources.md`](evidence/sources.md) as a **weak signal**, not proof. Any pain claim that rests only on those rows must be re-verified by a **direct operator conversation** before it drives a decision. The strongest evidence in this wiki is **not** Reddit — it is the salary/job-post anchors, the founder's domain knowledge, and (now) the fact that AMTECH already owns the Estimate skill that does the beachhead's #1 task.

## How this research was done

This wiki was built from the AMTECH discovery brief using a source-first workflow:

1. Firecrawl MCP search was used to find primary operator voices, especially Reddit threads, forums, job posts, and user-review style sources.
2. Candidate sources were logged in [`evidence/sources.md`](evidence/sources.md) before conclusions were written.
3. Segment pages were drafted from recurring evidence patterns, not vendor pain language.
4. Scores in [`evidence/scoring.md`](evidence/scoring.md) were assigned after all seven segment pages were drafted.
5. [`00-decision.md`](00-decision.md) was written last as the action document.

## Source rule applied

Pain evidence comes only from sources where operators, employees, admins, or buyers describe their own work. Reddit was the main discovery surface because the brief explicitly prioritizes operator language. Firecrawl search could discover Reddit results and capture titles/snippets, but direct Reddit page scraping returned an account/tooling limitation: Firecrawl reported that `reddit.com` and `old.reddit.com` direct scraping were unsupported for this account. Because of that, Reddit entries in the ledger are marked as `reddit-search-capture` when the captured language comes from Firecrawl search metadata rather than full-page scrape.

Vendor pages, blogs, and pricing pages were not used as proof of pain. They were used only for price anchors, competitor positioning, or macro-stat verification, and are labeled accordingly in the ledger.

## Verified vs. weak evidence

- **Verified** means the claim is backed by a ledger source that reflects operator language, job-task evidence, user-review language, a price anchor, or a credible report.
- **Search-captured Reddit** means Firecrawl discovered the Reddit URL and captured relevant thread title/snippet language, but the full thread was not scraped.
- **[UNVERIFIED]** means the claim was plausible but not sufficiently supported by the evidence collected in this pass.

## Inclusion criteria

Sources were included when they showed one of these:

- recurring task pain
- emotional operator language such as drowning, overwhelmed, can't keep up, disorganized, or behind
- a substitute behavior such as hiring an admin, VA, CSR, coordinator, dispatcher, or bookkeeper
- a price anchor for human labor or competitor software
- reachability or channel evidence
- regulatory or trust friction relevant to the first sale

## Exclusion criteria

Sources were demoted or excluded when they were:

- vendor SEO pages describing pain to sell software
- listicles or "best tools" pages without operator voice
- generic AI opportunity posts with no task shape
- sources that implied lead generation or cold-texting as the product

## Confidence and gaps

Confidence is highest for marketing agencies, bookkeeping/accounting, property management, real estate, and recruiting-style workflows because the evidence showed concrete recurring task pain and clear substitute roles. Confidence is moderate for insurance because task fit is strong but licensing, E&O, and carrier-process risk slow trust. Confidence is lower for contractors as a beachhead because pain is real but the owner is less desk-reachable and the workflows vary more by trade.

The main coverage gap is direct full-thread Reddit capture. The wiki compensates by keeping Reddit citations traceable to URLs, labeling search-captured entries, and using job-post/price/report anchors where accessible.
