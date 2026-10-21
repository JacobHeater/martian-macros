---
id: MM-438
status: done
component: food-logging
related: [MM-99, MM-100, MM-180, MM-254, MM-255, MM-288, MM-302, MM-152]
---

# Story: food is added from a meal's "+", and nowhere else

## Context
The Dashboard had an "Add food" action in its bar (MM-100, MM-288) and the Food screen had a floating
"Add food" button (MM-255), both opening the Add food sheet with the meal chosen from the clock. Each
meal on Food also has its own "+" ("Add food to breakfast", MM-180). The owner decided on 2026-10-20
that they do not like the "+ Add food" button on any screen: food is added on the Food screen, from
the "+" beside the meal it belongs to.

## Decisions
From the owner (2026-10-20):
- **No "Add food" button on any screen.** The Dashboard's bar action and the Food screen's floating
  button are removed.
- **A meal's "+" is how food is added.** The sheet opens with that meal chosen.
- **The easy-to-miss chips stay** (cooking oil, drinks, sauces and the estimate, MM-152): they are
  reminders on the Food screen, not an Add food button.

Choices made without asking (say if any is wrong):
- **`MmFab` stays in the design system**, with its catalog entry and tests, though no screen uses it
  now. Removing the component is a separate decision.
- **The Dashboard keeps no lead action once weighed.** Before, Add food became the screen's one Ember
  action after the weigh-in (MM-288); with it gone, the weigh-in's Save is the only primary, and only
  while it asks.
- **Food loses the room left at its foot for the floating button**, so the last line no longer
  scrolls into empty space.
- Editing an entry (tapping its row) and the sheet itself are unchanged.

## Description
The Dashboard and the Food screen have no "Add food" button. On Food, each meal's "+" opens the Add
food sheet for the day shown, with that meal chosen. MM-100's "Add food" from the Dashboard and
MM-255's "one primary action: the Add food button" are superseded by this ticket.

## Acceptance Criteria
```gherkin
Scenario: No Add food on the Dashboard
  Given the Dashboard, weighed in today or not
  Then there is no "Add food" button

Scenario: No floating Add food on Food
  Given the Food screen
  Then there is no "Add food" button

Scenario: A meal's "+" adds to that meal
  Given the Food screen showing a day
  When "Add food to lunch" is pressed
  Then the Add food sheet opens for that day with Lunch chosen

Scenario: The reminders still open the sheet
  Given the easy-to-miss line shows its chips
  When "drinks" is pressed
  Then the Add food sheet opens searching for "drink"
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: Food, Nothing Logged, Entry
  Removed). The meals' "+" are the only adds; nothing floats above the list.
- Today — apps/mobile/src/gallery/screens/Today.stories.tsx (Story: Today). The bar holds only
  Settings.

## Notes
Built in `apps/mobile/src/app/HomeShell.tsx` (the bar action and the floating button removed) and
`apps/mobile/src/food/FoodScreen.tsx` (the spacer at its foot removed). Guarded by
`apps/mobile/test/food/addFromAMeal.test.tsx`. The tests' `openAddFood` helper now goes to Food and
presses the meal's "+" of the clock's meal, so the sheet opens as it did before.
