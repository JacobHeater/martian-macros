---
id: MM-55
status: in-progress
component: food-database
related: [MM-50, MM-42, MM-43, MM-46, MM-49, MM-52, MM-56]
---

# Task: The food pack format, and the package that reads it

## Context
See MM-50. The phone needs instant lookup by barcode and fast search by name, in a file small enough to download on a phone connection.

## Decisions (made with the product owner)
- **The pipeline uses DuckDB; the phone does not.** A phone does point lookups and text search, which is SQLite's job, and DuckDB would add
  a large binary for no benefit there.

Choices I made without asking (say if any is wrong):
- **A pack is one read-only SQLite file**: foods (per-100 g nutrients as scaled integers), servings (description and gram weight), a
  barcode index, and an FTS5 index over name and brand.
- **A header table** holds the format version, build date, region, each source's version, and the license and attribution text.
- **Packs are separate from the user's database** and opened read-only. An entry logged from a pack **copies** the nutrients, so the log
  never depends on a pack that may be replaced or removed.
- **A new package, `packages/food_catalog`**, pure Dart: open packs, search, look up a barcode, list a food's servings. The app talks to it,
  not to pack tables.

## Description
The format, written by the pipeline (MM-52) and read by `food_catalog`. Search across several installed packs returns one ranked list.

## Acceptance Criteria
```gherkin
Scenario: Barcode lookup
  Given a pack with a million products
  Then looking up a barcode takes under 10 ms on a mid-range phone

Scenario: Search as you type
  Then a two-word search returns its first page in under 150 ms on a mid-range phone

Scenario: The log outlives the pack
  Given a food was logged from a pack
  When that pack is removed
  Then the logged entry still shows its name and macros

Scenario: A newer format
  Given a pack whose format version the app does not know
  Then the app refuses it with a clear message instead of misreading it
```

## Notes
- Hand portions need a density per food (MM-46); decide whether the pack carries it or the app derives it from the food group.
- The sizes that decide whether scaled integers and FTS5 are affordable come from MM-51.

## Progress (first increment: the format, the reader and a fixture; status stays in-progress)
- New package `packages/food_catalog` (`mm_food_catalog`, pure Dart; `mm arch` forbids Flutter, Drift and the user's database there). It depends on `sqlite3` only.
- **Format (version 1)**, defined once in `FoodPackFormat` and written by `FoodPackWriter`: `header` (pack id, built date, region, sources, license, attribution), `foods` (per-100 g nutrients as integers times 100, fiber, sodium, alcohol, preparation state, raw/cooked pair link, density, source, trust tier and its reason), `servings`, `barcodes` (GTIN-14), and an FTS5 index over name and brand with prefix indexes. `PRAGMA user_version` carries the format version.
- **Reader**: `SqliteFoodPack` opens read-only and implements narrow interfaces (`CatalogSearch`, `CatalogBarcodeLookup`, `CatalogServingLookup`, joined as `FoodPack`). Search matches the start of every typed word and ranks name above brand; punctuation in the query cannot break it. `FoodCatalog` presents several packs as one ranked list. A pack whose format version is not 1 is refused with `UnsupportedPackVersion` and a plain message.
- **Fixture**: `FixturePack`, 30 invented foods with raw/cooked pairs, densities, servings and three barcoded products. Every one passes `checkNutrition` and every barcode passes `normalizeBarcode` (tested).
- Tests: the above, a file pack opened read-only (a write is refused), and a 50,000-food synthetic pack where a three-word prefix search is under 150 ms and a barcode lookup under 10 ms on this laptop.
- **Not done / not verified**:
  - The fixture is **30 foods, not a few hundred**, and its values are rounded from general knowledge. It is test data and must never be shown as real nutrition; it is not a nutrition source.
  - The acceptance timings are for a mid-range phone and a million products; I measured a laptop and 50,000 rows. The phone and the million are unmeasured.
  - "The log outlives the pack" is by design (an entry copies nutrients) but there is no logging code that reads packs yet, so it is not tested.
  - Whether a density comes from the pack or from food group (the ticket's open note) is decided only as far as the pack carries one if the source has it.
  - Multi-pack ranking merges by each pack's own relevance score, which is only roughly comparable between packs.
  - No pipeline writes packs yet (MM-52), and nothing in the app reads them (WS-08).

