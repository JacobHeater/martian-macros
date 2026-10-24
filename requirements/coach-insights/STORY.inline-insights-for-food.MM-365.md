---
id: MM-365
status: done
component: coach-insights
related: [MM-361, MM-362, MM-378, MM-370, MM-125, MM-121, MM-114, MM-150, MM-167, MM-108, MM-11]
---

# Story: The first inline insights on food entries

## Context
See MM-361 and MM-362. This is the owner's own example: a logged food that is high in fat, and so calorie-dense, gets a line
under it about what could improve.

## Decisions
The product owner's (2026-10-17): single-item neutral facts and pattern-backed insights both apply to food. Grades show on the
entry (MM-370), and the insight may refer to the grade and to the portion.

The product owner's (2026-10-18, through the question tool):
- **The first food set is "mostly fat", "light on protein" and the portion check** (drafted as "large portion"), checked by the
  panel's nutrition, coaching and safety roles (`docs/agent-runs/mm365-food-rules/`). "Salty item" is left out of it; "often
  logged, low grade" waits for grades (MM-369, MM-370).
- **Swap or add, never eat less.** No food line suggests a smaller portion. The portion check asks only whether the amount was
  entered right.
- **Under logged foods only.** Search and the amount step show the grade, once grades are built, and no line.
- **Every qualifying entry shows its line, every time, and can be snoozed** for that food (MM-378).

