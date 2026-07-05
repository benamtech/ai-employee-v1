/**
 * Varied, plausible contractor onboarding fixtures for local live-feedback testing.
 *
 * Why this exists: a harness that pastes the *same* "Palaskas Painting" every run
 * hides assumptions in onboarding/provisioning. These fixtures keep the AMTECH
 * paint/landscape beachhead vibe while varying the trade, business/owner names,
 * workflows, tools, and the owner's own words — so each run exercises a slightly
 * different real user. Pick deterministically with ONBOARD_FIXTURE=<index|kind>
 * for reproducibility, or omit it for a random pick.
 *
 * Two shapes are derived from one fixture so both test paths share it:
 *   - `conversationTurns(fx)` — owner messages for the REAL front-door path
 *     (POST /api/front-door/message → orchestrator builds the manifest itself).
 *   - `bypassManifest(fx)` — a complete manifest for the no-orchestrator BYPASS
 *     path (local:bootstrap style), which needs no model key.
 */

/** The beachhead: owner-operated paint/landscape-adjacent trades. */
export const FIXTURES = [
  {
    business_kind: "painting",
    business_display_name: "Northgate Painting Co.",
    owner_name: "Marcus Delvecchio",
    employee_name: "Casey",
    timezone: "America/New_York",
    years: 8,
    crew: "me plus two guys",
    money_shape: "around $320k a year, jobs run $2,000 to $9,000",
    ideal_customer: "homeowners doing an interior or full-exterior repaint",
    friction: "people who go quiet after I email the estimate",
    workflows: ["estimate walkthroughs", "quote follow-up", "daily office reminders"],
    tools: ["Gmail", "phone", "a paper quote pad"],
    services: ["interior repaints", "exterior repaints", "cabinet refinishing"],
  },
  {
    business_kind: "landscaping",
    business_display_name: "Creekside Lawn & Landscape",
    owner_name: "Renee Kowalczyk",
    employee_name: "Sam",
    timezone: "America/New_York",
    years: 12,
    crew: "four of us in season",
    money_shape: "about $540k a year, installs from $3,500 to $25,000",
    ideal_customer: "homeowners who want a full yard design/install, not just mowing",
    friction: "writing up planting estimates at night and chasing deposits",
    workflows: ["design estimates", "deposit follow-up", "seasonal scheduling reminders"],
    tools: ["Gmail", "phone", "a whiteboard", "spreadsheets"],
    services: ["landscape design", "hardscape/patios", "plantings", "drainage"],
  },
  {
    business_kind: "carpentry",
    business_display_name: "Hollenback Custom Carpentry",
    owner_name: "Travis Boland",
    employee_name: "Jordan",
    timezone: "America/New_York",
    years: 15,
    crew: "just me and an apprentice",
    money_shape: "roughly $260k a year, projects $1,500 to $18,000",
    ideal_customer: "homeowners wanting built-ins, trim, or a deck",
    friction: "scoping jobs and remembering to follow up on the ones I bid weeks ago",
    workflows: ["bid write-ups", "follow-up on open bids", "material-order reminders"],
    tools: ["Gmail", "phone", "notes app"],
    services: ["decks", "built-ins", "trim carpentry", "door/window install"],
  },
  {
    business_kind: "deck_and_fence",
    business_display_name: "Ridgeline Deck & Fence",
    owner_name: "Danny Ruiz",
    employee_name: "Alex",
    timezone: "America/New_York",
    years: 6,
    crew: "me and three guys",
    money_shape: "about $480k a year, deck/fence jobs $4,000 to $22,000",
    ideal_customer: "homeowners replacing an old deck or fencing a yard",
    friction: "juggling estimates and deposits while I'm out on job sites all day",
    workflows: ["estimate visits", "deposit invoicing follow-up", "install scheduling"],
    tools: ["Gmail", "phone", "QuickBooks"],
    services: ["deck builds", "fence installs", "railings", "pergolas"],
  },
  {
    business_kind: "pressure_washing",
    business_display_name: "BrightSide Exterior Cleaning",
    owner_name: "Kayla Mensah",
    employee_name: "Riley",
    timezone: "America/New_York",
    years: 4,
    crew: "me and one helper",
    money_shape: "around $180k a year, jobs $250 to $2,500",
    ideal_customer: "homeowners wanting house/driveway soft-wash before summer",
    friction: "so many small quotes and no-shows on scheduled washes",
    workflows: ["quick quotes", "appointment reminders", "review requests"],
    tools: ["Gmail", "phone", "a booking sheet"],
    services: ["house soft-wash", "driveway/concrete", "roof cleaning", "gutter brightening"],
  },
];

