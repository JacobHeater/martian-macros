---
id: MM-285
component: body-measurements
status: done
related: [MM-253, MM-257, MM-17]
---

# Bug: weight events show ISO dates, and the sheet defaults to Illness

## What the panel found

Event rows and the sheet's Date row showed "2026-10-13" where every other
surface uses the app's words (UX-accessibility UX-20, 2026-10-13). The
sheet's event type defaulted to Illness, so a person adding travel who did
not open the chooser recorded an illness (UX-21).

## The fix

Rows say the day as `Fmt.day` ("Yesterday", "Thu, Oct 8"); the sheet's
Date row does too. The sheet opens with no event chosen ("Choose an
event") and Save event waits until one is.

## Regression test

`test/progress/weightEvents.test.tsx`: rows name the day in words and
never an ISO date; the sheet starts with nothing chosen and cannot save
until an event is chosen. Both failed before the fix.

## Acceptance criteria

```gherkin
Scenario: Dates in words
  Given an illness yesterday
  Then its row reads "Illness" and "Yesterday", and no ISO date appears

Scenario: No default event
  When the sheet opens
  Then no event is chosen and Save event is off until one is
```

## Progress

Fixed 2026-10-13 with the hierarchy rebuild (MM-257).
