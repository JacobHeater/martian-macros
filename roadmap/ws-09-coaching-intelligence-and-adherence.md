# WS-09: Coaching intelligence and adherence

**Order** 9 · **Group** C · **State** in progress · **Risk** high

## Summary
Everything the coach says and does beyond the weekly number: adherence,
stalls, safety notices, gaps and pauses, recovery, recomp verdicts, rewards
and reports.

## Why this is a workstream
By this point the engine is right (WS-02), a target explains itself (WS-06)
and measurements know their noise (WS-07). This workstream is where the app
starts to behave like a coach: it notices that a user has eaten far below
their floor for a week, that progress has stalled and which of four kinds of
stall it is, that someone has come back after three weeks away, that a recomp
has or has not worked after twelve.

Its tickets come from five requirements folders (safeguards, adherence, coach
insights, adaptive coach, app shell). They are one workstream because they
share three things:

- **they are all rules over the same analysis snapshot**, producing a notice,
  an offer or a summary, never a silent change to targets;
- **they all need rationing and a common tone**, which is what the insight
  framework provides;
- **they must agree with each other**: the stall diagnosis cites the same
  average intake the adherence summary shows; a pause silences the reminders,
  the notices and the streaks together.

It is the workstream with the most prerequisites, and that is the point: it
is the top of the stack.

## Capability it unlocks
A coach that is trusted in month two: honest about adherence, specific about
stalls, careful about restriction, and welcoming after a lapse.

## Included
- A weekly adherence summary: five facts and no score.
- A return flow after a gap; a notice for persistent under-eating.
- The insight framework and its first rule, the stall diagnosis.
- Pausing for travel, illness or injury; local reminders.
- A weekly recovery check-in and an offer to ease a deficit.
- The recomp review and the recomp signal.
- Process rewards; the monthly report.
- A protein-across-meals rule; phase planning.

## Excluded or deferred
- Anything that changes the target calculation: WS-02 and WS-06. Rules here
  recommend, offer and explain. The only automatic target change in this
  workstream is the gap rule that restarts calibration.
- The training-lapse rules of the "goal needs training" ticket: owned by
  WS-05, built when WS-10 step 2 exists, shown through this workstream's
  notice component.
- Weight-jump explanations: WS-07 (shown on the reading, not as an insight).

## Prerequisites
- **WS-06 (MM-121, MM-123, MM-138, MM-139)** for everything.
- **WS-01 (MM-61)** for steps 2 to 5 and 7 (stored state).
- **WS-02 (MM-131, MM-115)** for steps 2 and 3.
- **WS-05 (MM-112)** for steps 2 and 3 (flags; the gap flow re-runs the
  health check).
- **WS-07 (MM-155)** for steps 3 and 6; **MM-34** for phase planning in
  step 8.
- **WS-10 (MM-77)** for step 6 and for the strength trigger in step 5.
- **WS-03 (MM-104, MM-108, MM-99, MM-98)** for every step with a screen.

## Enables
WS-13: the under-eating notice and the gap flow are release must-haves, and
the trial is timed to end after the first monthly report.

## Packages and surfaces
- `packages/engine` (new files: adherence, insights and their catalog, stall
  diagnosis, notices, gap and pause rules, recomp review)
- `packages/domain` (pause, recovery answers, insight records)
- `packages/data` (insight and notice state, pauses, reminder settings,
  recovery answers, stored reports)
- `apps/mobile`: an insight card on the dashboard and Coach screen, the
  weekly summary, the return screen, the pause sheet, reminder settings, the
  recovery sheet, the report
- a local-notifications plugin

## Risks
- **This is where a diet app does harm.** A notice shown to the wrong person,
  praise for the wrong thing, a reminder that reads as guilt. The rules are
  written into the tickets (nothing praises eating under target; no notice
  from a single day; nothing sent because the user has been away) and several
  are enforced by test. Treat those tests as the specification.
- **Notice fatigue.** Five features each want to say something. The insight
  framework's rationing (one a day, three a week, no repeats for 28 days)
  exists to prevent that; build it with the first rule, not after the fifth.
