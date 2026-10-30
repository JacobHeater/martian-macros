---
id: MM-710
status: in-progress
component: food-logging
related: [MM-44, MM-45, MM-153, MM-325, MM-586, MM-607, MM-616, MM-642, MM-657, MM-684, MM-703, MM-706, MM-708, MM-709]
---

# Task: A saved food carries its group, its evidence and its ingredients (schema 32)

## Context
A saved food (`custom_foods`, MM-45) has a name, a serving, its numbers and a barcode. It has no food group, so the
coach's same-group swap (MM-684) can never offer it; it does not say where its numbers came from, so a label read, a
typed guess and an assistant's estimate look alike; and a homemade food has nowhere to keep what went into it.

## Decisions
The owner's (MM-703): a required group on an AI-made food, editable, with the same chooser on the typed form; the
evidence stored on the saved food and shown as its trust mark; homemade ingredients corrected and kept.

Choices made without asking (say if any is wrong):
- **Schema 32** (`currentSchemaVersion` 31 → 32; the only schema change among the three PRs of MM-703): `custom_foods`
  gains `food_group TEXT NULL`, `evidence_kind TEXT NULL`, `evidence_citation TEXT NULL`, `ingredients TEXT NULL` (a JSON
  array of `{ name, grams }`). The migration adds the four columns; nothing is backfilled, so an existing saved food has
  no group and no evidence.
- **`CustomFood`** gains `group: FoodGroup | undefined`, `evidence: FoodEvidence | undefined`, `ingredients: readonly
  FoodIngredient[]` (empty for most foods). The repository (SQL and in-memory) and the contract suite carry them; the
  backup carries them (they are columns, MM-63).
- **`FoodEvidenceKind` gains `label`**: a food saved from the label reader (MM-44) is "label"; one typed, corrected
  ("Fix this food", MM-153) or saved from a usual food is "yours"; an AI-made one is what MM-709 resolved. Every new saved
  food has an evidence; an old one has none and no mark.
- **The trust mark on a saved food** (`SavedFoodTrustMark`, the sibling of `FoodTrustMark`): label and cited read as
  trusted, matched as the packs' mark, yours as the person's own, estimated as unverified; shown in the Library (MM-706)
  and on the add-food sheet's "Yours" results and Saved step rows.
- **The typed form gains "Food group (optional)"**, a chooser over `FoodGroup` with the groups' labels, after the serving
  rows; a recipe has none.
- **"About this food"** (MM-642) on a saved food shows its evidence line and, when it has them, its ingredients.
- **The coach's same-group swap (MM-684)** may offer a saved food that has a group, by group; a saved food without one is
  matched by meal slot as today (MM-607).

## Description
Four columns on a saved food, carried through the domain, the repositories, the forms and the marks.

## Acceptance Criteria
```gherkin
Scenario: Version 31 to 32
  Given a database at version 31 with a saved food
  When it is opened
  Then it is at version 32 and the food has no group, no evidence and no ingredients

Scenario: Saved with its group and evidence
  When a saved food with group "breadsAndGrains", evidence cited and two ingredients is saved and read back
  Then all three come back as saved

Scenario: A label's evidence
  When a food is saved from a label read
  Then its evidence is "label", and its row shows the trusted mark

Scenario: The typed form's group
  When "Food group" is set to "Breads and grains" on the typed form
  Then the saved food has that group

Scenario: The coach may offer it
  Given a saved food in "breadsAndGrains" that trades better than a croissant at breakfast
  When the meal's moves are found
  Then the same-group swap may name it
```

## Notes
- Tests: `test/data/upgrade.test.ts` (31 → 32), `test/data/schemaFingerprint.test.ts`, the custom food repository
  contract, `test/food/customFoods.test.tsx` (the chooser, the mark, About this food), `test/engine/mealMoves.test.ts`
  (the swap).
- Never edit step 31 or earlier (MM-325).

## Progress
Built 2026-10-30 (PR C of MM-703, which takes schema 32), not run locally; CI validates.
- Schema 32: `custom_foods` gains `food_group`, `evidence_kind` (checked against the five kinds), `evidence_citation`
  and `ingredients` (a JSON list of name and grams); the step adds the four columns and backfills nothing.
  `CustomFood` gains `group`, `evidence` and `madeOf` (named so because `ingredients` is a recipe's lines); the SQL and
  in-memory repositories carry them, with a contract case; `FoodEvidenceKind` gains `label`.
- The typed form chooses "Food group (optional)" (an `MmDropdown` with None); a new typed food is "yours", one read from
  the label "label", a corrected copy (MM-153) "yours"; an edited food keeps its evidence.
- `SavedFoodTrustMark` on the Saved step's rows and the add-food sheet's Yours results; `customCatalogFood` carries the
  group and turns the evidence into the amount step's tier (an estimate is "Check this"); "About this food" says the
  evidence and "Made of: …".
- The coach: `CatalogTradeCatalog.load` takes the saved foods and answers `groupOf` for a `custom` origin by the saved
  food's group; `InMemoryTradeCatalog` takes `savedFoodGroups`; `CoachAnalysisInputs.savedFoods` is wired in
  `AppState`. A saved food with a group gets a same-group swap; one without gets none, as before.
- Tests: `test/data/upgrade.test.ts` (31 to 32), `test/data/schemaFingerprint.test.ts` (32), the custom food repository
  contract, `test/food/customFoods.test.tsx` (the chooser, the marks, About this food), `test/food/labelRead.test.tsx`
  (the label's evidence), `test/state/catalogTradeCatalog.test.ts` and `test/engine/mealSwapSameGroup.test.ts` (the
  saved biscuit's swap; the ticket named `mealMoves.test.ts`, but the group swap's own file is the sibling).

**Left to a sibling PR:** the mark on the Library's rows (MM-706), once the two PRs meet.
