---
id: MM-55
status: proposed
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
