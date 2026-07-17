# 13 — Academic and Normative Basis for Validation Vectors

Status: evidence map for `04-feature-validation-vectors.md`, `05-pass-fail-vectors.md`, and `12-compiler-design-and-autonomy-validation-addendum.md`
Updated: 2026-07-17

## Interpretation rule

A paper may justify a representation, metric, statistical method, or known failure mode without justifying AMTECH's exact threshold.

Every gate therefore distinguishes:

- theory or metric definition;
- academic empirical evidence;
- normative platform behavior;
- AMTECH engineering risk budget.

Do not write “research proves the threshold” unless the cited source actually establishes that threshold under comparable conditions.

## HRR/VSA and high-dimensional geometry

### HRR-PLATE

Tony A. Plate, “Holographic Reduced Representations,” *IEEE Transactions on Neural Networks* 6(3), 623–641, 1995. DOI `10.1109/72.377968`.

Supports:

- fixed-width distributed representations of compositional structure;
- circular convolution binding;
- arbitrary role/filler bindings, sequences, and frame-like structures;
- noisy reconstruction and cleanup memory.

Does not establish:

- website relevance;
- AMTECH's retrieval thresholds;
- production dimension;
- conversion or SEO lift.

Used by: V01–V04, PF-HRR-01/02/05.

### LEXICON-JONES

Michael N. Jones and Douglas J. K. Mewhort, “Representing Word Meaning and Order Information in a Composite Holographic Lexicon,” *Psychological Review* 114(1), 1–37, 2007. DOI `10.1037/0033-295X.114.1.1`, PMID `17227180`.

Supports:

- convolution/superposition representations that contain meaning and recoverable order information;
- the possibility that structural information can live in the representation rather than only in higher-level transition rules.

Does not establish:

- page-materialization quality;
- arbitrary user-trait inference;
- universal language understanding.

Used by: structured-role rationale in V02/V07 and Phase 1 synthesis.

### HDC-KANERVA

Pentti Kanerva, “Hyperdimensional Computing: An Introduction to Computing in Distributed Representation with High-Dimensional Random Vectors,” *Cognitive Computation* 1(2), 139–159, 2009. DOI `10.1007/s12559-009-9009-8`.

Supports:

- high-dimensional random vectors and near-orthogonality;
- distributed representation and computing in superposition;
- robustness intuition for HDC/VSA systems.

Used by: PF-HRR-01/04 and PF-DIM-01.

### VSA-SURVEY

Denis Kleyko, Dmitri A. Rachkovskij, Evgeny Osipov, and Abbas Rahimi, “A Survey on Hyperdimensional Computing aka Vector Symbolic Architectures, Part I: Models and Data Transformations,” *ACM Computing Surveys* 55(6), 2022. DOI `10.1145/3538531`.

Denis Kleyko et al., “Vector Symbolic Architectures as a Computing Framework for Emerging Hardware,” *Proceedings of the IEEE* 110(10), 1538–1571, 2022.

Supports:

- the broader VSA/HDC family;
- bundling, binding, permutation, similarity, and capacity considerations;
- implementation and emerging-hardware context;
- “computing in superposition” as classical distributed computation.

Used by: V01–V04, PF-HRR-01/04/05/06, PF-DIM-01.

### SUPERPOSITION-CAPACITY

E. Paxon Frady, Denis Kleyko, and Friedrich T. Sommer, “Theory of the Superposition Principle for Randomized Connectionist Representations in Neural Networks,” arXiv `1707.01429`, 2017.

Supports:

- explicit analysis of crosstalk noise and capacity under superposition;
- capacity as dimension-, item-count-, dictionary-, and noise-dependent;
- the requirement to publish a capacity curve rather than select a bundle limit by intuition.

Used by: PF-HRR-06, PF-REL-05, PF-DIM-01.

### HRR-STABILITY

Ashwinkumar Ganesan et al., “Learning with Holographic Reduced Representations,” arXiv `2109.02157`, 2021.

Supports:

- numerical instability as a real HRR failure mode;
- projection/normalization as an experimentally useful stabilization method;
- empirical cross-implementation and repeated-composition testing.

