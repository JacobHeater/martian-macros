---
id: MM-46
status: done
component: food-logging
related: [MM-37, MM-27, MM-38, MM-42, MM-49, MM-167]
---

# Story: Log with hand portions instead of a scale

## Context
Beginners will not weigh food, and should not have to. The risk is a method so loose that the engine's advice becomes wrong.

## Decisions (made with the product owner)
- **One data model for every way of logging.** A hand portion is stored as an amount of a specific food with a record of how it was
  measured and how uncertain that is; it is not a separate, lesser kind of entry.
- **A hand portion converts to grams of the food chosen**, never to generic macros: a palm of salmon and a palm of chicken come out
  differently. The portion is a volume scaled to the user's hand (estimated from height and sex), times the food's density.
- **Uncertainty**: palm 25%, cupped hand 30%, thumb 40%.
- **A steady bias is absorbed by the adaptive estimate.** What matters is noticing when the user changes method (MM-27).
- **There are no "modes".** Hand portions are an amount unit offered alongside grams and servings.

Choices I made without asking (say if any is wrong):
- **Which portion suits which food**: palm for meat and fish, cupped hand for grains, fruit and other carbohydrate foods, fist for
  vegetables, thumb for fats and spreads. The amount step offers the fitting one first.
- **Where protein precision matters, the app says so.** A user logging protein mostly by palm, whose protein target matters for their goal,
  is nudged to weigh their main protein source for one week to calibrate.

## Description
In the amount step (MM-42), a food can be logged as a number of palms, cupped hands, fists or thumbs. The app shows the grams and macros it
will record.

## Acceptance Criteria
```gherkin
Scenario: The food matters
  When one palm of salmon and one palm of chicken breast are logged
  Then the two entries have different weights and macros

Scenario: The hand matters
  Given a 190 cm man and a 155 cm woman
  When each logs one palm of the same food
  Then his entry is heavier

Scenario: Recorded as a hand portion
  When a food is logged by palm
  Then the entry is recorded as measured by palm, with 25% uncertainty

Scenario: Switching to a scale
  Given three weeks logged by hand portions
  When the user begins weighing everything
  Then the expenditure estimate restarts its window at the switch

Scenario: Switching to labels
  Given three weeks logged by hand portions and nothing weighed
  When the user begins logging label servings
  Then the expenditure estimate restarts its window at the switch

Scenario: A steady mix is not a switch
  Given half of every day's energy logged by hand portions and half by label servings
  Then the expenditure estimate does not restart its window

Scenario: Weigh the main protein for a week
  Given a goal of fat loss, recomposition or lean gain
  And more than half of the protein on fully logged days of the last two weeks was logged by palm
  Then the coach asks the user to weigh the protein food they eat most for one week
  And says what share of their protein was logged by palm

Scenario: No nudge where it does not help
  When the goal is maintenance, or half the protein or less was logged by palm,
  or the user has an eating-disorder history
  Then the coach does not ask the user to weigh their protein
```

## Notes
- Needs a density for each food (grams per unit volume), which the food pack must carry or approximate by food group (MM-55).
- The hand-size model (volume from height and sex) needs a source and a sanity check against a few real hands.
- The engine's style-switch rule currently only distinguishes weighed from not weighed (MM-27); it must learn to tell hand portions from
  label servings.

## Clarified by MM-167 (proposed)
A hand portion is stored as a count of palms, cupped hands or thumbs, the model and its version, and the grams it implies as an
estimate. Until the hand model exists, hand methods are a count plus typed totals. Whether "fist" is a method is an open decision in
MM-167.

Decided with the product owner (MM-167): there is **no fist portion**; the hand methods are palm, cupped hand and thumb. Vegetables
use a cupped hand or a cup. Until the hand model is built, these are logged as a count plus typed totals, labelled as an estimate.

