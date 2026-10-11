# Repository expert panel

Development tooling, **not agents embedded in the app**. These tool-neutral
documents are authoritative for panel work; native adapters only select tools
and load them. Existing contributor instructions remain binding.

Read `AGENTS.md`, `requirements/HANDOFF.md`, relevant tickets,
`docs/architecture.md`, `roadmap/README.md` and the relevant design documents
first. Requirements define behavior; the roadmap defines order. The panel
advises, not overrides the product owner.

## Start here

- [Protocol](panel-protocol.md): scope, independent review, challenge,
  synthesis, single-owner edits, verification, checkpoint/resume.
- [Review contract](review-contract.md): the common report and evidence rules.
- [Run state](run-state.md): minimal portable artifacts and schema.
- [Native surfaces](native-surfaces.md): configuration sources, restrictions,
  delegation differences and cross-tool examples.
- [Templates](templates/): copy into `docs/agent-runs/<task-id>/`; replace
  placeholders before running reviews. Never put health records or secrets here.

## Roles

The core panel is chair, training, nutrition, coaching, measurement and safety.
The chair scopes each core role explicitly (including a reason when irrelevant);
do not manufacture six reviews for a tooling-only change. Other specialists
are invoked only when their criteria apply.

| Role | Canonical definition | Selection |
| --- | --- | --- |
| Panel chair / orchestrator | [chair](roles/chair.md) | Core |
| Training & exercise science | [training](roles/training.md) | Core |
| Nutrition & body composition | [nutrition](roles/nutrition.md) | Core |
| Micronutrients & supplementation | [micronutrients](roles/micronutrients.md) | Selective |
| Coaching & behavior change | [coaching](roles/coaching.md) | Core |
| Measurement & adaptive systems | [measurement](roles/measurement.md) | Core |
| Safety & evidence review | [safety](roles/safety.md) | Core |
| Product & requirements | [product](roles/product.md) | Selective |
| Product designer | [product-designer](roles/product-designer.md) | Selective; distinct from UX |
| UX & accessibility | [ux-accessibility](roles/ux-accessibility.md) | Selective |
| Software architecture & data modeling | [architecture](roles/architecture.md) | Selective |
| Flutter & application implementation | [flutter](roles/flutter.md) | Selective |
| Integrations & data provenance | [integrations](roles/integrations.md) | Selective |
| Privacy & security | [privacy-security](roles/privacy-security.md) | Selective |
| QA & verification | [qa](roles/qa.md) | Selective |

## Minimal invocation

> Act as the panel chair using `agents/roles/chair.md`,
> `agents/panel-protocol.md` and `agents/review-contract.md`. Scope MM-78
> against its actual ticket and current implementation. Create a sanitized run
> `docs/agent-runs/mm78-review/` from the templates. Assign relevant core reviews
> independently, plus architecture and QA. Record why other roles are omitted.
> Do not edit canonical files until conflicts are challenged and one edit owner
> is designated. Use native delegation only if this surface exposes it;
> otherwise perform the same reviews sequentially.

This example is an invocation, not approval to change MM-78 or evidence that
it was reviewed. `mm panel` validates the panel package; `mm panel <run-dir>`
also validates a saved run. Structural validation is not scientific sign-off
or proof of a native runtime's permission enforcement.
