---
id: MM-523
status: proposed
component: health-sync
related: [MM-72, MM-516, MM-73, MM-68, MM-69, MM-23, MM-27]
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

## Notes
- No background read, ever (MM-516 declined). Opening the app reads what the platform has (MM-72).
