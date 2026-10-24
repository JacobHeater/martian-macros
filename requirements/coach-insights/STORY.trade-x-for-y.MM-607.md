---
id: MM-607
status: proposed
component: coach-insights
related: [MM-604, MM-605, MM-606, MM-608, MM-616, MM-365, MM-126, MM-371, MM-11, MM-114]
---

# Story: Trade X for Y

## Context
The owner wants the coach to say "you could have traded X for Y" (MM-604). Nothing in the engine suggests a food today. The
closest precedent is the fiber line, which gives examples from foods the person already logs (`fiberInsight.ts`).

On 2026-10-24 the owner chose that Y may be any food. That overrules "No meal plans and no prescribed foods" for this one use
(MM-608). Catalog foods carry no group today, so a catalog Y waits on MM-616.

## Decisions
By the product owner, 2026-10-24: Y may be any food. MM-108's wording rules hold.

Choices made without asking (from the nutrition panel; say if any is wrong):
- **A trade is tried only for a finding in change:** N1, N2, N3, N4, N5 high, N9, N13, N14 over on fat loss, N16 or N18
  (MM-606). Never for a pattern that is fine.
- **X**, the food to replace, must be all of:
  - a top contributor (N11), or a repeated food or meal item (N17, N18), on ≥ 3 distinct days in the span;
  - ≥ 150 kcal a time;
  - not an estimate, with macros explaining ≥ 75% of its calories;
  - not a protein food (≥ 20% of energy from protein) when the trade is for protein or fat;
  - not alcohol, not snoozed;
  - not the person's top source of a micronutrient that is under its reference (uncertain).
- **Y comes from, in order:**
  1. a food the person logs in the same meal slot, on ≥ 2 days in the last 56 days (uncertain);
  2. the person's saved foods and recipes logged in that slot;
  3. a catalog food in X's food group (MM-616), shown as "a food you haven't logged".

  A catalog Y never comes ahead of one of the person's own that qualifies.
- **Matching**, each food at the person's usual portion (the median of their logged instances; a catalog food at its default
  serving). Portions are never rescaled.
  - **Calories:** 0.6 × X ≤ Y ≤ 1.10 × X on fat loss, recomp and maintenance (uncertain). The floor keeps a trade from being "eat
    less" in disguise. On lean gain, Y ≥ 0.9 × X.
  - **For protein:** Y has ≥ 3 g more protein per 100 kcal and ≥ 8 g more a time (uncertain).
  - **For fat:** Y's fat share is ≥ 15 points lower, ≥ 8 g less fat a time, and protein no lower.
  - **For calories:** ≥ 80 kcal less a time, protein no lower, and kcal/g no higher where both are known.
  - **For sodium:** sodium per 100 kcal ≤ 0.7 × X's.
  - **No harm on other active findings:** not more sodium while N13 is active; not ≥ 2 g less fiber while N12 is; not a lower
    grade band; Y not itself "mostly fat" or "light on protein".
- **Ranking:** days X was eaten × gain a time. Ties go to the more familiar Y, then the better grade. One Y on the line; a second
  only behind "The numbers behind this".
- **No Y:** with calorie room, add a protein food the person logs (≥ 10 g per 100 kcal). Without room on fat loss, state the fact
  and offer no action. "Eat less" is never the action.
- **Words** are past or conditional, about the person's own log:
  - Own food: "{X} on {days} of {spanDays} days: {xKcal} kcal with {xProteinG} g protein and {xFatG} g fat. It is calorie-dense
    for its protein. {Y}, which you log at {meal}, gives {yProteinG} g in {yKcal} kcal. Trading it on those days would have added
    about {gainPerDayG} g of protein a day, at {deltaKcal} kcal."
  - Catalog food: the same, with "{Y}, a food you haven't logged, gives…".
  - Later, as holding up: "Since {date}, {Y} replaced {X} on {days} days; protein per 100 kcal rose from {before} to {after}."
- **Quiet** under every MM-606 safeguard. In addition:
  - Eating-disorder history: no food is named at all.
  - Kidney disease: no trade for protein.
  - Insulin or sulfonylurea: no carbohydrate-lowering trade.
  - Pregnancy, breastfeeding, underweight, low body weight: no calorie-lowering trade.
  - No trade that would take a day's average under the calorie floor.

## Description
A pure function from (finding, span entries, the person's food history, catalog index by group, safeguards) to a trade or none.
It is used by MM-606's findings and shown by MM-610. The catalog step is off until MM-616 is done.

## Acceptance Criteria
```gherkin
Scenario: A trade from the person's own foods
  Given granola at breakfast, 420 kcal with 9 g protein and 18 g fat, on 6 of 14 days
  And Greek yogurt with berries at breakfast, 330 kcal with 28 g protein, logged on 3 days
  And protein under the minimum on 9 of 14 days
  Then the protein finding carries a trade naming both foods, with about 8 g more protein a day at 90 kcal less a time

Scenario: A catalog trade
  Given the same granola and no qualifying food of the person's own at breakfast
  And foods carry a group (MM-616)
  Then the trade names a catalog food in the granola's group, says the person hasn't logged it, and meets every matching rule

Scenario: Own foods first
  Given a qualifying food of the person's own and a better catalog food
  Then the person's own food is the trade, and the catalog one is only behind "The numbers behind this"

Scenario: Not eat less in disguise
  Given the only candidate Y has 50% of X's calories
  Then it is rejected

Scenario: A protein food is not X
  Given chicken thigh is the top fat contributor
  Then it is never X for a protein or fat trade

Scenario: No room, no add
  Given fat loss over target and no qualifying Y
  Then the finding states the fact and offers no action

Scenario: Safeguards
  Given an eating-disorder history
  Then no food is named
  Given kidney disease
  Then no trade is offered for protein

Scenario: Edits recompute
  Given a trade naming X
  When the entries of X are deleted
  Then the trade is recomputed and no longer names X
```

## Notes
- The catalog does not know allergies, cultural foods or vegetarian choice. A catalog Y can be dismissed like any finding.
  "Not for me" on a catalog Y excludes that food from future trades (uncertain; it needs a small store).
- Rolls 2017: substituting a lower-energy-dense food reduced meal intake while adding alone did not. That is why adding is not
  offered on fat loss over target.
