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

| Order | Id | Workstream | State on 2026-10-08 | Group |
| --- | --- | --- | --- | --- |
| 1 | WS-14 | [Architecture and module boundaries](ws-14-architecture-and-module-boundaries.md) | not started | A |
| 2 | WS-03 | [Design system and app shell](ws-03-design-system-and-app-shell.md) | in progress | A |
| 3 | WS-01 | [Delivery foundations](ws-01-delivery-foundations.md) | partly built | A |
| 4 | WS-02 | [Engine truth and safety limits](ws-02-engine-truth-and-safety-limits.md) | partly built | A |
| 5 | WS-04 | [Food data pack](ws-04-food-data-pack.md) | not started | A |
| 6 | WS-05 | [Setup, screening and profile lifecycle](ws-05-setup-screening-and-profile.md) | partly built | B |
| 7 | WS-06 | [Targets and the explainable check-in](ws-06-targets-and-explainable-check-in.md) | not started | B |
| 8 | WS-07 | [Progress and measurement](ws-07-progress-and-measurement.md) | partly built | B |
| 9 | WS-08 | [Food logging experience](ws-08-food-logging-experience.md) | partly built | B |
| 10 | WS-09 | [Coaching intelligence and adherence](ws-09-coaching-intelligence-and-adherence.md) | not started | C |
| 11 | WS-10 | [Training log and strength](ws-10-training-log-and-strength.md) | not started | C |
| 12 | WS-11 | [Health platform sync](ws-11-health-platform-sync.md) | not started | C |
| 13 | WS-12 | [Backup and portability](ws-12-backup-and-portability.md) | not started | C |
| 14 | WS-13 | [Commercial and release readiness](ws-13-commercial-and-release-readiness.md) | not started | D |

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
3. **M3, public release in the United States.** Everything the listing
   promises, every external review recorded, the free tier and the Coach
   unlock working as sold.
4. **M4** is everything else, in each workstream's own order.

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
5. **Engine before screen.** The engine is pure Dart and is tested against
   simulated users. A feature's engine half lands with its tests before its
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

`packages/data/lib/src/database.dart` is at `schemaVersion` 1 with no
migrations. Nine workstreams need to change it. Rules, once MM-61 lands:

- **One schema change in flight at a time.** The branch that takes the next
  version number merges before the next one starts.
- **One migration per workstream step**, not per ticket. Batch a step's tables
  and columns.
- **Every migration has a test** that upgrades a database created at the
  previous version, with data in it.
- **Run `mm gen`; never hand-edit `database.g.dart`.**
- **Additive by default.** New columns are nullable or have defaults. A
  destructive change needs its own ticket.

### Other hotspots

`coordinationHotspots` in `roadmap.json` lists every file or surface that more
than one workstream changes, with a rule for each. The ones that will hurt
most if ignored:

| Hotspot | Why |
| --- | --- |
| `targets.dart`, `coach.dart`, `safety_bounds.dart` | Four workstreams want to change the target calculation. WS-02 finishes first; then WS-06 owns it; WS-09 adds beside it. |
| `tdee_estimator.dart` | Phase changes, week shapes and new logging styles each change what the estimator must tolerate. One at a time, each with a full simulator run. |
| `synthetic_user.dart` | Five workstreams extend the simulator. Additions are optional and default off, so seeded results never change. |
| All user-facing text | MM-108 moves every string into localization files in one pass. Do it while four screens exist. |
| `onboarding_screen.dart` | 531 lines in one file, and five workstreams add to onboarding. Split it by step during the WS-03 migration. |

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

With nothing beyond the current `done` tickets, these steps have no unmet
dependency:

| Step | Tickets | Why first |
| --- | --- | --- |
| WS-01 step 1 | MM-61 | Blocks more than any other ticket. |
| WS-02 step 1 | MM-120 | A small, self-contained defect in a headline number. |
| WS-02 step 2 | MM-131 | The largest risk to the product's central claim; starts by measuring it. |
| WS-14 step 1 | MM-160 | **Start here.** Enforces one declaration per file and splits the packages; nearly every file is touched, so it goes before other work in those packages. |
| WS-03 step 1 | MM-102, MM-103, MM-104, MM-105, MM-163 | 1a (theme) is done. 1b (components, gallery, one implementation per control, screen migration) waits for WS-14 step 1. |
| WS-04 step 1 | MM-51 | Starts the longest lead time. |
| WS-05 step 1 | MM-83 | Screening answers cannot be corrected at all today. Needed for M1; build it after WS-03 steps 1 and 2 so it is born in the new system. |
| WS-06 step 1 | MM-143, MM-144 | Documents and one test. Makes the professional review cheaper. |
| WS-10 step 1, WS-11 step 1 | MM-76, MM-67 | New data and a new package with no dependencies. Not urgent (M3); good work to hand off. |
| WS-12 step 1, WS-13 step 1 | MM-65, MM-88, MM-95 | Research and documents with no code. |

### What not to touch yet

- **No new `MmStore` methods and no new file with several declarations.** The rules are in `AGENTS.md`; after MM-161, persistence is a new narrow repository interface.
- **No new tables or columns** until MM-61 is done.
- **No changes to what a target contains** (protein minimum, explanation,
  bands) until WS-02 steps 1 to 4 are done.
- **No stall diagnosis, insight or adherence feature** until targets carry
  bands and a confidence level (WS-06's gate).
- **No new screens in large numbers** until the component library and string
  catalog exist (WS-03 steps 1 and 2, M0). A screen built before them is built
  twice. Engine work is not affected.
- **No purchase or trial code** until MM-88 has answered how each store allows
  a trial for a one-time purchase.

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

**When a ticket is finished:** nothing here needs to change. Availability is
computed from ticket status. Move the id from `remaining` to `built` in
`roadmap.json` when convenient; that list is a snapshot, dated by `asOf`.

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

**Restaged 2026-10-08:** design first. See `restaged` in `roadmap.json`.

**Checks worth running after any edit** (none is automated yet; a `mm roadmap`
command that performs them would be a reasonable addition to `tool/`):

- every ticket in `requirements/` is in exactly one workstream;
- every non-epic remaining ticket is in exactly one step;
- every ticket in an edge's `satisfiedBy` belongs to the edge's `from`
  workstream;
- `dependsOn` and `unlocks` match the edges;
- the ordering edges contain no cycle;
- each milestone's ticket list matches the steps tagged with it.

## Limits of this roadmap

- **It has no dates or estimates.** It orders work; it does not schedule it.
- **It assumes one developer on Windows with Android**, moving to a Mac for
  iOS later ([`docs/architecture.md`](../docs/architecture.md)). Work that
  needs a Mac (MM-69, and iOS builds generally) is placed late for that
  reason, not because it matters less.
- **Several tickets await product-owner decisions.** The roadmap sequences
  them as written; a decision that changes a ticket may change an edge.
- **It was derived by reading**, on 2026-10-07, from 158 tickets and the code
  as it stood. Where a workstream file says a file "will collide" or a change
  "needs no schema", that is a judgment from the code, not a tested fact.
