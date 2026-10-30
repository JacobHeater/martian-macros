---
id: MM-629
status: done
component: food-logging
related: [MM-39, MM-439, MM-587, MM-596, MM-623]
---

# Story: recent foods say the amount they repeat, and this meal's come first

## Context
The owner, 2026-10-26: the recent foods are weak next to MyFitnessPal and MyNetDiary. The
food-logging review (`docs/food-logging-plan.md`, F-09, increments B2 and C5) found two gaps:
- A recent food's row said only its calories, so the portion it would repeat was invisible.
- The list was newest first whatever the meal, so breakfast's oats sat above dinner's rice when adding to
  dinner.

MyNetDiary's own help documents recent and frequent foods pinned for quick logging; MyFitnessPal users
report meal-specific recents.

## Decisions
Choices made without asking (say if any is wrong):
- **A recent row says its amount** before its calories, as a meal's row does ("1 × 1 container · 170 g ·
  100 kcal", the entry's own portion text, MM-564). A food logged without an amount says calories only, as before.
- **Foods and meals last logged at the meal being added to come first**, newest first among them, then
  the rest, newest first. It is still one list of the five newest first, with the rest on asking (MM-439).
- How often a food is eaten is not counted yet: the most recent entry of a name stands for it (MM-39).

## Description
In the Add food sheet, each recent food or meal says what it repeats. The list starts with what was last
logged at the meal the sheet was opened for.

## Acceptance Criteria
```gherkin
Scenario: The amount is said
  Given "Greek yogurt" was last logged as one 170 g container at 100 kcal
  When the Add food sheet opens
  Then its recent row says "Your recent food · 1 × 1 container · 170 g · 100 kcal"

Scenario: This meal's foods first
  Given oats were logged at breakfast this morning and rice at dinner yesterday
  When food is added to dinner
  Then rice lists above oats
```

## Notes
- Built in `RecentFoodRow` (the amount from `portionAmount`) and `AddFoodSheet` (the order).
- Tests: `test/food/recentFoodsAreRows.test.tsx` (MM-629 cases).
