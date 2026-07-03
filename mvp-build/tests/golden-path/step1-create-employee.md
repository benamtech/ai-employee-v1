# Golden path — Step 1: Create Employee (Phase 1 acceptance)

Source: `wiki/MVP/old-build-plan/12-tests-demo-acceptance.md` §1. Run over BOTH front doors.
No manually injected provider result is allowed.

## Web front door
1. Open `/create-ai-employee`; chat as a real test business (landscaper/painter/florist).
2. Enter the **real** Twilio Verify code. → `verified_phones` row + Verify SID.
3. Create account (email/password). **No payment step appears.** → Supabase user + `accounts` row.
4. Provisioning runs → real Hermes profile + gateway + claimed 10DLC number + web route.
5. **The employee sends its own first "I'm live" SMS.** → outbound Twilio **message SID** stored.
6. Text the employee number; get a reply. Open `agent.amtechai.com/{employee_id}` authenticated.

## SMS front door
1. Text the keyword to the front-door number (signature-validated; forged fails).
2. Hold the conversation over SMS; tap the single-use claim link to finish account setup on web.
3. Provisioning → the **same** employee reachable on web + SMS.

## Pass criteria
- [ ] No manually injected provider result needed.
- [ ] Every external action has provider proof (Verify SID, outbound SMS SID, runtime health).
- [ ] SMS and web reach the same employee.
- [ ] No payment gate before employee creation.
- [ ] Forged inbound SMS (bad `X-Twilio-Signature`) is rejected.
- [ ] Owner cannot load another account's employee.

## Proof command
After the web or SMS path provisions a live employee, run:

```bash
SMOKE_EMPLOYEE_ID=emp_... npm run smoke:phase01
```

Pass requires:

- live `employees` row;
- verified phone row with Twilio proof;
- runtime endpoint with SMS number and webchat URL;
- first live SMS SID in runtime health;
- outbound owner SMS provider id;
- successful provisioning job.
