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
- `apps/mobile/src/engine` (new files: adherence, insights and their catalog, stall
  diagnosis, notices, gap and pause rules, recomp review)
- `apps/mobile/src/domain` (pause, recovery answers, insight records)
- `apps/mobile/src/data` (insight and notice state, pauses, reminder settings,
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
  the shell's `MmReminders` plugin.
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
   The self-report trigger needs nothing else; the strength trigger, built
   2026-10-21 on WS-10 step 3's strength trend, reads the training log.
6. **Recomp review and recomp signal (MM-133, MM-32).** M4. After WS-07
   step 1 and WS-10 step 3. A waist-and-weight-only version is possible
   earlier and is weaker; the review ticket says what to tell the user when
   strength is missing.
7. **Process rewards; monthly report (MM-92, MM-33).** M3. Rewards count
   exactly what the adherence summary counts. The report reuses the check-in
   explanation, the summary and the recovery lines; it restates nothing.
   Done 2026-10-21.
8. **Protein across meals; phase planning (MM-125, MM-36, MM-507, MM-450).** M4. Phase
   planning's projections are fiction without the body-fat estimate from
   WS-07 step 7, and the report's body-fat range (MM-450) waits for it too.
   MM-450 done 2026-10-21: the range from the waist at each end of the month.
- Also placed 2026-10-13 in earlier steps: step 3: MM-168.
13. **Reminders on iOS (MM-405).** M4. The plugin over `UNUserNotificationCenter` in the iOS shell of MM-403: the plan is exactly what is pending, a prompt and nothing more, no boot receiver because iOS keeps pending requests. Done 2026-10-21; its phone checks are owed.

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
  rules, on the dashboard), MM-148 (pauses: setting, extending and ending one, the maintenance guide,
  the estimator, the deficit count and the resume screen; streaks do not exist to be frozen), MM-146 (three local
  reminders with their own times, the two-a-day cap, the quiet period, the stop after a week unanswered and the
  onboarding offer; not the check-in or recovery ones; iOS untried), MM-248 (exact alarms when allowed, asked once
  with a reason from Settings, "On the minute" or "Within an hour"; checking on a phone is open), MM-116 (the five weekly questions, skipping, the
  eight-week lines on the Coach screen, and the missed-period question from marked period days; not its reminder or a
  place in the target-change summary), MM-117 (the offer after two hard check-ins or two lifts falling: a two-week
  break, a slower pace, or carry on; not the pace names, and not checked on a device), MM-33 (a report every 28 days: the
  work, the body, the measured expenditure or why there is none, each target change, strength, the longest logging run
  and the month's personal records; photos MM-157), MM-450 (the body-fat range from the waist in the report, at the end
  of the month and when it began, as it stood then; no change with an eating-disorder history), MM-92 (the logging streak, forgiving one missed
  day in seven, as a quiet Dashboard line; personal records on the workout, and both in the monthly report).
- Remaining: MM-133, MM-32, MM-507. Epic: MM-145.
- Done 2026-10-21: MM-36 (phase planning; setting the goal body fat is MM-507), MM-361 (every child built or
  closed), MM-248 (reminders on the minute; what is owed is on a phone).
- Placed 2026-10-13 (MM-245), from the React conversion onward: MM-168 (The insight card's Dismiss button sat under the Add food button, done).
- Placed 2026-10-13 in step 4: MM-248 (reminders on the minute: the exact-alarm permission, asked once with a reason; the owner's call).
- Added 2026-10-14 (step 9): MM-312 (the sodium-over-the-limit insight, after MM-311).
- Added 2026-10-19 (step 13): MM-405 (reminders on iOS).

## Notes for whoever builds it
- New engine code goes in new files beside `nextTargets.ts`. Do not add branches
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
