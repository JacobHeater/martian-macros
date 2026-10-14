---
id: MM-294
component: dashboard
status: done
related: [MM-291, MM-254, MM-272]
---

# Bug: saving the weigh-in says nothing, and the number typed disappears

## What the panel found

Saving the Dashboard's weigh-in removed the field and showed the trend
weight in its place, with nothing announced and focus dropped to the
document (UX-accessibility UX-1, 2026-10-14; WCAG 2.2 SC 4.1.3). The
person typed 184.2 and saw a different number, the trend, so a novice could
not tell the entry was kept (UX-4).

## The fix

A successful save from the Dashboard puts up the snack "Saved 184.2 lb for
today" (the snack host is a polite status region, MM-272), so the number
typed is confirmed in words and aloud while the trend row takes the slot.

## Regression test

`test/dashboard/dashboard.test.tsx` ("says the weigh-in was saved, with the
number typed") finds the status with the number typed; failed before the fix.

## Acceptance criteria

```gherkin
Scenario: The save is confirmed with the number typed
  Given no weigh-in today
  When 181.4 is typed and saved on the Dashboard
  Then a status says "Saved 181.4 lb for today"
  And the trend weight row takes the weigh-in's slot
```

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).
