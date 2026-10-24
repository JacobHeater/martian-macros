---
id: MM-616
status: done
component: food-database
related: [MM-52, MM-607, MM-604]
---

# Task: Catalog foods carry a food group

## Context
The coach's trade may name a catalog food (MM-607, the owner's choice of 2026-10-24). To offer a sensible one, it must know what
kind of food X is: granola is traded for another breakfast cereal or yogurt, not for canned tuna. The pack has no category or
food-group field (`foodCatalog/`). The USDA sources carry one (`food_category` for Foundation and SR Legacy foods,
`branded_food_category` for branded foods; the spike's `1_load_usda_branded.py` already loads the latter). The pipeline drops it.

## Decisions
Choices made without asking (say if any is wrong):
- **A small fixed set of groups**, mapped from the source categories in the pipeline. For example: breakfast cereals, dairy and
  yogurt, meat and poultry, fish, eggs, legumes, nuts and seeds, breads and grains, fruit, vegetables, snacks and sweets, spreads
  and sauces, prepared meals, drinks. The mapping is a reviewed table in the pipeline.
- A food whose source category maps to nothing has no group, and is never offered as a trade.
- Custom foods and the person's own foods have no group unless the person sets one; MM-607 matches them by meal slot.
- **The groups as built** (`FoodGroup`): breakfast cereals, dairy and yogurt, meat and poultry, fish (with shellfish),
  eggs, legumes (with soy and meat alternatives), nuts and seeds, breads and grains, fruit, vegetables, snacks and
  sweets, spreads and sauces, **fats and oils**, prepared meals, drinks. Fats and oils is split from spreads and sauces
  because the USDA's own categories keep them apart ("Fats and Oils"; WWEIA's butter and margarine; branded oils and
  butter), and a cooking oil is no trade for ketchup.
- **One USDA category can hold two groups.** SR Legacy and Foundation put eggs with dairy, juices with fruit and
  vegetables, and cookies and cakes with bread; there the food's name decides (`foodGroupRefinements`).
- **Reviewed, no group** is distinct from **unmapped**: a category the table names with no group (supplements, baby
  foods, herbs and spices, baking supplies, sugar, mixed variety packs) is a decision, not reported; a category in no
  row is unmapped, its foods have no group, and the build report lists it with its count.
- **FNDDS foods are mapped too**, by their WWEIA category, which the survey download carries.
- **Open Food Facts products have no group** for now: the extract carries no category for them. A food found online
  has none either.

## Description
The pipeline maps each source category to a group and writes it to the pack. The pack schema gains the field. The catalog's
search API can filter by group. The pack's version rises.

## Acceptance Criteria
```gherkin
Scenario: A USDA food has its group
  Given a branded granola with branded_food_category "Cereal"
  Then the pack carries it in the breakfast cereals group

Scenario: Unmapped
  Given a source category not in the mapping
  Then the food has no group, and the pipeline report lists the category

Scenario: Filter
  When the catalog is searched for foods in a group
  Then only foods in that group are returned
```

## Progress (2026-10-24)
Built. Not run locally; CI validates.

- **The type**: `apps/mobile/src/domain/food/FoodGroup.ts`, fifteen groups (see Decisions). The catalog layer may now
  import the domain (`test/layers.test.ts`), since a catalog food carries a domain type the coach reads too.
- **The pipeline**: `extract.sql` ends both candidate files with `category`: USDA Branded's `branded_food_category`,
  Foundation's and SR Legacy's `food_category` (joined from `food_category.csv`), FNDDS's WWEIA category (from
  `wweia_food_category.csv`); empty for Open Food Facts. `CandidateFood.category` carries it; `packEntryFor` maps it
  with `foodGroupOf`, over the reviewed table `foodPipeline/foodGroupTable.ts` (every category of the 2026-04-30
  branded export's US products, every SR Legacy/Foundation category and every WWEIA category, looked up by
  `categoryKey` so spacing and dashes do not matter) and the name refinements in `foodGroupRefinements.ts`.
  `BuildReport` counts the written foods per group and lists each unmapped `source: category` with its count, most
  first; the section appears only when the extract carries categories, so the Dart parity report is unchanged.
- **The pack**: format 4 (`FoodPackFormat`), a `food_group TEXT` column (the group's name) and a partial index on it.
  `writeFoodPack` writes it; `SqliteFoodPack` reads it from format 4 only, so a format 1 to 3 pack still opens and its
  foods have no group. A name the code does not know reads as no group.
- **The search**: `CatalogSearch.search` takes `group`. Only foods in that group are returned; a query with no words
  lists the group's foods (by id). `SqliteFoodPack` filters in SQL, `FoodCatalog` passes it to every pack, and the
  online caches (in memory and SQL) hold no groups, so a search in a group finds none of their foods (the in-memory
  cache now drops a group as the table does).
- **Tests**: `apps/mobile/test/foodPipeline/foodGroups.test.ts` (branded granola in "Cereal" is in breakfast cereals
  through the pack; spacing and dashes; the name refinements; a reviewed no-group category; the table names each
  category once, every group has categories; the extract row and the SQL carry the category; an unmapped category gives
  no group and is listed in the report; an extract without categories reports as before; a format 3 pack reads with no
  groups; an unknown group name; the search filter in a pack, with no words, with limit and offset, and across the
  catalog). The online cache contract (`test/contracts/onlineFoodCacheContract.ts`) gained the group case, run against
  both implementations. `packMicronutrients.test.ts` now expects format 4.
- **Not done**:
  - **The published packs must be rebuilt** (`mm food build`, then the publish step in `docs/food-packs-data.md`) for
    real foods to carry groups. Until then the phone reads the 2026-10-19 format 3 packs, whose foods have no group,
    and a search in a group finds nothing. The new extract SQL has not been run against the sources (CI has no DuckDB).
  - The unmapped list of the first real build is to be reviewed into the table; the branded categories that are a
    whole GS1 definition ("Includes any products that…", a few dozen foods) are left unmapped on purpose so they show.
  - Open Food Facts products (the winner of most shared barcodes) carry no group; their `categories_tags` could be
    mapped in a follow-up.

