---
id: MM-649
status: done
component: food-logging
related: [MM-634, MM-640, MM-644]
---

# Story: when the row choosing started from is gone, the focus goes to the next row

## Context
MM-634 returns the focus to the row choosing started from when choosing ends (the UX guard's UX-1). It noted,
not built: when that row was deleted or moved to another day by the action itself, there was no row to
return to, and the focus went nowhere. A screen reader was left at the top of the page.

## Decisions
Choices made without asking (say if any is wrong):
- **The first row still on the day takes the focus** when the action took the starting row off the day
  (deleted, or moved to another day) and that row was among the foods chosen. A logged meal's row counts as
  its foods, as everywhere in choosing (MM-587).
- **A row that stays still gets the focus back**, as MM-634 says: changing the time, the meal, or copying
  keeps every row on the day.
- **Nothing left on the day**: nothing is focused; what happened is said, with Undo (MM-634).
- Also a story at 200% text for the choosing bar (MM-634's UX-2 follow-up), so it is seen in the gallery.

## Acceptance Criteria
```gherkin
Scenario: Deleted
  Given dinner holds salmon and rice, and the snack an apple
  When choosing starts from rice and rice is deleted
  Then the focus is on salmon's row

Scenario: Moved to another day
  When choosing starts from salmon and salmon is moved to yesterday
  Then the focus is on rice's row

Scenario: Still there
  When choosing starts from salmon, rice is ticked, salmon unticked, and rice deleted
  Then the focus is on salmon's row
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: FoodChoosingLargeText).

## Notes
- Built in `FoodScreen` (`changeChosen`). Tests: `test/food/focusAfterChosenRowGone.test.tsx`.