function seededIndex() {
  const sel = process.env.ONBOARD_FIXTURE;
  if (sel === undefined || sel === "") {
    return Math.floor(Math.random() * FIXTURES.length);
  }
  const asNum = Number(sel);
  if (Number.isInteger(asNum) && asNum >= 0 && asNum < FIXTURES.length) return asNum;
  const byKind = FIXTURES.findIndex((f) => f.business_kind === sel);
  return byKind >= 0 ? byKind : 0;
}

/** A short, unique-ish local slug from the business name for emails/phones. */
function slug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 12);
}

// Process-lifetime counter so two synchronous picks never collide (same-ms safe).
let seq = 0;

/**
 * Pick a fixture and attach per-run unique identity (email/phone/idempotency) so
 * repeated runs never collide on account/phone rows. Phone stays in a documented
 * local test block; it is never dialed (dev bypass / no-SMS).
 */
export function pickFixture() {
  const fx = FIXTURES[seededIndex()];
  const n = seq++;
  const stamp = `${Date.now()}${n}`;
  // 555-01xx.. is reserved-for-fiction; a 4-digit tail keeps runs distinct.
  const tail = String(1000 + ((Date.now() + n) % 9000));
  return {
    ...fx,
    owner_email: process.env.ONBOARD_EMAIL ?? `owner+${slug(fx.business_display_name)}.${stamp}@amtech.local`,
    phone_e164: process.env.ONBOARD_PHONE ?? `+1570555${tail}`,
    idempotency_stamp: stamp,
  };
}

/** Owner messages for the REAL conversational front door (orchestrator builds the manifest). */
export function conversationTurns(fx) {
  return [
    `Hey — I run a ${fx.business_kind.replace(/_/g, " ")} business near Scranton PA called ${fx.business_display_name}. ${fx.years} years in, ${fx.crew}.`,
    `The repeat computer work that eats my time is ${fx.workflows[0]} and ${fx.friction}. I mostly live in ${fx.tools.slice(0, 2).join(" and ")}.`,
    `We do ${fx.money_shape}. Ideal customer is ${fx.ideal_customer}. What really kills me is ${fx.friction}.`,
    `Let's call the assistant ${fx.employee_name}. ${fx.timezone.split("/")[1].replace("_", " ")} time, Eastern. I think that's everything you need.`,
  ];
}

/** A complete manifest for the BYPASS path (no orchestrator/model key required). */
export function bypassManifest(fx) {
  return {
    employee_type: "contractor_estimator",
    profile_package_key: process.env.DEFAULT_PROFILE_PACKAGE ?? "contractor_estimator",
    business_display_name: fx.business_display_name,
    business_kind: fx.business_kind,
    timezone: fx.timezone,
    owner_name: fx.owner_name,
    owner_email: fx.owner_email,
    verified_phone_e164: fx.phone_e164,
    verification_method: "twilio_verify",
    consent_channel: "web",
    employee_name: fx.employee_name,
    top_workflows: fx.workflows,
    tools_mentioned: fx.tools,
    seed_skills: ["estimate", "invoice", "daily-checkin"],
    pricing_facts: [{ key: "local_test_rate", value: "Use conservative local-test assumptions until owner pricing is supplied.", confidence: "low" }],
    branding_facts: [{ key: "tone", value: "Plainspoken, contractor-friendly, concise.", confidence: "medium" }],
    customer_job_facts: [{ key: "beachhead", value: `${fx.business_kind} estimates for ${fx.ideal_customer}.`, confidence: "high" }],
    seven_question_answers: {
      business: `${fx.business_display_name} is a local ${fx.business_kind.replace(/_/g, " ")} contractor.`,
      team: fx.crew,
      repeat_computer_work: `${fx.workflows[0]} and ${fx.friction}.`,
      tools_in_use: fx.tools.join(", "),
      money_shape: fx.money_shape,
      ideal_customer: fx.ideal_customer,
      friction_customer: fx.friction,
    },
  };
}

// CLI: print a sample fixture (safe — no secrets, plausible test data only).
if (import.meta.url === `file://${process.argv[1]}`) {
  const fx = pickFixture();
  console.log(JSON.stringify({
    fixture: { kind: fx.business_kind, business: fx.business_display_name, owner: fx.owner_name, employee: fx.employee_name, phone: fx.phone_e164, email: fx.owner_email },
    conversation_turns: conversationTurns(fx),
    manifest_keys: Object.keys(bypassManifest(fx)),
  }, null, 2));
}