- **Thresholds are judgments.** Stall windows, noise multiples and trigger
  counts have no trial behind them. Every one belongs in the evidence
  register and should be tunable in one place.
- **Local notifications on two platforms.** Exact-alarm permission on
  Android and the pending-notification limit on iOS need checking against
  the pinned Flutter version.
- **Scope.** Sixteen tickets. The internal sequence matters more here than
  anywhere; the first three steps are the ones a beta and a release need.

## Sequence
1. **Adherence summary (MM-149).** M2. A pure engine function and a card. It
   feeds the stall diagnosis, confidence and rewards, so it comes first.
2. **Return after a gap; under-eating notice (MM-147, MM-114).** M2. Both are
   simple rules with large consequences for retention and safety.
3. **Insight framework with the stall diagnosis (MM-141, MM-140).** M2. Build
   the framework for its first real rule. Add the rest of the catalog one
   rule at a time afterwards.
4. **Pause; reminders (MM-148, MM-146).** M3. A pause must silence reminders,
   so build them together.
5. **Recovery check-in and the offer to ease a deficit (MM-116, MM-117).** M4.
   The self-report trigger needs nothing else; the strength trigger waits
   for WS-10 step 3.
6. **Recomp review and recomp signal (MM-133, MM-32).** M4. After WS-07
   step 1 and WS-10 step 3. A waist-and-weight-only version is possible
   earlier and is weaker; the review ticket says what to tell the user when
   strength is missing.
7. **Process rewards; monthly report (MM-92, MM-33).** M3. Rewards count
   exactly what the adherence summary counts. The report reuses the check-in
   explanation, the summary and the recovery lines; it restates nothing.
8. **Protein across meals; phase planning (MM-125, MM-36).** M4. Phase
   planning's projections are fiction without the body-fat estimate from
   WS-07 step 7.

## Done enough to unblock others
MM-149, MM-114 and MM-147 are done. That is the part a public release
requires.

## Do not start before this
The trial and purchase steps of WS-13, whose timing depends on the monthly
report.

## Parallel with
WS-10, WS-11 and WS-12, which are mostly new packages. Within this
workstream, steps 2 and 3 can overlap once step 1 is done, and step 4 is
independent of step 3.

## Requirement sources
- In progress: MM-149 (the weekly summary as five facts on the Coach screen;
  not yet beside the check-in summary or in a report), MM-114 (the
  under-eating notice, its one-tap fix and its 14-day quiet; the support line
  for an eating-disorder history awaits the wording review), MM-147 (gap
  detection, the welcome-back screen, the deficit-count restart and the
  starting estimate after a long gap; confidence after a short gap, the goal
  re-confirmation and the chart are open), MM-140 (the stall diagnosis and its
  card on the Coach screen; its options are text because the things they offer
  are not built), MM-141 (the insight framework, rationing and five of the ten
  rules, on the dashboard).
- Remaining: MM-148, MM-146, MM-116, MM-117, MM-133, MM-32,
  MM-92, MM-33, MM-125, MM-36. Epic: MM-145.

## Notes for whoever builds it
- New engine code goes in new files beside `coach.dart`. Do not add branches
  to `computeTargets` for anything here.
- Every insight comes from a named rule that is a pure function with tests.
  No text is generated at run time, and no language model or server is
  involved. That is a recorded non-goal.
- Safety insights and notices are never behind the paywall. Everything else
  here reads the entitlement interface introduced in WS-06 step 3.
- No composite scores: not for adherence, not for recovery, not for
  confidence. Each ticket explains why; the short version is that a
  composite hides which thing is wrong and invites optimizing the number.
- Insights about weight are suppressed entirely for a user with an
  eating-disorder history, and every insight obeys the weight-display
  setting once WS-07 step 5 exists.
- A gap of 14 days or more, and a pause of 7 days or more, both restart the
  unbroken-deficit count. That interacts with the diet-break decision in
  WS-02 step 6; read its outcome before building steps 2 and 4.
- The simulator needs a user who lapses for four weeks mid-diet and returns,
  and one who under-eats and logs it. Additive and default off, as always.
- Wording for the under-eating notice and anything pointing to professional
  support is reviewed in WS-13 step 2. Helplines change; check the resource
  exists at release time.
