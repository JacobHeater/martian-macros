# Roadmap

This folder says what to build, in what order, and why. It sits above
[`requirements/`](../requirements/README.md) and below nothing: it adds no
requirements of its own.

- **`requirements/`** answers *what must be true*. One ticket per decision or
  piece of work, grouped by feature.
- **`roadmap/`** answers *what next*. Fourteen workstreams, grouped by how the
  work is actually delivered, with the dependencies between them.

If the two disagree about what a feature does, the ticket is right. If a
ticket's status and this folder disagree about what is built, the ticket is
right (`mm req list`). The roadmap is authoritative only for order.

## What is here

| File | What it is |
| --- | --- |
| `README.md` | This manual. |
| [`roadmap.json`](roadmap.json) | The roadmap as data: workstreams, steps, dependency edges, parallel groups, shared contracts, hotspots, milestones. |
| `ws-NN-*.md` | One file per workstream: why it exists, its internal sequence, its risks, and notes for whoever builds it. |

## Why it is not organized like the tickets

The requirements folders follow features (`food-logging`, `safeguards`,
`macro-targets`). Delivery does not. Three examples from this repository:

- **The safeguards are split four ways.** The underweight guard (MM-111) and
  the fast-loss raise (MM-115) are engine changes that must land before the
  target calculation is rebuilt. The repeated health check (MM-112) is
  onboarding and settings work. The under-eating notice (MM-114) needs the
  adherence summary. The recovery check-in (MM-116) needs nothing but a table.
  One folder, four different places in the build order.
- **One table blocks nine workstreams.** The schema is at version 1 with no
  migrations (MM-61). That ticket lives in `persistence` beside encrypted
  backup, which is one of the last things to build.
- **The weight trend is two things.** The filter (MM-18) is engine code with
  a known defect (MM-131). The chart (MM-17) is a screen. They change for
  different reasons, in different packages, at different times.

So a workstream here is a set of tickets that share code ownership and a place
in the dependency order, whatever folder they came from. Every ticket belongs
to exactly one workstream.

## The workstreams

