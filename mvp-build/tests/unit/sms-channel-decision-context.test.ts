import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@amtech/db";
import { resolveSmsHumanPrincipal } from "../../apps/manager/src/lib/channel-decisions";
import { FakeSupabase } from "./_helpers/fake-supabase";

const nowPast = new Date(Date.now() - 60_000).toISOString();
const nowFuture = new Date(Date.now() + 60_000).toISOString();

function client(seed: Record<string, Array<Record<string, unknown>>>) {
  const fake = new FakeSupabase(seed);
  return { fake, db: fake as unknown as SupabaseClient };
}

describe("SMS channel decision principal context", () => {
  it("treats multiple eligible roles for one human as one verified owner session", async () => {
    const { db } = client({
      verified_phones: [{
        id: "vp_owner",
        account_id: "acct_owner",
        phone_e164: "+15555550101",
        human_principal_id: "hpr_owner",
        verified_at: new Date().toISOString(),
      }],
      assignment_principals: [
        {
          id: "ap_owner",
          assignment_id: "asn_owner",
          principal_id: "hpr_owner",
          principal_class: "human",
          role: "owner",
          status: "active",
          starts_at: nowPast,
          ends_at: null,
          policy_version: "authorization-v1",
        },
        {
          id: "ap_billing",
          assignment_id: "asn_owner",
          principal_id: "hpr_owner",
          principal_class: "human",
          role: "billing",
          status: "active",
          starts_at: nowPast,
          ends_at: null,
          policy_version: "authorization-v1",
        },
      ],
    });

    const resolved = await resolveSmsHumanPrincipal(db, {
      account_id: "acct_owner",
      assignment_id: "asn_owner",
      phone_e164: "+15555550101",
      allowed_roles: ["owner", "billing"],
      policy_version: "authorization-v1",
    });

    expect(resolved).toMatchObject({
      human_principal_id: "hpr_owner",
      role: "owner",
      policy_version: "authorization-v1",
    });
    expect(resolved.roles).toEqual(["owner", "billing"]);
  });

  it("repairs a legacy phone row only when one distinct current human is eligible", async () => {
    const { db, fake } = client({
      verified_phones: [{
        id: "vp_legacy",
        account_id: "acct_legacy",
        phone_e164: "+15555550102",
        human_principal_id: null,
        verified_at: new Date().toISOString(),
      }],
      assignment_principals: [
        {
          id: "ap_manager",
          assignment_id: "asn_legacy",
          principal_id: "hpr_legacy",
          principal_class: "human",
          role: "manager",
          status: "active",
          starts_at: nowPast,
          ends_at: nowFuture,
          policy_version: "authorization-v1",
        },
        {
          id: "ap_approver",
          assignment_id: "asn_legacy",
          principal_id: "hpr_legacy",
          principal_class: "human",
          role: "approver",
          status: "active",
          starts_at: nowPast,
          ends_at: nowFuture,
          policy_version: "authorization-v1",
        },
      ],
    });

    const resolved = await resolveSmsHumanPrincipal(db, {
      account_id: "acct_legacy",
      assignment_id: "asn_legacy",
      phone_e164: "+15555550102",
      allowed_roles: ["approver", "manager"],
      policy_version: "authorization-v1",
    });

    expect(resolved.role).toBe("approver");
    expect(fake.tables.verified_phones?.[0]?.human_principal_id).toBe("hpr_legacy");
  });

  it("fails closed when a legacy phone could map to two distinct humans", async () => {
    const { db } = client({
      verified_phones: [{
        id: "vp_ambiguous",
        account_id: "acct_ambiguous",
        phone_e164: "+15555550103",
        human_principal_id: null,
        verified_at: new Date().toISOString(),
      }],
      assignment_principals: [
        {
          id: "ap_one",
          assignment_id: "asn_ambiguous",
          principal_id: "hpr_one",
          principal_class: "human",
          role: "owner",
          status: "active",
          starts_at: nowPast,
          ends_at: null,
          policy_version: "authorization-v1",
        },
        {
          id: "ap_two",
          assignment_id: "asn_ambiguous",
          principal_id: "hpr_two",
          principal_class: "human",
          role: "owner",
          status: "active",
          starts_at: nowPast,
          ends_at: null,
          policy_version: "authorization-v1",
        },
      ],
    });

    await expect(resolveSmsHumanPrincipal(db, {
      account_id: "acct_ambiguous",
      assignment_id: "asn_ambiguous",
      phone_e164: "+15555550103",
      allowed_roles: ["owner"],
      policy_version: "authorization-v1",
    })).rejects.toThrow("sms_human_principal_ambiguous");
  });
});
