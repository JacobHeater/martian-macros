# Food source spike (MM-51)

Scripts that produced the 2026-10-09 numbers recorded in
`requirements/food-database/SPIKE.us-food-data-sources-and-pack-size.MM-51.md`
(Findings and Decisions). They are a one-off measurement, not part of the
build. Scripts 1 to 4 and this README were removed with the Flutter tree in
MM-232 (commit 50e187d8) and restored for MM-51 from its parent, as they were;
they are history and are not maintained:

- `4_pack_sizes.py` reads the pack schema from the Dart
  `packages/food_catalog/lib/src/food_pack_format.dart`, which no longer
  exists. The schema now lives in `apps/mobile/src/foodCatalog/FoodPackFormat.ts`;
  to rerun it, check out a commit before 50e187d8.
- The nutrition check in `3_compare_sources.py` is a SQL copy of
  `checkNutrition` (MM-53) as it was then; the pipeline calls the TypeScript
  rules, so this copy may have drifted.

The figures of 2026-10-19 (MM-409) do not come from these scripts but from the
TypeScript pipeline: the extract in `apps/mobile/src/foodPipeline/node/extract.sql`,
and the `report.txt` and `coverage.txt` the build writes and the
`2026-10-19` release of `martian-macros-food-data` carries
(`docs/food-packs-data.md`).

## Running the 2026-10-09 scripts

They need Python with `duckdb` (`pip install duckdb`), and about 5 GB of disk.
Run from an empty working folder, with `MM_REPO` set to the repository root:

1. Download and unzip, into the working folder (versions used on 2026-10-09):
   - `FoodData_Central_branded_food_csv_2025-04-24.zip`,
     `FoodData_Central_foundation_food_csv_2025-04-24.zip`,
     `FoodData_Central_sr_legacy_food_csv_2018-04.zip`
     from `https://fdc.nal.usda.gov/fdc-datasets/`;
   - `en.openfoodfacts.org.products.csv.gz` from
     `https://static.openfoodfacts.org/data/` (saved as `off.csv.gz`).
2. `python 1_load_usda_branded.py`, `2_load_off_us.py`, `3_compare_sources.py`,
   `4_pack_sizes.py`, in that order.

`sample50_disagreements.csv` is a random sample of fifty products where the two
sources disagree, for a person to check against real packages.

## Pantry coverage (question 7, current)

`pantry_coverage.py` is kept current: it reads any pack in today's format by
its table `barcodes(gtin, food_id)` (`FoodPackFormat.ts`), with only the Python
standard library:

    python3 pantry_coverage.py barcode_us.pack barcodes.txt

`apps/mobile/test/foodPipeline/pantryCoverage.test.ts` reads the script and the
schema, so a renamed table or column fails there. The steps are in MM-51's
"Owed by the owner".
