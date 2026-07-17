# Generative UI Frontier

Status: active frontier track  
Purpose: define the highest-upside UI work that is source-wired but not live-proven

## Current Position

Generative UI is likely AMTECH's most powerful long-term interface idea: software surfaces appear from
the work Avery is doing, instead of forcing the owner through fixed SaaS screens. The code has the
right seams, but the idea has not been live-tested against a funded provider-backed Hermes loop.

This frontier does not replace or block the baseline normal-employee launch gate. First prove the
canonical public onboarding, runtime, provider reply, and connected-tool path. Then run the first
provider-backed generative-UI acceptance slice on that accepted stack.

## What Exists

- Typed work descriptors can carry work views such as table, schedule, diff, and form.
- Manager compiles owner-safe views into MCP-UI `ui://` resources.
- The web owner surface renders those resources in a sandboxed iframe.
- Iframe intents return to the host and route through existing approval/respond handlers.
- Unit tests prove escaping, `ui://` resource creation, approval id binding, and fallback behavior.

Primary source and local proof:

- `apps/manager/src/lib/ui-resources.ts`
- `tests/unit/ui-resources.test.ts`

## What Is Missing

- A live LLM/Hermes run that creates a useful view from real business context.
- Provider-backed proof that the generated surface maps to the correct approval/action.
- Rich interaction beyond basic accept/reject/respond.
- Visual alignment of generated UI with the Avery-first system.
- A human-readable explanation of why a generated surface appeared and what Avery will do with it.

The current Manager template still uses an independent legacy dark-mode media query and blue primary
action. That is a source-level visual mismatch with the canonical light-only, AMTECH-red design system,
not a reason to weaken the typed-template boundary.

## Product Rule

Generative UI must never mean raw model HTML. AMTECH owns the template, action grammar, approval gates,
sandbox, and proof. The LLM may propose structured work; Manager compiles it into a safe surface.

## Acceptance Gate

The frontier becomes accepted only after a provider-backed Hermes run:

1. receives real or production-like business context;
2. emits a typed work view through Manager;
3. renders in owner UI without fixture data;
4. routes an owner action through the same approval/proof path;
5. leaves auditable proof ids that bind the view, approval, action, and external result.

## Exact Next Sequence

1. Preserve the current typed `WorkView` grammar, Manager compilation, sandbox, approval-id binding,
   escaping, and text-card fallback.
2. Align the Manager-owned HTML template to the light Avery design system: AMTECH red primary action,
   no dark-mode branch, accessible focus/contrast, and stable mobile sizing.
3. Add owner-readable explanation metadata: why this surface appeared, which business facts Avery used,
   what approval is requested, and what action will follow.
4. After the normal-employee production gate passes, run one narrow provider-backed slice from real
   business context to typed view to owner action to external proof, and retain every proof id.
5. Only after that acceptance slice, expand interaction beyond accept/reject/respond and add richer
   generated work objects or direct manipulation.
