export function createAgentSiteFixture() {
  const sourceId = "source:agent-site-fixture";
  const evidenceId = `evidence:${sourceId}`;
  const project = {
    id: "project:agent-site-fixture",
    version: "1",
    business: {
      purpose: "Generate a complete evidence-bounded AMTECH website from business truth and an agent-discovered prospect ontology.",
      services: ["AI Employee infrastructure"],
      offers: ["Start Free", "Managed AI Employee from $400"],
      audiences: ["contractor owner-operators"],
      locations: ["United States"],
      workflows: ["estimate drafting", "owner approval", "QuickBooks handoff"],
      integrations: ["QuickBooks"],
      constraints: ["no fabricated proof", "no protected/private targeting", "owner approval"],
      proofPoints: ["source-wired framework fixture"],
      pricingFacts: ["Managed AI Employee from $400"],
    },
    brand: {
      name: "AMTECH",
      voice: ["direct", "operational", "human"],
      prohibitedLanguage: ["unlock", "revolutionize"],
      palette: { ink: "#111111", red: "#E11D2A", blue: "#2563EB", white: "#FFFFFF" },
      typography: ["Inter", "system-ui"],
      visualRules: ["light surfaces only", "restrained motion"],
      componentRules: ["semantic modules", "no decorative pills"],
    },
    technical: {
      repositoryRoot: ".",
      framework: "agent-operated static compiler",
      deploymentTarget: "static assets",
      browserTargets: ["Chrome >= 111", "Firefox >= 113", "Safari >= 16.4"],
      performanceBudgets: { criticalCssBytes: 24576, canonicalJsBytes: 1, htmlBytes: 131072 },
      accessibilityStandard: "WCAG 2.2 AA",
    },
    goals: {
      primaryConversions: ["Start Free"],
      searchOutcomes: ["specific problem and workflow discovery"],
      utilityOutcomes: ["customer-ready estimate", "approved QuickBooks handoff"],
      publicationRiskTolerance: "low",
      minimumInitialPages: 8,
      maximumInitialPages: 12,
    },
    sources: [{ id: sourceId, kind: "company", title: "AMTECH agent-site fixture authority", summary: "Synthetic source for ontology, vector-space, and page-program validation only.", retrievedAt: "2026-07-17", applicability: ["agent-site-fixture"], confidence: "verified" }],
    assets: [{ id: "asset:amtech-logo", kind: "logo", pathOrUri: "assets/amtech.svg", altOrPurpose: "AMTECH logo", rights: "owned" }],
  };

  const effects = {
    anchor: ["problem-framing", "workflow", "offer-fit", "utility", "conversion"],
    industry: ["problem-framing", "workflow", "vocabulary"],
    role: ["workflow", "proof", "conversion"],
    schedule: ["workflow", "utility"],
    lifestyle: ["vocabulary", "ui"],
  };
  const attribute = (id, label, dimensionHint, description, options = {}) => ({
    id,
    label,
    dimensionHint,
    description,
    sourceIds: [sourceId],
    evidenceIds: [evidenceId],
    confidence: options.confidence ?? 0.9,
    sensitivity: options.sensitivity ?? "operational",
    publicTargetingAllowed: options.publicTargetingAllowed ?? true,
    reviewerApproved: options.reviewerApproved ?? true,
    materialEffects: options.materialEffects ?? effects.industry,
    ...(options.anchorKind ? { anchorKind: options.anchorKind } : {}),
  });
  const attributes = [
    attribute("attr:service:estimate-ai", "AI estimate employee", "service", "AI Employee service for turning job notes into reviewable estimates.", { anchorKind: "service", materialEffects: effects.anchor }),
    attribute("attr:offer:start-free", "Start Free", "offer", "Free public or owner-started AI Employee entry path.", { anchorKind: "offer", materialEffects: effects.anchor }),
    attribute("attr:problem:estimate-backlog", "estimate backlog", "problem", "Unfinished estimates delayed by office workload.", { anchorKind: "problem", materialEffects: effects.anchor }),
    attribute("attr:topic:quickbooks", "AI with QuickBooks", "topic", "Estimate and accounting handoff questions involving QuickBooks.", { anchorKind: "topic", materialEffects: effects.anchor }),
    attribute("attr:intent:create-estimate", "create an estimate with AI", "intent", "Search or task intent to create a customer-ready estimate.", { anchorKind: "intent", materialEffects: effects.anchor }),
    attribute("attr:workflow:owner-approval", "owner approval", "workflow", "Owner reviews and approves the estimate before customer delivery.", { anchorKind: "workflow", materialEffects: effects.anchor }),
    attribute("attr:industry:painting", "painting contractor", "industry", "Painting contractor workflows and estimating vocabulary.", { materialEffects: effects.industry }),
    attribute("attr:industry:landscaping", "landscaping contractor", "industry", "Landscaping contractor workflows and estimate details.", { materialEffects: effects.industry }),
    attribute("attr:industry:roofing", "roofing contractor", "industry", "Roofing contractor workflows, measurements, and proof expectations.", { materialEffects: effects.industry }),
    attribute("attr:role:owner", "owner operator", "business-role", "Owner performs field work and office approval.", { sensitivity: "business", materialEffects: effects.role }),
    attribute("attr:role:office-manager", "office manager", "business-role", "Office manager prepares drafts for owner review.", { sensitivity: "business", materialEffects: effects.role }),
    attribute("attr:schedule:evening", "evening office work", "schedule", "Administrative work completed after field work.", { materialEffects: effects.schedule }),
    attribute("attr:schedule:daytime", "daytime office workflow", "schedule", "Administrative work completed during business hours.", { materialEffects: effects.schedule }),
    attribute("attr:pet:dog", "dog owner", "household-context", "Self-declared dog-owner context that may change examples and visual framing.", { sensitivity: "lifestyle", materialEffects: effects.lifestyle }),
    attribute("attr:pet:cat", "cat owner", "household-context", "Self-declared cat-owner context that may change examples and visual framing.", { sensitivity: "lifestyle", materialEffects: effects.lifestyle }),
    attribute("attr:duplicate:painting", "painting contractor", "industry", "Duplicate painting contractor description.", { confidence: 0.7, materialEffects: effects.industry }),
    attribute("attr:unsafe:medical", "medical condition", "health-status", "Private medical status inferred from behavior.", { sensitivity: "inferred-sensitive", publicTargetingAllowed: false, reviewerApproved: false, materialEffects: ["vocabulary", "ui"] }),
    attribute("attr:unreviewed:age", "late twenties", "age-cohort", "Age cohort proposed without explicit reviewer approval.", { sensitivity: "demographic", reviewerApproved: false, materialEffects: ["vocabulary", "ui"] }),
  ];

  const positiveIds = attributes.filter((item) => !item.id.startsWith("attr:duplicate") && !item.id.startsWith("attr:unsafe") && !item.id.startsWith("attr:unreviewed")).map((item) => item.id);
  const relation = (from, to, type = "compatible", weight = 0.8) => ({ id: `rel:${from}:${type}:${to}`, fromAttributeId: from, toAttributeId: to, type, weight, sourceIds: [sourceId], evidenceIds: [evidenceId], rationale: `${from} ${type} ${to} in the synthetic AMTECH fixture.` });
  const anchor = "attr:service:estimate-ai";
  const relations = [];
  for (const id of positiveIds.filter((id) => id !== anchor)) relations.push(relation(anchor, id, "compatible", 0.85));
  relations.push(relation("attr:problem:estimate-backlog", "attr:intent:create-estimate", "compatible", 0.95));
  relations.push(relation("attr:workflow:owner-approval", "attr:role:owner", "compatible", 0.9));
  relations.push(relation("attr:workflow:owner-approval", "attr:role:office-manager", "compatible", 0.9));
  relations.push(relation("attr:schedule:evening", "attr:role:owner", "compatible", 0.85));
  relations.push(relation("attr:pet:dog", "attr:pet:cat", "excludes", 1));
  relations.push(relation("attr:industry:painting", "attr:industry:landscaping", "excludes", 1));

  const observation = (id, industry, role, schedule, pet) => ({
    id,
    attributeIds: [anchor, "attr:offer:start-free", "attr:problem:estimate-backlog", "attr:intent:create-estimate", "attr:workflow:owner-approval", industry, role, schedule, pet],
    sourceIds: [sourceId],
    evidenceIds: [evidenceId],
    weight: 1,
    description: `${industry} ${role} ${schedule} ${pet}`,
  });
  const observations = [
    observation("obs:1", "attr:industry:painting", "attr:role:owner", "attr:schedule:evening", "attr:pet:dog"),
    observation("obs:2", "attr:industry:painting", "attr:role:office-manager", "attr:schedule:daytime", "attr:pet:cat"),
    observation("obs:3", "attr:industry:landscaping", "attr:role:owner", "attr:schedule:evening", "attr:pet:dog"),
    observation("obs:4", "attr:industry:landscaping", "attr:role:office-manager", "attr:schedule:daytime", "attr:pet:cat"),
    observation("obs:5", "attr:industry:roofing", "attr:role:owner", "attr:schedule:evening", "attr:pet:dog"),
    observation("obs:6", "attr:industry:roofing", "attr:role:office-manager", "attr:schedule:daytime", "attr:pet:cat"),
  ];
  const ontologyProposal = { id: "ontology:agent-site-fixture", version: "1", generatedBy: "stage-one-ontology-agent", generatedAt: "2026-07-17", sourceIds: [sourceId], attributes, relations, observations };
  return {
    project,
    ontologyProposal,
    vectorIdentity: { namespace: "agent-site-fixture", symbolVersion: "1" },
    opportunityPolicy: {
      minimumSupportWeight: 1,
      minimumRegionWidth: 4,
      maximumRegionWidth: 7,
      minimumCoherence: 0.08,
      minimumMaterialEffects: 2,
      neighborExpansionLimit: 24,
      maximumCandidateRegions: 400,
      minimumSelectedRegions: 8,
      maximumSelectedRegions: 12,
      minimumMarginalGain: 0,
      duplicateJaccardThreshold: 0.9,
      duplicateHrrThreshold: 0.97,
      hrrDimensions: 64,
    },
    siteGenerationPolicy: { pageConceptBatchSize: 3, nearbyRegionLimit: 4, minimumSharedCoverageKeys: 2, requireUtilityOrInformationObject: true },
  };
}

