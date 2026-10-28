---
id: MM-662
status: done
component: food-logging
related: [MM-302, MM-634, MM-661]
---

# Bug: a hold leaps, and a toast says the obvious

## Context
The owner, 2026-10-27, on MM-661 on the phone: "after long press on some foods the screen shifts rapidly toward
the bottom of the screen", and "don't need the toast, it's redundant and the verbiage sucks anyway."

When choosing starts, every row of the day is redrawn as a box (MM-634): the rows above the held one change
height, and the box took focus through the native attribute, which scrolls to itself. On a phone with no scroll
anchoring (iOS) the row under the finger leapt. The snack "Choosing: tick the foods to change together" was
said at every start.

## Decisions
From the owner (2026-10-27): no leap, no toast.

Choices made without asking (say if any is wrong):
- **The held row stays where the finger is**: the hold hands over the row's edges, and once the boxes are drawn
  the nearest scrolling ancestor moves by the difference (`keepRowInPlace`). The focus goes to the box by hand,
  never scrolled to, so a keyboard or screen-reader user keeps the focus MM-634 gave them (the UX guard's UX-1).
  "Select" from the menu starts as before, with no anchor.
- **Nothing is said** when choosing starts, from a hold or from the menu: the boxes and the bar at the foot say
  it, and the count is said as boxes are ticked (MM-640).

## Acceptance Criteria
```gherkin
Scenario: No leap
  Given a day with many foods
  When the person holds a food low on the screen
  Then the row stays under the finger once the boxes are drawn

Scenario: No toast
  When choosing starts, from a hold or from "Select"
  Then nothing is announced beyond the boxes and the bar
```

## Notes
- `food/keepRowInPlace.ts` (new), `FoodScreen` (the anchor, the layout effect, no snack), `MealSection`,
  `LoggedMealRow`, `ui/MmPressable.tsx` (the hold hands over the anchor), `ui/MmCheckRow.tsx` (focus without
  scrolling). Tests: `test/food/longPressChooses.test.tsx` (focus without scrolling, no toast),
  `test/food/chooseFoodsToChange.test.tsx` (no toast). The scroll correction itself needs layout, which the
  test harness has none of: not verified by Claude; the owner's phone is the check.
