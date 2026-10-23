---
id: MM-565
status: done
component: design-system
related: [MM-268, MM-370, MM-562]
---

# Bug: pressing a menu's button again does not close it

## Context
The owner (2026-10-22): the "Delete" menu of a food "doesn't close when clicking the button after it's
open. Doesn't act like a toggle."

## Description
The menu's scrim closed it on pointer down. The finger then came up over the button, now uncovered, and
the click opened the menu again. The popover (MM-370) had the same scrim.

Fixed: the scrim of a menu and of a popover closes on the click, so it takes the whole press and nothing
under it gets one; and a menu button, a grade badge and a macro on the nutrition card close what they
opened when pressed again.

## Acceptance Criteria
```gherkin
Scenario: A toggle
  Given a food's More menu is open
  When I press the More button again
  Then the menu closes and does not open again
```

## Progress
Fixed in `MmMenu`, `MmPopover`, `MmMenuButton`, `FoodGrade`, `CalorieHero`. Regression test:
`test/ui/menuButton.test.tsx`, "a second press on the button closes the menu". Not run locally; CI validates.
