---
id: MM-575
status: done
component: food-logging
related: [MM-152, MM-114, MM-255, MM-389, MM-574]
---

# Story: Easy to miss is asked as a day is marked complete

## Context
MM-152 put a line of chips under a day marked complete: "Easy to miss: cooking oil, drinks, sauces, bites
and tastes", each opening add-food. The owner (2026-10-22): "Look how pathetically useless the easy to miss
feature is ... Maybe instead of being buttons that do nothing, how about you show an easy to miss reminder
when users mark the day as complete and only complete it when they confirm that they didn't miss any 'easy
to miss' items." The chips came after the day was already marked, at the foot of the screen, where nobody
looked for them.

## Decisions
The owner's: the reminder is part of marking the day complete, and the day is marked only on the
confirmation that nothing was missed.

- **Choosing Complete opens a sheet**, "Anything easy to miss?": Cooking oil, Drinks, Sauces, Bites and
  tastes as rows, and one button, "Nothing missed, mark complete". Only that button marks the day.
- **A missed item opens add-food on it** (oil, drink and sauce searched; bites and tastes estimated as Light,
  as MM-152 had them), and the day is left as it was, to be marked once the food is in.
- **Closed, nothing is marked.**
- **When it is asked stays MM-152's**: every time in the first 14 days, then at most once a week; never when
  turned off in Settings; never with an eating-disorder history or while the under-eating notice is up
  (MM-114). When it is not due, Complete marks the day at once, as before.
- **It can be turned off** (the owner, 2026-10-22): Settings' switch, "Easy-to-miss check", says what it does:
  "Before a day is marked complete, asks about cooking oil, drinks, sauces, and bites and tastes." Off, Complete
  marks the day at once.
- The low-day question (MM-114) still follows for a day far below the floor.
- The chips under a completed day are gone.

## Acceptance Criteria
```gherkin
Scenario: Asked, nothing missed
  Given the check is due
  When I mark today complete
  Then "Anything easy to miss?" lists cooking oil, drinks, sauces, bites and tastes
  And the day is marked complete only when I choose "Nothing missed, mark complete"

Scenario: Something missed
  When I choose Cooking oil
  Then add-food opens with oil searched, and the day is not marked

Scenario: Not due
  Given the check was asked yesterday, a month in
  When I mark today complete
  Then the day is marked at once
```

## UI/UX
- EasyToMissCheck — apps/mobile/src/gallery/screens/Food.stories.tsx.

## Progress
Built: `EasyToMissSheet`, `showEasyToMissSheet`, `EasyToMissAnswer`, `FoodCompletenessRow`; `EasyToMissLine`
removed. Tested in `test/food/easyToMiss.test.tsx`, `test/settings/settingsFlows.test.tsx` and `test/food/foodAndTheRest.test.tsx`. Not run locally;
CI validates.
