---
id: MM-606
status: in-progress
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

Settled while building, 2026-10-24 (choices made without asking; say if any is wrong):
- **A change is the level rule or the trend.** A signal is in change when the table's "change when" column holds over the
  span's judged days, or when MM-605's engine finds it off its target the bad way (level against target, or a long run). Its
  other detectors (a shift, a short run, recent against baseline, a drift) date the change ("It has held since 12 Oct") but say
  nothing alone, since a move that stays on the right side of the target is not worth changing. The sign test alone is stricter
  than the table: at 14 days it needs 11 days off target, and the owner's fat week has 10.
- **Judged days:** whole days with targets, each against its own targets and its own planned calories (MM-124). A span is read
  only with at least 5 judged days and MM-605's 60% coverage. A Refeed or Day off is counted, as MM-605 has it; foods and trades
  come from whole, unmarked days only.
- **Thresholds the table leaves open:** fat "within ±15%" and carbohydrate "within ±15%" hold up on 70% of days; carbohydrate under
  the floor is a change on 50% of days; N2's "within 5%" includes any day over the target; N3's holding up counts only days with
  entries; N9's water-rich meal is a main meal whose weighed foods under 0.6 kcal a gram (Rolls' lowest band) are half its grams,
  on 3 days; N16's holding up reads only slots with a quarter of the calories. The δ of each trend signal is in
  `foodTrendSignals` (uncertain, for the null simulation).
- **N14 on maintenance** has no change line, as the table names only fat loss, recomp and lean gain.
- **N8 is gated like N5** (said only when protein is displaced or calories are over the band), and never shown beside N5: when
  fat over target is said, the split goes into it as figures; otherwise N8 is the line. N6 is never a line of its own.
- **N5's "averaged {shortG} g under your minimum"** is the minimum less the average protein; when the average is above the minimum,
  the sentence says on how many days protein fell short instead.
- **Families** keep one finding per direction, holding up included; the lowest in the catalog order speaks, the others' figures
  go with it.
- **N11:** the total counts every entry, so a share is honest; only foods that may be named are ranked (no quick-add estimate, no
  drink mostly of alcohol, macros explaining 75%). A food's calories are its median a time. A diffuse pattern names no food and
  offers no trade.
- **Safeguards:** kidney disease also leaves out protein's holding-up lines (protein is a cap); insulin or a sulfonylurea leaves out
  a split that points at carbohydrate; pregnancy, breastfeeding, underweight and low body weight also leave out N15 on fat loss.
  Under 18, paused or under-eating, no food is named, so "a protein add" is the add sentence alone.
- **N10, N17 and N18** are left to MM-607's `findTrade`, which picks X and Y from the span's and history's entries itself.

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
| N15 | intake against energy use | fat loss: intake ≥ TDEE − 1σ ("around maintenance"); lean gain: ≤ TDEE (calibrated from + 1σ, see Progress). Only when `tdeeStatus` is updated | | none; defers to N14 and the stall diagnosis (MM-140) |
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

## Progress
Built 2026-10-24: the signals, the span analysis and its words. Not run locally; CI validates.

- **Where:** `apps/mobile/src/engine/analysis/food/`, exported through `src/engine/analysis/index.ts`, one declaration per file:
  - the input (`FoodAnalysisInput`), the day (`FoodDay`, `foodDaysOf`) and the span (`FoodSpan`);
  - the signal ids, families and trade motives (`FoodSignalId`) and the thresholds (`FoodSignalRule`);
  - N1–N9 and N12–N16 as MM-605 `TrendSignal`s (`foodTrendSignal`, `foodTrendSignals`), with forced boundaries at target
    changes and the logging-style switch (`foodBoundariesOf`);
  - the table's level rules (`readFoodSignals`, `FoodSignalReading`);
  - N11 (`topContributors`, with `countsAsFood` and `foodKeyOf`);
  - the safeguards (`FoodLimits`, `foodLimitsOf`, `foodFindingAllowed`);
  - `analyseFoodSpan(input, span, asOf)`: data quality first, the trend engine and its de-duplication, the gates, the safeguards,
    the families, foods, and MM-607's `findTrade` for a change that allows one, as `CoachFinding`s.
