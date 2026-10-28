---
id: MM-661
status: done
component: food-logging
related: [MM-246, MM-266, MM-582, MM-634]
---

# Story: a long press on a food starts choosing

## Context
MM-634 put choosing foods behind "Select" in each row's menu and decided against a long press: "easy to miss
and collides with swiping a food away." The owner, 2026-10-27, from the phone: "long pressing a food should
trigger multiselect with checkboxes with haptics."

## Decisions
From the owner (2026-10-27): a long press on a food starts choosing, with checkboxes, with haptics. MM-634's
choice against the long press is reversed; "Select" in the menu stays.

Choices made without asking (say if any is wrong):
- **Half a second, held still**: the hold counts at 500 ms; a finger that drifts more than 8 px meanwhile, as a
  swipe begins (MM-582's slop), is not holding, so swiping a food away is untouched. The press a phone sends
  after a hold is not also a press, so the food does not open. The phone's own long-press menu and text
  selection never show over the row.
- **One tap under the finger when the hold takes**: Capacitor's haptics plugin (`@capacitor/haptics` 8, the Taptic
  Engine on iOS, the vibrator on Android), behind a `Haptics` interface with an in-memory counterpart for tests
  and stories (MM-318: as the rest signal and the clipboard are). A phone that refuses is silent.
- **The pressed row is ticked** and choosing begins exactly as "Select" begins it (MM-634): the same bar, the
  same boxes, focus on that row. A logged meal's row holds the same way.
- The long press is a capability of the design system's pressable content (`MmPressable`), the one way a
  screen makes a region pressable (MM-246), so another screen can hold a row the same way.

## Acceptance Criteria
```gherkin
Scenario: Hold to choose
  Given two foods logged today
  When the person holds a finger still on one for half a second
  Then the phone taps once, choosing begins, and that food's box is ticked and the other's is not

Scenario: A press is still a press
  When the person presses a food and lets go
  Then the food opens to edit and nothing taps

Scenario: A drift is not a hold
  When the finger moves sideways during the hold
  Then nothing is chosen and nothing taps
```

## UI/UX
- `Screens/Food`, `FoodChoosingByLongPress`: choosing begun by a hold on the first food. A change the owner
  dictated, so no panel.

## Notes
- `ui/MmPressable.tsx` (`onLongPress`), `domain/integration/Haptics.ts`, `fixtures/InMemoryHaptics.ts`,
  `platform/CapacitorHaptics.ts`, `MealSection`, `LoggedMealRow`; `test/food/longPressChooses.test.tsx` holds for
  real time. The hold and the tap are not verified on a phone by Claude.