| Order | Id | Workstream | State on 2026-10-13 | Group |
| --- | --- | --- | --- | --- |
| 1 | WS-14 | [Architecture and module boundaries](ws-14-architecture-and-module-boundaries.md) | in progress (the React conversion's leftovers) | A |
| 2 | WS-03 | [Design system and app shell](ws-03-design-system-and-app-shell.md) | in progress | A |
| 3 | WS-01 | [Delivery foundations](ws-01-delivery-foundations.md) | in progress | A |
| 4 | WS-02 | [Engine truth and safety limits](ws-02-engine-truth-and-safety-limits.md) | partly built (M1 steps done) | A |
| 5 | WS-04 | [Food data pack](ws-04-food-data-pack.md) | in progress | A |
| 6 | WS-05 | [Setup, screening and profile lifecycle](ws-05-setup-screening-and-profile.md) | partly built (M1 steps done) | B |
| 7 | WS-06 | [Targets and the explainable check-in](ws-06-targets-and-explainable-check-in.md) | in progress | B |
| 8 | WS-07 | [Progress and measurement](ws-07-progress-and-measurement.md) | in progress | B |
| 9 | WS-08 | [Food logging experience](ws-08-food-logging-experience.md) | in progress | B |
| 10 | WS-09 | [Coaching intelligence and adherence](ws-09-coaching-intelligence-and-adherence.md) | in progress | C |
| 11 | WS-10 | [Training log and strength](ws-10-training-log-and-strength.md) | in progress | C |
| 12 | WS-11 | [Health platform sync](ws-11-health-platform-sync.md) | in progress | C |
| 13 | WS-12 | [Backup and portability](ws-12-backup-and-portability.md) | built (the epic MM-59 done with MM-404) | C |
| 14 | WS-13 | [Commercial and release readiness](ws-13-commercial-and-release-readiness.md) | not started | D |
| 15 | WS-15 | [Sleep](ws-15-sleep.md) | not started (added 2026-10-13, the owner's decision) | C |

The state column is `status` in `roadmap.json`, derived from the tickets:
"in progress" means at least one ticket is being worked on, and most
workstreams have a built step with a leftover held open. The progress page
(`mm roadmap`) shows each step's tickets with their status.

Ids are stable labels. If the order changes, `recommendedOrder` changes and
the ids do not. WS-03 was moved to order 1 on 2026-10-08 (design first); the
ids were not renumbered.

```
WS-14 architecture ──► (everything below builds to its rules)
Group A (start now)      Group B                    Group C                 Group D
WS-01 foundations  ──┬─► WS-05 setup/screening ─┐
WS-02 engine       ──┼─► WS-06 targets ─────────┼─► WS-09 coaching ──────┐
WS-03 design/shell ──┼─► WS-07 progress ────────┘   WS-10 training ──┘   ├─► WS-13 release
WS-04 food pack    ──┴─► WS-08 food logging         WS-11 health sync    │
                                                    WS-12 backup ────────┘
```

The drawing is a summary. The edges in `roadmap.json` are the truth, and most
of them block only some steps of the dependent workstream.

## Milestones

Order within a workstream follows four milestones, starting with M0. A step's `milestone` in
`roadmap.json` says which one it serves.

0. **M0, structure, look, voice and shell.** Internal staging, not a release
   gate. The foundations exist before feature work multiplies: the engineering
   rules enforced (one declaration per file, repository and integration
   interfaces with fixtures, WS-14) and the design system (theme, components,
   strings, navigation, charts; [`design/`](../design/README.md), WS-03). The
   engine and safety lane (M1) runs beside it because the two touch different
   files.
1. **M1, a trustworthy first check-in.** The coach's first adaptive change
   happens on day 14. Three known defects affect that number (MM-120, MM-131,
   MM-115), nothing explains it to the user (MM-138), and a health change after
   onboarding goes unnoticed (MM-112). Nobody outside the project should reach
   day 14 before M1.
2. **M2, a closed beta.** Real food search and barcodes, the dashboard and
   design system, honest measurement, and a coach that handles stalls, gaps
   and under-eating: enough for a small group to use daily for two months.
3. **M3, my phone.** The app the owner tests every day on their own phone,
   through local builds, for weeks or months before any release decision
   (the owner, 2026-10-21). Every feature is built and used, none paywalled
   or held back for a review.
4. **M4** is everything else, in each workstream's own order.
5. **M5, store release: future vision, on the backburner.** Only the release
   gates: the Coach unlock's paywall (free tier, trial, purchase), the store
   listing, and the professional, health-claims and legal sign-offs. A feature
   whose wording waits on a sign-off is built now; the sign-off waits here.
   It comes alive if the owner decides to release.

## How order is decided

In this order of precedence:

0. **Structure, then design, before features.** WS-14 (the engineering rules
   in `AGENTS.md`) and WS-03 (the design system) are milestone M0: every later
   file and screen is built to them, not reworked afterwards. This does not
   delay safety: engine defects are a separate lane and proceed in parallel.
1. **Safety.** A defect that could give a user a wrong or unsafe target comes
   before any feature. This is why WS-02 is second only to the ability to
   change the schema.
2. **Foundations that many things stand on.** Schema migrations (MM-61); the
   component library, string catalog and navigation (MM-104, MM-108, MM-99).
   The cost of doing these later grows with every screen and table added.
3. **Shared contracts before their consumers.** The target calculation's
   semantics (WS-02) settle before its contents change (WS-06), and both
   before anything reasons about targets (WS-09).
4. **Schema sequencing.** The database file is a single-lane road (see below).
5. **Engine before screen.** The engine is pure TypeScript and is tested
   against simulated users. A feature's engine half lands with its tests before its
   screen is built.
6. **End-to-end slices.** Within those limits, prefer the step that makes a
   whole user journey work over the one that deepens a single layer.
7. **Long lead times start early.** The food pack (WS-04), finding a
   professional reviewer (MM-29) and learning the stores' trial rules (MM-88)
   take calendar time that engineering effort cannot compress.
8. **Release obligations last, but known from the start** (WS-13).

## How parallel work is decided

Two workstreams are parallel only if all of these hold:

- they own different files (`primaryOwnership`);
- every type, API or table they share is listed in `sharedContracts` and is
  either stable or changed by only one of them;
- neither depends on unfinished work in the other;
- there is a named place where they meet.

"Different feature" is not a reason. WS-05 and WS-06 are different features
and both add fields to `UserSetup`, both read `CoachingPolicy` and both add
cards to the Coach screen. They are in the same group with three written
coordination rules, not "independent".

`parallelGroups` in `roadmap.json` gives, for each group, the condition for
starting it, why it is safe, and the specific collisions to manage.

### The schema lane

`apps/mobile/src/data/currentSchemaVersion.ts`, `currentSchema.ts` and
`migrationSteps.ts` carry the schema (MM-61 is done; it is at version 2
since MM-242).
Nine workstreams need to change it. Rules:

- **One schema change in flight at a time.** The branch that takes the next
  version number merges before the next one starts.
- **One migration per workstream step**, not per ticket. Batch a step's tables
  and columns.
- **Every migration has a test** that upgrades a database created at the
  previous version, with data in it.
- **Additive by default.** New columns are nullable or have defaults. A
  destructive change needs its own ticket.

### Other hotspots

`coordinationHotspots` in `roadmap.json` lists every file or surface that more
than one workstream changes, with a rule for each. The ones that will hurt
most if ignored:

| Hotspot | Why |
| --- | --- |
| `computeTargets.ts`, `nextTargets.ts`, `SafetyBounds.ts` | Four workstreams want to change the target calculation. WS-02's M1 steps are done; WS-06 owns it now; WS-09 adds beside it. |
| `TdeeEstimator.ts` | Phase changes, week shapes and new logging styles each change what the estimator must tolerate. One at a time, each with a full simulator run. |
| `SyntheticUser.ts` | Five workstreams extend the simulator. Additions are optional and default off, so seeded results never change. |
| All user-facing text | Follows `design/voice-and-wording.md`; `apps/mobile/test/voice.test.ts` reads it in place (MM-108). |
| `OnboardingScreen.tsx` | Five workstreams add to onboarding; it is already split by step. Keep it that way. |

## Choosing what to build next

For an implementation agent, or anyone picking up work:

1. **Read the state.** Run `mm req list --status done` and
   `--status in-progress`. Ticket status is the only source of truth for what
   is built.
2. **Find the available steps.** In `roadmap.json`, a step of a workstream is
   available when:
   - every `hard-blocker` and `contract-dependency` edge pointing at that
     workstream whose `scope` includes the step is satisfied, meaning every
     ticket in its `satisfiedBy` is `done`; and
   - the earlier steps of the same workstream that it builds on are done.
3. **Pick by milestone, then order.** Among available steps, take one tagged
   with the earliest unfinished milestone (M1 before M2 before M3). Break ties
   by the workstream's `recommendedOrder`, then by step number.
4. **Check for collisions.** Read the workstream's `coordinationHotspots`. If
   the step changes the schema, check that nobody holds the schema lane. If
   another in-progress ticket touches the same hotspot, pick something else or
   coordinate.
5. **Read the workstream file**, then the tickets for the step. The tickets
   define done. Several tickets carry "choices I made without asking" and open
   questions for the product owner; a step whose tickets have unresolved
   questions that change behavior is not ready, whatever the graph says.
6. **Follow the repository rules** in [`AGENTS.md`](../AGENTS.md): set the
   ticket to `in-progress`, build, set it to `done` with what was verified,
   run `mm check`.

A step's tickets are meant to be built together. Building half a step is
normal; skipping ahead two steps inside a workstream usually is not.

### What is available right now

As of 2026-10-13, with the `done` tickets as they are, these steps have no
unmet dependency and no earlier step of their workstream still open. M0 and
M1 are nearly closed; WS-03 steps 9 (the hierarchy rebuild) and 10 (nothing
native shows) closed the same day they were written; the gap to M2 (a closed
beta) is the food pack lane, the panel's leftovers (WS-03 step 11) and the
leftovers held open across WS-08 and WS-09.

| Step | Tickets | Why |
| --- | --- | --- |
| WS-02 step 6 | MM-135 | **Start here.** The owner decided (2026-10-13): a break offered at 12 weeks and when recovery signals fail, forced only at 20. The engine change replaces MM-31's forced week at sixteen. M1 closed the same day (WS-06 step 3, WS-03 step 1, WS-01 step 6 and WS-14 step 4 are done). |
| WS-03 step 11 | MM-286, MM-287, MM-289 (MM-288 is the owner's decision) | **What the hierarchy panel left for later** (2026-10-13): destinations keep their fold, range and scroll state across tabs; Progress with one figure and the lifts as rows; a demo seed that shows every mark. Step 9 (the hierarchy rebuild, MM-253 to MM-259) was built the same day it was placed. |
| WS-15 steps 1 and 2 | MM-250, MM-251 | **Sleep, first class** (the owner, 2026-10-13): the nightly record from the health platform or by hand, and the sleep-disorder item in the health check. Step 3 (the coach reads it) waits for the panel pass MM-249 asks for. |
| WS-11 step 2 | MM-71 | Choosing the primary scale in Settings, which the ticket promises; a preference column and a Settings row. |
| WS-13 step 1 | MM-95, MM-247, MM-244 | The privacy policy draft (decided: now, with the terms), the public page from the repository (the workflow is the owner's merge), and watching what ML Kit sends on a release build. |
| WS-09 step 4 | MM-248 | Reminders on the minute: the exact-alarm permission, decided 2026-10-13. |
| WS-04 step 1 | MM-51 | The food pack lane, the gap to M2: the spike's two checks need a real pantry (no online source was found); steps 3 to 6 on a device (MM-55, MM-56, MM-57, MM-153) do not wait for them. |

Later steps of a workstream whose earlier step is held open for a leftover
(WS-03 steps 2 and 3, WS-04 steps 3 to 6, WS-11 steps 3 and 4) are
available too, since the leftover rarely blocks them; read the open ticket's
Progress to be sure.

### What not to touch yet

- **One schema change in flight at a time**, each with its migration step
  and upgrade test (the schema lane above).
- **No new file with several declarations, no raw control in a screen, no
  vendor import outside its adapter folder.** The rules are in `AGENTS.md`
  and `test/architecture.test.ts` fails the suite on each (MM-246);
  `test/layers.test.ts` keeps the layers apart.
- **No screen without a story** (`test/gallery/stories.test.tsx` fails it)
  and no design verified anywhere but a browser.
- **No purchase or trial code**: monetization is on the backburner (M5) since
  the owner decided on 2026-10-21 that the app is for personal use.
- **No sentence that says nothing leaves the phone** until MM-244 has watched
  a release build; the terms of use (MM-242) are worded for either answer.

## Dependency relationships

Edges in `roadmap.json` run from the prerequisite to the dependent and have
one of four types:

| Type | Meaning | What to do |
| --- | --- | --- |
| `hard-blocker` | The dependent steps cannot be built correctly yet. | Wait. |
| `contract-dependency` | The dependent builds on a type, API, table or component the prerequisite defines. | Wait, or agree the contract in writing first and accept some rework. |
| `soft-preferred-order` | Either order works; this one is cheaper or gives a better result. | Prefer it; do not block on it. |
| `integration-risk` | No order implied. Both change the same code. | Coordinate; land one, rebase the other. |

`dependsOn` and `unlocks` on each workstream are derived from the first two
types only.

## Keeping the roadmap current

This is a working agreement in `AGENTS.md` (MM-245): the roadmap changes in
the same pull request as the work, and `mm req` fails when it and the
tickets disagree.

**When a ticket is finished:** move its id from `remaining` to `built` in
`roadmap.json`. Availability is computed from ticket status, so nothing else
changes unless the step's description no longer fits.

**When a session ends:** say in `requirements/HANDOFF.md` which workstream
step or milestone the session advanced and what that makes available, or
that nothing moved and why.

**When a ticket is added:**

1. Decide which workstream owns the code it changes. That, not its
   requirements folder, decides where it goes.
2. Add its id to that workstream's `sourceRequirements.remaining` and to a
   step in `sequence` (a new step if it fits none).
3. If it depends on a ticket in another workstream, check that an edge already
   covers it. If not, add one, with `satisfiedBy` and `scope`.
4. If it changes a file another workstream changes, add or extend a hotspot.
5. If it belongs to a milestone, add it to that milestone's list and tag its
   step.
6. Add it to the workstream file's "Requirement sources" and, if it changes
   the sequence, the "Sequence" section.

**When a new workstream seems needed:** it is, if the new tickets share an
ownership area nobody has and would otherwise be scattered across three or
more workstreams. Otherwise they belong to the existing ones.

**Restaged 2026-10-08:** design first. **Caught up 2026-10-13** (MM-245):
the tickets of the React conversion, Storybook, the expert panel and the
terms of use were placed, and the file names here name the React app. See
`restaged` in `roadmap.json`.

**What `mm req` checks** (`tool/src/roadmapChecker.ts`; it runs inside
`mm check` and CI, so none of this can drift unnoticed):

- every ticket in `requirements/` is in exactly one workstream, as `built`
  when it is done and `remaining` otherwise;
- every non-epic remaining ticket is in exactly one step of its workstream,
  and no step names another workstream's ticket;
- every ticket in an edge's `satisfiedBy` belongs to the edge's `from`
  workstream, and its `scope` names steps the `to` workstream has;
- `dependsOn` and `unlocks` match the ordering edges;
- the ordering edges contain no cycle;
- each milestone's ticket list matches the steps tagged with it.

The progress page is not committed (owner, 2026-10-22): `mm roadmap` builds
it locally to look at, and nothing checks it.

## Limits of this roadmap

- **It has no dates or estimates.** It orders work; it does not schedule it.
- **It assumes one developer on Windows with Android**, moving to a Mac for
  iOS later ([`docs/architecture.md`](../docs/architecture.md)). Work that
  needs a Mac (MM-69, and iOS builds generally) is placed late for that
  reason, not because it matters less.
- **Several tickets await product-owner decisions.** The roadmap sequences
  them as written; a decision that changes a ticket may change an edge.
- **It was derived by reading**, on 2026-10-07, from 158 tickets and the Dart
  code as it stood, and caught up on 2026-10-13 with 245 tickets and the
  React app. Where a workstream file says a file "will collide" or a change
  "needs no schema", that is a judgment from the code, not a tested fact.
  The workstream files' prose still describes the plan as first written;
  their "Requirement sources" and "Sequence" sections carry the additions.
