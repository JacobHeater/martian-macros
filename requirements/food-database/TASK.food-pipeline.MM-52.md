---
id: MM-52
status: proposed
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