## Progress
Built: the hand model (`HandModel`, version 1, `packages/domain/lib/src/food/hand/`). Volume of a palm, cupped hand or thumb for a
reference man (178 cm) and woman (165 cm), scaled by height cubed, times the food's own density or, with none, a default for what
the portion is for (palm 1.0, cupped hand 0.65, thumb 0.9 g/mL). `gramsFor` and `scaleNutrition` take an optional `HandSize` and
convert hand units only with it. The amount step offers Palms, Cupped hands and Thumbs after the weights, logs them as measured by
palm, cupped hand or thumb (25, 30 and 40% uncertainty already in `QuantitySource`), and records the implied grams and the model
version on the entry (schema version 16). The edit sheet keeps them. Tests: `hand_model_test.dart` (a taller man logs more than a
shorter woman; a food's own density wins; no hand size, no conversion), the repository contract, and a widget test that logs a food by palm.

**Honest limits.** The reference volumes are judgement, rounded from common coaching guidance and not checked against measured
hands; the code says so. The packs carry a density for few foods, so a palm of salmon and a palm of chicken weigh the same here and
differ only in their nutrition per gram, not in weight as the first scenario asks. Foods are not yet matched to the fitting portion
(palm for meat, cupped hand for grains): all three are offered. A check against real hands is not built. Not seen on the emulator.

Built: hand portions are a logging style of their own (MM-27). Each intake day carries the share of its energy logged by palm,
cupped hand or thumb (`handShare`) beside the weighed share. The estimator's switch test is now the change in the mix of weighed, by
hand and the rest (half the summed change in the three shares) between two runs of days, against the same 0.5 threshold. With no
hand portions it is exactly the old weighed-share change, so earlier results are unchanged; hand portions to a scale, or to label
servings, each count as a full switch. Tests: `tdeeEstimator.test.ts` (three weeks by hand then a scale restarts the window; hand
portions to labels restarts it; a steady half-and-half mix does not), `intakeDaysFrom.test.ts` (the hand and palm-protein shares).

Built: the nudge to weigh protein, as the insight rule `weighProtein` (MM-141's catalog, data quality, rationed like the rest).
It fires when more than half the protein on the fortnight's fully logged days was logged by palm (`palmProteinShare` on each
intake day) and the goal is fat loss, recomposition or lean gain; thresholds in `WeighProteinRule`. It asks for one week of
weighing the protein food eaten most and states the share by palm. Tests: `insights.test.ts` (fires in fat loss; not at half;
not in maintenance; never with an eating-disorder history) and `insightCard.test.tsx` (its words and evidence).

Choices I made without asking (say if any is wrong):
- **The nudge is never shown to a user with an eating-disorder history**, though it is about protein and logging: asking them
  to weigh food is the wrong push.
- **"Protein matters for their goal" is every goal but maintenance**, and "mostly by palm" is more than half the protein.
- **The nudge does not name the food.** It says "the protein food you eat most"; insights carry figures, not names.
- **The style test is one distance over three shares**, not a separate test per share, so a switch between any two styles counts
  once and the old behaviour is kept exactly.

Built (2026-10-21, hand model version 2): **the food matters in weight, not only per gram.** A palm or a thumb of a food
with no stated density now takes the density of its makeup per 100 g (`compositionDensity`: protein, fat and
carbohydrate as stated, the rest water, each at its own density, the Choi and Okos mixture rule), so a palm of salmon
(about 1.04 g/mL) weighs less than a palm of chicken breast (about 1.08 g/mL), and their macros differ. A cupped hand is
a heap with air in it and keeps its default (0.65 g/mL). A food's own density still wins; a per-serving food has no
makeup per 100 g and keeps the default. **The fitting portion is offered first** (`handUnitsFor`): 40 g of fat or more
in 100 g is a spread (thumb first), 12 g of protein or more and no less than its carbohydrate is meat or fish (palm
first), anything else a cupped hand first; all three stay offered. Tests: `handModel.test.ts` (salmon and chicken
differ in weight and macros; density from makeup; a cupped hand keeps its default; the fitting portion first),
`foodSearch.test.tsx` ("the hand portion a food suits is offered first"), `conversionFor.test.ts`. Not run locally; CI
validates.

Choices I made without asking (say if any is wrong):
- **The food's makeup stands in for a measured density** for palms and thumbs. It ignores air and cooking structure,
  so it separates lean from fatty foods but is not a measurement; the hand model's stated uncertainty covers it.
- **The fitting portion is chosen from the food's makeup**, not a food group, because the packs carry no group. A fatty
  meat such as bacon offers a thumb first; every portion is still one tap away.

Review fixes (2026-10-21, panel review, hand model version 3). Not run locally; CI validates.
- **Makeup density only where there is no air to speak of** (`compositionDensity`): more than half water (meat, fish,
  cooked foods), or fat outweighing protein and carbohydrate together (spreads, butter, oil). A dry, porous food
  (crisps, bread, crackers) came out three to ten times too heavy by its makeup; it now takes the portion's default.
  Raised `HandModel.version` to 3, since such entries now imply other grams.
- **Protein's density is 1.32 g/mL at 20 °C** (Choi and Okos: 1329.9 - 0.5184 T kg/m³), not 1.33.
- **Nuts and seeds offer a cupped hand first, a thumb next** (`handUnitsFor`): mostly fat with 10 g or more of protein
  and carbohydrate is nuts or seeds; under that, a fat or spread (thumb first). A nut butter has the same makeup as
  nuts, so it is offered the same way; the thumb is one place down. Supersedes the "40 g of fat is a spread" rule above.
- Tests: `test/domain/handModel.test.ts` (a palm of crisps or bread takes the default; makeup density for a moist food
  or a spread and not at half water; protein at 1.32; nuts and macadamias cupped hand then thumb; oil still thumb).

Owed on a phone: logging a palm of a pack food on the emulator and reading back its grams. The check of the reference
volumes against a few real hands stays a judgement, as the code says.
