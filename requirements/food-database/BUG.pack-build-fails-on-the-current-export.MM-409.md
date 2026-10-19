---
id: MM-409
status: done
component: food-database
related: [MM-52, MM-383, MM-51, MM-56]
---

# Bug: The pack build fails on the current Open Food Facts export and DuckDB

## Context
The owner asked for the food search's scope to be widened (2026-10-19).
The first step was the build the MM-383 spike left for the owner to run:
the FNDDS source and the refreshed pins. Run on the owner's Mac with DuckDB
1.5.6 and the export of 2026-10-19, the extract failed twice before it
read anything: the export no longer has a `brands` column (`brands_en` and
`brands_tags` since 2026), and DuckDB 1.5 parses the export strictly and
stops at the first row that is not standard CSV, where DuckDB 1.1 skipped
such rows under `ignore_errors` (about 250,000 of them, the MM-51 spike
noted without explaining: 4,535,553 rows read against the Parquet's
4,786,290). With both fixed, the build's own gate (MM-383) stopped it a
third time: every FNDDS food was dropped for a missing value, because the
survey's `food_nutrient.csv` keys nutrients by the legacy nutrient number
(208 for energy, 203 for protein) where the other FoodData Central files
use the nutrient id (1008, 1003), and the extract matched on the id.

## Description
The Open Food Facts read in `extract.sql` names the brand column the export
has, and reads the file without strict parsing, so every row the export
holds is read. The FNDDS nutrient rows are mapped through the survey's own
`nutrient.csv` (nutrient number to id), so its foods carry their energy,
macros and the thirteen MM-307 nutrients. Measured on the export of 2026-10-19: 4,848,211 rows; 987,217
products tagged United States, 184,356 of them with a name, energy and the
three macros, against the 98,880 the MM-51 spike counted on 2026-10-09
under the skipping parser.

## Acceptance Criteria
```gherkin
Scenario: The columns exist
  Then every column the Open Food Facts read names is in the export's header

Scenario: Every row is read
  Then the read is not strict, and the build's report counts about 4.8 million Open Food Facts rows

Scenario: FNDDS foods are written
  Then the build's report shows FNDDS foods written, not all dropped for a missing value
```

## Regression test
`apps/mobile/test/foodPipeline/extractColumns.test.ts` checks every column
the Open Food Facts branch of `extract.sql` names against the export's
header of 2026-10-19 (`test/foodPipeline/support/off-header-2026-10-19.txt`),
and that the read is not strict. It fails with `brands` and passes with
`brands_en`. The build itself is the other guard (MM-383): a source that
gives nothing fails it, which is what caught the FNDDS nutrient numbers; a
unit test cannot run the extract, since it needs DuckDB and the sources.
