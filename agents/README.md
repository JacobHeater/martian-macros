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
  research discovery versus retrieval, delegation differences and cross-tool examples.
- [CI monitoring](ci-monitoring.md): `mm ci`, background pull request and
  check monitoring that supplements the delivery workflow; what each
  surface was and was not verified to do.
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
> Use `change` audit mode; inspect surrounding current behavior before proposals.

## Existing-feature audit examples

Every role audits existing implementation within its bounded remit, even during
planning. The shared contract records inspected/uninspected areas, methods,
classified findings and limitations; "no findings" is not whole-app certification.

- **Feature:** Ask the chair for `feature` mode on current food-entry quantity/
  unit and nutrition scaling. Assign nutrition to reference/consumed arithmetic
  and QA to entry/edit/save/read paths, requirements and test validity. Withhold
  peer conclusions for initial reports. Chair requests owner-run targeted checks,
  deduplicates causes and records uncovered layers; audit does not authorize fixes.
- **Domain:** Assign measurement `domain` mode on conversions/rounding and
  missing-data handling across named packages, with an explicit file/time budget.
- **Panel baseline:** Chair uses `panel-baseline` mode to partition specified
  feature areas among relevant specialists, including product traceability,
  product design and separate UX coverage. Record exclusions/unreviewed areas,
  not a claim that every role scanned everything.

Confirmed defects/violations enter the requirements/bug workflow with regression
guards. Evidence-supported concerns, documentation gaps, improvements and
unverified hypotheses stay distinctly classified. Reviewers never write fixes.

This example is an invocation, not approval to change MM-78 or evidence that
it was reviewed. `mm panel` validates the panel package; `mm panel <run-dir>`
also validates a saved run. Structural validation is not scientific sign-off
or proof of a native runtime's permission enforcement.

### Novice mobile fitness experience

For a critique of cognitive load or card-heavy views, use `feature` or
`panel-baseline` mode across a named novice task, not an unbounded aesthetic
pass. Assign product-designer and UX-accessibility independently. The designer
owns visual hierarchy, density, and what earns prominence; UX owns novice task
flow, choices, comprehension, recovery, and accessibility. Both inspect current
screens, requirements, tests and actual renders where available, and both
research externally when the request asks for current mobile practice. They
record sources actually consulted and distinguish heuristic/source review from
rendered or user-tested observations.

Each specialist may ask the chair for a narrowly scoped consultation from the
role that owns an out-of-domain fact. The chair returns a read-only, bounded
answer; the requesting specialist explains whether it changes the
recommendation. Do not let either specialist speculate across domain boundaries
or launch unrestricted nested agents. Do not count cards as a proxy for
cognitive burden. Favor a clear novice path and progressive disclosure while
preserving safety, uncertainty, consent and agency.

Research is required by the protocol's evidence triggers, not only when a model
admits uncertainty. Every role records performed/unnecessary/blocked research.
Specialists use actual available research tools or a bounded chair request;
missing capability never becomes fabricated citations. The
[real smoke run](../docs/agent-runs/pr79-research-smoke/) is separate from inert
templates and records actual observations and remaining platform limitations.