Choices I made without asking (say if any is wrong), from the panel's findings (all three roles: "build with the listed
changes"):
- **A protein food is never "mostly fat"** (the panel's NU-1): the rule fires only when protein supplies under 20% of the
  item's calories, so eggs, cheese, tofu, fish and meat are left alone. Nuts, nut butters, oils and avocado still qualify:
  nutrition pointed out that guidance includes them and offered a saturated-fat test that would have stopped the owner's own
  peanut-butter example firing (NU-2). I kept the total-fat share so the example stands; **the owner may prefer the
  saturated-fat test, which drops peanut butter, nuts, olive oil and avocado from the rule.** The direction adds a food, which
  is true for nuts and oil as well: "A protein food alongside balances the meal."
- **"Light on protein" needs a protein minimum in force**, and is not shown after bariatric surgery (no minimum) or with
  kidney disease (the minimum is a cap, not a floor) (NU-3, SA-7, CO-3). Its words lead with protein, not calories (SA-9),
  and never name "your minimum" in the line; the minimum sits in "The numbers behind this" when there is one (CO-2).
- **The composition lines need the macros to explain the energy** (at least 75% of the calories), so a food typed with
  calories alone says nothing, and the fat share is capped at 100% (NU-4). A drink that is mostly alcohol gets no protein
  line (NU-7).
- **The portion check compares with the serving the entry was counted in** (`usualServing`): the label's serving of a packaged
  food, the saved serving of the person's own food or recipe, or the typed serving. A food logged by weight or a household
  measure, a hand portion, an estimate or an entry from before portions were kept has no usual serving and gets no check
  (NU-5). It fires at 2 servings or more and 300 kcal or more, or at 10 servings or more whatever the calories, which is the
  typo it can genuinely catch (NU-6). Its title is "Portion check", not "Large portion", because the title must not say what
  the line must not (CO-4). Its words: "Logged as 4 servings (350 kcal); one serving is 30 g. Right as logged? If not, the
  amount can be edited."
- **Safeguards beyond the eating-disorder history** (SA-4, SA-5, SA-6): "mostly fat" and the portion check are not shown while
  the under-eating finding holds (MM-114), the one backstop for an undisclosed history, nor with the underweight caution;
  "mostly fat" also not in pregnancy or breastfeeding, where the app has handed intake to the clinician. The framework's
  safeguards now carry the coaching policy's cautions and the under-eating finding.
- **An estimated entry gets none of the three lines** (CO-6).
- **Declined**: a per-entry "Right as logged" acknowledgement for the portion check (CO-4) and dropping the direction sentence
  on a repeat showing (CO-5). The owner ruled that every qualifying line shows every time with the snooze as the one way to
  quiet it; two mechanisms would blur that. Say if either is wanted.
- **Every line is about the item**, never the day's totals (MM-362). **MM-125's meal-without-protein insight stays on the
  dashboard, not inline.**

| kind | priority | fires when | the line (example) | safeguard |
|---|---|---|---|---|
| portion check | data quality | counted as ≥ 2 servings and ≥ 300 kcal, or ≥ 10 servings; only with a usual serving | "Logged as 4 servings (350 kcal); one serving is 30 g. Right as logged? If not, the amount can be edited." | off for ED history, while under-eating, underweight |
| light on protein | pattern | ≥ 400 kcal and < 10% of calories from protein; alcohol < 50%; a protein minimum in force | "9 g of protein in 520 kcal. A protein food alongside is the easiest way to add some." | not after bariatric surgery or with kidney disease |
| mostly fat | pattern | ≥ 150 kcal, ≥ 55% of calories from fat, < 20% from protein | "Most of this food's calories come from fat (76%). A protein food alongside balances the meal." | off for ED history, while under-eating, underweight, pregnancy, breastfeeding |

Not in the first set (the product owner, 2026-10-18): "salty item" and "often logged, low grade" (after MM-370).

## Description
The three rules of the first set in the inline catalog, their words, evidence register rows, and their placement in the food
log.

## Acceptance Criteria
```gherkin
Scenario: The owner's example
  Given a logged entry of 190 kcal with 16 g of fat and 7 g of protein
  Then the "mostly fat" insight is shown under it, stating 76%

Scenario: A protein food is not "mostly fat"
  Given 150 g of firm tofu (216 kcal, 26 g protein, 14 g fat)
  Then no "mostly fat" insight is shown

Scenario: Small items are left alone
  Given an entry of 90 kcal, 100% from fat
  Then no "mostly fat" insight is shown

Scenario: Protein
  Given an entry of 640 kcal with 14 g of protein and a protein minimum in force
  Then the "light on protein" insight states both figures

Scenario: No minimum, no protein line
  Given no protein minimum is in force, or the kidney answer is ticked
  Then no "light on protein" insight is shown

Scenario: Calories only
  Given a typed entry of 450 kcal with no macros
  Then no composition insight is shown under it

Scenario: Mostly alcohol
  Given 400 kcal of wine with 50 g of alcohol
  Then no "light on protein" insight is shown

Scenario: Two rules on one entry
  Given an entry of 600 kcal, 70% from fat, with 8 g of protein
  Then the "light on protein" insight is shown under it and "mostly fat" is not

Scenario: Estimated entries
  Given an estimated entry that would satisfy any of the three rules
  Then no insight is shown under it

Scenario: The portion check
  Given garlic bread logged as 4 servings of 30 g, 350 kcal
  Then the portion check is shown, naming 4 servings and the 30 g serving

Scenario: No usual serving
  Given 316 g of rice logged by weight, or 2 palms of chicken
  Then no portion check is shown

Scenario: A count that is a typo
  Given a yogurt logged as 100 servings of 80 kcal
  Then the portion check is shown whatever the calories

Scenario: Eating-disorder history
  Given that screening answer is ticked and entries that satisfy all three rules
  Then only the "light on protein" insight is shown

Scenario: Under-eating
  Given the under-eating finding holds
  Then no "mostly fat" or portion check is shown, and "light on protein" still can be

Scenario: Plain words
  Then no food rule's line calls a food good or bad, names a replacement food, suggests eating less of it, or says "lean", "room", "item" or "usual serving"
  # Amended 2026-10-24 (MM-608): this governs inline lines under an item. The coach's analysis may name a replacement food as a trade (MM-607).

Scenario: Logged foods only
  When food search or the amount step is shown
  Then no insight line is drawn there
```

## UI/UX
- FoodWithInsights, FoodTwoInsightsInOneMeal, FoodInsightOpen, FoodWithInsightsEatingDisorder, in
  `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`: the lines the app works out from the demo plus a lunch and
  a snack (the pasta light on protein, the peanut butter mostly fat, the garlic bread counted as 4 servings). The design
  (reviewed in `docs/agent-runs/mm361-coaching-insights/`) drew the same lines with the design's own words; the words changed
  at the panel's review of the rules.

## Progress
- Built 2026-10-18. Engine: `foodItemInsights`, `FoodInsightRule`, `usualServing` (domain). Kinds `portionCheck`,
  `lightOnProtein`, `mostlyFat` in `itemInsightKinds`. Words: `format/itemInsightText.ts`. The framework's safeguards gained
  the under-eating finding and the policy's cautions (`InsightSafeguards`, `ItemInsightKind.notWhileUnderEating`,
  `notWithCautions`). The line sits under the entry (`FoodEntryInsight`), travelling with it when swiped.
- Tests: `test/engine/foodItemInsights.test.ts` (every rule scenario), `test/coach/foodAndBodyInsights.test.tsx` (the lines on
  the Food screen, the eating-disorder history, kidney disease, an estimate), `test/engine/allowedItemInsights.test.ts`
  (under-eating and cautions), `test/format/itemInsightText.test.ts` (the forbidden words), `test/engine/itemInsightEvidence.test.ts`.
- Evidence register: `mostlyFat`, `lightOnProtein`, `portionCheck`, `usualServing`, `FoodInsightRule.*`.
