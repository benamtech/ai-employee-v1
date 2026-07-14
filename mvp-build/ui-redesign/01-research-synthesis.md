# Research Synthesis

Status: active design foundation  
Purpose: show how research changed AMTECH UI decisions

This packet does not use research as decoration. Each source below changes a concrete design decision.

## Source Spine

- Microsoft HAX Guidelines: evidence-based AI UX guidelines across first use, in-use behavior, errors, and
  long-term interaction. Source: https://www.microsoft.com/en-us/haxtoolkit/ai-guidelines/
- Google PAIR Guidebook: human-centered AI guidance around user needs, feedback, confidence, and responsible
  product framing. Source: https://pair.withgoogle.com/guidebook/
- Nielsen Norman Group, "Progressive Disclosure": show the few important options first; defer advanced or
  rarely used features to secondary screens to improve learnability, efficiency, and error rate. Source:
  https://www.nngroup.com/articles/progressive-disclosure/
- Cognitive load in UI evaluation: recent HCI review emphasizes measuring and reducing mental effort in
  software, web, mobile, robotics, and VR interfaces. Source: https://arxiv.org/abs/2402.11820
- Fogg Behavior Model: behavior happens when motivation, ability, and a prompt converge; ability includes
  "brain cycles," so high-cognition approval tasks fail at the moment they matter. Source:
  https://dl.acm.org/doi/10.1145/1541948.1541999
- Mixed-initiative interaction: human and AI can both initiate; good systems expose initiative, allow repair,
  and avoid eroding human situational awareness. Useful anchors: Horvitz's mixed-initiative work and newer
  mixed-initiative co-creativity research, https://arxiv.org/abs/2305.07465
- LLM human-agent systems survey: fully autonomous LLM agents remain limited by reliability, hallucination,
  safety, and ethics; human feedback/control improves reliability and safety. Source:
  https://arxiv.org/abs/2505.00753
- Conversational XAI caution: conversational explanation can increase understanding and trust, but LLM-enhanced
  conversations can amplify overreliance. Source: https://github.com/delftcrowd/iui2025_convxai
- Calm technology: information should live in the periphery and move to attention when needed. Source:
  https://people.csail.mit.edu/rudolph/Teaching/weiser.pdf
- Aqua historical lesson: early Mac OS X used color, depth, translucency, texture, and obvious affordance to
  make a new system feel tangible and approachable. Source: https://en.wikipedia.org/wiki/Aqua_(user_interface)
- Apple HIG as a continuing design anchor: hierarchy, feedback, direct manipulation, clarity, consistency,
  and platform-native affordance. Source: https://developer.apple.com/design/human-interface-guidelines/

## Cognitive Load: The First Screen Must Be Small

Prior designs showed too many concepts at once: chat, streams, proof, metrics, modes, badges, panels, and
documents. Cognitive load research says this makes the interface costlier to operate before the user gets
value.

AMTECH decision:

- The first screen shows only three live concepts: talk to Avery, Avery needs your say, Avery is watching.
- No default three-column layout.
- No persistent status-chip taxonomy.
- No object browser as the first mental model.
- Details move into sheets, object views, and proof pages only after the owner asks or Avery needs permission.

Pass/fail:

- Pass: the owner can describe the first screen in one sentence.
- Fail: the owner has to scan columns to learn what the product is.

## Progressive Disclosure: Power Appears When It Is Useful

NN/g's progressive disclosure guidance directly rejects the previous "show every capability" approach.
AMTECH is powerful, but power should be revealed at the moment it helps.

AMTECH decision:

- Connected accounts appear as plain-language readiness when relevant, not as a connector dashboard by default.
- Capabilities appear as "Avery can draft this once Email is connected," not as a feature catalog.
- Proof is available from the work and recent receipts, not a permanent ledger panel.
- Advanced object inspection is one tap away, not always visible.

## Behavior Change: Approval Must Be Easier Than Avoidance

The owner is often tired, on a job site, or at a kitchen table after work. Fogg's model makes "ability" central:
if approval requires too much reading, comparison, or navigation, the owner will ignore it.

AMTECH decision:

- Approval moments are single-purpose sheets.
- Each approval states: what Avery made, who/what it affects, exact money/customer consequence, and what happens
  after approval.
- The primary action is thumb-safe, but the owner always has clear Tweak, Reply, and Decline paths.
- The prompt appears only when the owner's judgment is genuinely needed.

## Trust And Control: Calm Confidence Beats AI Theater

HAX and Google PAIR point toward expectation setting, feedback, recovery, uncertainty, and control. LLM-agent
research adds the warning: autonomy without well-placed human control is not trustworthy.

AMTECH decision:

- Avery should sound competent, but the UI should never pretend risky work is autonomous.
- High-risk work always has an exact preview and explicit approval.
- Uncertainty attaches to the work itself: missing info, assumptions, confidence, blocked connection.
- Recovery is normal: "Tweak," "Reply," "Do not send," and "Use this instead" are first-class.

## Conversational Interfaces: Chat Is Necessary But Not Sufficient

Recent LLM products prove conversation is a powerful command language. They also prove that a transcript alone
is a poor place to manage durable business work. Conversational XAI research warns that conversation can raise
trust and also overreliance.

AMTECH decision:

- Chat is the natural language front door.
- Work does not remain trapped in chat. It becomes approval sheets, work previews, receipts, and proof.
- Avery's interpretation is visible only when it matters: before a gate, while asking a clarifying question, or
  when correcting a misunderstanding.
- The product must never rely on "the owner can scroll back in chat" as proof or memory.

## Mixed Initiative: Avery Can Start, But Not Overstep

The product is not merely user-commanded software. Avery watches provider events, prepares drafts, asks for
missing information, and resurfaces work. But mixed initiative can become stressful if the user cannot tell who
is acting.

AMTECH decision:

- Avery may initiate "I prepared this," "I need your say," "This is blocked," and "This is done."
- Avery may not silently send, charge, publish, share protected material, or write durable external records.
- The interface distinguishes preparation from permission.
- The owner stays in judgment/control, not operational micromanagement.

## Calm Technology: Awareness Belongs In The Periphery

Calm technology says information can inform without demanding focus. This is the right pattern for business
awareness: not every customer reply, draft, connector check, or receipt deserves interruption.

AMTECH decision:

- "Watching" is quiet and ambient.
- "Needs your say" is central only when there is an actual gate.
- SMS is reserved for urgent business judgment, customer/money gates, time-sensitive replies, and blocking
  connection failures.
- Routine proof collapses into recent receipts and history.

## Aqua Lessons Without Aqua Imitation

The useful lesson from Aqua is not glossy blue buttons. It is that a new computing model can feel approachable
when controls have clear affordance, depth, warmth, motion, and delight.

AMTECH decision:

- Use soft dimensionality to indicate touchable surfaces and active layers.
- Use translucency sparingly for layered sheets and review moments, never as low-contrast haze behind text.
- Use light, reflection, and shadow to explain hierarchy.
- Keep the product visually warm and branded without red dominance or purple "AI" gradients.
- Make interactive objects look graspable, not flat labels in boxes.

## Resulting Design Thesis

AMTECH should feel like the first calm, trustworthy employee interface for small business owners:

- The LLM is the primary interface.
- The first screen is simple enough for a tired owner.
- Avery's independent work is visible as readiness and permission moments, not internal state.
- Exact approvals and durable proof create trust.
- Depth and warmth make the product feel capable and humane.

