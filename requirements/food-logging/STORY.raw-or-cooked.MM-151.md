---
id: MM-151
status: in-progress
component: food-logging
related: [MM-37, MM-42, MM-45, MM-46, MM-52, MM-55, MM-153]
---

# Story: Ask whether I weighed it raw or cooked

## Context
The single largest avoidable error for a user who weighs their food. Cooking changes weight without changing energy: rice and pasta take
up water and roughly triple; meat and fish lose water and shrink by a quarter to a third. A user who weighs 200 g of cooked rice and logs
"rice, white, raw" records about 720 kcal for a 260 kcal portion. One who weighs 150 g of cooked chicken breast against a raw entry
records about 180 kcal for a 250 kcal portion. Both happen every day in every food-tracking app, to exactly the careful users who weigh.

The effect is not noise that the adaptive loop absorbs. A user who makes this error with their staple carbohydrate overstates intake by
hundreds of calories on rice days and not on others. MM-45 already names it as "the classic recipe error"; it is at least as common
outside recipes.

Evidence: yield factors for cooking are **strong** (USDA publishes retention and yield tables; FoodData Central carries separate raw and
cooked entries for most staples). How often users pick the wrong one is not measured anywhere I could find; that it is common is
**judgement** from coaching practice.

## Decisions
Choices I made without asking (say if any is wrong):
- **Every generic food in the pack carries a preparation state**: raw, cooked, dry (grains, pasta, legumes before cooking), or not
  applicable. Where the source has both states of a food they are linked as a pair (MM-52).
- **Search results say the state in the name, always**: "Rice, white, cooked", "Rice, white, dry". Generic results default to the state
  people most often weigh: cooked for grains, pasta, legumes and meats (consistent with MM-42's "Chicken breast, cooked" first).
- **When a food with a linked pair is logged by weight, the amount step shows a two-way switch**: "Weighed: cooked / raw (dry)". Switching
  changes which entry is used. It is one tap and is visible, not a dialog.
- **The choice is remembered per food.** A user who always weighs rice dry is asked once.
- **The switch shows the consequence**: "200 g cooked is about 260 kcal. 200 g dry is about 720 kcal." The size of the difference is the
  education.
- **Where only one state exists in the source**, the app does not invent the other by a yield factor in the first version. It says which
  state the entry is.
- **Branded and barcode foods are as labelled** (US labels state "as packaged" unless they say "as prepared"); the entry says "as
  packaged".
- **Hand portions** (MM-46) are always of the cooked or ready-to-eat food.

Where the experts disagreed:
- The nutritionist wanted computed conversions (yield factors) for every food so that either state is always available. The engineer and
  the data-trust reviewer: yield varies with cut, method and time (chicken loses 20 to 35%), and a computed entry would look as
  authoritative as a measured one. Deferred; if added, such entries are marked "converted" and carry extra uncertainty (MM-153).
- The UX strategist worried about one more control in the amount step. It appears only for foods with a linked pair and only when
  logging by weight.

## Description
A preparation-state field and pair link in the pack format (MM-55); the switch in the amount step; a per-food remembered choice.

## Acceptance Criteria
```gherkin
Scenario: Names say the state
  When "rice" is searched
  Then each generic result's name includes cooked or dry

Scenario: The switch
  Given "Rice, white, cooked" is chosen and 200 g entered
  Then the amount step shows the cooked and dry alternatives with the calories of each
  And switching to dry logs about 720 kcal instead of about 260

Scenario: Remembered
  Given the user chose dry for white rice last time
  When white rice is logged again
  Then dry is preselected

Scenario: Meat
  Given 150 g of chicken breast is entered
  Then the switch shows cooked (about 250 kcal) and raw (about 180 kcal)

Scenario: No pair
  Given a food with only one state in the source
  Then no switch is shown and the name says which state it is

Scenario: Not for servings
  Given a food logged as "1 cup" or by label serving
  Then no switch is shown
```

## Notes
- Priority: should-have, with the food database (MM-50).
- Oil and fat absorbed in cooking is a related and larger hole (pan-fried against grilled); see MM-152.
- Recipes (MM-45) ask for the cooked weight of the whole dish; that ticket's rule stands.

## Progress
Built: the pipeline now sets a preparation state on every generic food (raw or dry, cooked, or neither, from USDA's comma-separated
names) and links a food's raw and cooked entries to each other when the source has both (the raw one points to its plain cooked entry:
boiled, steamed, roasted, baked, grilled in that order; every cooked entry points to the raw one); branded and barcode foods are marked
as packaged. The reader gained `pairOf` (pack and catalog). In the amount step, a food with a pair shows "Weighed as: Cooked / Raw"
(or "Dry") while logging by weight, with "200 g cooked is about 260 kcal. 200 g raw is about 730 kcal" under it; switching changes which
entry is logged and its name; no switch is shown for a serving or a food with one state. Tests: `preparation_link_test.dart`,
the pack test for `pairOf`, and `raw_or_cooked_test.dart`.

Not done: the choice is not remembered per food (that needs the source food stored with an entry, MM-167's remaining persistence);
the published packs predate this and have no preparation or pairs until the pipeline is run on the downloaded sources and a new release
is published (not run: the source downloads are large); the rule was tested on names written from USDA's style, not yet on the real
files, so how many foods pair is unknown; "default to the state people weigh" for search ordering; branded foods say "as packaged" only
in the data, not on screen.

Done since: the choice is remembered. Because an entry now stores which food it came from (MM-167), choosing a food that has a raw or
cooked pair starts on the state it was last logged in, weighed in grams, found among the recent foods (the last 20 distinct entries,
so a state not logged recently is forgotten). The switch still applies to weighing only; choosing a serving logs the food as picked.
Tested in `raw_or_cooked_test.dart`.
