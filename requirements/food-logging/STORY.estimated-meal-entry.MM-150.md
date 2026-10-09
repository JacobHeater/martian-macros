---
id: MM-150
status: in-progress
component: food-logging
related: [MM-37, MM-27, MM-38, MM-40, MM-42, MM-45, MM-46, MM-139, MM-141, MM-149, MM-153, MM-167]
---

# Story: Log a rough estimate when I cannot log the meal properly

## Context
A restaurant dinner, a friend's cooking, a buffet. The user cannot weigh it, cannot scan it, and searching for each component is ten
minutes of guesswork. What happens today is one of two bad things: the meal is skipped, and the day becomes a partial day the estimator
throws away (MM-27); or the user stops logging for the day, and often for the weekend. All-or-nothing logging is how careful trackers
become non-trackers.

A rough entry is worth far more than no entry. For the estimator, a day that is 90% right is usable and a missing day is not.

Evidence:
- **Moderate**: stated calories for restaurant food are right on average and unreliable item by item. In measured samples, about a fifth
  of items had at least 100 kcal more than stated, and lower-calorie items were the most likely to be understated (Urban 2011, JAMA). So
  even a "proper" restaurant entry from a database is an estimate.
- **Strong**: people underestimate the energy in large meals, and the error grows with meal size.
- The size presets below are **judgement**.

## Decisions
Choices I made without asking (say if any is wrong):
- **"Estimate a meal" is a first-class way to add food**, beside search, scan and typed macros.
- **Two questions**:
  1. **How big?** Light, Regular, Large, Very large. Shown with calorie ranges, scaled to the user (a Regular meal is a third of their
     maintenance expenditure; Light is 0.6 of that, Large 1.5, Very large 2.2), rounded to 50 kcal.
  2. **What kind?** Balanced; mostly carbohydrate (pasta, rice, pizza); mostly protein (meat or fish with vegetables); rich (fried, creamy,
     dessert-heavy). Each sets a macro split.
- **An optional name** ("Sara's birthday dinner"), so that it can be reused from recents (MM-39).
- **Stored as an estimate, with an uncertainty of 40%** (the same model as hand portions, MM-46), and shown with a small "estimated" mark.
- **A day containing an estimate can be marked complete**, and counts as a usable day.
- **Estimates nudge upward, not down.** Because large meals are systematically underestimated, the presets sit toward the top of the
  honest range, and the screen says "restaurant meals usually have more than they look".
- **The coach knows.** The share of calories from estimates is reported in the adherence summary (MM-149) and can lower confidence
  (MM-139); above half, an insight says that estimates are fine occasionally and that the coach works better with more measured days
  (MM-141).
- **It is never framed as cheating or as a lesser entry** (MM-108).

Where the experts disagreed:
- The bodybuilding coach: this is a license to stop weighing. The adherence expert: the comparison is not with weighing, it is with
  logging nothing. The data settles it over time, since the engine can see how estimate-heavy weeks behave.
- The engineer raised the logging-style switch (MM-27): a user who moves from weighing to mostly estimating has changed their bias, and
  the window should restart. Agreed; that rule must learn estimates as a style (the same extension MM-46 needs).
- The product strategist asked for a photo of the meal as a memory aid. Estimation *from* a photo is excluded (MM-44, MM-144); storing a
  photo for the user's own reference is harmless and deferred.

## Description
A two-step sheet producing a normal food entry with `measuredBy: estimate`; presets derived from the user's maintenance expenditure.

## Acceptance Criteria
```gherkin
Scenario: A regular restaurant meal
  Given a user with a maintenance expenditure of 2,700 kcal
  When they estimate a Regular, Balanced meal
  Then an entry of about 900 kcal with a balanced macro split is logged, marked estimated

Scenario: Sizes scale
  Given the same user
  Then Light is about 550, Large about 1,350 and Very large about 2,000 kcal

Scenario: The day still counts
  Given a day with two measured meals and one estimated meal
  When it is marked complete
  Then the day is usable for the expenditure estimate

Scenario: Recorded with its uncertainty
  Then the stored entry records that it was estimated, with 40% uncertainty

Scenario: Reported
  Given a week where estimates supply 60% of calories
  Then the adherence summary says intake was mostly estimated

Scenario: A change of style
  Given three weeks of weighed logging followed by three weeks that are mostly estimates
  Then the expenditure window restarts at the switch

Scenario: Reuse
  Given an estimate named "Thai place, usual"
  Then it appears in recent foods and can be logged again in one tap
```

## Notes
- Priority: should-have, early; it is the cheapest protection against the weekend that ends a streak of good data.
- The simulator (MM-30) should gain a user whose estimates are unbiased but noisy (40%), and one whose estimates run 25% low, to confirm
  the adaptive loop absorbs both as it does other consistent bias (MM-23).

## Clarified by MM-167 (proposed)
"Estimate" means entered or preset totals with no quantity or unit. Its uncertainty is 40% here and 20% in MM-38 and the code; which
is right is an open decision in MM-167.

Decided with the product owner (MM-167): Estimate's uncertainty is 40%, as here, and MM-38's 20% is to be changed to match.

## Progress
Built: "Estimate a meal" on the add-food sheet; sizes Light, Regular, Large and Very large shown with their calories, scaled to the
coach's maintenance estimate (a third of it for Regular; 0.6, 1.5 and 2.2 times that for the others; rounded to 50 kcal, so 550, 900,
1,350 and 2,000 for 2,700); four kinds, each a macro split by share of energy (balanced 20/50/30 protein/carbohydrate/fat, mostly
carbohydrate 15/65/20, mostly protein 35/30/35, rich 12/38/50; judgement, not data); an optional name; the line "restaurant meals
usually have more than they look". The entry is an ordinary one measured by estimate, shown as "Estimated totals", at 40% uncertainty
(decided in MM-167). Domain: `estimateMeal`, `mealKcal`; app: `EstimateMealStep`. Tested in `estimate_meal_test.dart` (domain and
widget).

The logging-style rule needed no new code for weighing giving way to estimates: the estimator restarts the window on a drop in the
weighed share of calories, and estimates are not weighed. A test in `tdee_estimator_test.dart` covers it. What it cannot yet tell apart
is estimates from hand portions or label servings (both "not weighed"); that needs MM-46's styles.

Not built: the adherence summary and insight about estimate-heavy weeks (MM-149, MM-139, MM-141), simulator users with noisy or
biased estimates (MM-30), reuse from recents with the estimate mark (the entry appears in recents like any other, as typed totals),
and the Estimate-heavy day check. Before the coach has a maintenance estimate the sizes are not shown and the sheet says so. Not seen
on the emulator.