- **Words:** `apps/mobile/src/format/foodFindingText.ts` (title, body and the numbers behind it, with the ticket's templates) and
  `coachTradeText.ts` (MM-607's trade sentence).
- **Contract:** `CoachFood` gained an optional `proteinG`, for the foods that fit what is left (MM-612). A fix carries its direction
  as the figure `direction` (1 or −1), and `calorieRoom` and `tradeDays` for its add and trade.
- **Tests:**
  - `apps/mobile/test/engine/foodSignals.test.ts`: the owner's fat week, fat that costs nothing, diffuse trends (and N11), data
    quality first, each day's own targets, the eating-disorder history, under-eating, the other safeguards, lean gain under
    target, and never praise under target over simulated users;
  - `apps/mobile/test/format/foodFindingText.test.ts`: the templates, the trade sentence, and every template against the banned
    words and the eight-word title;
  - `apps/mobile/test/voice.test.ts` bans "too much", "unhealthy", "fattening", "empty calories" and "burn rate".
- **Remaining:**
  - ~~wiring into `AppState` and the Coach tab (MM-610)~~ (done, below); ~~the announcement log for MM-605's state machine (N1's
    exit at 65% is the machine's, not a level rule's)~~ (done, below);
  - the evidence register rows (MM-143);
  - calibrating the uncertain thresholds with MM-605's null simulation.

Wired into the Coach tab (MM-610), 2026-10-24. Not run locally; CI validates.

- `AppState.coachAnalysis` builds `FoodAnalysisInput` from the app's cells (the last 119 days of food and intake, the
  targets history, the safeguards, the marked days, the planned share, the fat minimum, the balance in force, the
  trend weight, fiber at Full detail, the sodium limit, the calorie floor and the trade catalog once read) and runs
  `analyseFoodSpan` for the span chosen. Its findings are placed by `arrangeCoachFindings` (MM-610).
- Every scenario is covered by the tests above. Still in progress for the announcement log (the state machine's exit),
  the evidence register rows (MM-143) and the null-simulation calibration of the uncertain thresholds.

Evidence rows, the cross-signal null simulation and calibration, 2026-10-24. Not run locally; CI validates.

- **Evidence rows (MM-143)** added to `docs/evidence.md`, with the question "What does the coach read in my data?"
  and the test `apps/mobile/test/engine/coachAnalysisEvidence.test.ts`, which fails for a rule figure without a row.
  This ticket's rows: `foodSignal.*` for N1–N9 and N12–N16, `topContributors` (N11), `foodTrendSignals` (each δ and σ
  floor), `findTrade` and every `FoodSignalRule` figure, citing Morton 2018, Schoenfeld & Aragon 2018, Rolls 2017,
  Pérez-Escamilla 2012, Leidy 2015, Burrows 2019 and the IOM AMDR. **The protein rows** (`SafetyBounds.proteinRangeG`,
  `SafetyBounds.proteinTargetsG`) did not cite the Dietary Guidelines 2025–2030: both now name them as concordant
  (1.2–1.6 g/kg/day), marked as from a secondary summary (Am Fam Physician 2026;114(1):98-100; the panel's NU-A6).
- **The cross-signal null simulation** is written: `apps/mobile/test/engine/coachNullSimulation.test.ts`, with the
  generator `test/engine/support/stationaryCoachUser.ts`. 60 seeded stationary people (fat loss, maintenance and lean
  gain; food around the fixture's targets with an 8–15% day-to-day spread, stable 4-day training, water around the goal)
  run `analyseFoodSpan` and `analyseTrainingSpan` on 90 successive days for 2w and 1m; a fix not present the evaluation
  before counts as new, and each span must stay at 1 or fewer per person per 30 days. Not run locally; CI validates.
- **Calibrated:** N15 on lean gain, "≤ TDEE + 1σ" → "≤ TDEE" (`FoodSignalRule.energyUseLeanGainSigmas` 0; fat loss
  keeps 1σ as `energyUseFatLossSigmas`, both read in `readFoodSignals`). A lean-gain surplus (0.15–0.35% a week, about
  100–250 kcal) is usually within one standard deviation of an updated estimate (Good is under 200 kcal), so at 1σ the
  line fired on a person eating exactly to plan on about half of days and came and went daily: an estimated 1.2 new
  fixes per person per 30 days at 2w with a 150 kcal surplus and σ, against about 0.6 at 0σ. The other uncertain
  thresholds are unchanged: by the same estimate they stay within the budget.

N1's exit at 65%, 2026-10-24 (with MM-605's announcement log). Not run locally; CI validates.

- `foodSpanAnalysisOf` (which `analyseFoodSpan` now wraps) returns, with the findings, the keys whose exit threshold
  does not hold yet (`FoodSpanAnalysis.unresolved`): `proteinMinimum:level` while the minimum is met on under 65% of
  judged days (`FoodSignalRule.proteinMinimumExitShare`). N1 is said under 50%; between 50% and 65% it is not said,
  yet a reported N1 is not resolved; at 65% it resolves once that holds as of E, E−1 and E−2.
- Tests: `apps/mobile/test/engine/coachTrendLog.test.ts` ("N1's exit at 65%": the analysis at 5, 8 and 10 of 14 days
  met, and through the state machine).
- Still in progress for the evidence register rows (MM-143) and the null-simulation calibration of the uncertain
  thresholds.
