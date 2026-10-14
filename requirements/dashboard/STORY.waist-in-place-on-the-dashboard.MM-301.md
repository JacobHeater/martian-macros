---
id: MM-301
component: dashboard
status: done
related: [MM-291, MM-294, MM-298, MM-155, MM-257, MM-272, MM-302, MM-303, MM-304]
---

# Story: the waist is measured on the Dashboard, and the save offers Progress

## The owner's request (2026-10-14)

Looking at the Dashboard on his phone: some of its rows should be windows
into a measurement that do not need another screen, the waist among them.
He should be able to record the waist there without navigating, and the
confirmation should offer to take him to see it in the other screen.

## What is built

- The Dashboard's waist row asks for a measurement in place, in the slot
  the answer takes (as the weigh-in does, MM-291), whenever no waist
  measurement still counts: none at all, or none in the last
  `ReminderRule.measurementEveryDays` (7) days, the same window that
  silences the weekly measurement reminder. Its title is "Waist", its line
  the last measurement and when ("Last 37 in · Sat, Oct 3"), or "Once a
  week is enough" before the first, then one field heard as "Today’s
  waist, inches" (or centimeters), Save, and how to measure beneath:
  "Morning, before eating. Tape level with the navel, snug, breathe out
  normally." (MM-155's conditions, ME-2).
- Its Save is secondary and heard as "Save waist"; the weigh-in's is heard
  as "Save weigh-in" (PD-1, UX-3): the weekly waist never takes the
  screen's one primary from the daily weigh-in.
- The field takes one reading, kept as it is (the quick entry of MM-155).
  The three readings whose middle is kept stay in Progress. One reading
  costs what MM-155 says: a change has to pass 2.1 cm instead of 1.4, and
  it does not count toward the personal noise figure (ME-1). A mistake is
  corrected by saving again in Progress the same day, which replaces it
  (ME-6).
- Every waist value on the Dashboard is said to the quarter inch or half
  centimeter a tape can tell (MM-155, ME-5).
- A value outside what a waist can be is refused the way Progress refuses
  it, and "That value looks off. Check it." is said under the field.
- Once saved, the row shows the measurement and opens Progress, as before.
- The save is confirmed by a snack with the value typed, the unit last,
  "Waist saved: 36 in" (PD-2, UX-4), with one action, "Open Progress",
  which opens Progress. The snack stands above the navigation bar (MM-302).
- The weigh-in's confirmation (MM-294) carries the same action.

## Acceptance criteria

```gherkin
Scenario: The waist is asked for when no measurement counts
  Given the last waist measurement is 7 or more days old, or there is none
  Then the Dashboard's waist row holds a field for the waist, with Save

Scenario: A measurement this week is shown, not asked for
  Given a waist measurement 3 days ago
  Then the waist row shows it and opens Progress, and holds no field

Scenario: Saving on the Dashboard keeps one reading and stays on the Dashboard
  Given no waist measurement counts
  When 36 is typed in the waist field and saved
  Then a waist of 36 in is recorded for today, from one reading
  And the Dashboard stays open, with the waist row showing 36 in
  And a status says "Waist saved: 36 in" with "Open Progress"

Scenario: The confirmation opens Progress
  When "Open Progress" is pressed on the confirmation
  Then Progress opens

Scenario: A value that is not a waist is refused
  When 3 is typed in the waist field and saved
  Then nothing is recorded and "That value looks off. Check it." is said under the field

Scenario: Asked from the day a measurement stops counting
  Given a waist measurement 6 days ago
  Then the waist row holds no field
  And the next day it does

Scenario: Each Save is told apart, and the weekly one is secondary
  Given both the weigh-in and the waist are asking and typed
  Then "Save weigh-in" is the one primary and "Save waist" is secondary

Scenario: A quarter inch is said as typed
  When 35.25 is saved in inches
  Then the status says "Waist saved: 35.25 in"

Scenario: The weigh-in's confirmation offers Progress too
  When a weigh-in is saved on the Dashboard
  Then its confirmation carries "Open Progress"
```

## UI/UX

- Not Weighed Today — apps/mobile/src/gallery/screens/Today.stories.tsx
  (Story: Not Weighed Today). Both rows asking: the weigh-in, then the
  waist never measured.
- Waist Due — apps/mobile/src/gallery/screens/Today.stories.tsx (Story:
  Waist Due). Weighed today, the last waist over a week old.
- Dashboard — apps/mobile/src/gallery/screens/Today.stories.tsx (Story:
  Dashboard). The waist measured this week, shown as a row.
- Waist Typed, Waist Refused, Both Typed, Waist Saved, Weigh In Saved —
  apps/mobile/src/gallery/screens/Today.stories.tsx. The typed, refused
  and saved states, the snack above the navigation bar.

## Tests

`apps/mobile/test/dashboard/dashboard.test.tsx` ("MM-301" tests).

## Progress

Built 2026-10-14 (Session 26), drawn in Storybook and reviewed by the
panel first (MM-293), `docs/agent-runs/mm301-waist-in-place/`. What the
panel left is MM-304.
