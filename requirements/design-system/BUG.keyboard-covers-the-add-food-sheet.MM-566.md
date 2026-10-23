---
id: MM-566
status: done
component: design-system
related: [MM-271, MM-438]
---

# Bug: the keyboard covers the add-food sheet, and the sheet changes height

## Context
The owner (2026-10-22), searching for a food with no results on the iPhone: "The keyboard covers the
sliding element. The height on the slide out shall be static."

## Description
A sheet sized itself to its content: with no results it shrank to a short panel at the bottom of the
screen, where the keyboard covered it, and it grew again as results came. The page does not resize for
the keyboard on iOS, so nothing moved the sheet out of its way.

Fixed: a sheet can be "tall", one height whatever it holds (90% of what is in sight); the add-food sheet
is tall. Every sheet stands in the area the keyboard leaves in sight, read from the visual viewport.

## Acceptance Criteria
```gherkin
Scenario: One height
  When the add-food sheet is open, with results or with none
  Then it is the same height

Scenario: Above the keyboard
  When the keyboard comes up under a sheet
  Then the sheet stands above it, whole
```

## Progress
Fixed in `MmSheet` (`size`, `useVisibleArea`) and `showAddFoodSheet`. Regression test:
`test/ui/sheetKeyboard.test.tsx`. Not run locally; CI validates. Owed on a phone: the iPhone with the
keyboard up.
