# Food source spike (MM-51)

Scripts that produced the numbers recorded in
`requirements/food-database/SPIKE.us-food-data-sources-and-pack-size.MM-51.md`.
They are a one-off measurement, not part of the build. They need Python with
`duckdb` (`pip install duckdb`), and about 5 GB of disk.

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

The nutrition check in `3_compare_sources.py` is a SQL copy of
`checkNutrition` (MM-53), so it can drift from the Dart one; the pipeline must
call the Dart rules.
