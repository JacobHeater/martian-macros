---
id: MM-39
status: done
component: food-logging
related: [MM-37, MM-38, MM-45, MM-47]
---

# Story: Re-log a recent food in one tap

## Context
See MM-37: most logging is repetition.

## Decisions
Choices I made without asking (say if any is wrong):
- **The twenty most recently logged distinct foods**, newest first, as a row of chips at the top of the add-food sheet.
- **"Distinct" is by name, ignoring case.** The most recent entry with that name supplies the numbers.
- **Tapping a chip fills the form** (name, macros, calories, how measured) rather than logging at once, so the amount can be changed.
- **The meal is not copied**; it follows the clock.

## Description
The add-food sheet shows recent foods when there are any. Tapping one fills every field; the user adjusts and logs.

## Acceptance Criteria
```gherkin
Scenario: Recents, newest first
  Given Oats, then Chicken, then "oats" again were logged
  Then the recents are "oats" then "Chicken", and "oats" carries the numbers from its latest entry

Scenario: Filling the form
  When a recent food is tapped
  Then its name, macros, calories and measurement are in the form, and nothing is logged yet

Scenario: A new user
  Given nothing has been logged
  Then no recents row is shown
```

## Notes (built and verified)
- `MmStore.watchRecentFoods` (data test "recent foods are distinct by name, newest first"); `_fill` in the add-food sheet.
- The chip row is not covered by a widget test.
- Recents are a stopgap for saved foods with servings (MM-45): a recent has one fixed amount, so "half of that" means retyping four
  numbers.
