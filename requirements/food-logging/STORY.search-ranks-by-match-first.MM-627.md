---
id: MM-627
status: done
component: food-logging
related: [MM-42, MM-153, MM-383, MM-408, MM-410, MM-411]
---

# Story: food search lists the closest name first, says the serving, and never ends at nothing for one stray word

## Context
The owner, 2026-10-26: recent foods and database search are "kind of ass" next to MyFitnessPal and
MyNetDiary. The food-logging review (`docs/food-logging-plan.md`, F-07, F-08) found that pack results were
sorted by the source's reliability score first (MM-383) and by text match only to break ties. So a
well-documented record that matched loosely listed above the food the person typed, and two records from
one source were ordered by which stated more nutrients. Every word had to match, so one extra or
misspelled word gave "Nothing found", and each row said only its calories per 100 g.

## Decisions
From the owner (2026-10-26, the plan's D-3): **match first; source reliability boosts and breaks ties
among near-identical names.** This supersedes MM-383's reliability-first order for search. The score still
chooses between a barcode's records across packs (MM-383), and is still never shown.

Choices made without asking (say if any is wrong):
- **How close a name is**, in order:
  1. the name begins with the words typed, as whole words ("Banana, raw" for "banana");
  2. the name's first word begins as the first word typed, and every word typed begins a word of the name
     ("Chicken breast, roasted" for "chick bre");
  3. any other match, such as through the brand.

  Then names with fewer words beyond those typed come first, counted in pairs: one extra word ("raw",
  "cooked") is near-identical, so "Banana" and "Banana, raw" tie and the more reliable record leads. Then
  reliability, then the database's own text score.
- **A name as close from a less reliable source can lead.** "Oats" from Open Food Facts lists above "Oats,
  rolled, dry" from USDA; the trust mark beside each says which is which (MM-153).
- **When every word typed finds nothing**, the closest foods that match some of the words are listed
  under "No exact match for "…". Closest:", most words matched first. Never for a one-word search.
- **A row says the food's first serving and its calories** ("1 cup (158 g) · 205 kcal"), with the
  calories per 100 g after it for comparing; a food with no serving says per 100 g only, as before.

## Description
Pack search orders results by how closely the name matches what was typed, then by the source's
reliability among names as close. A search that matches nothing in full offers the closest partial
matches, said as such. Each result says its first serving and its calories.

## Acceptance Criteria
```gherkin
Scenario: The closest name first
  Given the packs hold "Oats" from Open Food Facts and "Oats, rolled, dry" from USDA SR Legacy
  When the person searches "oats"
  Then "Oats" lists first

Scenario: Near-identical names by reliability
  Given "Banana" from Open Food Facts and "Banana, raw" from USDA Foundation
  When the person searches "banana"
  Then "Banana, raw" lists first

Scenario: A stray word
  Given the packs hold "Chicken breast, roasted" and no food matches all of "chicken breast skinless"
  When the person searches "chicken breast skinless"
  Then "Chicken breast, roasted" is listed under "No exact match for "chicken breast skinless". Closest:"

Scenario: A serving on each row
  Given white rice whose first serving is 1 cup of 158 g at 130 kcal per 100 g
  When it is found
  Then its row says "1 cup (158 g) · 205 kcal (130 per 100 g)"
```

## Notes
- Built in `foodCatalog/searchOrder.ts` (the order), `FoodCatalog.search` (applied across packs, partial
  matches dropped when any pack matches in full), `SqliteFoodPack.search` (a wider pool per pack, the
  first serving read with each hit, the any-word fallback) and `FoodSearchResults`.
- Tests: `test/foodCatalog/searchOrder.test.ts`; `sourceReliability.test.ts` and `foodPack.test.ts`
  updated where they held MM-383's reliability-first order, which this ticket supersedes for search.
- Not in this ticket (the plan's C4 and W-D): one list merging the person's own foods with the packs'
  (they already list above them, MM-596), typo tolerance, synonyms.
