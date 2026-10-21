---
id: MM-126
status: done
component: macro-targets
related: [MM-119, MM-49, MM-53, MM-55, MM-108, MM-141, MM-153]
---

# Story: A fiber guide, because hunger ends more diets than arithmetic

## Context
The app sets energy, protein, carbohydrate and fat. It says nothing about what the food is. A user can hit every number on protein powder
and pastries, be hungry all day and quit. The panel did not want a diet-quality score (they moralize food and are poorly validated for
individuals), but agreed one more number earns its place.

Evidence:
- **Strong**: higher fiber intake is associated with lower all-cause and cardiovascular mortality and lower body weight (Reynolds 2019,
  Lancet, meta-analyses of prospective studies and trials). Association in cohorts; consistent in trials for weight and risk markers.
- **Moderate**: fiber and lower energy density increase fullness for the same calories; in one trial fiber intake predicted weight loss
  and adherence independent of macronutrient split (POUNDS Lost analysis, Miketinas 2019).
- The US Dietary Guidelines' adequate intake is 14 g per 1,000 kcal.

## Decisions
Choices I made without asking (say if any is wrong):
- **A fiber guide of 14 g per 1,000 kcal of the calorie target, with a minimum of 25 g for men and 21 g for women**, so that a low calorie
  target does not lower it much. (The guide falls with calories only above those minimums.)
- **Shown at Full detail on the Food screen, as a guide, never judged** (MM-123): no "under", no streak, no reward.
- **Shown only when the data supports it**: if under 70% of the day's calories come from entries that carry a fiber value, the fiber line
  says "not enough data" in place of a total. Typed macro entries (MM-38) carry none, and a total that silently treats missing as zero
  would be false.
- **One insight** (MM-141), at most monthly, for a user on a deficit whose fiber averages under half the guide and who reports high hunger
  (MM-116) or has no recovery answers: a plain statement that more fiber and bulkier foods usually make a deficit easier, with two or
  three examples drawn from foods they already log.
- **No food is called good or bad** (MM-108). The insight talks about fullness.
- **How the insight reads the rule** (2026-10-21, built against the recommendation above):
  - "On a deficit" is the fat-loss goal; recomp, lean gain and maintenance are left out.
  - The average is over the fortnight's whole days (MM-27) that carry enough fiber data (the 70% rule), at least seven of
    them; a day with too little data is left out, never read as zero.
  - "High hunger" is the latest check-in of the fortnight answering hunger at the hard end (2 or below, the relief offer's
    `hardAnswer`, MM-117); "no recovery answers" is no check-in in that fortnight.
  - "At most monthly": once shown, it does not start again as new for 30 days (`FiberRule.quietDaysAfterShown`), on top of
    the 28 quiet days after a dismissal and the usual one-a-day, three-a-week ration.
  - The examples are the logged foods of the fortnight with at least the guide's own density (14 g per 1,000 kcal), densest
    first, each name once, three at most; with fewer than two, none are named.
  - Only at Full detail, as the fiber line is: below it the insight would be about a number the user never sees (the
    "Standard detail" scenario).
  - It is about intake other than protein, so it is left out for a user with an eating-disorder history (MM-141's CO-1),
    and it is an education insight, the lowest priority.
- **No micronutrient tracking**; see MM-49's note and the non-goals (MM-144).

Where the experts disagreed:
- The sports nutritionist wanted fruit-and-vegetable servings and a minimum micronutrient check, arguing that long deficits at low
  calories are where deficiencies appear. The product strategist: the food sources carry micronutrients patchily (MM-49), so the feature
  would be wrong often. Deferred; a low-calorie caution suggesting a varied diet belongs in MM-29's wording review.
- The adherence expert wanted energy density shown per food. Interesting, cheap to compute, and easy to turn into food moralizing; not in
  this ticket.

## Description
A derived guide, a coverage check, a line at Full detail, and one insight rule.

## Acceptance Criteria
```gherkin
Scenario: The guide
  Given a man on 2,400 kcal
  Then his fiber guide is about 34 g

Scenario: The minimum holds at low calories
  Given a woman on 1,300 kcal
  Then her fiber guide is 21 g

Scenario: Enough data
  Given Full detail and a day where 85% of calories come from entries with a fiber value
  Then the fiber total is shown against the guide

Scenario: Not enough data
  Given a day where 40% of calories were logged by typing macros
  Then the fiber line says there is not enough data, and shows no total

Scenario: Never judged
  Then no streak, summary or reward depends on fiber, and no text calls fiber low or a food good or bad

Scenario: The insight
  Given Full detail, the fat-loss goal, and a fortnight whose days with enough fiber data number at least seven
  And fiber averaged under half the guide on them
  And the latest check-in of the fortnight answered hunger at 2 or below, or there was none
  Then one insight says the average against the guide, that more fiber and bulkier foods usually make a deficit easier
    because they fill you up for the same calories, and names two or three foods the user already logs

Scenario: The insight holds back
  Given the latest check-in says hunger is fine, or the goal is not fat loss, or fiber is at half the guide or more,
    or too few days carry enough fiber data, or the detail level is below Full, or there is an eating-disorder history
  Then there is no fiber insight

Scenario: At most monthly
  Given the fiber insight was shown 29 days ago and dismissed
  Then it is not shown again until 30 days have passed

Scenario: Standard detail
  Given Standard detail
  Then fiber is not shown
```

## Notes
- Priority: could-have. Depends on the food database carrying fiber (MM-55) and the detail setting (MM-49).
- Fiber counted at 2 kcal per gram in the energy check is already specified (MM-53).

## Progress
Built: `fiberGuideG` (14 g per 1,000 kcal of the calorie target, never below 25 g for men or 21 g for women) and `FiberDay`
(the day's fiber from entries that carry a value, and the share of calories they cover) in the domain; a fiber line on the Food
screen at Full detail only: "Fiber: 28 g · guide 34 g", or "Fiber: not enough data" when under 70% of the day's calories come
from entries with fiber, never a total that treats missing as zero. Nothing else depends on fiber: no streak, no summary, no reward.
Tested in `fiber_test.dart` and `detail_level_test.dart`.

Built (2026-10-21): the insight rule `fiberForFullness` (`fiberInsight`, `FiberRule`, `FiberPattern`), wired through the
app's state at Full detail only and shown on Today like the other insights: "Fiber, and staying full on a deficit".
Tested in `test/engine/fiberInsight.test.ts`, `test/coach/fiberInsightCard.test.tsx` and `test/coach/insightCard.test.tsx`
("the fiber insight states the average…"); drawn in the gallery's `InsightFiberForFullness`. Not run locally; CI validates.

Not built, by decision: fiber on the Today dashboard (the Decisions place it on Food, at Full detail).
