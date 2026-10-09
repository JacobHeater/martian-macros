---
id: MM-167
status: in-progress
component: food-logging
related: [MM-37, MM-27, MM-63, MM-38, MM-42, MM-43, MM-44, MM-45, MM-46, MM-48, MM-49, MM-55, MM-61, MM-139, MM-150, MM-151]
---

# Story: Record how much was eaten, in what unit, and what the nutrition numbers are for

## Context
"How was it measured?" in the Add food sheet (MM-38) records a *method* and nothing else. Choosing "Weighed" does not ask for a weight,
"Label serving" does not ask how many servings, and "Cupped hand" does not ask how many handfuls. A stored entry is a name, four totals and
a method, so the portion cannot be reconstructed, an edit cannot show what was eaten, and the meaning of the typed protein, carbohydrate,
fat and calorie fields is not stated anywhere on screen. This ticket is the cross-cutting rule for all of it. It extends MM-38, MM-42,
MM-43, MM-46, MM-48 and MM-150 and does not replace them; those tickets keep their own behavior and are cross-referenced below.

### What is already documented (existing behavior, before this ticket)
- **MM-38 (done)** requires that every entry record "how its amount was measured" and lists seven methods with uncertainties
  (weighed 5%, label serving 10%, cup or spoon 15%, estimate 20%, palm 25%, cupped hand 30%, thumb 40%). It does not require a quantity or
  unit for any method, and does not say what basis the typed macros are for. The form's behavior is that the typed numbers are the totals
  recorded: nothing is scaled.
- **MM-42 (in progress)** requires an amount step with the food's own servings and grams, macros updating with the amount, and the entry
  "recorded as a cup-or-spoon measurement" for a cup. Built: quantity and unit are asked there, macros scale from per-100 g, and then **only
  the totals and the method are stored**; the quantity and unit are discarded.
- **MM-46 (proposed)** requires that a hand portion converts to grams of the chosen food using a hand volume (from height and sex) times
  the food's density, and that the app shows the grams and macros it will record. It lists palm, cupped hand, fist and thumb. It does not
  say what is persisted.
- **MM-150 (proposed)** defines "Estimate a meal" as size (Light to Very large) and kind, producing calories and a macro split, stored
  as an estimate at 40% uncertainty. This is the only place "estimate" is defined, and it conflicts with MM-38 (20%); see Open decisions.
- **MM-43 (in progress)** says a scanned product opens the amount step "defaulting to one label serving". MM-45 (proposed) says a custom
  food can be logged "in any number of servings or grams". MM-44 (proposed) reads serving size from a label. MM-151 (proposed) is about
  raw versus cooked for weighed foods. MM-55 (done) stores per-100 g nutrients, servings (description and gram weight) and density.
- **MM-48 (done)** lets an entry be edited; it restores only name, macros, method, meal and day, because that is all that is stored.
- **MM-27 (done)** lets the estimator treat weighed versus not-weighed days differently; it reads the method, not any quantity.

### What is missing (the gap this ticket closes)
No ticket requires a quantity or unit per method; none defines the nutrition basis of typed numbers; none says what is persisted to
interpret a portion; none covers legacy entries with a method and no quantity; and "Estimate" has two incompatible meanings.

## Decisions
**Proposed additions** (made without asking; say if any is wrong). None of this is built.

### 1. Three separate things, never mixed
Every entry distinguishes:
1. **Reference nutrition**: the nutrition of a stated reference amount (per 100 g, per 100 mL, or per one labelled serving), from a food
   source, a label, or the user.
2. **Amount consumed**: a quantity and a unit (or a count of a hand portion).
3. **Totals for the entry**: calories, protein, carbohydrate and fat for what was actually eaten. These are what the day's summary and the
   engine use, and they are stored.

Totals are either **calculated** (reference nutrition scaled by the amount consumed, once, when logged) or **entered** (the user types
totals for what they ate). The entry records which. A quantity on an entered-totals entry is **descriptive only**: it is never multiplied
into the totals. A quantity on a calculated entry is the scaling factor and is never applied twice. The totals are stored as logged, so a
later change to a food pack does not change history.

