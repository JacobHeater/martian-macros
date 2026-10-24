---
id: MM-606
status: proposed
component: coach-insights
related: [MM-604, MM-605, MM-607, MM-610, MM-612, MM-141, MM-121, MM-122, MM-124, MM-125, MM-126, MM-312, MM-365, MM-114, MM-11, MM-92]
---

# Story: What the coach reads in your food

## Context
The owner's example: a week heavy in fat, "calorie-dense and going to steal available calories for more nutritious and
protein-rich options" (MM-604). Today the only fat logic is the per-item "mostly fat" line (`FoodInsightRule.mostlyFatShare`,
MM-365). No rule compares a span's fat with the fat target, names the foods driving it, or says what it cost in protein. The
nutrition panel proposed the signals on 2026-10-24.

Facts the signals rest on:
- The protein minimum and target come from `SafetyBounds`.
- The fat target is the 25% split or the person's chosen balance (MM-122). The fat minimum is the larger of 0.5 or 0.6 g/kg and 20%
  of energy. Carbohydrate is the remainder, with a 100 g floor.
- The calorie band is ±5%, at least 100 kcal (`CalorieBand`).
- `TdeeEstimate` is in the person's logging units, so intake against it is a relative statement only.

## Decisions
Choices made without asking (from the nutrition panel; say if any is wrong):
- **Protein per 100 kcal is the main "calorie-dense for its protein" measure.** It needs only macros. Calories per gram is second,
  used only when grams cover ≥ 80% of the food's or meal's calories, because many entries carry no grams.
- **The fat target is a split, not a health limit.** Fat over target is said only when it displaces protein (N1, N2 or N4 in
  change) or calories are over the band. Fat over target with protein met and calories on target is a "holding up" line, not a
  fix.
- **Required protein density** `req = 100 × T.proteinG / T.kcal`, from each day's targets in force (`recordOn`).
- **Data quality first.** With `partialDays` or `estimatesRising` active, every composition signal stays quiet. A food counts only
  when its macros explain ≥ 75% of its calories. `quickAdd` estimates are left out.
- **Families** for MM-605's de-duplication: {calories, fat g, fat share, calorie density, macro split} and {protein minimum, target
  gap, density, by meal}.
- **Safeguards:**
  - Under 18, paused, or while the under-eating finding holds: nothing about composition and nothing that lowers intake. Adds
    (protein, fiber) may show.
  - Eating-disorder history: protein signals only (N1–N3), and no food is named.
  - Pregnancy, breastfeeding, underweight, low body weight: no fat, density or calorie-lowering line.
  - Kidney disease: protein is a cap, so no "more protein".
  - Bariatric surgery: nothing.
  - Insulin or sulfonylurea: no carbohydrate-lowering line.
- **Never praise under target.** "On target" is the band, never "under" (MM-92).

## Description
Signal definitions for MM-605. δ values marked (uncertain) are calibrated by its null simulation.

| id | signal | change when | holding up when | action |
|---|---|---|---|---|
| N1 | protein minimum | met on < 50% of judged days, with the average shortfall | met on ≥ 80% (uncertain); exit at 65% | N4, N11, then a swap (MM-607); add if there is calorie room |
| N2 | protein target gap | only when target ≥ minimum + 15 g and N1 is not in change; ≥ 10% below target on ≥ 60% of days (uncertain) | within 5% on ≥ 70% | swap or add |
| N3 | protein by meal | N1 in change and one main meal < 10 g on most missed days (existing `proteinByMeal`) | each main meal ≥ 0.3 g/kg on ≥ 70% of days (uncertain) | a swap or add in that meal |
| N4 | protein per 100 kcal | span density < 85% of req (uncertain), N1 or N2 in change, calories within or above the band | density ≥ req with protein at target | swap |
| N5 | fat against target | high: ≥ max(1.25 × T.fatG, T.fatG + 15 g) on ≥ 60% of days (uncertain), gated as above. Low: under the fat minimum on ≥ 50% of days | within ±15% | high: fat-motivated swap; low: add a fat food |
| N6 | fat share of calories | ≥ planned share + 10 points and > 35% (uncertain), same gate | | folded into N5 or N8 |
| N7 | carbohydrate | under the 100 g floor where the balance keeps it | within ±15% | add |
| N8 | macro split | the largest share off by ≥ 8 points (uncertain), with protein below its share | every share within 5 points | routes to N4/N5. It is the summary line, so N5 and N6 are not shown beside it |
| N9 | calorie density, kcal/g | a food on ≥ 3 days at ≥ 4.0 kcal/g, < 5 g protein per 100 kcal, ≥ 10% of the span's calories (uncertain); not on lean gain under target | a meal mostly of water-rich foods | swap |
| N10 | a food light on protein | < 3 g per 100 kcal, ≥ 150 kcal a time, on ≥ 3 days; not protein foods (≥ 20% of energy) or alcohol | a food giving a large share of protein | the X for MM-607 |
| N11 | top contributors | helper: names up to 3 foods on ≥ 3 days, each ≥ 15% of the total or of the protein-gap calories (kcal − 100 × protein / req). Quiet when the top 3 explain < 30% | | feeds every signal's evidence |
| N12 | fiber | as MM-126 | average ≥ the 14 g per 1,000 kcal guide on ≥ 7 counted days | examples from the person's foods |
| N13 | sodium (opt-in limit) | as MM-312, plus contributors | under the limit on ≥ 80% of days | sodium-motivated swap |
| N14 | calories against target | fat loss or recomp: above the band on ≥ 60% of days; lean gain: below the band on ≥ 60% | within the band on ≥ 70% of days | over: a calorie swap that keeps protein; under on lean gain: add |
| N15 | intake against energy use | fat loss: intake ≥ TDEE − 1σ ("around maintenance"); lean gain: ≤ TDEE + 1σ. Only when `tdeeStatus` is updated | | none; defers to N14 and the stall diagnosis (MM-140) |
| N16 | meal balance | a meal slot with ≥ 25% of calories and protein density < 50% of req, with N1, N2 or N4 in change | no slot under 70% of req | a swap in that slot |
| N17 | a repeated food | logged on ≥ 4 of 14 days; ranks levers | a repeated food at ≥ 10 g protein per 100 kcal | feeds MM-607 |
| N18 | a repeated meal | a saved meal logged ≥ 3 times, at < 70% of req or fat ≥ planned + 15 points | | an item swap inside the meal |

