---
id: MM-310
status: done
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
entries are missing a value. After the panel (2026-10-14): **Micros is offered on the Food screen only**,
its one home; the Dashboard and Coach heroes offer Grams | Split and show Grams for a remembered Micros
(the panel's PD-1: the list would push their rows below the first viewport). On Food the long card is
accepted, as the person asked for that detail.

Choices I made without asking (say if any is wrong):
- **The segment reads "Micros"** and the switch's choices become Grams | Split | Micros. Below Full detail
  the switch has its two choices, and a remembered "Micros" shows Grams.
- **Three groups, in this order**: Minerals (sodium, potassium, calcium, iron, magnesium, zinc), Vitamins
  (A, C, D, B12, folate), Also on the label (total sugars, saturated fat, cholesterol). Each nutrient a
  food states is a row: its name, the day's known amount, and a thin neutral bar to a marker that stands
  above and below it; a screen reader hears the row as one sentence. The nutrients no food states are
  named once per group: "Not stated by any food: Potassium, Calcium."
- **Reference amounts** are the US Dietary Reference Intakes for adults (RDA, or AI where there is no RDA),
  by sex and age band (19–30, 31–50, 51–70, over 70), from the NIH Office of Dietary Supplements' fact
  sheets. The bar fills to the marker and a little past it; the marker is labelled "reference", never
  "goal" or "target", and nothing turns a colour for being under or over it. One line above the rows
  says what a reference is: "Reference: a daily amount for a healthy man of your age, as an average over
  many days, not one day. If a clinician gave you amounts, use theirs." (the panel's UX-6, MN-4, SA-1).
- **No reference marker** for sodium unless the user set a limit (MM-311), and none for sugars, saturated
  fat or cholesterol: those show their amount only.
- **Coverage** is said per nutrient when the day has foods without a value for it: "from 4 of 7 foods".
  With nothing logged the picture is empty, and the screen's own line says so (MM-316).
- **No reference markers**, amounts still shown, with one line each (the panel's SA-2, SA-3, MN-6):
  pregnancy or breastfeeding, "Reference amounts are different in pregnancy and breastfeeding; ask your
  care team which apply."; chronic kidney disease, "With kidney disease, some of these amounts may be
  different for you; ask your care team."; bariatric surgery, "After bariatric surgery, your care team
  sets these amounts; ask them which apply."; under 19, "Reference amounts are different under 19."
  Pregnancy is said first when several apply.
- **No upper limits are shown.** The ULs for magnesium, folate and vitamin A apply to a subset of sources
  (supplements, synthetic folic acid, preformed vitamin A) that the totals cannot separate, and sodium
  and potassium have none (the panel's MN-5).

## Description
The Micros segment on the nutrition card, its rows, the reference amounts and their rules, and its
coverage wording.

## Acceptance Criteria
```gherkin
Scenario: Three choices at Full detail, on Food
  Given Full detail
  Then the Food screen's nutrition card offers Grams, Split and Micros
  And the Dashboard's offers Grams and Split, and shows Grams when Micros is remembered

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
  Then vitamin B12 has no row and is named in the group's "Not stated by any food" line

Scenario: No reference where there is none
  Then the sugars, saturated fat and cholesterol rows show an amount and no marker

Scenario: Pregnancy
  Given the health check says pregnant
  Then no row shows a reference marker, and the pregnancy line is shown

Scenario: What a reference is
  Given references are shown
  Then one line above the rows says they are for a healthy adult, as an average over many days

Scenario: Never judged
  Then no row changes colour or wording for being under or over its reference
```

## UI/UX
- Food Micros — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Micros, Micros Today, Micros
  Under Limit, Micros Not Stated, Micros Empty, Micros Care Team, Micros Kidney, Micros Surgery, Micros
  Eighteen). Drawn before the build and reviewed by the panel (`docs/agent-runs/mm305-water-micros/`).
- Today Micros Remembered — apps/mobile/src/gallery/screens/Today.stories.tsx: the Dashboard shows Grams.

## Progress
Built: `MicrosPanel` in `CalorieHero` (offered on Food only), `MmNutrientRow` with the `nutrient` bar
kind, `referenceAmount`, `ReferenceWithheld`, `microsDayOf`, `MicronutrientTotal`, `nutrientAmount`.
Tested in `test/domain/micronutrients.test.ts` (every DRI band edge, withholding and its order, coverage
with a stated 0) and `test/food/waterAndMicros.test.tsx`. Looked at in Storybook in three palettes at
412 by 915.

Not looked at: TalkBack (the spoken sentence is unverified on a device), the phone.
