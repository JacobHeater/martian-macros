---
id: MM-265
component: design-system
status: proposed
related: [MM-262, MM-261, MM-104]
---

# Story: a select that is ours

## What is built

- **`MmDropdown` renders no `<select>`.** It is a design-system field: a
  visible label, the current value, our chevron, pressable anywhere; it
  opens the options list (`MmOption` rows in a dialog or a sheet, the
  current one marked "Chosen") that MM-261 made the one way to choose from
  a list. No native list ever appears.
- **States drawn by us:** rest, focus, pressed, disabled (quiet, with the
  value still readable), error.
- **Screen reader:** the field is a button with `aria-haspopup="listbox"`
  and `aria-expanded`; the list is a listbox; the chosen option is
  announced.
- **Callers** (`WeightEventEntrySheet`, `CustomExerciseScreen`, the
  catalog) change nothing but gain the look.

## Acceptance criteria

```gherkin
Scenario: No native list
  When the type of a weight event is chosen
  Then no native select or popup appears; the options list is the design system's

Scenario: The current value is marked
  Given "Travel" is the current type
  When the field is pressed
  Then "Travel" is marked Chosen in the list

Scenario: Disabled
  Given a dropdown with no onChange
  Then it is drawn quiet, the value readable, and pressing it does nothing
```

## Regression test

`test/ui/dropdown.test.tsx`; the architecture test fails any `<select>` in
`src/`.
