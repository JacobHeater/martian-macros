---
id: MM-52
status: done
component: food-database
related: [MM-50, MM-51, MM-53, MM-54, MM-55, MM-57]
---

# Task: The pipeline that builds food packs from the sources

## Context
See MM-50. The pipeline runs on a developer machine or in CI, never on a phone.

## Decisions (made with the product owner)
- **DuckDB reading Parquet and CSV.**

Choices I made without asking (say if any is wrong):
- **A Dart command-line tool** in `tools/food_pipeline`, driven by `mm food build`, so the repository stays one language and one task
  runner. It calls DuckDB (the `dart_duckdb` package, or the DuckDB CLI if that proves simpler).
- **Sources are downloaded to a cache folder that is not committed**; the build records each source's version and download date in the
  pack.
- **The build is reproducible**: the same source files give byte-identical packs.

## Description
Steps: download or reuse sources; load them; map each to one schema (per 100 g: energy, protein, carbohydrate, fat, and where present
fiber, sugars, saturated fat, sodium, alcohol; plus name, brand, barcode, servings with gram weights, source and source id); apply the
checks in MM-53; normalize barcodes (MM-54); resolve duplicates by the rule from MM-51; write the packs (MM-55); print a report of counts
kept and dropped per source and per reason.

## Acceptance Criteria
```gherkin
Scenario: One command
  When "mm food build" is run on a machine with the sources cached
  Then the generic pack and the US barcode pack are written, with a report

Scenario: Reproducible
  When it is run twice on the same sources
  Then the packs are identical

Scenario: Every dropped entry has a reason
  Then the report's dropped counts, by reason, add up to the difference between entries read and entries written

Scenario: Provenance
  Then every food in a pack records which source it came from and that source's id
```

## Notes
- USDA household measures ("1 cup, chopped") come from FoodData Central's portion data and are what make generic foods loggable without a
  scale. Carry them through.

## Progress (built and verified)
- **Two commands**: `mm food fetch` downloads the four sources into `.food_cache/` (reusing what is there, unpacking the USDA zips) and writes `provenance.json` (versions and download date); `mm food build` runs the DuckDB extract and then the Dart build, and writes `generic.pack`, `barcode_us.pack` and `report.txt`. Neither the cache nor the packs are committed.
- **Split**: `packages/food_pipeline/sql/extract.sql` (DuckDB command-line tool) only maps each source onto one schema. Everything with a rule is Dart in `packages/food_pipeline`: the checks and barcode normalization are `checkNutrition` and `normalizeBarcode` from `mm_domain` (so MM-53 and MM-54 have one implementation, not a SQL copy), then newest-version-per-source, the conflict policy, entry ids, trust tier fields and the writer from `mm_food_catalog`. **Location decision**: the Dart part is `packages/food_pipeline`, not `tools/food_pipeline`, so it is a workspace package like the others; `mm arch` keeps it out of Flutter, Drift, the app and the user's database.
- **Format change**: the pack format (MM-55, not yet released) gained `source_id`, so every food records its source and that source's id.
- **Run on the real sources (this machine, 2026-10-09)**: read 2,894,620 entries; wrote 464,279 (barcode pack 456,191: Open Food Facts 90,106 and USDA Branded 366,085; generic pack 8,088: Foundation 344 and SR Legacy 7,744); dropped 2,430,341, each with one reason, the counts adding up (1,257,692 older versions, 794,813 Open Food Facts rows with a missing value, 179,501 USDA rows with a missing value, 73,937 + 5,824 where energy disagrees with the macros, 43,333 invalid barcodes, 33,736 lost to the other source on a shared barcode, and the rest the other check reasons). Packs: generic 2.5 MB (0.5 MB xz); barcode 140 MB (46 MB gzip, 29 MB xz), with servings and source ids included.
- **Reproducible**: building twice from the same extract, and a second full run including a fresh DuckDB extract, gave byte-identical packs (same SHA-256).
- Tests (`packages/food_pipeline/test`): CSV reading however the text is chunked; each drop reason; invalid barcodes drop a product but not a generic food; every barcode form meets one product; newest version wins whatever the order; the preferred source wins and the loser is counted; a 10% disagreement marks the food check-this; a failing record never beats a passing one; provenance on every entry; servings carried; read = written + dropped; any input order gives the same packs; written packs are byte-identical across runs.
- **Not done / not verified**:
  - The SQL extract and `mm food fetch` are not run in CI (the sources are gigabytes, and CI has no DuckDB): they were run by hand on this Windows machine only. The Dart half is tested on small fixtures.
  - **Which source wins a shared barcode is still the product owner's decision** (MM-51). The default `--prefer off` follows their stated preference. Disagreeing records are marked check-this either way.
  - **Trust tiers are provisional** (MM-153) and the **license text in the pack header is provisional** (MM-57): no pack should be published until a qualified person has read the licensing.
  - USDA household measures come from Foundation and SR Legacy portion data; Branded foods carry only their one labeled serving, and only when it is in grams. Open Food Facts servings are taken from its serving quantity, assumed to be grams. Raw/cooked pair links and densities are not populated yet (MM-43, MM-46).
  - DuckDB version used: 1.5.6. The pipeline needs its command-line tool installed.

