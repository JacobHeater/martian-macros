---
id: MM-559
status: done
component: adaptive-coach
related: [MM-138, MM-128, MM-130, MM-135, MM-115, MM-148, MM-123, MM-118, MM-220, MM-24]
---

# Story: Check in now, from the latest weigh-in

## Context
Targets change only at the weekly check-in, which the app runs by itself (`CheckIn`, `nextTargets`). The person has no way to
ask for one. Checking in on the Coach was passive: "How you are holding up" asks questions but moves no target. Other trackers
(MyNetDiary, for one) let the person recalculate the plan from a new weight whenever they like.

The owner (2026-10-22) asked for the targets (calories, protein, pace) to be recalculated on the fly from measurements, off with
an info notice when there is no recent weigh-in to work from. Looking at it, the owner called it what it is: an ad-hoc check-in,
which checking in with the coach always needed to be, something the person does.

## Decisions
With the owner (2026-10-22):
- **A "Check in now" button**, in "Your targets" on the Coach. It works the targets out now, shows them beside the ones in force
  with why they differ, and keeps them only if the person says so.
- **The weekly check-in stays automatic.** Checking in now is an extra, not a replacement.
- **Off, with an info notice saying why, without a recent weigh-in.**

Choices I made without asking (say if any is wrong):
- **"Recent" is seven days** (`recalculationWeighInDays`, the check-in's own interval). A weigh-in six days old is enough.
- **The same calculation as the weekly check-in**, on today's trend weight and expenditure estimate (the starting estimate during
  calibration, which follows the trend weight through resting energy), **without the weekly step limit.** A check-in the person
  asks for moves the whole way at once, like a change of goal or pace (MM-24, MM-128). Everything safety asks for still applies:
  the raise for a too-fast loss and the hold after one (MM-115), the calorie floor, a maintenance correction already running
  (MM-130), and no calorie reduction while a creatine change settles.
- **Off, each with its own reason in the notice**, during a pause (MM-148), a diet break (MM-135), and the first of two steps out of
  a deficit (MM-130): a weigh-in would not change those, so they are said before a missing weigh-in. Also off on a day targets
  already changed, until tomorrow, so a day keeps one record and one account.
- **Nothing visible changes, nothing is asked**: when the new figures round to the ones in force (MM-123), a snack says the targets
  already match the latest weigh-in.
- **The sheet is the summary.** A kept check-in is stored as seen, so no target-change summary follows it on the next opening.
- **Its cause in the account is its own** (`recalculation`): "You checked in from your latest weight (+120)." It is the person's own
  change, so it cannot be held back once (MM-138), like a pace change.
- The internal name is "recalculation" (the reason stored in each explanation, `nextTargets`' `recalculate`); people read
  "check in". The glossary's "check-in" now covers both.
- The panel pass is skipped: the change was dictated by the owner (apps/mobile/AGENTS.md, "Design").

## Description
"Your targets" on the Coach ends with a secondary "Check in now" button and a caption saying what it does. Pressed, it opens
"Check in": the trend weight (unless the weight is hidden, MM-118) and estimate it worked from; calories, protein minimum, protein
target and intended pace as before → after; why the calories moved, in the lines that add up (MM-138); and "Use new targets" or
"Keep current targets". Kept, the new targets take effect today, the next weekly check-in is a week from today, and a snack says
so. When it is off, the button is shown as off and an info notice under it says why (MM-220); the notice describes the button.

## Acceptance Criteria
```gherkin
Scenario: Checking in between weekly check-ins
  Given targets three days old at 1,500 kcal and a weigh-in today
  When the person presses "Check in now"
  Then "Check in" shows 1,500 kcal → the new calorie target, and why
  When they choose "Use new targets"
  Then targets effective today are stored, more than 100 kcal higher, with the cause "recalculation", marked seen
  And the snack names the next check-in

Scenario: Keeping the current targets
  Given the "Check in" sheet is open
  When the person chooses "Keep current targets"
  Then nothing is stored

Scenario: No recent weigh-in
  Given the last weigh-in was eight days ago
  Then "Check in now" is off
  And an info notice under it says the last weigh-in is more than 7 days old and to weigh in to turn it on

Scenario: A weigh-in six days old
  Given the last weigh-in was six days ago
  Then "Check in now" is on

Scenario: A safety raise is never taken back
  Given the current targets were raised because the loss was too fast
  When the person checks in and today's figures would give less
  Then the target stays where the raise put it

Scenario: Nothing to work out
  Given a pause, a diet break, or the first step out of a deficit is in force
  Then "Check in now" is off and the notice names which
  Given targets already changed today
  Then "Check in now" is off until tomorrow, and the notice says so
```

## UI/UX
- CheckInNow — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CheckInNow). The sheet, laid out like
  `TargetChangeSheet`, its nearest sibling.
- CheckInNowOff — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CheckInNowOff). Off, with the info notice. The button
  sits under the Pace row like "Change pace"; it is a full-width secondary button because it acts on the whole section.

## Notes
Built (2026-10-22):
- Engine: `nextTargets({ recalculate: true })` (a new trigger and reason, `recalculation`), `TargetInputs.stepLimited`,
  `recalculationWithheld` with `RecalculationWithheldReason`, and `recalculationWeighInDays` in `coachConstants`.
- State: `CheckIn.recalculation()` works it out from the check-in's own inputs, and `CheckIn.acceptRecalculation()` keeps it.
- Coach: `useCheckInNow`, `CheckInNowSheet`, the button and notice in `CoachScreen`; wording in `recalculationWithheldText`
  and `explanationLineText`.
- Tests: `test/engine/recalculation.test.ts` (no step limit, the safety raise kept, the cases left alone, the weigh-in window, each
  reason), `test/coach/checkInNow.test.tsx` (the sheet, keep and use, off without a recent weigh-in, six days is enough).
- Not run locally (owner's rule): CI validates. Not yet seen on a phone.

Out of scope: a guided check-in that also weighs in and asks the recovery questions on one screen. It would build on this.
