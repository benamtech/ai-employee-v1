# Aqua Principles For An AI Employee

Status: active research translation  
Primary source: Mac OS X Human Interface Guidelines, June 2002:
https://dn721903.ca.archive.org/0/items/apple-hig/MacOSX_HIG_2002_06_01.pdf

This is not an instruction to clone Aqua visually. The useful lesson is psychological: concrete
objects, obvious affordances, stable places, visible consequences, and calm permission moments make
powerful software feel understandable.

## Translation Rules

| Aqua principle | AMTECH translation | Current state |
|---|---|---|
| Metaphors | Use Avery, work, proof, connected accounts, and permission as concrete ideas. Do not make owners learn implementation nouns. | Implemented in owner Home / Talk / Proof / Connected. Needs extension to public/admin surfaces. |
| See-and-point / noun-then-verb | Let the owner select a work object, proof item, connection, or approval and then act on it. | Partial. Review cards support actions; richer object actions remain future work. |
| Direct manipulation | Work should feel inspectable and movable, not only command-driven. | Not implemented beyond opening sheets and approval actions. Future: drag/drop, reorder, attach, compare, and edit work objects. |
| User control | Avery may prepare independently, but risky actions wait for the owner. | Strong in approval gates; weaker for undo/revert after non-risky local actions. |
| Feedback and communication | Avery should confirm receipt, show when work is being prepared, explain blocks, and show proof. | Partial. Home/Talk feedback exists; long-running progress and live generative UI status need work. |
| Consistency | The same work/action/proof grammar should render across web, SMS Review, admin, and future surfaces. | Source-wired through `WorkResource`, `WorkAction`, `SurfaceEnvelope`, and shared review rendering. |
| WYSIWYG | What the owner approves should match what the customer receives or what the external system records. | Partial. Estimate/document/customer portal parity needs a deeper pass. |
| Forgiveness | Most exploration should be safe; destructive or external actions need warning and exact permission. | Approval gates are strong; undo/revert and recoverable edits are not yet broad. |
| Perceived stability | Avery's state, proof, connections, and pending approval areas should stay in familiar places. | Implemented for the owner MVP shell; persistent layout/preferences are not implemented. |
| Aesthetic integrity | Use warmth, depth, restraint, and hierarchy to reduce anxiety. Avoid badge soup and harsh operational density. | Implemented in the latest owner route; not yet applied everywhere. |
| Modelessness | Do not trap owners in dashboards, modes, or multi-step wizards. Modes must be obvious and easy to exit. | Improved through Home/Talk/Proof/Connected, but admin and older public routes still need review. |

## AMTECH-Specific Implication

Avery can do more than classic software, so the UI must provide more human control, not less. The
Aqua lesson is not "make buttons glossy." It is: give owners a concrete place, obvious objects,
visible consequences, and permission they can understand without becoming operators.
