# Food pipeline (MM-52)

Builds the offline food packs from the open data sources. A developer tool: it
runs on a development machine or in CI, never on a phone, and nothing here is
shipped in the app.

```
./mm food fetch                 # download the sources into .food_cache/ (reused if present)
./mm food build [--prefer off]  # extract with DuckDB, then write the packs
```

`build` needs the [DuckDB command-line tool](https://duckdb.org/install) on
`PATH`. It writes `generic.pack`, `barcode_us.pack` and `report.txt` into
`.food_cache/packs/`. Neither folder is committed.

## How it is split

1. `sql/extract.sql` (DuckDB) reads the source files and maps each onto one
   schema, with no judgement: `candidates_barcode.csv` and
   `candidates_generic.csv`.
2. `lib/` (Dart) does everything that has a rule: the nutrition checks and the
   barcode normalization are `checkNutrition` and `normalizeBarcode` from
   `mm_domain`, the same code the app uses (so there is one implementation);
   `PackBuilder` keeps the newest version of a product in a source, resolves a
   barcode two sources share with a `ConflictPolicy`, and counts every entry
   read as written or dropped with one reason. `FoodPackWriter` (from
   `mm_food_catalog`) writes the packs.

The build reads no clock and no random numbers: the date in a pack's header is
the download date `fetch` recorded in `provenance.json`, and the output is
ordered by barcode (or name). The same sources give byte-identical packs.

## Decisions still open

- **Which source wins a barcode both have** is the product owner's call (see
  MM-51). `--prefer` picks it; the default is `off`, the owner's stated
  preference. Where the two differ by more than 10%, the food is marked
  `checkThis` whichever wins.
- **The trust tiers** are provisional until MM-153: USDA analysed foods are
  `reference`, USDA branded data `label`, Open Food Facts data `checkThis`.
- **The license text in the pack header** is provisional until MM-57 has been
  read by a qualified person. Do not publish a pack before then.
