---
id: MM-268
component: design-system
status: proposed
related: [MM-262, MM-261, MM-104, MM-180]
---

# Bug: overflow menus are clipped by their containers and never mark the current value

## What the walk found

`MmMenuButton` positions its list absolutely inside the trigger's parent.
In Settings the list sits in a row of `MmListGroup` (`overflow: hidden`),
so from the second row the five choices run past the group's bottom and
are cut; in Food it sits inside `MmSwipeToRemove` (also `overflow:
hidden`), so "Delete" opens below the row and is clipped (product-designer
PD-2). Where the menu is a choice (daily activity, experience), nothing
marks the value in force, while the options dialog does (PD-12, UX-18).
No story or test opens either menu.

## The fix

- A menu of choices is not a menu: Settings' daily activity and experience
  use `overlays.options`, which marks "Chosen" (MM-261's one way).
- A menu of actions (`MmMenuButton`) renders its list through the overlay
  host, anchored to the trigger, so no ancestor can clip it; it gains
  focus, hover and pressed styles, opens with focus on the first item and
  returns focus to the trigger on close.

## Regression test

Settings story play opens "Change daily activity" and finds the current
value marked; Food story play opens an entry's menu and asserts the list
is rendered in the overlay host (not inside `.mm-swipe`); the menu's focus
behaviour in `test/ui/menuButton.test.tsx`.

## Acceptance criteria

```gherkin
Scenario: Not clipped
  When an entry's more menu opens inside a swipe row
  Then every item is fully visible

Scenario: The current value is marked
  When Change daily activity opens
  Then the value in force is marked Chosen

Scenario: Focus
  When a menu opens
  Then focus is on its first item, and on close it returns to the trigger
```
