---
id: MM-439
status: done
component: food-logging
related: [MM-39, MM-150, MM-410, MM-220]
---

# Bug: Recent foods scroll sideways, very far when names are long

## Context
Found by the owner on 2026-10-20. The Add food sheet shows recent foods (MM-39) as one row of chips
that scrolls sideways. Each chip is as wide as its name, so long names make the row scroll a very
long way, and a person has to swipe through it to find a food. The sheet scrolls only sideways
here.

## Decisions
Choices made without asking (say if any is wrong):
- **Recent foods are list rows**, the rows a search already shows for a recent food that matches
  ("Your recent food · 510 kcal"), as rule 9 asks: the nearest sibling is reused. A long name wraps
  inside the row.
- **The five newest show first; "More recent foods" shows the rest**, as search's "More results"
  does (MM-410), so "Enter manually" stays near the top of the sheet (MM-220).

## Description
Recent foods are listed down the sheet, one row each, never in a sideways scroller, whatever the
length of their names.

## Acceptance Criteria
```gherkin
Scenario: Recent foods are rows
  Given recent foods, one with a name of more than sixty characters
  When the Add food sheet opens
  Then each recent food is a row under "Recent foods"
  And nothing in the sheet scrolls sideways

Scenario: Five first
  Given eight recent foods
  When the Add food sheet opens
  Then the five newest are listed
  When "More recent foods" is pressed
  Then all eight are listed

Scenario: A recent food fills the form
  When a recent food's row is pressed
  Then the form is filled from it, as before
```

## UI/UX
- Add food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: Add Food). Recent foods as
  rows, with "More recent foods".

## Notes
Guarded by `apps/mobile/test/food/recentFoodsAreRows.test.tsx`, which failed before the fix (the
recents were chips in `.food-recents`, a sideways scroller).