### 2. What each method requires
| Method | Quantity | Unit | Reference | Totals |
|---|---|---|---|---|
| Weighed | positive number, fractions allowed | grams or ounces (weight ounces, 28.3495 g; never fluid ounces) | per 100 g, or a serving with a gram weight | calculated, or entered |
| Label serving | number of servings, fractions allowed (0.5, 1.5) | "serving" | the label's serving: its description and its gram or millilitre weight where known | calculated from per-serving values, or entered |
| Cup / spoon | positive number, fractions allowed | cup, tablespoon, teaspoon or millilitre (fluid ounce only with a stated volume) | a serving defined in volume, or a food-specific density | calculated, or entered |
| Palm | number of palms, fractions allowed | "palm" | the food and the estimation model (MM-46) | calculated through the model only |
| Cupped hand | number of cupped handfuls, fractions allowed | "cupped hand" | as above | as above |
| Thumb | number of thumbs, fractions allowed | "thumb" | as above | as above |
| Estimate | none | none | none | entered by the user (typed, or from a MM-150 size and kind); never scaled |

- **Estimate means estimated totals.** It is not a unit and has no quantity. If a user wants to estimate "about half a plate of rice",
  they choose the food and a hand portion or a cup, not Estimate. This resolves the two meanings of "estimate" in favor of MM-150.
- **Cups are not assumed identical.** The US legal cup is 236.588 mL, the tablespoon 14.787 mL, the teaspoon 4.929 mL. A volume converts
  to grams only (a) through a serving that the food source defines in that unit ("1 cup = 158 g" scales linearly to 0.5 cup), or (b)
  through a density the food carries (MM-55). With neither, the unit is not offered for that food; the app does not guess a density.
- **Fluid ounces and weight ounces are different units and are labelled "fl oz" and "oz".** A weight in ounces is exact; a fluid ounce
  needs a density to become weight.
- **Hand portions** are never exact nutrition. They record the count, the model and its version, and the resulting grams as an estimate
  with the method's uncertainty (MM-27, MM-46). Until MM-46's hand model exists, hand-portion methods are logged as a count with typed
  totals, labelled as an estimate.
- **Quantities are validated where required**: a quantity must be a number greater than zero. Empty, zero, negative and non-numeric
  quantities disable "Log it" and say why in a line under the field. Fractions typed as decimals are accepted; simple fractions ("1/2",
  "1 1/2") are accepted too.

