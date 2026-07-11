/**
 * Prefixed id generator. Domain objects use stable, human-readable prefixed ids
 * (acct_, emp_, aud_, …) as their primary keys; the app supplies them so ids are
 * meaningful in logs, envelopes, and audit. Uses crypto for collision resistance.
 */
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

// Web Crypto — globally available in Node 20+ and every target browser. Using it
// (instead of a static `node:crypto` import) keeps @amtech/shared isomorphic, so
// the barrel is safe to value-import from Next.js client bundles.
function randomBytes(len: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(len));
}

function token(len = 22): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i]! % ALPHABET.length];
  return out;
}

export const ID_PREFIX = {
  account: "acct",
  user: "user",
  membership: "mem",
  phone: "phone",
  employee: "emp",
  manifest: "man",
  brainFact: "fact",
  runtime: "rt",
  runtimeHealth: "rth",
  provisioningJob: "pjob",
  onboardingSession: "onb",
  phoneVerificationAttempt: "ver",
  claimToken: "claim",
  numberPoolEntry: "num",
  profilePackage: "pkg",
  profileBuild: "build",
  ownerWebSession: "sess",
  artifact: "art",
  artifactLink: "lnk",
  previewLink: "prev",
  approval: "appr",
  connector: "conn",
  outboundEmail: "email",
  gmailWatch: "watch",
  emailThread: "thr",
  inboundEmailEvent: "iev",
  stripeConnection: "stcon",
  stripeAccountLink: "stlink",
  stripeInvoice: "stinv",
  stripeCustomer: "stcus",
  stripeWebhookEvent: "stwh",
  audit: "aud",
  event: "evt",
  message: "msg",
  reminder: "rem",
  jobCommitment: "job",
  repairQueue: "repair",
  eventBatch: "batch",
  jobRun: "jobrun",
  runtimeSecret: "rtsec",
  mcpCredential: "mcpc",
  turnJob: "turn",
  channelSession: "chs",
  deliveryDecision: "deld",
  workRun: "run",
  meterEvent: "mev",
  toolInvocation: "tinv",
  meterPricing: "price",
  usageRollup: "roll",
  budgetPolicy: "budget",
  surfaceEnvelope: "senv",
  workResource: "wres",
  workAction: "wact",
  capabilityNode: "cap",
  surfaceReceipt: "srcpt",
  platformUser: "puser",
  platformRole: "prole",
  supportAccess: "supp",
  adminAction: "adact",
  qboPendingWrite: "qbpw",
  inboundQboEvent: "iqe",
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${token()}`;
}
