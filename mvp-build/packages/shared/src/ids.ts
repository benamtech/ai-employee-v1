/**
 * Prefixed id generator. Domain objects use stable, human-readable prefixed ids
 * (acct_, emp_, aud_, …) as their primary keys; the app supplies them so ids are
 * meaningful in logs, envelopes, and audit. Uses crypto for collision resistance.
 */
import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

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
} as const;

export type IdPrefix = (typeof ID_PREFIX)[keyof typeof ID_PREFIX];

export function newId(prefix: IdPrefix): string {
  return `${prefix}_${token()}`;
}
