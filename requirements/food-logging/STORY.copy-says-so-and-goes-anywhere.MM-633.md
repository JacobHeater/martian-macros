---
id: MM-633
status: done
component: food-logging
related: [MM-47, MM-48, MM-570, MM-587, MM-625, MM-630]
---

# Story: a copy says it was made, can be undone, happens once, and goes to any day

## Context
The food-logging review (`docs/food-logging-plan.md`, F-17, increment B3; the QA reviewer's QA-4) found that
"Copy <meal> to today" said nothing. The copies went to a day not on screen, the button stayed, and a second
press, made because the first seemed to do nothing, copied the meal again. MM-47 offered a meal's copy only
to today ("copying a meal to a day other than today is not offered").

## Decisions
Choices made without asking (say if any is wrong):
- **A copy says so, with Undo**: "Copied breakfast to today" or "Copied yesterday's food", and Undo removes
  the copies, all of them at once (MM-625). A copy that cannot be made says so, and nothing is copied.
- **Pressed once**: while a copy is being made, pressing again does nothing.
- **A meal copies to any day** from its ⋯ menu ("Copy to another day", from the past year to today).
  Copies keep their meal and have no time eaten, as every copy (MM-570). "Copy <meal> to today" stays as the
  one-press way on a past day.

## Description
Copying a meal or a day says what was copied and where, offers Undo, is done once however often it is
pressed, and a meal can be copied to any day up to today.

## Acceptance Criteria
```gherkin
Scenario: A copy is said and undone
  Given yesterday's breakfast holds two foods
  When "Copy breakfast to today" is pressed
  Then today has the two foods and "Copied breakfast to today" is said with Undo
  When Undo is pressed
  Then today has none of them

Scenario: Pressed twice
  Given the copy is still being made
  When "Copy breakfast to today" is pressed again
  Then today has the two foods once

Scenario: To another day
  Given today's dinner holds two foods
  When "Copy to another day" is chosen from dinner's menu and yesterday picked
  Then yesterday's dinner has copies of both, with no time eaten
```

## Notes
- Built in `MealSection` (`copyTo`), `FoodScreen` (Copy yesterday) and `copyEntries` (now gives the
  copies' ids).
- Tests: `test/food/copySaysSo.test.tsx`.
