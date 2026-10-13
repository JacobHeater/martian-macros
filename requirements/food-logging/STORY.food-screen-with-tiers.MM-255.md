---
id: MM-255
component: food-logging
status: proposed
related: [MM-253, MM-254, MM-224, MM-180, MM-179, MM-219, MM-220]
---

# Story: the Food screen in tiers

## What is built

- **The hero** with the macro switch shared with Dashboard (MM-254); the
  "Macronutrient split" card is removed.
- **Meals as sections, not cards**: each meal is a section header with a
  meal icon (breakfast, lunch, dinner, snack), its subtotal, its add
  button, and its entries as rows; the fold stays.
- **Entry rows** carry a leading icon for how the food was measured
  (weighed, serving, hand, estimate, scanned), so the method reads at a
  glance instead of in the subtitle.
- **The day header** keeps the stepper; the day's completeness mark moves
  into it.
- **One primary action**: the Add food button; per-meal adds are icon
  buttons in the headers as today.
- **Tertiary**: the fiber, alcohol and easy-to-miss lines sit behind "More
  about today" unless they carry a message for today.

## Acceptance criteria

```gherkin
Scenario: Sections
  Then each meal is a header with its icon and subtotal and its entries as rows, with no card around them

Scenario: Method at a glance
  Given a weighed entry and an estimated one
  Then each row shows the icon for its method, and the icon has a text label for a screen reader

Scenario: The switch follows Dashboard
  Given the donut was chosen on Dashboard
  Then the Food hero shows the donut

Scenario: Nothing lost
  Then every line the old screen showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Food.stories.tsx` (Food, NothingLogged),
before and after.
