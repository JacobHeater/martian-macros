---
id: MM-310
status: in-progress
component: food-logging
related: [MM-305, MM-308, MM-311, MM-49, MM-126, MM-253, MM-254, MM-290, MM-108, MM-144]
---

# Story: Micros on the nutrition card

## Context
See MM-305. The nutrition card is `CalorieHero`, the one calorie visual on the Dashboard, Food and Coach
(MM-187). Its macro picture is a switch, Grams | Split (MM-253 rule 4, MM-290), remembered per person in
`user_preferences.macro_picture`. The owner asked for micronutrients as a third choice on that switch.

## Decisions
The product owner's (2026-10-14): a third segment, "Micros"; at Full detail only; each vitamin and mineral
shown against a reference marker for the user's sex and age; the known total with its coverage when
entries are missing a value.

Choices I made without asking (say if any is wrong):
- **The segment reads "Micros"** and the switch's choices become Grams | Split | Micros. Below Full detail
  the switch has its two choices, and a remembered "Micros" shows Grams.
- **Three groups, in this order**: Minerals (sodium, potassium, calcium, iron, magnesium, zinc), Vitamins
  (A, C, D, B12, folate), Also on the label (total sugars, saturated fat, cholesterol). Each nutrient is a
  row: its name, today's known amount, and a thin bar to the reference marker.
- **Reference amounts** are the US Dietary Reference Intakes for adults (RDA, or AI where there is no RDA),
  by sex and age band (19–30, 31–50, 51–70, over 70), from the NIH Office of Dietary Supplements' fact
  sheets. The bar fills to the marker and a little past it; the marker is labelled "reference", never
  "goal" or "target", and nothing turns a colour for being under or over it.
- **No reference marker** for sodium unless the user set a limit (MM-311), and none for sugars, saturated
  fat or cholesterol: those show their amount only.
- **Coverage** is said per nutrient when the day has foods without a value for it: "from 4 of 7 foods".
  With no food stating it, the row says "No data yet" and shows no number.
- **Pregnancy, breastfeeding and chronic kidney disease** (from the health check, MM-112): no reference
  markers at all, and one line: "Reference amounts are different for you; your care team can say which
  apply." Amounts are still shown.
- **No upper limits are shown.** Food alone rarely reaches one; supplements are a non-goal (MM-144).
- **The Dashboard, Food and Coach heroes all get the segment**, since they are the one component.

## Description
The Micros segment on the nutrition card, its rows, the reference amounts and their rules, and its
coverage wording.

## Acceptance Criteria
```gherkin
Scenario: Three choices at Full detail
  Given Full detail
  Then the nutrition card's switch offers Grams, Split and Micros

Scenario: Two choices below Full
  Given Standard detail and Micros remembered
  Then the switch offers Grams and Split, and Grams is shown

Scenario: A nutrient against its reference
  Given a 40-year-old woman at Full detail with Micros chosen
  And today's foods state 9 mg of iron
  Then the iron row shows 9 mg with a marker at the reference 18 mg

Scenario: Coverage
  Given 7 foods today, 4 of which state potassium, totalling 1,200 mg
  Then the potassium row shows 1,200 mg and says "from 4 of 7 foods"

Scenario: Nothing known
  Given no food today states vitamin B12
  Then the vitamin B12 row says "No data yet" and shows no number

Scenario: No reference where there is none
  Then the sugars, saturated fat and cholesterol rows show an amount and no marker

Scenario: Pregnancy
  Given the health check says pregnant
  Then no row shows a reference marker, and the care-team line is shown

Scenario: Never judged
  Then no row changes colour or wording for being under or over its reference
```

## UI/UX
- Food Micros — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Micros, Micros Partial,
  Micros Empty, Micros Care Team). The segment and its rows, drawn before the build (MM-293).