export function createPageConceptProposals(plan) {
  return plan.pageConceptJobs.map((job, index) => ({
    jobId: job.id,
    pageId: `page:${String(index + 1).padStart(4, "0")}`,
    route: `/research/generated/${String(index + 1).padStart(4, "0")}`,
    canonicalQuestion: `How should AMTECH solve ${job.attributes.map((item) => item.label).join(" + ")}?`,
    intent: "evaluate-specific-ai-employee-workflow",
    expressedAttributeIds: job.attributes.map((item) => item.id),
    evidenceIds: job.evidenceIds,
    sourceIds: job.sourceIds,
    informationObjectIds: [`information:${job.regionId}`],
    utilityOrTaskContractIds: [`task:${job.regionId}`],
    conversionPathId: "conversion:start-free",
    requiredModuleKinds: ["hero", "answer", "workflow", "proof", "cta"],
    requiredLayoutRoles: ["lead", "support", "proof", "conversion"],
    requiredCapabilities: ["semantic-hierarchy", "workflow-steps", "evidence-dense", "conversion-panel"],
    graphEdges: [],
    commercialValue: 1,
    lifecycleCost: 1,
  }));
}

export function createScaleAgentSiteFixture(targetPages = 10_000) {
  const sourceId = "source:scale-ontology";
  const evidenceId = `evidence:${sourceId}`;
  const dimensionCount = 8;
  const valuesPerDimension = 7;
  const project = {
    id: `project:scale-${targetPages}`,
    version: "1",
    business: { purpose: "Validate one-shot large-site ontology and page-program planning.", services: ["AI Employee infrastructure"], offers: ["Start Free"], audiences: ["small-business operators"], locations: ["United States"], workflows: ["office automation"], integrations: ["business software"], constraints: ["research-only", "no fabricated proof"], proofPoints: ["synthetic scale fixture"], pricingFacts: ["Managed AI Employee from $400"] },
    brand: { name: "AMTECH", voice: ["direct"], prohibitedLanguage: ["revolutionize"], palette: { ink: "#111111", red: "#E11D2A", white: "#FFFFFF" }, typography: ["Inter"], visualRules: ["light surfaces only"], componentRules: ["semantic modules"] },
    technical: { repositoryRoot: ".", framework: "static compiler", deploymentTarget: "static assets", browserTargets: ["Chrome >= 111"], performanceBudgets: { planningMilliseconds: 30000, packedVectorBytes: 100000000 }, accessibilityStandard: "WCAG 2.2 AA" },
    goals: { primaryConversions: ["Start Free"], searchOutcomes: ["large sparse opportunity coverage"], utilityOutcomes: ["page concept jobs"], publicationRiskTolerance: "low", minimumInitialPages: targetPages, maximumInitialPages: targetPages },
    sources: [{ id: sourceId, kind: "company", title: "Synthetic scale ontology", summary: "Synthetic scale source used only for deterministic 10k planning tests.", retrievedAt: "2026-07-17", applicability: ["scale-fixture"], confidence: "verified" }],
    assets: [],
  };
  const attributes = [{ id: "scale:anchor", label: "AI Employee service", dimensionHint: "service", description: "Primary service anchor for scale planning.", sourceIds: [sourceId], evidenceIds: [evidenceId], confidence: 1, sensitivity: "business", publicTargetingAllowed: true, reviewerApproved: true, materialEffects: ["problem-framing", "workflow", "offer-fit", "utility", "conversion"], anchorKind: "service" }];
  for (let dimension = 0; dimension < dimensionCount; dimension += 1) {
    for (let value = 0; value < valuesPerDimension; value += 1) {
      attributes.push({ id: `scale:d${dimension}:v${value}`, label: `dimension ${dimension} value ${value}`, dimensionHint: `dimension-${dimension}`, description: `Synthetic attribute ${dimension}/${value} with workflow and vocabulary effects.`, sourceIds: [sourceId], evidenceIds: [evidenceId], confidence: 0.9, sensitivity: "operational", publicTargetingAllowed: true, reviewerApproved: true, materialEffects: ["workflow", "vocabulary", "utility"] });
    }
  }
  const relations = [];
  const approvedIds = attributes.map((item) => item.id);
  for (const id of approvedIds.filter((id) => id !== "scale:anchor")) relations.push({ id: `scale-rel:anchor:${id}`, fromAttributeId: "scale:anchor", toAttributeId: id, type: "compatible", weight: 0.95, sourceIds: [sourceId], evidenceIds: [evidenceId], rationale: "Synthetic anchor compatibility." });
  for (let leftDimension = 0; leftDimension < dimensionCount; leftDimension += 1) {
    for (let rightDimension = leftDimension + 1; rightDimension < dimensionCount; rightDimension += 1) {
      for (let leftValue = 0; leftValue < valuesPerDimension; leftValue += 1) {
        for (let rightValue = 0; rightValue < valuesPerDimension; rightValue += 1) {
          const left = `scale:d${leftDimension}:v${leftValue}`;
          const right = `scale:d${rightDimension}:v${rightValue}`;
          relations.push({ id: `scale-rel:${left}:${right}`, fromAttributeId: left, toAttributeId: right, type: "compatible", weight: 0.75 + ((leftValue + rightValue) % 3) * 0.05, sourceIds: [sourceId], evidenceIds: [evidenceId], rationale: "Synthetic cross-dimensional compatibility." });
        }
      }
    }
  }
  const observations = [];
  for (let row = 0; row < 64; row += 1) {
    const attributeIds = ["scale:anchor"];
    for (let dimension = 0; dimension < dimensionCount; dimension += 1) attributeIds.push(`scale:d${dimension}:v${(row * (dimension + 3) + dimension) % valuesPerDimension}`);
    observations.push({ id: `scale-observation:${row}`, attributeIds, sourceIds: [sourceId], evidenceIds: [evidenceId], weight: 1, description: `Synthetic object-attribute row ${row}.` });
  }
  return {
    project,
    ontologyProposal: { id: `ontology:scale-${targetPages}`, version: "1", generatedBy: "scale-ontology-agent", generatedAt: "2026-07-17", sourceIds: [sourceId], attributes, relations, observations },
    vectorIdentity: { namespace: `scale-${targetPages}`, symbolVersion: "1" },
    graphPolicy: { minimumLexicalCosine: 0.99, minimumCooccurrenceJaccard: 0.01, minimumPositiveEdgeWeight: 0.05, minimumCore: 1, lexicalNeighborLimit: 2 },
    opportunityPolicy: { minimumSupportWeight: 1, minimumRegionWidth: 5, maximumRegionWidth: 7, minimumCoherence: 0.2, minimumMaterialEffects: 2, neighborExpansionLimit: 56, maximumCandidateRegions: Math.max(targetPages + 5000, 15000), minimumSelectedRegions: targetPages, maximumSelectedRegions: targetPages, minimumMarginalGain: 0, duplicateJaccardThreshold: 0.98, duplicateHrrThreshold: 0.995, hrrDimensions: 64 },
    siteGenerationPolicy: { pageConceptBatchSize: 25, nearbyRegionLimit: 4, minimumSharedCoverageKeys: 3, requireUtilityOrInformationObject: true },
  };
}
