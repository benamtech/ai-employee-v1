# AI-Native Interaction Model

Status: active  
Purpose: define how conversation, initiative, work, correction, and generated surfaces behave

## Core Model

The product has four moves:

1. **Tell Avery** - the owner speaks in normal business language.
2. **Avery prepares** - Avery watches, drafts, checks, files, or asks for missing context.
3. **Avery stops** - exact permission, clarification, or repair is needed.
4. **Proof settles** - completion becomes a quiet receipt and refindable record.

Everything else is secondary disclosure.

## Where Chat Lives

Chat is always reachable from the home screen and from a selected work item. It is not a separate "app tab" that
competes with work. It is the live relationship layer.

Required behavior:

- Home has one primary composer: "Tell Avery..."
- If a work item is selected, composer context changes: "Ask Avery about this..."
- Chat can show recent conversation, but the first screen should not be a long transcript.
- The transcript should have fewer visual affordances than active work and approvals.

## Avery's Independent Work

Avery can initiate:

- "I prepared this."
- "I need your say."
- "I need one detail."
- "This is blocked by a connection."
- "This is done."
- "I will bring this back later."

Do not show:

- raw tool calls;
- provider event streams;
- every internal state transition;
- persistent "thinking" logs;
- model/runtime diagnostics.

The owner sees meaningful business movement, not machinery.

## Interpreted Intent

Show interpreted intent only when it changes trust:

- before external action;
- before money movement;
- before publishing/sharing;
- before durable external writes;
- when Avery asks a clarifying question;
- when an owner correction changes the work.

Do not display interpreted intent after every message. That recreates dashboard noise.

## Correction And Repair

Correction is not an error path. It is part of normal collaboration.

Every active work surface should support some combination of:

- Tweak;
- Reply;
- Decline;
- Use this instead;
- Not now;
- Ask Avery.

The UI should make repair feel cheaper than abandoning the work.

## Generated Work Surfaces

Generated surfaces are useful when a task needs structure:

- estimate preview;
- table;
- schedule;
- comparison/diff;
- short form;
- website draft;
- bookkeeping review;
- photo/media set.

Rules:

- The generated surface must be scoped to one work item.
- It must inherit owner-safe rendering.
- It must show risky consequences outside the generated body in a stable approval frame.
- It must not create new safety semantics.
- It must degrade to a generic `WorkResource` view.

## State Language

Use few owner-facing states:

- Needs your say.
- Avery is working.
- Waiting.
- Blocked.
- Done.
- Saved proof.

Avoid status taxonomies like pending, queued, processed, resolved, materialized, ingested, delivered, provider
accepted, runtime accepted, or source wired in owner UI.

## LLM-First Pass/Fail

Pass:

- The owner can begin by typing or speaking a business sentence.
- Avery's independent work is visible without exposing internals.
- Active work becomes a simple decision or object view.
- Proof is saved after the loop.

Fail:

- The owner starts by choosing among dashboard tabs.
- The app looks useful only after learning a navigation model.
- The UI is mostly a transcript.
- The UI is mostly tables, cards, statuses, and badges.

