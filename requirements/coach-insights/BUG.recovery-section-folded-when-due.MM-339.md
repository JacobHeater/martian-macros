---
id: MM-339
status: done
component: coach-insights
related: [MM-116, MM-299, MM-321]
---

# Bug: "How you are holding up" stayed folded when the check-in was due

## Context
Found drawing the Coach screen's undrawn states for MM-321 (story "Recovery Opens"). The section is meant
to open when this week's recovery check-in is due, with "Answer this week" in reach. It read whether the
check-in was due once, when it was first drawn, which can be before the check-ins have been read; it then
said "This week's five questions are due." in its summary while staying folded, the button hidden.

## Description
The section opens each time the check-in falls due, whenever that becomes known. Answering leaves it open,
showing the answers.

## Acceptance Criteria
```gherkin
Scenario: Due on opening Coach
  Given this week's recovery check-in is due
  When the Coach screen opens
  Then "How you are holding up" is open and "Answer this week" can be pressed

Scenario: Answered
  When this week's check-in is answered
  Then the section stays open with a line per question
```

## Notes
Guarded by `apps/mobile/test/coach/recoveryOpenWhenDue.test.tsx`, which failed before the fix, and the
existing "answering stores one record and shows the five lines" in `recoveryCheckIn.test.tsx`.
