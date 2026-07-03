/**
 * Thin Twilio REST wrapper (no SDK) for the two Phase-1 needs:
 *   - Verify: start + check phone verification (works pre-A2P-campaign).
 *   - Messages: outbound SMS (the employee's first live "I'm live" text + replies).
 * Every successful call returns a provider proof id (Verify SID / message SID).
 *
 * Phase 0 ships the wrapper; Phase 1 wires it into the identity/provisioning tools.
 */

interface TwilioCreds {
  accountSid: string;
  authToken: string;
}

function creds(): TwilioCreds {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new Error("Twilio credentials missing.");
  return { accountSid, authToken };
}

function authHeader({ accountSid, authToken }: TwilioCreds): string {
  return "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
}

async function twilioPost(path: string, form: Record<string, string>): Promise<any> {
  const c = creds();
  const res = await fetch(`https://${path}`, {
    method: "POST",
    headers: {
      Authorization: authHeader(c),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(`Twilio ${res.status}: ${json?.message ?? "error"}`);
  }
  return json;
}

async function twilioGet(path: string, params: Record<string, string> = {}): Promise<any> {
  const c = creds();
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://${path}${qs ? `?${qs}` : ""}`, {
    headers: { Authorization: authHeader(c) },
  });
  const json = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(`Twilio ${res.status}: ${json?.message ?? "error"}`);
  }
  return json;
}

/** Start phone verification. Proof = verification SID. */
export async function startVerification(phoneE164: string): Promise<{ sid: string; status: string }> {
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!service) throw new Error("TWILIO_VERIFY_SERVICE_SID missing.");
  const json = await twilioPost(
    `verify.twilio.com/v2/Services/${service}/Verifications`,
    { To: phoneE164, Channel: "sms" },
  );
  return { sid: json.sid, status: json.status };
}

/** Check a verification code. Returns approved/denied. */
export async function checkVerification(
  phoneE164: string,
  code: string,
): Promise<{ status: string; valid: boolean }> {
  const service = process.env.TWILIO_VERIFY_SERVICE_SID;
  if (!service) throw new Error("TWILIO_VERIFY_SERVICE_SID missing.");
  const json = await twilioPost(
    `verify.twilio.com/v2/Services/${service}/VerificationCheck`,
    { To: phoneE164, Code: code },
  );
  return { status: json.status, valid: json.status === "approved" };
}

/** Send an SMS. Proof = message SID. Uses a Messaging Service if configured. */
export async function sendSms(opts: {
  to: string;
  from?: string;
  body: string;
}): Promise<{ sid: string; status: string }> {
  const c = creds();
  const form: Record<string, string> = { To: opts.to, Body: opts.body };
  const messagingService = process.env.TWILIO_MESSAGING_SERVICE_SID;
  if (messagingService) form.MessagingServiceSid = messagingService;
  else if (opts.from) form.From = opts.from;
  else throw new Error("sendSms needs a From number or TWILIO_MESSAGING_SERVICE_SID.");
  const json = await twilioPost(
    `api.twilio.com/2010-04-01/Accounts/${c.accountSid}/Messages.json`,
    form,
  );
  return { sid: json.sid, status: json.status };
}

export async function findIncomingNumberSid(phoneE164: string): Promise<string | null> {
  const c = creds();
  const json = await twilioGet(
    `api.twilio.com/2010-04-01/Accounts/${c.accountSid}/IncomingPhoneNumbers.json`,
    { PhoneNumber: phoneE164 },
  );
  return json?.incoming_phone_numbers?.[0]?.sid ?? null;
}

export async function setIncomingSmsWebhook(
  phoneE164: string,
  smsUrl: string,
): Promise<{ phone_number_sid: string; sms_url: string }> {
  const c = creds();
  const sid = await findIncomingNumberSid(phoneE164);
  if (!sid) throw new Error(`Twilio number not found in account: ${phoneE164}`);
  const json = await twilioPost(
    `api.twilio.com/2010-04-01/Accounts/${c.accountSid}/IncomingPhoneNumbers/${sid}.json`,
    { SmsUrl: smsUrl, SmsMethod: "POST" },
  );
  return { phone_number_sid: json.sid, sms_url: json.sms_url };
}
