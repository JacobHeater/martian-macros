---
id: MM-248
component: adherence
status: proposed
related: [MM-146, MM-95]
---

# Story: reminders arrive on the minute

## The decision

The owner's call (2026-10-13): request Android's exact-alarm permission so a
weigh-in or logging reminder arrives at the time set, not within an hour of
it (MM-146 schedules them inexactly today).

## What to build

- `MmReminders` schedules with an exact alarm when the permission is held
  and falls back to the inexact one when it is not, with the same plan.
- The app asks once, from the reminder settings, with one line of reason:
  "So a reminder arrives at the time you set." It never asks on first run
  and never blocks anything on the answer.
- Settings shows which it is: "On the minute" or "Within an hour", and a
  way to the system setting when the permission was declined.
- The permission is declared with its reason for Play's form (MM-95).

## Acceptance criteria

```gherkin
Scenario: Granted
  Given the exact-alarm permission is held
  When a reminder is scheduled for 7:00
  Then the alarm is exact and the row says "On the minute"

Scenario: Declined
  Given the permission was declined
  Then reminders are scheduled inexactly, the row says "Within an hour", and nothing else changes

Scenario: Asked once, with a reason
  When reminders are first turned on
  Then the reason is shown before the system prompt, and the prompt is not shown again after an answer

Scenario: Never on first run
  Given a new installation
  Then no permission prompt appears before the person opens reminders
```

## Notes

- Android 12 and later: `SCHEDULE_EXACT_ALARM` needs the person's consent in
  system settings; Android 13 and later offers `USE_EXACT_ALARM` to apps
  whose core function is alarms, which this app's is not, so the first is
  the one to request. Verify on a device; the emulator's behaviour differs
  by image.
