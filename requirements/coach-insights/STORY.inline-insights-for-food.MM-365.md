---
id: MM-365
status: proposed
component: coach-insights
related: [MM-361, MM-362, MM-370, MM-125, MM-121, MM-305, MM-312, MM-108, MM-11]
---

# Story: The first inline insights on food entries and meals

## Context
See MM-361 and MM-362. This is the owner's own example: a logged food that is high in fat, and so calorie-dense, gets a line
under it about what could improve.

## Decisions
The product owner's (2026-10-17): single-item neutral facts and pattern-backed insights both apply to food. Grades show on the
entry (MM-370), and the insight may refer to the grade and to the portion.

Choices I made without asking (say if any is wrong). **The catalog and every figure in it is a draft** for the panel's
nutrition and coaching roles to check:

Listed in priority order (MM-362): when two fire on one entry, the higher row wins.

| rule | priority | basis | fires when | the line (example) | safeguard |
|---|---|---|---|---|---|
| large portion | data quality | item | entry ≥ 2× the food's usual serving and ≥ 300 kcal | "About twice the usual serving (2 cups). Worth checking the amount is right." | portion: off for ED history (the panel's request, see below) |
| light on protein | pattern | item | entry ≥ 400 kcal and < 10% of calories from protein | "520 kcal with 9 g of protein. Adding a protein source here makes your minimum easier." | protein: shown |
| mostly fat | pattern | item | entry ≥ 150 kcal and ≥ 55% of its calories from fat | "Most of this item's calories come from fat (62%). A leaner choice or a smaller portion leaves more room for protein." | composition: off for ED history |
| salty item | pattern | item | a sodium limit is set and the entry alone is ≥ 40% of it | "This item is about half your sodium limit (1,150 mg of 2,300)." | composition: off for ED history |
| often logged, low grade | education | pattern | a food graded D+ or below was logged on ≥ 5 of the last 14 days, under the latest entry of it | "Logged on 6 of the last 14 days, and graded D, mostly for its saturated fat and sugar. A higher-graded choice on some of those days is an easy place to start." | composition: off for ED history |

- **Every line is about the item**, never the day's totals (MM-362).
- **"Large portion" is left out with an eating-disorder history.** At the design review (2026-10-17) both reviewers asked whether
  a prompt about how much was eaten is a restriction cue. The chair chose the safer reading until the safety role answers: a
  line that invites a second look at an amount eaten can read as a nudge to eat less.
- **An estimated entry (MM-150)** gets no composition insight, because its macros are guesses.
- **MM-125's meal-without-protein insight stays on the dashboard, not inline.** It is offered at most monthly and rules out
  per-meal targets. An unrationed line under every meal header would break both.

## Description
The five rules in the inline catalog, their words, evidence rows and evidence-register entries, and their placement in the food
log.

## Acceptance Criteria
```gherkin
Scenario: The owner's example
  Given a logged entry of 400 kcal with 260 kcal from fat
  Then the "mostly fat" insight is shown under it, stating 65%

Scenario: Small items are left alone
  Given an entry of 90 kcal, 80% from fat
  Then no "mostly fat" insight is shown

Scenario: Protein
  Given an entry of 520 kcal with 9 g of protein
  Then the "light on protein" insight states both figures

Scenario: Salt only with a limit
  Given no sodium limit is set
  Then no "salty item" insight is shown, whatever the entry's sodium

Scenario: A pattern under the food
  Given a food graded D logged on 6 of the last 14 days
  Then today's entry of that food shows the "often logged, low grade" insight with 6 of 14

Scenario: Two rules on one entry
  Given an entry of 600 kcal, 70% from fat, with 8 g of protein
  Then the "light on protein" insight is shown under it and "mostly fat" is not

Scenario: Estimated entries
  Given an estimated entry that would satisfy "mostly fat"
  Then no insight is shown under it

Scenario: Eating-disorder history
  Given that screening answer is ticked and an entry that satisfies "mostly fat" and "light on protein"
  Then the "light on protein" insight is shown and "mostly fat" is not

Scenario: No portion prompt with an eating-disorder history
  Given that screening answer is ticked and an entry at three times its usual serving
  Then no "large portion" insight is shown

Scenario: Plain words
  Then no food rule's line calls a food good or bad or names a replacement food
```

## UI/UX
- FoodWithInsights, FoodTwoInsightsInOneMeal, FoodInsightOpen, FoodWithInsightsEatingDisorder, in
  `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`. The owner's example under Peanut butter, two lines in one
  meal, a line opened, and the eating-disorder view. Reviewed by the panel (`docs/agent-runs/mm361-coaching-insights/`).
