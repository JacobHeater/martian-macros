---
id: MM-264
component: design-system
status: proposed
related: [MM-262, MM-260, MM-146, MM-191]
---

# Story: a time picker of our own

## What is built

- **`MmTimePicker`**: hour and minute as two drums (a scrolling column
  each, snapping, the chosen value large in the middle), with AM and PM as
  a segmented control where the phone uses 12-hour time; minutes in steps
  of five by default, every minute when the picker is told to. Drawn by
  the design system; no native `<input type="time">` anywhere.
- **The dialogs:** `MmTimeOfDayDialog` (reminders) shows the picker, says
  the time back in words beneath it ("6:30 AM"), takes an allowed range and
  says it as an alert when the time is outside it, so the reminder
  screen's refusal after the fact goes away; an empty value is explained.
  `MmClockTimeDialog` (minutes and seconds, the rest timer) uses the same
  drums with "Minute" and "Second" as the spoken names.
- **Keyboard and screen reader:** each drum is a spinbutton with arrow
  keys and a typed value; the time is announced on every change.
- **Every palette, every state** in the stories: rest, a drum mid-scroll,
  AM/PM, out of range, empty.

## Acceptance criteria

```gherkin
Scenario: No native picker
  When a reminder time is edited
  Then no native time control or popup appears; the drums are drawn by the design system

Scenario: Said back
  Given 6:30 AM chosen
  Then "6:30 AM" is beneath the drums, and OK saves it

Scenario: Out of range
  Given reminders are allowed from 7 am to 9 pm and 10:30 PM is chosen
  Then the range is said as an alert, OK does nothing, and the chosen time stays in the drums

Scenario: Keyboard
  Then arrow keys move each drum by one step, typing sets it, Escape closes with nothing changed
```

## Regression test

`test/ui/timePicker.test.tsx`; the architecture test fails any
`<input type="time">` in `src/`.
