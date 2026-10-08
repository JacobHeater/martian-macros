# WS-02: Engine truth and safety limits

**Order** 2 · **Group** A (start now) · **State** partly built · **Risk** high

## Summary
Correct the known defects in the trend filter, the expenditure estimate and
the safety limits, and settle how the target calculation behaves, before
anything else is built on it.

## Why this is a workstream, and why it is this early
The engine is the product. It is also the best-tested part of the repository:
sixty tests, including a closed loop against simulated users. The later
requirements work found five things it gets wrong or cannot yet do, all in
`packages/engine`, all pure Dart, none needing a schema change or a screen:

| Problem | Ticket | Consequence if left |
| --- | --- | --- |
| Protein target steps by about 30 g at BMI 30 | MM-120 | A visible, unexplainable jump mid-diet |
| Water that moves at a phase change is read as tissue | MM-131 | The first adaptive change is biased for every fat-loss user; ending a cut looks like overeating |
| The step limit throttles safety raises | MM-115 | A user losing faster than the app's own limit gets calories back 100 kcal a week |
| Body-fat thresholds are applied to a point estimate good to ten points | MM-132 | Safety rules miss and flip week to week |
| No floor on body size | MM-111 | An underweight user can be given a deficit |

WS-06 will change what a target contains and attach an explanation to every
change. Explaining a number that is wrong, or building bands around a step
limit whose meaning is about to change, is rework. So the semantics settle
here first.

## Capability it unlocks
An expenditure estimate and a set of limits that later workstreams can explain
(WS-06), measure adherence against and diagnose stalls from (WS-09), and
submit for professional review (WS-13).

## Included
- The five fixes above.
- The simulator gains a glycogen-and-gut compartment and, with it, the
  ability to test phase changes.
- The diet-break policy decision and whatever engine change follows.
- Later: the spike on a single joint model for weight, water, fat and lean.

## Excluded or deferred
- What a target *contains* (protein minimum, pace choice, bands,
  explanation): WS-06.
- Weight events such as creatine: WS-07 step 2. It reuses the mechanism built
  here for MM-131; design them together, build that one there.
- Any screen. The Coach screen shows whatever the engine returns; new flags
  need at most a line of text until WS-06 rebuilds the card.

## Prerequisites
None. It needs neither migrations nor the design system.

## Enables
WS-06 (target contents), WS-07 step 2 (weight events) and step 7 (body-fat
estimate), WS-09 (stall diagnosis, notices), WS-13 (the professional review
should see corrected limits).

## Packages and surfaces
- `packages/engine/lib/src/`: `safety_bounds.dart`, `targets.dart`,
  `coach.dart`, `weight_trend.dart`, `tdee_estimator.dart`,
  `body_composition.dart`, `mode_advisor.dart`
- `packages/engine/test/` and `test/support/synthetic_user.dart`,
  `coach_loop.dart`
- `packages/domain/lib/src/screening.dart` (the underweight rule in
  `CoachingPolicy.derive`, MM-111 only)

## Risks
- **MM-131 is a prediction.** The size of the bias comes from arithmetic, not
  from a run. Its first acceptance criterion is to reproduce and measure it.
  If the measured bias is small, the ticket closes with that result and the
  later steps are unaffected.
- **Fixing the estimator can unfix its calibration.** The existing tests
  assert that the truth lies within two stated standard deviations at least
  85% of the time. Every change here must keep that, including in the weeks
  after a phase change.
- **An upward-only exemption from the step limit can oscillate.** MM-115
  carries a no-oscillation criterion over forty simulated users; treat it as
  the main test.
- **Cautious thresholds cost some users speed.** MM-132 gives users with only
  a formula body-fat estimate slower limits near a threshold. That is a
  product decision recorded in the ticket, and it should be confirmed before
  it ships.

## Sequence
1. **Protein step at BMI 30 (MM-120).** M1. Small and independent.
2. **Phase-change water (MM-131).** M1. Simulator first, then measure, then
   choose between the three candidate methods by results.
3. **Asymmetric step limit and the fast-loss raise (MM-115).** M1. After
   step 2, because its "ignore the first ten days" rule should come from the
   phase-change mechanism, not a second hard-coded number. This also closes
   the open note on the diet break rising only 100 kcal.
4. **Thresholds under uncertainty (MM-132).** M1.
5. **Underweight guard (MM-111).** M1. Land it before WS-05 step 2, which
   extends the same function.
6. **Diet-break policy (MM-135).** M2. A product-owner decision first; the
   spike lists five questions and the panel's proposed answers.
7. **Joint model spike (MM-35).** M4. Only after step 2 has shown what the
   two-step model can and cannot do with a glycogen term.

## Done enough to unblock others
MM-120, MM-131, MM-115 and MM-132 are done, the full engine suite passes, and
`computeTargets`' inputs, flags and step-limit behavior are not expected to
change again except by WS-06.

## Do not start before this
- WS-06 step 2 onward (anything that changes `computeTargets`' output).
- WS-09 steps 2 and 3 (notices and stall diagnosis).
- WS-07 step 2 (weight events) before step 2 here.

## Parallel with
WS-01, WS-03 and WS-04: no shared files. WS-06 step 1 (the evidence register)
can and should run alongside, since it documents the constants this workstream
is changing.

## Requirement sources
- Built: MM-18, MM-19 (trend filter, cycle noise); MM-23, MM-24, MM-25, MM-26,
  MM-27, MM-28 (estimate, check-in, goals, partition, partial days, limits);
  MM-30 (simulator); MM-31 (diet break as built); MM-120, MM-131 (reference
  weight, settling after a phase change); MM-115 (raise when loss outruns the
  limit); MM-111 (underweight guard).
- Remaining: MM-132, MM-135, MM-35. Epics: MM-22, MM-110.

## Notes for whoever builds it
- Simulator changes are additive and default off. A simulated user created
  with today's arguments must produce today's history, byte for byte, so the
  existing seeded tests remain meaningful.
- The simulated person currently obeys the same partition model the engine
  assumes; the simulator ticket already names that as its biggest weakness.
  MM-131 removes one instance of it. Do not add a glycogen model to the
  simulator that is the same code as the engine's fix.
- New inputs to `analyze` (phase-change dates now; events and pauses later)
  should be optional with a no-data default that reproduces current results.
- Every constant added or changed here needs a row in the evidence register
  once WS-06 step 1 exists.
- The engine stays free of I/O, clocks and randomness. "Today" is a
  parameter.
- Biological sex is a required, exhaustive parameter wherever a rule differs
  by sex (MM-132's thresholds do). Do not add a default branch.
