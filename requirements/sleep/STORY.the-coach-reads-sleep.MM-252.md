---
id: MM-252
component: sleep
status: done
related: [MM-249, MM-250, MM-116, MM-117, MM-138, MM-140, MM-141, MM-143, MM-128]
---

# Story: the coach reads sleep

## What is built

- **The check-in pre-fill** MM-116 promised: the fourteen-day average fills
  "typical hours of sleep", editable.
- **A signal of its own in the relief rule** (MM-117): an average under six
  hours over fourteen nights is a recovery signal beside hunger, energy and
  sleep quality, not a line appended to their trigger. The threshold and
  the window get rows in the evidence register (MM-143), sourced to
  Nedeltcheva 2010 and Tasali 2022 (MM-249).
- **Named in explanations**: the check-in explanation (MM-138) and the stall
  diagnosis (MM-140) say when sleep averaged short over the window, as a
  cause the person can act on, before anything about food accuracy.
- **An offer, not a change**: when the average is under six hours, the Coach
  says what the evidence says in one sentence ("With short sleep, more of
  what you lose appears to be lean tissue and hunger runs higher") and
  offers the gentler pace (MM-128) with one press. Nothing changes until the
  person chooses. Whether short sleep should ever change the target on its
  own is the owner's decision after the panel pass (MM-249).
- **A sleep line on the Coach screen**: the fourteen-day average in hours
  and minutes, and the number of nights recorded; no score, no colour.
- **An insight** in the catalog (MM-141), rationed like the others: "Your
  sleep averaged 5 h 40 m this fortnight" with the sentence above, shown at
  most once a fortnight.

## Acceptance criteria

```gherkin
Scenario: Pre-filled
  Given fourteen nights recorded averaging 6 h 50 m
  When the recovery check-in opens
  Then typical hours shows 6 h 50 m and can be changed

Scenario: A signal of its own
  Given hunger and energy are fine and sleep averages 5 h 30 m over fourteen nights
  Then the relief rule reports short sleep as a signal
  And the offer shows the sentence and the gentler pace

Scenario: Named
  Given a target reduction in a window where sleep averaged under six hours
  Then the explanation names short sleep before any line about logging

Scenario: Never silent
  Then no target changes because of sleep without the person choosing

Scenario: No score
  Then the Coach screen shows hours and nights only; the voice test finds no sleep score, grade or percentage

Scenario: Registered
  Then the six-hour threshold and the fourteen-night window have evidence rows with sources
```

## UI/UX

- The offer on short sleep alone — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachShortSleep). The title "Two weeks of short sleep", the one sentence, the three buttons.
- The sleep line — Coach.stories.tsx (Story: CoachSleepLine). In "How you are holding up": a `StatRow` with the average and the nights; the folded line carries it too.
- The check-in pre-fill — Coach.stories.tsx (Stories: RecoveryCheckIn, RecoveryCheckInNoNights). Hours and minutes filled from the record, with a caption; empty with no nights.
- The explanation — Coach.stories.tsx (Story: WhyYourTargetsShortSleep). The sleep sentence after the lines and before "What it was based on".

## Progress (2026-10-20, feat/m2)

**Built.**
- `SleepRule` (engine): `windowNights` 14, `minimumNights` 7, `shortSleepHours` 6 (which `ReliefRule.shortSleepHours` now reads); `sleepAverageOf` and `shortSleep`; rows in `docs/evidence.md` for the three, with a question "How does sleep come into it?" the How-this-works screen reads.
- The relief rule: `findReliefOffer` takes the `sleepAverage`; short sleep over the record is a `ReliefSignal` of its own (`signals: ['shortSleep']`) that makes the offer with hunger and energy fine; the hours typed at hard check-ins stay a line only when there is no record. `reliefOfferText` gives the sleep-only offer its own title and the sentence "With short sleep, more of what you lose appears to be lean tissue and hunger runs higher."; the same three buttons; nothing changes until one is pressed.
- The explanation (MM-138): `TargetsExplanation.shortSleepAverageMinutes` and `shortSleepNights`, set by `explainTargets` when the average was short, encoded with the record, and said in `TargetChangeSheet` after the lines and before "What it was based on" (the lines about the log). `nextTargets` and `CheckIn` pass the average through.
- The stall (MM-140): `StallAssessment.shortSleepAverageMinutes`/`shortSleepNights`; `stallText` puts the sleep sentence first, before any diagnosis and before the line about missing food.
- The insight (MM-141): `InsightRule.shortSleep` (coaching tier), produced by `findInsights` from the average, worded in `insightText` with the period, nights and average as evidence; rationed like the rest.
- The Coach line: in `RecoveryCard`, a `StatRow` "Sleep, last 14 nights" with the average as hours and minutes and the nights as its detail, and the folded summary "Sleep 6 h 50 m over 12 nights."; no score, no colour.
- The pre-fill: `RecoveryCheckInScreen` shows typical hours as `MmDurationField` filled from the average, with a caption saying where it came from; changed hours are what is saved.

**Tests.** `test/engine/sleepSignal.test.ts` (the average, the threshold, the explanation through storage, the insight); `test/engine/reliefOffer.test.ts` (the signal of its own, both signals, the typed-hours fallback, still only an offer); `test/engine/stallDiagnosis.test.ts` (noted on every diagnosis); `test/format/templates.test.ts` (the sleep-only offer's words); `test/coach/sleepOnCoach.test.tsx` (the line, the empty line, the offer and the gentler pace with nothing changing until pressed, six hours is no offer); `test/coach/recoveryCheckIn.test.tsx` (the pre-fill, changed and saved). The voice test passes over every new sentence.

**Decided here (say if wrong).**
- The signal needs at least seven recorded nights in the fortnight (`SleepRule.minimumNights`, judgement): one short night typed never calls sleep short.
- The average is taken through today (last night ended this morning), everywhere, so the person reads one figure.
- The sleep-only offer suggests the slower pace when there is one and the maintenance week otherwise, as the hard-weeks offer does; "both signals" keeps the hard-weeks title and adds the sleep sentence.
- "Shown at most once a fortnight" for the insight is the catalog's existing rationing: it stays while it holds and is quiet for 28 days once dismissed; no sleep-specific clock was added.
- The sleep line lives in "How you are holding up" (recovery is where sleep belongs), as a `StatRow` like those of "Your targets" and "Body"; the folded line carries the figure so it is read without opening.
- The explanation's sleep note is a sentence beside the lines, not an `ExplanationLine`: it moved no kilocalories, and the lines must add up to the change.
- The panel pass in grading mode that MM-249 asks for before this ticket was not run in this session (no owner present); the thresholds were registered with their sources and graded moderate (six hours) and judgement (the window and the minimum). The epic stays open for that pass and for the owner's decision on a target change.
