---
id: MM-51
status: in-progress
component: food-database
related: [MM-50, MM-52, MM-55, MM-56, MM-57]
---

# Spike: What the sources contain for the United States, and how big the packs are

## Context
The plan rests on guesses: that the United States slice of Open Food Facts plus USDA Branded Foods is about a million products, and that
it compresses to 30 to 60 MB. Neither has been measured. Pack size decides whether the barcode pack can ship inside the app or must be a
download, and what the first-run experience is.

## Description
Using DuckDB on the real files (the Open Food Facts Parquet export on Hugging Face, about 4.9 million products worldwide; USDA FoodData
Central's Foundation, SR Legacy, FNDDS and Branded downloads), answer:

1. How many Open Food Facts products are sold in the United States, and how many of those have calories, protein, carbohydrate and fat?
2. How many USDA Branded products are there, how many carry a barcode, and how many overlap with Open Food Facts?
3. Where both have a barcode, how often do their macros disagree by more than 10%? Which is right more often, on a hand-checked sample of
   fifty?
4. What share of each source fails the nutrition checks in MM-53?
5. How large is a pack holding name, brand, barcode, serving, and the nutrients in MM-49, as SQLite with a search index, before and after
   compression?
6. How many generic foods are worth shipping in the app, and how large is that pack?
7. Coverage test: of fifty barcodes from a real US pantry, how many are found?

## Acceptance Criteria
```gherkin
Scenario: Numbers, not guesses
  Then this ticket records an answer to each question above, with the query that produced it

Scenario: A decision on the barcode pack
  Then it states whether the US barcode pack ships in the app or is downloaded, and why

Scenario: A decision on conflicts
  Then it states which source wins when both have a barcode and they disagree
```

## Notes
- The Hugging Face dataset page lists the license as both AGPL-3.0 and ODbL. Establish which applies to the data (MM-57) as part of this.
- Planning suggested preferring USDA Branded on conflict (it is label data submitted by manufacturers); the product owner prefers Open Food
  Facts as primary. Question 3 is how to settle it with evidence.

## Findings (measured 2026-10-09; status stays in-progress)
Scripts: `tool/spikes/food_sources/` (README there). Data: USDA FoodData Central branded, foundation and SR Legacy CSV downloads (branded and foundation dated 2025-04-24, SR Legacy 2018-04: **not confirmed to be the newest**), and Open Food Facts' own CSV export from static.openfoodfacts.org (4,535,553 rows, built that day). **Deviation**: the ticket names the Hugging Face Parquet export; it rate-limited this machine (HTTP 429) and the CSV is the same data from the source, with about 5% fewer rows than the Parquet's 4,786,290 (some of that may be lines the CSV reader skipped; not investigated). The nutrition check used here is a SQL copy of MM-53's rules.

1. **Open Food Facts, United States**: 910,135 products (countries tag `en:united-states`), all with a barcode, 849,563 with a valid check digit. **Only about 100,900 have any nutrition values; 98,880 have energy, protein, carbohydrate and fat.** The plan's "about a million" is right for products and wrong for usable products: roughly nine in ten have no nutrition at all.
2. **USDA Branded**: 1,977,398 rows, but **441,179 distinct barcodes** (the file keeps several versions of a product; I kept the newest per barcode). 430,418 distinct valid barcodes. **357,839 barcodes are in both sources** (valid barcodes); 33,740 when both records pass the checks.
3. **Where both have a barcode and complete macros** (37,311 products): 10,153 (27%) disagree on energy by more than 10% (and 10 kcal) or on any of protein, carbohydrate or fat by more than 10% (and 1 g). Of those, 7,346 pass the nutrition checks in both sources, 2,126 pass only in USDA, 456 pass only in Open Food Facts, 225 pass in neither. **A pass on the energy-versus-macros check says a record is consistent with itself, not that it is right**, so this is a proxy. **The fifty-product hand check against real packages has not been done**: `sample50_disagreements.csv` is the sample, waiting for someone with the packages.
4. **Share failing MM-53**: Open Food Facts US: 10.0% valid, 87.3% missing a required value, 1.9% no name, 0.6% energy disagrees with macros, 0.1% macros over 100 g, 0.03% energy over 900. USDA Branded: 86.0% valid, 9.1% missing a value, 3.7% energy disagrees, 1.1% macros over 100 g, 0.1% energy over 900. The "missing a value" share is a gap, not bad data; the others are what the check drops.
5. **Pack size** (the format in MM-55; a pack of every barcode that passes the checks: 457,138 foods, 400,772 of them from USDA and 56,366 only in Open Food Facts; name, brand, barcode, energy, protein, carbohydrate, fat, fiber, sodium, alcohol, search index; **no servings**): **105 MB as SQLite, about 40 MB gzip, about 26 MB xz**. A two-prefix name search took about 16 ms and a barcode lookup about 0.1 ms on this laptop. Serving rows would add to the size and are not counted.
6. **Generic foods** (USDA Foundation and SR Legacy): 7,793 SR Legacy foods and 352 Foundation foods have all four macros (Foundation's file also holds tens of thousands of sub-sample rows with none); **8,088 pass the checks**; as a pack **1.5 MB, about 0.4 MB xz**.
7. **Pantry coverage**: **not done**; it needs fifty barcodes from a real pantry. `pantry_coverage.py` takes the barcodes and a pack and reports how many are found.

## Proposed decisions (the product owner decides; I have not recorded them as decisions)
- **Barcode pack: download, do not bundle.** About 26 to 40 MB for 457,000 foods is too much to add to every install, and it lets the pack update without an app release. **The generic pack (about 0.4 MB) can ship in the app**, so search and manual logging work before any download. This is a recommendation from sizes alone; the first-run experience and mobile-data prompts belong to MM-56.
- **The pack will be mostly USDA data, not Open Food Facts**: 88% of the barcodes. Open Food Facts adds 56,366 barcodes USDA lacks (12%). That bears on attribution and licensing (MM-57): the share-alike database obligation attaches to the Open Food Facts part.
- **Conflict rule: undecided.** The evidence so far: when exactly one of two disagreeing records is internally consistent, it is USDA's 4.7 times as often (2,126 against 456). That favors "the consistent record wins". For the 7,346 where both are consistent and still disagree, nothing here says which is right, and the product owner preferred Open Food Facts as primary. I recommend deciding that case from the fifty-product hand check, and in the meantime marking such foods `checkThis` (MM-153) rather than choosing silently.

## License facts found (for MM-57; not a legal reading)
- The Hugging Face dataset page lists the license tags **agpl-3.0 and odbl** and says nothing more on the visible page; which applies to the data was **not established**. Open Food Facts' own terms of use say the database is under ODbL, individual contents under the Database Contents License, and images under CC BY-SA, that reusers must credit Open Food Facts with a link to openfoodfacts.org, and that derivative works must be shared under the same conditions.
- **USDA's public-domain (CC0) status is not confirmed from anything I could read this session**: the pages I fetched did not state it. The ticket asserts it; check it against USDA's own statement.