Used by: V02 and PF-HRR-02/03.

### JL-ACHLIOPTAS

Dimitris Achlioptas, “Database-Friendly Random Projections: Johnson–Lindenstrauss with Binary Coins,” *Journal of Computer and System Sciences* 66(4), 671–687, 2003. DOI `10.1016/S0022-0000(03)00025-4`.

Supports:

- dimension as a probabilistic distortion-versus-cost tradeoff;
- random-projection concentration principles;
- dimension-aware rather than dimension-independent geometry gates.

The dimension-aware absolute-cosine bounds in PF-HRR-04 use the normal approximation for independent random unit vectors plus a conservative AMTECH multiplier. They are not quoted thresholds from this paper.

Used by: PF-HRR-04 and PF-DIM-01.

## Information retrieval evaluation

### NDCG-JARVELIN

Kalervo Järvelin and Jaana Kekäläinen, “Cumulated Gain-Based Evaluation of IR Techniques,” *ACM Transactions on Information Systems* 20(4), 422–446, 2002. DOI `10.1145/582415.582418`.

Jaana Kekäläinen and Kalervo Järvelin, “Using Graded Relevance Assessments in IR Evaluation,” *Journal of the American Society for Information Science and Technology* 53(13), 1120–1129, 2002. DOI `10.1002/asi.10137`.

Supports:

- graded relevance;
- rank-sensitive gain metrics;
- NDCG as an appropriate metric when highly relevant results should be ranked first.

Does not establish `0.80` or `+0.05` as universal acceptance thresholds.

Used by: V07 and PF-REL-01/02/03.

### REL-VOORHEES

Ellen M. Voorhees, “Variations in Relevance Judgments and the Measurement of Retrieval Effectiveness,” *Information Processing & Management* 36(5), 697–716, 2000. DOI `10.1016/S0306-4573(00)00010-8`.

Supports:

- retaining and analyzing assessor disagreement;
- checking whether comparative system rankings remain stable across judgment sets;
- test-collection reliability as an empirical property.

Used by: PF-REL-01/03/04.

### CALIBRATION-GUO

Chuan Guo, Geoff Pleiss, Yu Sun, and Kilian Q. Weinberger, “On Calibration of Modern Neural Networks,” *Proceedings of ICML*, PMLR 70, 1321–1330, 2017.

Supports:

- model confidence is not automatically calibrated;
- reliability diagrams, expected calibration error, and post-hoc calibration as useful evaluation/repair methods.

AMTECH's resolver is not necessarily a neural network, but the confidence-calibration principle still applies to score-to-selection mappings.

Used by: PF-REL-07.

## Compression and approximate retrieval

### PQ-JEGOU

Hervé Jégou, Matthijs Douze, and Cordelia Schmid, “Product Quantization for Nearest Neighbor Search,” *IEEE Transactions on Pattern Analysis and Machine Intelligence* 33(1), 117–128, 2011. DOI `10.1109/TPAMI.2010.57`.

Supports:

- explicit accuracy/memory/speed evaluation for compressed vector search;
- measuring approximate distance and ranking quality rather than assuming quantization is harmless.

Does not establish AMTECH's `0.5%` top-1 inversion or `0.01` NDCG budget.

Used by: V03 and PF-DIM-02.

## Near-duplicate detection and content quality

### DUP-BRODER

Andrei Z. Broder, “On the Resemblance and Containment of Documents,” *Compression and Complexity of Sequences*, 21–29, 1997. DOI `10.1109/SEQUEN.1997.666900`.

Supports:

- shingle-based document resemblance and containment;
- sampled fingerprints for large-scale near-duplicate detection;
- distinguishing whole-document resemblance from containment.

Used by: PF-SEO-08.

### SIMHASH-CHARIKAR

Moses S. Charikar, “Similarity Estimation Techniques from Rounding Algorithms,” *STOC 2002*, 380–388. DOI `10.1145/509907.509965`.

Supports:

- locality-sensitive hashing for compact similarity estimation;
- SimHash-style cosine similarity sketches.

Used by: PF-SEO-08 and optional large-corpus retrieval experiments.

