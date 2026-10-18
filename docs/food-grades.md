# How a food is graded (MM-369)

The spike's report, 2026-10-18. The nutrition role's research is in
`docs/agent-runs/mm369-grading-method/findings/nutrition.md`; the chair
measured the coverage and chose where the report leaves a choice.

## The method

Every food is graded for the food itself, per 100 g, with the **point tables of
the general-foods algorithm published for the Nutri-Score label by Santé
publique France's Scientific Committee (2023 update)**, read from Open Food
Facts' implementation (`Nutriscore.pm`) and the German Wikipedia table; the
official FAQ V11 PDF could not be read by the role and is still to be checked
against. It was chosen over the Health Star Rating and the UK nutrient profiling
model because its 2023 revision made the fruit, vegetable and legume component
purely additive: the one input the pack lacks costs a bounded 0 to 5 points and
does not change which other components count, where the other two methods gate
protein on it or need a food category to pick a table.

The score is unfavourable points for energy (kJ), total sugars, saturated fat
and salt (sodium × 2.5), less favourable points for fiber and, while the
unfavourable points are under 11, protein. Every threshold is a strict
"greater than"; no input is rounded. The tables are `FoodGradeRule` in the
engine and rows in the evidence register.

The grades are **not Nutri-Scores** and the app never says they are (the
trademark position below). They differ from the label in five documented ways:

1. **No fruit, vegetable and legume share.** Whole fruit grades one to two
   steps lower than the label would (an apple B-, a banana C+); vegetables and
   legumes mostly keep their letter.
2. **One table for every food.** Drinks grade higher than the label's beverage
   table would (a cola B-); oils, nuts and cheese lower than their own tables
   would (olive oil D-, almonds C, cheddar D-). The pack has no category to tell
   them apart; a category column in a later pack format is the fix.
3. **Twelve steps, no E.** The published letters are A ≤ 0, B 1–2, C 3–10,
   D 11–18, E ≥ 19. Here: A+ ≤ −6, A −5…−3, A- −2…0, B+ 1, B 2, B- 3, C+ 4–5,
   C 6–7, C- 8–10, D+ 11–14, D 15–18, D- ≥ 19. B- takes the published C's first
   point and E is folded into D-. The splits are not equal.
4. **Alcoholic drinks are not graded**, read as more than 1.2 g of alcohol per
   100 g (the label's 1.2% by volume, read by weight).
5. **A missing value is never zero** (MM-310): a food is graded only when it
   states sugars, saturated fat, sodium and fiber; otherwise the question mark
   names what is missing.

## Inputs

| Food | Per 100 g from |
|---|---|
| A pack food | its values, which are per 100 g; sugars and saturated fat from its micronutrients |
| A food of the person's own | its serving's values ÷ the serving's grams × 100; no grade without a serving weight |
| A recipe | not graded yet: its ingredients carry only the four macros |
| A logged entry | its totals ÷ the grams it was logged as × 100, so the amount eaten does not change it; an estimate is not graded; an entry whose grams are not known (typed totals, a hand portion before the hand model, an entry from before portions were kept) is not graded |
| A meal or a day | the calorie-weighted mean of its graded entries' scores, rounded half up, when they carry at least 70% of its calories; otherwise the question mark says the share |

## Coverage

Measured on the packs published 2026-10-09 (`manifest.json`, format version 1):

| Pack | Foods | Fiber stated | Sodium stated | Both | Sugars or saturated fat stated |
|---|---|---|---|---|---|
| Common foods (`generic`) | 8,088 | 7,360 (91.0%) | 7,997 (98.9%) | 7,349 (90.9%) | 0: format 1 has no such columns |
| Barcode foods, United States (`barcode_us`) | 456,191 | 387,381 (84.9%) | 450,445 (98.7%) | 384,613 (84.3%) | 0 |

So **no pack food can be graded until a format 2 pack is published** (MM-307
added the sugars and saturated fat columns to the pipeline; the published packs
predate it). Once it is, the share of foods with a grade will be at most the
"both" column, less those missing sugars or saturated fat, which the pack build
report's `coverage.txt` will show. Until then grades appear on the person's own
foods that state those values (a label read or typed), and every pack food shows
the question mark naming sugars and saturated fat. The nutrient that most often
blocks a grade today is saturated fat and sugars, by absence; after the rebuild
it will be fiber.

**Follow-ups:** rebuild and publish the packs in format 2 (`mm food`); a
`category` column in a later format for the fruit, vegetable and legume proxy
and the beverage, fats, cheese and red-meat tables; recipe ingredients carrying
fiber, sodium and the label micronutrients.

## Licensing and naming

The Nutri-Score logo is a collective mark of Santé publique France (registered
at EUIPO and INPI); use of the logo needs the owner's consent and is granted to
registered food businesses under Conditions of Use (March 2025) and a Graphic
Charter. The app:

- never says "Nutri-Score" on a badge, its accessible name, a popover or a screen
  title, and never says a food "has Nutri-Score B";
- draws no five-letter A–E strip, no dark-green-to-red ramp, no logo: one letter
  with + or −, categorical fills (A mint, B sunflower, C periwinkle, D orchid),
  no red, no E;
- names the method once, in the evidence register's "How is a food graded?"
  entry, with the differences and the statement that the grades are not
  Nutri-Scores and the app is not registered.

The Conditions of Use PDF was not readable by the role and has not been read
for clauses on applications or text references; that read, and whether to
notify Santé publique France, are the product owner's (and the attorney's,
MM-242) to settle. The role is not a lawyer; the owner's jurisdiction was not
researched.

## What was decided

- The method, the twelve steps and the alcohol threshold as above (the role's
  recommendation, taken as is).
- Ship with the deviations disclosed rather than wait for a pack category.
- Alcohol and missing data read alike in a meal's popover (a share of calories
  that could be graded).