Alcohol (≥ 50% of a drink's energy) is never an X or a Y. Any alcohol line belongs to a later ticket.

Sentences (MM-610 holds the general rules):
- **N5, change:** "Fat averaged {avgFatG} g against {targetFatG} g; {topFood} supplied {shareFat}% of it. Fat carries 9 kcal a
  gram, so those calories went to fat instead of protein, which averaged {shortG} g under your minimum."
- **N4, change:** "Your days carried {densityG} g of protein per 100 kcal. Reaching {targetG} g within {targetKcal} kcal takes
  about {reqG} g, so some calories went to foods with little protein."
- **N1, holding up:** "Protein reached {minimumG} g or more on {metDays} of {judgedDays} days."
- **N15:** "By your log, intake averaged {avgKcal} kcal, close to the {tdeeKcal} kcal the app estimates you use."

## Acceptance Criteria
```gherkin
Scenario: The owner's fat week
  Given 14 whole days with fat at 1.4 × target on 10, protein under the minimum on 9, calories within the band
  And peanut butter supplies 35% of the fat on 8 of the days
  Then one finding in the calorie family says fat averaged above target, names peanut butter and its share, and says protein was short
  And it carries a trade from MM-607

Scenario: Fat over target that costs nothing
  Given fat at 1.3 × target, protein at target on 12 of 14 days, calories within the band
  Then no fat fix is shown, and protein appears under "holding up"

Scenario: Diffuse trends name no food
  Given a protein shortfall where the top 3 foods explain 20% of the gap
  Then the finding names no food

Scenario: Data quality first
  Given 6 of 14 days partial
  Then no composition finding is shown and the partial-days finding is

Scenario: Each day's own targets
  Given targets changed mid-span
  Then every day is judged against the targets in force that day

Scenario: Eating-disorder history
  Given an eating-disorder history and the owner's fat week
  Then only the protein-minimum finding is shown, and it names no food

Scenario: Under-eating
  Given the under-eating finding holds
  Then no fat, density or calorie finding is shown, and a protein add may be

Scenario: Lean gain under target
  Given lean gain with calories under the band and calorie-dense foods
  Then no density finding is shown, and N14 suggests an add

Scenario: Never praise under target
  Given every simulated user and every day
  Then no "holding up" finding mentions calories below the band, a deficit or weight down

Scenario: Words
  Then every template passes the banned-word test, and none says "too", "unhealthy", "fattening" or "avoid"
```

## Notes
Sources (nutrition panel, accessed 2026-10-24):
- Morton 2018 (no further fat-free-mass gain above about 1.62 g/kg);
- Schoenfeld & Aragon 2018 (0.4 g/kg per meal, weaker than the daily total);
- Rolls 2017 (energy-density bands < 0.6, 0.6–1.5, 1.6–3.9, 4.0–9.0 kcal/g; swapping lowers intake where adding alone did not);
- Pérez-Escamilla 2012;
- Leidy 2015;
- Burrows 2019 (self-report under-reports);
- IOM AMDR 20–35% fat (under NASEM review since 2024);
- Dietary Guidelines 2025–2030 (protein 1.2–1.6 g/kg; check the evidence register cites them).

Each rule gets its evidence register row (MM-143).