### ORPHAN-ARORA

Akhil Arora, Robert West, and Martin Gerlach, “Orphan Articles: The Dark Matter of Wikipedia,” *Proceedings of the International AAAI Conference on Web and Social Media* 18, 2024. DOI `10.1609/icwsm.v18i1.31300`.

Supports:

- inbound-link absence as a practical discoverability problem for humans navigating a content graph;
- graph-level orphan auditing as more than a cosmetic concern.

This is not a Google-ranking study and does not prove an indexing outcome.

Used by: PF-SEO-07.

## Cloaking and crawler/human parity

### CLOAKING-INVERNIZZI

Luca Invernizzi et al., “Cloak of Visibility: Detecting When Machines Browse a Different Web,” *IEEE Symposium on Security and Privacy*, 2016.

Supports:

- split-view content as an observable and adversarial web failure mode;
- repeated captures across browsing profiles;
- parity detection using content and behavior differences rather than user-agent assumptions alone.

Used by: V13 and PF-SEO-03.

## Normative Google Search sources

Academic research cannot define Google's current canonicalization, sitemap, structured-data, spam-policy, or Search Console behavior. Current official documentation is therefore normative for Google-specific gates.

### GOOGLE-CANONICAL

Google Search Central, “How to specify a canonical URL with rel=canonical and other methods” and “What is URL canonicalization.”

Supports:

- self-referential canonicals;
- redirects and canonical annotations as stronger signals than sitemap inclusion;
- consistent internal links and absolute canonical URLs;
- avoiding contradictory canonical signals.

Used by: PF-SEO-01/07/09.

### GOOGLE-SITEMAPS

Google Search Central, “Build and submit a sitemap” and “What is a sitemap.”

Supports:

- sitemap URLs should be absolute preferred canonical URLs;
- sitemaps aid discovery but do not guarantee crawling/indexing;
- internal links remain essential for discoverability.

Used by: PF-SEO-02/07/09.

### GOOGLE-NOINDEX

Google Search Central, “Control the content you share on Search.”

Supports:

- `noindex` as the rule for excluding lab/session/preview content from search results;
- access-control requirements for truly private content.

Used by: PF-SEO-02.

### GOOGLE-SPAM

Google Search Central, “Spam policies for Google Web Search.”

Supports:

- cloaking prohibition;
- scaled low-value/doorway and manipulative content boundaries;
- identical primary truth for crawlers and users.

Used by: PF-SEO-03/05.

### GOOGLE-STRUCTURED

Google Search Central, “General structured data guidelines” and feature-specific structured-data documentation.

Supports:

- markup must describe visible representative content;
- Rich Results Test and URL Inspection validation;
- valid markup does not guarantee a rich result.

Used by: PF-SEO-06.

### GOOGLE-INDEXING / GOOGLE-INSPECTION

Google Search Console, “URL Inspection tool” and single-page troubleshooting documentation.

Supports:

- live and indexed-view checks for concrete deployed URLs;
- verifying indexability, rendered content, canonical selection, and structured data after deployment.

Used by: PF-SEO-01/09.

## Threshold review summary

### Scientifically or normatively hard

- deterministic symbol identity under pinned inputs;
- explicit invalid-number and bounds handling;
- zero hard-policy violations;
- no crawler-only material truth;
- canonical/sitemap/structured-data consistency;
- complete baseline fallback.

### Literature-informed but empirically selected

- dimension and orthogonality bounds;
- bundle capacity;
- cleanup retrieval rate;
- NDCG and reviewer acceptability;
- confidence calibration;
- quantization tolerance;
- near-duplicate detector thresholds.

### Pure AMTECH engineering budgets

- `1e-5` numeric tolerance where not derived per operation;
- `99.5%`, `95%`, `99%` retrieval targets;
- `0.80` NDCG floor and `+0.05` uplift;
- `0.5%` quantized top-1 inversions;
- `2 MB` payload target;
- edge and web latency/size budgets.

These budgets are legitimate release gates because they are explicit and falsifiable. They are not academic facts and should be revised only through preregistered experiments, platform constraints, or risk analysis.
