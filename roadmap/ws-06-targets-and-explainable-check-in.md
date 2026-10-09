# WS-06: Targets and the explainable check-in

**Order** 6 · **Group** B · **State** in progress · **Risk** high

## Summary
Turn the weekly number into something an expert would sign and a user can
understand: better macros, tolerance bands, a chosen pace, and a stated reason
and confidence for every change.

## Why this is a workstream
After WS-02 the engine computes the right calories. What it hands the user is
still thin: protein as the midpoint of a range for every goal, a fixed 0.75%
pace with no control, the same target every day shown to the calorie, and a
silent change once a week. The built check-in ticket says it in one line: "A
user is never told that targets changed; they have to notice."

The tickets here come from two requirements folders (macro targets, coach
insights) and are one workstream because they all change one thing: the
record the engine returns from `nextTargets` and the card that shows it. Done
ticket by ticket, that record's shape would change eight times. Done as a
workstream, it changes once (step 3) and grows additively afterwards.

## Capability it unlocks
A target that carries a protein minimum, a band, a list of reasons, and a
confidence level. Everything in WS-09 reads those.

## Included
- The evidence register (every engine constant with its source and grade) and
  the non-goals document.
- Protein minimum and a target chosen by goal, training and age.
- A structured explanation stored with every target; a target history; the
  option to hold a reduction once.
- Coach confidence in three levels, with reasons and one next step.
- Display rounding and "on target" bands.
- A fat-loss pace control with a deficit-fraction limit.
- A maintenance band and a planned exit from a deficit.
- A carbohydrate and fat preference; a week shape with higher days.
- Lean-gain guardrails.

## Excluded or deferred
- Engine semantics (step limit, floors, thresholds): WS-02.
- Adherence, stalls, insights: WS-09. They consume this workstream's output.
- Fiber and alcohol against targets: WS-08 step 6. They need per-entry
  nutrient data.
- Protein across meals: WS-09 step 8. It is an insight rule.

## Prerequisites
- **WS-02 (MM-120, MM-115, MM-132)** for step 2 onward; **MM-131** for step 6.
- **WS-01 (MM-61)** for steps 3, 5 and 7 (stored explanations and settings).
- **WS-05 (MM-112)** for steps 2 and 5 (limits read from the coaching policy).
- **WS-03 (MM-104, MM-108, MM-99)** for step 4 onward. Step 3 belongs to M1
  and may be built before the design system, then migrated.

## Enables
WS-09 entirely. WS-13: the professional reviews against the evidence
register, and the paywall gates features built here.

## Packages and surfaces
- `packages/engine/lib/src/targets.dart`, `coach.dart`, `safety_bounds.dart`
- `packages/domain` (`UserSetup` gains pace, macro balance, week shape)
- `packages/data` (targets history gains an explanation; settings columns)
- `apps/mobile/lib/src/coach/`, the Food screen's summary card, the dashboard
- `docs/evidence.md`, `docs/non-goals.md` (new)

## Risks
- **It rewrites the most safety-sensitive output in the app.** Every step
  must keep the closed-loop tests green: step limit and floor honored in
  every simulated week.
- **Explanations that do not add up destroy the trust they exist to build.**
  The explanation ticket requires the listed contributions to sum to the
  change within 5 kcal across a 16-week simulated run. Make that test first.
- **The week shape interacts with the estimator's partial-day rule.** A
  planned low day could be mistaken for a partly logged one. The ticket asks
  for a simulator check before shipping; if it fails, tighten the shape
  limit.
- **Product-owner decisions.** The hold-a-reduction option, the non-goals
  list, the default macro balance and the paces offered are the author's
  proposals. Step 3 and step 5 should not ship before they are confirmed.
- **Free against paid.** Most of this is Coach-unlock territory. The gate
  does not exist yet.

## Sequence
1. **Evidence register and non-goals (MM-143, MM-144).** M1. Documents and
   one completeness test. No dependency; start alongside WS-02, which is
   changing the constants being documented.
2. **Protein minimum and goal-specific target (MM-121).** M1. First change to
   the target's contents. Engine and tests, then the bar's two marks.
3. **Explanation and confidence (MM-138, MM-139).** M1. The one deliberate
   change to the shape of the target record: add the minimum, the signed
   contributions with reason codes, the inputs used, and the confidence
   parts. One migration. Introduce the entitlement interface here, returning
   "unlocked". Current implementation includes stored confidence and the
   confidence card; simulator calibration and the one-time next-open summary
   remain.
4. **Rounding and bands (MM-123).** M2.
5. **Fat-loss pace (MM-128).** M2. After WS-05 step 2.
6. **Maintenance band and leaving a deficit (MM-130).** M2. After WS-02
   step 2.
7. **Carbohydrate and fat preference; week shape (MM-122, MM-124).** M4.
   One migration for both settings.
8. **Lean-gain guardrails (MM-129).** M4. Its waist signal needs WS-07 step 1
   and its strength signal WS-10 step 3; the surplus cap needs neither.

## Done enough to unblock others
MM-121 is done: target records carry a protein minimum and goal-specific
target, the app displays both, and the engine can determine whether an intake
meets the minimum.

## Do not start before this
Anything in WS-09. The adherence summary judges against bands and the protein
minimum; the stall diagnosis refuses to run below "Fair" confidence.

## Parallel with
WS-07 and WS-08 (different screens and types; shared schema lane). WS-05 with
the coordination already described there. Within the workstream, step 1 runs
beside anything.

## Requirement sources
- Built (since this was written): MM-144 (non-goals).
- Built (since this was written): MM-143 (evidence register).
- Remaining: MM-138, MM-139, MM-123, MM-128, MM-130,
  MM-122, MM-124, MM-129. Epics: MM-119, MM-137.

## Notes for whoever builds it
- The explanation is data, not prose: a list of signed contributions with
  reason codes. Screens turn codes into localized sentences. Storing prose
  would make past explanations untranslatable and untestable.
- Existing targets records get a "no explanation recorded" reason in the
  migration.
- Per-day targets under a week shape are derived from the stored weekly
  target, never stored, so a past day stays explainable.
- Stored and computed values are unrounded. Rounding is display only.
- No reduction is ever worded as a consequence of a particular day's eating.
  The engine estimates expenditure; it does not punish intake.
- When calories are too low for protein, the fat minimum and the
  carbohydrate floor all to fit, the carbohydrate floor gives way first, and
  protein and fat minimums never do. Put that order in code and in a test.
- The register's completeness test fails `mm check` when a public constant
  has no row. Expect it to fail on first run; that is the list of work.
- Citations in the tickets were gathered from searches and summaries. A
  register row is not done until someone has read the primary source.
