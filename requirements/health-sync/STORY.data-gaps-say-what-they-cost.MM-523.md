---
id: MM-523
status: in-progress
component: health-sync
related: [MM-72, MM-516, MM-73, MM-68, MM-69, MM-23, MM-27, MM-323, MM-123, MM-378]
---

# Story: When the app lacks data, it says what that costs, and the user decides

## Context
The owner (2026-10-21), declining background sync (MM-516): "If the app needs more data to close gaps, it can inform the user
that without the data it will have gaps which can affect coaching and trajectory accuracy, but that should ultimately be up to the
user."

The app reads the health platform only while it is open (MM-72). Data can be missing for reasons the user controls: a kind not
allowed, history refused (MM-73 keeps 30 days then), weigh-ins or food not logged on some days, or the app not opened for a long
stretch. Each of these leaves gaps that weaken what the coach can say: the expenditure estimate (MM-23), partial days (MM-27), the
weight trend and the projected dates that rest on it.

## Decisions
- **The owner's (2026-10-21): no background sync, and no pressure.** The app may say what a gap costs; whether to allow more data
  or log more is the user's choice, and declining is a complete answer.

Choices I made without asking (say if any is wrong):
- **Said once, where the gap matters, and dismissible.** The line appears where the estimate or projection it weakens is shown, not
  as a prompt on opening, and a dismissal is kept.
- **It names the consequence, not a fault.** "Without your weigh-ins from Health Connect, the trend and the dates it projects are
  less certain" — never "you are missing" or anything that reads as blame.
- **No line with an eating-disorder history that would ask for more weighing or logging** (as MM-34 and MM-129 do).
- **Two gaps, on Coach (builder, 2026-10-21).** Weigh-ins not allowed, under "Trend weight" in Body; the history refused,
  under the expenditure estimate in "Your metabolism". The projected end of a phase (MM-36) rests on the same trend, so the
  one line under the trend covers it rather than saying it twice. Partial days and days without readings are not lines of
  this ticket: the metabolism estimate already says what it needs (MM-27), and a stretch with the app closed is not
  something allowing would fix.
- **Only while the coach is not yet sure (builder).** The weigh-ins line shows while the coach's weigh-ins are not yet
  "Good" (`CoachConfidence.weighIns`), so a person who types enough weigh-ins sees nothing; the history line while the
  estimate is not yet "Good", since after a few weeks the estimate rests on what was read since connecting. The history line
  shows only while weight is read: without it, history changes nothing the estimate uses.
- **The eating-disorder rule takes out the weigh-ins line only (builder).** The history line asks for a permission, not for
  more weighing or logging, so it stays.
- **The dismissal is kept as a snooze for always (builder).** No column or table of its own (another branch owns the next
  schema): it is a row of the inline insights' snoozes (MM-378), kind `dataGap`, the gap as subject, no end day. Coach's
  area screens list only their own kinds, so it never shows there, and there is no way to turn it back on.
- **Built like the line on label accuracy (MM-123, rule 9).** A note with "Got it"; beside it "Open Settings" for weigh-ins
  (Settings at Health Connect, where the Weight row asks) and "Open Health Connect" for the history, which Health Connect
  asks for only once (MM-73) and is allowed in its own screen of the app's permissions (MM-323). On an iPhone the history is
  always granted, so only the weigh-ins line can show.
- **The words (builder).** "Without weigh-ins from Health Connect, your trend and the dates it projects are less certain.
  Allowing them is up to you." and "Health Connect lets the app read only from 30 days before you connected, so this
  estimate has less to go on. Allowing past data in Health Connect would give it more. It is up to you." The ticket's "rests
  on the last 30 days only" is true only on the first day, so the line says what Health Connect allows instead.

## Description
Where the app knows that more data would narrow an estimate it shows (a kind not allowed, history refused, stretches with no
readings), it says so beside that estimate, with the way to allow it if the user wants, and leaves it there.

## Acceptance Criteria
```gherkin
Scenario: A kind not allowed weakens an estimate
  Given weight is not allowed from the health platform and few weigh-ins are typed
  When the trend or a projected date is shown
  Then a line beside it says that without those weigh-ins the trend and its dates are less certain
  And it offers where to allow them, without asking again once dismissed

Scenario: Declining is a complete answer
  Given the user dismisses the line
  Then it does not come back for the same gap, and nothing else in the app changes

Scenario: History refused
  Given the history permission was refused (MM-73)
  When the expenditure estimate is shown
  Then it says it rests on the last 30 days only, and that allowing history would give it more to go on

Scenario: Eating-disorder history
  Given the profile records an eating-disorder history
  Then no line asks for more weighing or logging
```

## UI/UX
- CoachWeighInsGap, CoachWeighInsGapOpensSettings, CoachWeighInsGapDismissed — apps/mobile/src/gallery/screens/Coach.stories.tsx.
  The weigh-ins line under the trend, where it leads, and dismissed.
- CoachHistoryGap, CoachHistoryGapCannotOpen — apps/mobile/src/gallery/screens/Coach.stories.tsx. The history line under the
  estimate, and Health Connect that cannot be opened.

## Notes
- No background read, ever (MM-516 declined). Opening the app reads what the platform has (MM-72).
- Built 2026-10-21: `coach/dataGapsOf.ts` decides the gaps, `coach/DataGapNote.tsx` says one and keeps its dismissal,
  `CoachScreen` places them; `HealthConnection.history` says whether the history permission is granted. Tests:
  `test/coach/dataGaps.test.tsx` (each scenario above, the eating-disorder case included). Not run locally; CI validates.
- Device check owed: on the owner's phone, with weight not allowed and with the history refused, each line shows once in
  its place, "Open Health Connect" opens the app's page there, and a dismissal survives closing the app.
