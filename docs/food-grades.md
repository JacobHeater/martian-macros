# How a food is graded (MM-380, MM-382)

The spike's report, 2026-10-18, replacing the one of the same morning that
had adopted a published label's point tables (MM-369): the product owner
withdrew that the same day. The method below is the app's own. The panel's
nutrition, micronutrients, measurement and integrations roles reviewed the
draft (`docs/agent-runs/mm380-proprietary-grade/`); every figure is a
judgement, recorded in the evidence register, and held to the calibration set
below in `apps/mobile/test/engine/foodGrade.test.ts`.

## The method

Every food is graded for the food itself, from **what it gives per calorie**:
the same grade for every person, whatever the amount eaten. Protein, fiber and
the vitamins and minerals the app tracks count for a food; sodium, sugars,
saturated fat and calories per gram count against it. The score is the points
for less the points against, and the letter is one of twelve steps.

| Component | Read per | Counts | Points |
|---|---|---|---|
| Protein | 100 kcal | for | 1.5, 3, 4.5, 6, 8, 10, 12.5, 15 g (max 8) |
| Fiber | 100 kcal | for | 0.7, 1.4, 2.1, 2.8, 3.5, 4.5, 6 g (max 7) |
| Vitamins and minerals | 100 kcal | for | the mean share of the US Daily Value over the ones stated, each capped at 100%: 2.5, 5, 7.5, 10, 15, 20% (max 6); never more points than the food has nutrients at 5% or more; at most 3 when its counted sugars pass 8 g per 100 kcal |
| Calories per gram | the food | against | 3, 4, 5, 6, 7.5 kcal/g (max 5) |
| Sodium | 100 kcal, or 40 kcal for a food under 40 kcal per 100 g | against | 120, 240, 360, 480, 600, 800, 1000, 1500, 2000, 3000, 5000, 8000, 10000, 14000 mg (max 14) |
| Sugars, when stated | as sodium | against | 3, 6, 9, 12, 16, 20, 25, 30 g (max 8), scaled by the waiver |
| Saturated fat, when stated | as sodium | against | 1.5, 2.5, 3.5, 4.5, 5.5, 6.5 g (max 6) |

A list "for" gives a point per threshold the value reaches; a list "against"
one per threshold it passes, so a value exactly on a threshold gets the
benefit of the doubt. What counts for a food is read per 100 kcal whatever its
calories, so a vegetable's density is its own; what counts against it is read
per 40 kcal at least, so a broth's label rounding does not become whole points.

**The sugars waiver** stands in for the intrinsic sugars of fruit and dairy,
which the sources do not tell from added sugars. A watery food (under
1.5 kcal per gram; the waiver fades out by 2) has its sugars points waived by
how far its fiber or protein per 100 kcal has climbed a ramp: fully at 1 g of
fiber or 4.5 g of protein, by half at 0.75 g or 3.4 g, not at all at 0.5 g or
2.25 g. A sweetened cereal with added fiber, a granola bar, dried fruit, honey
and chocolate keep their sugars points. A sweetened drink with protein, a
flavoured yogurt or canned fruit in syrup leak through; an added-sugars column
in a later pack format closes them.

**The vitamins and minerals** are potassium, calcium, iron, magnesium, zinc and
vitamins A, C, D, B12 and folate, each against the Daily Value on the US food
label (21 CFR 101.9(c)(8)(iv)), one reference for everyone; sodium, sugars,
saturated fat and cholesterol are limits, not amounts to reach, and are not in
it. The component counts when a food states at least four of the ten (the
four a US label must state), over the ones stated; a label that states one
rich nutrient cannot outscore a full profile, because the points are bounded
by how many nutrients reach 5% of their Daily Value per 100 kcal. A stated
zero is a small amount (a label may write zero under 2% of the Daily Value)
and counts as stated. Fortification counts as the label states it.

**The letters**, as the lowest score each step reaches: A+ 16, A 13, A- 10,
B+ 7, B 5, B- 3, C+ 1, C −1, C- −3, D+ −5, D −8, and D- below. A step is about
the resolution of the inputs: a label may be 20% off and comply, so
neighbouring letters are not a ranking to act on, and the calibration test
holds that 5% on a food's calories moves it at most one step and 20% at most
two.

**Not graded:** an alcoholic drink (more than 1.2 g of alcohol per 100 g); a
food under 10 kcal per 100 g (broth, coffee, a diet drink), which has almost
nothing to grade per calorie; an estimate; an entry whose grams are not known
(or, for a drink stated per 100 mL, its millilitres: MM-654);
a recipe, whose ingredients carry no sodium; and a food that does not
state sodium, since a missing value is never zero (MM-310). A fiber that is not
stated is counted as none and the grade says so (MM-656, the owner): fiber can
only count for a food, so the letter is at worst a step too low.

## The cap (MM-660, the owner, 2026-10-27)

A nutrient table cannot see a fryer: breaded fried chicken breast and a
grilled one are the same numbers, and per calorie a battered, sauced dish
scores like an average food (General Tso chicken, a C). Two caps hold such a
food to C- whatever its score, and the popover says which:

- **Fried**, by the words of its name (`friedByName`): fried, battered,
  breaded, a doughnut, fries, chips and the like; never a stir-fry, a pan-fry
  or a fast fry of lean meat, refried beans, an egg, a food said not to be
  fried, or one whose coating was not eaten. The source's own words, so
  almonds and a salmon fillet, as fat-rich as fried chicken, are never
  called fried; a name the words miss grades as it would without the cap.
