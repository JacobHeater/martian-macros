---
id: MM-263
component: design-system
status: proposed
related: [MM-262, MM-260, MM-104, MM-184]
---

# Story: a date picker of our own

## What is built

- **`MmDatePicker`**: a calendar drawn by the design system. A month grid
  with the weekday row, today marked, the chosen day in Ember, days outside
  the allowed range quiet and inert; previous and next month as icon
  buttons; the month and year as a heading that opens a year list for a
  quick jump (a date of birth is decades away). Swiping between months
  within `interaction-and-motion.md`'s budget.
- **The dialog** (`MmDateDialog`) shows the picker, says the chosen day in
  words beneath it, and keeps the range message and the inert-OK
  explanation MM-260 added. No native `<input type="date">` is rendered
  anywhere; the field that opens the dialog (`MmPickerField`) becomes a
  design-system row with a visible label, the value in words, and our
  chevron, pressable anywhere.
- **Keyboard and screen reader:** the grid is `role="grid"` with arrow-key
  movement, the chosen day announced with its full date, Escape closes.
- **Every palette, every state** in the Fields and Overlays stories: rest,
  focused day, chosen day, a range boundary, the year list open.

## Acceptance criteria

```gherkin
Scenario: No native picker
  When the date of birth is edited
  Then no native date control or popup appears; the calendar is drawn by the design system

Scenario: Choosing a day
  Given the calendar at January 1996
  When the 1st is pressed
  Then "January 1, 1996" is said beneath, and OK saves it

Scenario: A date decades away
  When the month-and-year heading is pressed
  Then a year list opens and choosing 1996 shows that year's month

Scenario: Range
  Given days after the latest allowed
  Then they are quiet and inert, and the range is said when one is tried

Scenario: Keyboard
  Then arrow keys move between days, Enter chooses, Escape closes with nothing changed
```

## Regression test

Rendering and choosing in `test/ui/datePicker.test.tsx`; the architecture
test fails any `<input type="date">` in `src/`.