### 3. What the nutrition fields mean
- **Typed protein, carbohydrate, fat and calories** are labelled with their basis in words next to the fields: "For everything you ate"
  (entered totals; today's behavior, now stated), "Per serving (from the label)" or "Per 100 g". The basis defaults to "For everything you
  ate".
- When the basis is per-serving or per-100 g, the amount consumed is required and the totals are calculated and shown before logging.
- **Calories from macros** keeps its behavior. It computes from the macros in whichever basis is on screen, and the result is shown in
  that basis; it is never computed from totals and then scaled again. The mismatch check (MM-38, MM-53) applies to the reference values
  and equally to entered totals, because it is a ratio.
- A food from the pack or a barcode always has a reference basis (per 100 g plus its servings); a manual entry has the one the user chose.

### 4. What is persisted
Beyond the totals and the method, an entry stores what is needed to read the portion back:
- the **method**; the **quantity** and **unit** (null for an Estimate);
- the **nutrition basis** (`entered totals` or `calculated`), and for calculated entries the **reference amount and unit** and the
  **reference nutrition** used;
- the **serving description and its gram or millilitre weight** when one was used;
- the **conversion** used to turn the unit into grams, when there was one: its kind (the food's serving weight, a density, a hand-portion
  model), its factor, and the model's version;
- the **source food** where there was one: pack id, food id, the source name and the source's own id (MM-52), and the raw or cooked state
  (MM-151).
This requires a schema change (MM-61) and a backup-format change, and has a migration requirement below.

### 5. Changing method, and editing
- **Changing the method clears the quantity and unit**, and the form says so ("Enter how much again"). A quantity is never carried into a
  different unit, and no hidden value survives. If the new method's required quantity is empty, "Log it" is disabled.
- **Editing restores** the method, quantity, unit, basis, reference and serving, and shows the same controls as when the entry was
  logged. Changing the quantity of a calculated entry recalculates the totals from the stored reference; changing the totals of a
  calculated entry converts it to an entered-totals entry and says so.
- **Legacy entries** (a method and totals, no quantity) are left exactly as they are. They are shown as "Amount not recorded" with the
  method, the editor offers the method and totals only, and no quantity, unit or basis is invented for them. They keep contributing their
  totals and their method's uncertainty as before.
- **Logged-food details show a readable summary of the portion**: "150 g · calculated from 52 kcal per 100 g", "1.5 servings (45 g)",
  "0.5 cup (about 79 g)", "2 cupped hands, estimated", "Totals entered by you".
- **Search, barcode and manual entry behave the same way.** All three end in the same amount step and write the same fields; the
  barcode and a custom food default to one label serving when the source gives one (MM-43, MM-45), and the label-serving method is recorded
  when a label serving is used (not a cup-or-spoon method, whatever the serving's wording).

## Acceptance Criteria
```gherkin
Scenario: Weighed asks for an amount and a weight unit
  When "Weighed" is selected
  Then an amount field and a grams / ounces choice are shown
  And "Log it" is disabled until the amount is greater than zero

Scenario: 150 g of a food stated per 100 g
  Given a food with 52 kcal, 0.3 g protein, 14 g carbohydrate and 0.2 g fat per 100 g
  When 150 g is logged by weight
  Then the entry's totals are 78 kcal, 0.45 g protein, 21 g carbohydrate and 0.3 g fat
  And it is stored as weighed, 150 g, calculated from per-100 g values

Scenario: Ounces mean weight
  When 6 oz is entered by weight
  Then the amount is 170.1 g
  And fluid ounces are a different, separately labelled unit that needs a density

Scenario: 1.5 label servings
  Given a label serving of "1 bar (40 g)" with 160 kcal
  When 1.5 servings are logged
  Then the totals are 240 kcal and the amount recorded is 1.5 servings, 60 g
  And the method recorded is label serving

Scenario: 0.5 cup of a food with a volume-based serving
  Given a food whose serving is "1 cup (240 mL)" with 200 kcal
  When 0.5 cup is logged by cup
  Then the totals are 100 kcal and the amount recorded is 0.5 cup, with the serving it was scaled from

Scenario: A cup is not assumed to be a fixed weight
  Given a food with no serving defined in cups and no density
  Then cup, tablespoon and teaspoon are not offered for it

Scenario: 2 cupped handfuls as an estimated portion
  Given the hand-portion model is available for a food
  When 2 cupped hands are logged
  Then the entry records 2 cupped hands, the model version and the grams it implies, as an estimate with 30% uncertainty
  And the amount is never presented as exact

Scenario: Totals that are not multiplied again
  Given the user chooses "For everything you ate" and types 400 kcal
  And enters a quantity of 2 servings
  Then the entry's totals are 400 kcal
  And the 2 servings are descriptive only

Scenario: No double scaling when editing
  Given a calculated entry of 2 servings at 150 kcal per serving, totalling 300 kcal
  When it is opened and saved without changes
  Then its totals are still 300 kcal

Scenario: The basis is stated
  When the Add food sheet shows protein, carbohydrate, fat and calories
  Then it says whether they are for everything eaten, per serving or per 100 g

Scenario: Calories from macros use the shown basis
  Given 45 g protein, 60 g carbohydrate and 10 g fat typed "for everything you ate" with calories blank
  Then the calories are 510 kcal and are not scaled by any quantity

Scenario: Invalid quantities
  When the amount is empty, 0, -2 or "abc"
  Then "Log it" is disabled and a line under the field says an amount above zero is needed

Scenario: Fractions
  When "1/2" or "1.5" is entered as an amount
  Then it is read as 0.5 and 1.5

Scenario: Changing method
  Given 150 g was entered under "Weighed"
  When the method is changed to "Cup / spoon"
  Then the amount and unit are cleared and the form asks for them again

Scenario: Editing restores the portion
  Given an entry logged as 1.5 label servings
  When it is opened
  Then it shows "Label serving", 1.5 and the serving it used

Scenario: A legacy entry
  Given an entry stored before this change with a method and totals and no quantity
  Then it is shown as "Amount not recorded", its totals are unchanged, and no quantity is invented

Scenario: Estimate has no unit
  When "Estimate" is selected
  Then calories and macros are entered for the whole thing eaten
  And no quantity or unit is asked

Scenario: The same behavior from search, barcode and manual entry
  Given the same food reached by search, by barcode and by typing
  Then each logs with the same fields and the same totals for the same amount
```

## Notes
- **Nothing here is built.** What exists is described in the first section. The amount step from MM-42 collects quantity and unit and
  then drops them, and maps every serving to "cup / spoon", including a label serving from a barcode, which contradicts the rule above;
  both are implementation gaps against this ticket, not satisfied by it.
- **Decisions made by the product owner** (all seven open questions of the first draft, answered as recommended):
  1. **Estimate's uncertainty is 40%** everywhere. MM-38's 20% and `QuantitySource.quickAdd`'s value are to change to 40% when this
     is built, with the simulator re-run (MM-30); MM-150 already says 40%.
  2. **The US cup is the legal 236.588 mL** (tablespoon 14.787 mL, teaspoon 4.929 mL) for density-based conversion; a serving the source
     defines in cups uses its own gram weight.
  3. **The manual form's default basis is "For everything you ate"**, with a one-tap switch to per serving (from the label). Per 100 g
     is not offered for typed values in the first version.
  4. **There is no fist method.** Palm, cupped hand and thumb only; MM-46 is amended.
  5. **Until MM-46's hand model exists**, palm, cupped hand and thumb are logged as a count plus typed totals, labelled as an estimate
     with that method's uncertainty. No grams are invented.
  6. **Simple fractions are accepted** ("1/2", "1 1/2") as well as decimals.
  7. **An amount is required for Weighed, Label serving, Cup / spoon and the hand portions** (descriptive only when totals are typed),
     and none for Estimate.
  These are recorded as decisions; **none is built**, and the code still has Estimate at 20%, a fist-free method list, no quantity fields
  and no fraction parsing.
- **Implementation plan** (for a later change; each step is its own pull request):
  1. *Domain*: a `Portion` value (method, quantity, unit, basis, reference, serving, conversion), unit enums with exact conversion
     constants, and pure functions for scaling, ounce and volume conversion and quantity parsing and validation, with tests that cover
     every scenario above before any UI.
  2. *Data model and migration* (with MM-61): nullable columns for the portion on food entries, the schema version bump with a migration
     that adds them null, the in-memory store and the contract tests updated, the backup format (MM-63) carrying them, and a test
     that a legacy row reads back with no quantity and unchanged totals.
  3. *Calculation*: scaling in one place in the domain; the amount step and the manual form call it; no widget computes nutrition.
  4. *UI*: a quantity-and-unit control per method in the add-food sheet and the amount step; the basis label; validation lines; clearing on
     method change; the portion summary in the entry row and in details; edit restoring every field.
  5. *Wire-through*: search, barcode and custom foods write the same portion; fix the label-serving method mapping.
  6. *Tests*: domain unit tests; repository contract tests; widget tests for each method, validation, method change, edit round trip and
     legacy display; goldens for the new controls; and an emulator pass.

## Progress
Step 1 of the plan, the domain, is built and tested (`packages/domain/lib/src/food/portion/`, `test/portion_test.dart`):
`PortionUnit` with exact constants (weight ounce 28.349523125 g, legal cup 236.588236 mL, tablespoon, teaspoon, fluid ounce as a
separate volume unit), `parseQuantity` (decimals and simple fractions; empty, zero, negative and non-numeric rejected),
`ReferenceNutrition` (per 100 g, per 100 mL or per serving, with the serving's description, grams, millilitres, unit and a density
that is never guessed), `gramsFor`, `scaleNutrition` (the one place a quantity scales nutrition; null where it would need a guess),
`unitsOffered` (cup and spoon only where the food can convert them) and the `Portion` value.

Where the source counts a serving in a unit, that unit scales by the count itself, so "1 cup (240 mL) = 200 kcal" gives 100 kcal for
half a cup; any other volume unit goes through the serving's own millilitres. This is why the legal-cup decision applies only to
density-based conversion.

Not built: schema and migration, repository changes, the amount step and manual form, edit restore, legacy display, the portion
summary, and the fix to the label-serving mapping. The totals-versus-descriptive rule (typed totals never scaled) is a UI and
persistence rule and has no code yet. No behavior of the app has changed.

Step 2 of the plan, persistence, is built and tested. `FoodEntry` has an optional `Portion`; schema version 11 adds nullable
columns to `food_entries` (quantity, unit, nutrition basis, the reference nutrition and its basis, the serving's description,
grams, millilitres and unit, and a density) with migration step 10 to 11; the Drift repository, the in-memory repository and the
shared repository contract read and write them. Tests: a version-10 database with a food keeps its totals and method and gets no
portion ("nothing is invented"); a calculated portion round-trips every field; typed totals keep their quantity but are not scaled;
an update can change or clear the portion. The schema snapshot for version 11 is exported and the upgrade-from-every-version
tests pass.

Still not stored: the source food (pack id, food id, source, source id), the conversion record (kind, factor, model version) and
the raw or cooked state. They need the pack integration and the hand model and are the next persistence addition. Backups are
not changed: the encrypted backup (MM-63) is not built, and its format must carry these columns when it is. No screen reads or
writes a portion yet, so the app behaves as before.

Steps 3 to 5, calculation and screens, are built (`apps/mobile`, tests in `food_portion_test.dart`).
- **Manual form**: after "How was it measured?" the sheet asks for the amount that method needs: grams or ounces for Weighed,
  servings for Label serving, cups, tablespoons, teaspoons or millilitres for Cup / spoon, a count for palm, cupped hand and thumb,
  and nothing for Estimate. Amounts take decimals and simple fractions; empty, zero, negative and non-numeric amounts disable
  "Log it" and say why. "The numbers below are for" says "Everything you ate", and under Label serving offers "One serving", which
  scales the typed numbers by the servings eaten (the calories label becomes "Calories per serving" and the sheet shows what will be
  logged). Typed totals are never multiplied by the amount. Changing the method clears the amount and unit.
- **Search and barcode results** use the same domain scaling, record the quantity, unit, serving and the food's per-100 g numbers as
  a calculated portion, and a label serving of a packaged product is recorded as a label serving (generic foods' servings as a
  household measure, weights as weighed). The amount step also offers ounces and takes fractions.
- **Editing** restores the method, amount and unit. A calculated entry shows its amount and units and recalculates the totals from
  the stored numbers (no double scaling), with "Enter the totals myself" to type them instead. An entry from before amounts were
  recorded says so, asks for no amount and keeps its totals.
- **Logged foods** show a portion line: "150 g · calculated from 89 kcal per 100 g", "1.5 servings · calculated from 160 kcal per
  serving", "2 cupped hands · estimated", "Estimated totals", or "Weighed · amount not recorded". Copying an entry keeps its portion.
- Checked on the Android emulator: the new sheet and the Weighed view were seen. Goldens for the screens that changed are
  regenerated on CI.

Remaining: the source food, conversion record and raw/cooked state are not stored; hand portions are a count with typed totals until
MM-46's model exists; "One serving" is offered only under Label serving; the backup format (MM-63) is unbuilt. The ticket stays in progress for those.

Done since: `QuantitySource.quickAdd` (Estimate) is now 0.40, as decided; the domain and engine tests pass unchanged. The adaptive simulator
was not given a new estimate-heavy user (MM-30, MM-150 own that).

Done since: the source food is stored. A portion carries an optional `FoodOrigin` (pack, food id, source, source id); schema version 14 adds four nullable columns to `food_entries` (migration 13 to 14, guarded); foods logged from a pack, barcode or saved food record it. Still not stored: the conversion record and the raw or cooked state (the latter can be read back through the origin). Contract and migration tests pass.