- **Sweet and fatty**, by its numbers (`FoodGradeRule.cap.sweetAndFatty`):
  at 200 kcal or more per 100 g or 100 mL, 40% or more of its calories from
  fat and 10 g or more of sugars, with fewer than 3 points for it from
  protein, fiber and the vitamins and minerals. The signature of a sauced or
  sweet dish that is mostly fat and sugar, which no word names; the points
  for it keep a nut butter, a cheese or a fibrous granola out.

Both are rules with a handful of constants, not a list of foods. On the
generic pack of 2026-10-27 the words move 333 foods and the numbers 24;
every one is listed in [food-grade-cap-moves.md](food-grade-cap-moves.md).
Other published systems do not see the fryer either: Nutri-Score 2023 gives
breaded fried chicken breast a B and General Tso chicken a D, the D coming
from reading salt and sugar per 100 g, which also puts cheddar and peanut
butter at E.

## Inputs

| Food | Per 100 g from |
|---|---|
| A pack food | its values, which are per 100 g; sugars, saturated fat and the vitamins and minerals from its micronutrients when the pack carries them |
| A food of the person's own | its serving's values ÷ the serving's grams × 100; no grade without a serving weight |
| A recipe | not graded: its ingredients carry only the four macros |
| A logged entry | its totals ÷ the grams it was logged as × 100, so the amount eaten does not change it; a drink stated per 100 mL by its millilitres, as the pack grades it (MM-654) |
| A meal or a day | the calorie-weighted mean of its graded entries' scores, rounded half up, when they carry at least 70% of its calories; otherwise the question mark says the share |

A graded food says, when its badge is pressed, what its source left unstated
and so was not counted: sugars, saturated fat, or the vitamins and minerals
(naming how many of the ten are stated), and when the component was counted
from fewer than ten.

## The calibration set

Approximate USDA SR Legacy values per 100 g, recollected and checked for
order, not the pack's own (`apps/mobile/test/support/gradeCalibrationFoods.ts`
lists every input). The test holds each letter, at least two foods on every
step, the dry and cooked states of oats within a step, the milks in order,
grapes at C+ or better, pickles below eggs, and the sensitivity bounds above.

| Letter | Foods |
|---|---|
| A+ | spinach, broccoli, white mushrooms, iceberg lettuce |
| A | celery, Swiss chard, lentils, edamame |
| A- | canned green beans, nonfat Greek yogurt, firm tofu, canned tuna, skim milk, baked sweet potato |
| B+ | roasted chicken breast, fortified whole-grain oat cereal, farmed salmon, 80/20 ground beef, whey protein powder, 2% milk |
| B | apple, avocado, hard-boiled egg, oats cooked in water, whole-wheat bread, banana, protein bar, dry oats |
| B- | watermelon, whole milk, low-fat fruit yogurt, deli ham, plain whole-milk yogurt, white bread, cooked pasta, fortified sweetened cereal, almonds, dill pickles |
| C+ | cooked brown rice, cheese pizza, grapes, cooked white rice |
| C | soy sauce, orange juice, salted peanut butter |
| C- | walnuts, potato chips, cooked bacon, cheddar, vanilla ice cream |
| D+ | raisins, 70% dark chocolate, sandwich cookies |
| D | olive oil, cola, gummy candy, sweetened condensed milk, milk chocolate, honey, lard |
| D- | salted butter, coconut oil |

What the panel flagged as owned by the method rather than a threshold, and
disclosed rather than fixed: lean red meat at or above chicken (zinc and B12,
a feature of every per-calorie micronutrient index); walnuts beside chips (the
ten nutrients exclude vitamin E and the fats' kind); refined grains a single
step under whole grains (enrichment); fortified foods earning the component as
their label states; chips and salted butter paying nothing for sodium per
calorie while brined foods pay in full; a grade without sugars, saturated fat
or micronutrients when the pack does not carry them.

## Coverage

Measured on the packs built 2026-10-19 (format 3; USDA Foundation, SR Legacy
and FNDDS in `generic`, USDA Branded and Open Food Facts in `barcode_us`)
with the method's requirements:

| Pack | Foods | Fiber and sodium stated, 10 kcal or more | Under 10 kcal per 100 g | Fiber stated as 0 | Sugars and saturated fat stated too |
|---|---|---|---|---|---|
| Common foods (`generic`) | 13,285 | 12,441 (93.6%) | 195 (1.5%) | 4,549 (34.2%, analysed zeros: meat, dairy, oils) | 10,938 (82.3%) |
| Barcode foods, United States (`barcode_us`) | 520,988 | 418,241 (80.3%) | 24,944 (4.8%) | 151,572 (29.1%) | 401,745 (77.1%) |

So more than nine in ten common foods and four in five barcode foods are
graded, and most of those with their sugars and saturated fat as well: the
format 3 packs carry the thirteen MM-307 nutrients where the source states
them (`coverage.txt` in the release has every share per source; FNDDS states
all of them for every food). The 2026-10-09 packs (format 1) graded 7,270 of
8,088 common foods and 377,606 of 456,191 barcode foods, without sugars,
saturated fat or the vitamins and minerals; a cola scored 0 and graded C
until this rebuild. The owner chose to grade then rather than wait (MM-380);
the rebuild with a third source (MM-381, MM-383, MM-409) is what completes
the grades.

## Naming

The grade is unnamed: badges and popovers say "Grade B+ for Lunch". The
method is the app's own and names no outside model as its basis; the
evidence register's "How is a food graded?" entry describes it, and the
nutrient-density literature (per-100 kcal indices against Daily Values) is
cited there as context, not validation. Nothing the app draws resembles a
published label.

## What was decided

Recorded in `docs/agent-runs/mm380-proprietary-grade/decision.md` and MM-380.
