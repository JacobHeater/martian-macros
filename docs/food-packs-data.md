# Food packs with fuller data (MM-381, MM-383, MM-409)

The spike's report, 2026-10-18, from the panel's integrations and
micronutrients roles (`docs/agent-runs/mm380-proprietary-grade/findings/`,
`docs/agent-runs/mm383-sources-and-downloads/findings/`) and the chair's
measurements of the published packs. The product owner asked: "Is it time to
explore alternate food packs that are more robust in their data?" The answer
is yes for one source, and the rebuild is the owner's to run.

## What today's sources carry

The packs published 2026-10-09 are format 1: calories, the macros, fiber,
sodium and alcohol per 100 g. The pipeline has carried thirteen more
nutrients since MM-307 (sugars, saturated fat, cholesterol, potassium,
calcium, iron, magnesium, zinc, vitamins A, C, D, B12 and folate) in format
2, but no format 2 pack has been built: the build needs the DuckDB
command-line tool and the sources are large downloads.

| Source | What it is | Of the thirteen, expected (documentation, not measured) |
|---|---|---|
| USDA Foundation Foods (344 foods in the generic pack) | analytically derived values, sample level, released April and October | partial: "does not provide data on all nutrients"; newer foods analysed for the nutrients important in that food; vitamin D rare |
| USDA SR Legacy (7,744) | analyses, calculations and published literature; final release April 2018 | near-complete profiles for almost every food; vitamin D and B12 the ones most often absent on older entries |
| USDA Branded (366,085 in the barcode pack) | the maker's label through the GS1 data pool; monthly updates | post-2020 labels: sugars, saturated fat, cholesterol, sodium, fiber, vitamin D, calcium, iron, potassium (nine); the rest only when added, claimed or volunteered. Pre-2020 records (the median, January 2020): vitamin C, calcium, iron, vitamin A in IU (refused by MM-307) |
| Open Food Facts, US (90,106) | volunteer label transcription, nightly export | sugars, saturated fat and sodium commonly; the rest rarely; vitamin A and folate refused (MM-307) |

Measured on the published packs (format 1) against the grade's needs
(MM-380: calories, the macros, fiber and sodium required):

| Pack | Foods | Gradeable today | Under 10 kcal per 100 g | Fiber stated as 0 |
|---|---|---|---|---|
| `generic` | 8,088 | 7,270 (89.9%) | 99 (1.2%) | 3,370 (41.7%; analysed zeros) |
| `barcode_us` | 456,191 | 377,606 (82.8%) | 23,065 (5.1%) | 138,807 (30.4%) |

## The candidates

- **USDA FNDDS 2021-2023 (survey foods): added** (MM-383). About 5,400 foods
  and beverages as eaten (mixed dishes, restaurant foods), every one of the
  thirteen nutrients, compiled by recipe mainly from Foundation and SR
  Legacy with Agriculture Handbook 102 yields and the Release 6 retention
  factors; the same FDC CSV layout and nutrient ids, so it joins the generic
  branch with no new SQL shape; public domain (CC0 1.0, as every FDC data
  type). Its foods are `reference` with their own sentence and the
  reliability base 80, one step below the analysed sources. Caveats: FNDDS
  `fdc_id`s are reassigned each two-year cycle (the 8-digit food code is the
  stable identity, a column for a later format); its names carry survey
  vocabulary ("NFS", "NS as to …"), kept as the source states them; its
  portions put the amount in the description and may carry a numeric
  portion code in the modifier, which the extract drops; the survey zip
  (200 MB) may carry rows of other data types, so the extract reads only its
  own foods' rows.
- **FDC Experimental Foods: declined.** USDA's own words: foods "produced,
  acquired, or studied under unique conditions", data that "may not be
  appropriate as a reference for the consumer, diet planning, or dietary
  guidance"; no download offered.
- **The Canadian Nutrient File 2026: declined for a US launch.** Open
  (Open Government Licence, Canada), fresh (released 2026-05-19), 5,993
  foods; but Canadian fortification differs, much of it descends from USDA
  SR, it has no barcodes, and it needs a second schema mapping and a third
  licence line. Revisit for a Canadian launch. The UK and Australian tables
  likewise.

## Liquids, measured (H-06, 2026-10-27)

The food-logging plan's H-06 check, run on the dev Mac with DuckDB 1.5.6
over the 2026-10-19 fetch cache. Both sources state liquids per 100 mL in
their per-100 columns, and both hold the serving's millilitres as a plain
number.

USDA Branded, `market_country = 'United States'` (1,986,471 rows), by
`serving_size_unit`:

| Unit | Rows | Share |
|---|---|---|
| `g` | 1,506,308 | 75.8% |
| `ml` | 240,881 | 12.1% |
| `GRM` | 181,257 | 9.1% |
| `MLT` | 27,414 | 1.4% |
| empty | 18,992 | 1.0% |
| `mg`, `IU`, `gm`, `mc` | 11,619 | 0.6% |

The mL rows are the drinks: juice 36,853, soda 28,887, water 23,795, milk
19,956, other drinks 16,442, then dressings, oils, tea, plant milks and
syrups. `extract.sql` keeps a serving only when the unit is `g` or `GRM`,
so every mL row (268,295, 13.5%) reaches the pack with no serving at all,
and the 344 `gm` rows are dropped with them. Their per-100 figures are per
100 mL: Coca-Cola (`MLT`, 355) is 39 to 42 kcal, the label's 140 kcal per
355 mL is 39.4; 2% milk (`MLT`, 240, "1 cup") is 50 to 55, the label's 130
per 240 mL is 54; Tropicana Pure Premium (`MLT`, 240, "8 fl oz") is 46,
the label's 110 per 240 mL is 45.8.

Open Food Facts, tagged United States with a name and kcal (193,713
products): 152,724 state a serving; 12,311 (8.1%) of those name it in mL,
fl oz, L or cL, 2,329 name both a weight and a volume, and 16,099 name
neither. Of 9,982 servings stated in mL alone, `serving_quantity` equals
the mL number in 9,951 (the six that differ are typos). The per-100 figures
are per 100 mL: Coca-Cola 0049000028904 ("355ml") is 39.4, 0049000004632
is 42.3; 2% milks are 50 to 54; Tropicana 100% orange juice is 46.
`extract.sql` already emits these servings, as `g: 355`, which is right
only because a soft drink's density is near 1.

So for C2's liquids half: Branded needs the `ml`/`MLT` branch (serving in
mL, per-100 per 100 mL); Open Food Facts needs the serving's mL recognised
from `serving_size` so it is stored as millilitres, not grams. The queries
are not in the repository; they read `branded_food.csv`, `food_nutrient.csv`
(nutrient 1008) and `off.csv.gz` with the same `read_csv` options as the
extract, and the mL match is `(?i)(\bml\b|millilit|fl\.? ?oz|\bl\b|liter|litre|\bcl\b)`.

## A wider Open Food Facts cut, measured (MM-409, 2026-10-19)

The owner asked for more food in search. The export was read whole with
DuckDB 1.5.6 (`strict_mode = false`; the 2026-10-09 read had skipped about
250,000 rows): 4,848,211 rows.

| Cut | Products | With a name, energy and the three macros |
|---|---|---|
| Tagged United States (today's rule) | 987,217 | 184,356 (the MM-51 spike counted 98,880 under the skipping parser) |
| Tagged United States, energy only in kJ or the name only in another field | | +6: not worth a rule |
| GS1 United States or Canada prefix, not tagged United States or Canada | 195,691 | 68,358, but 24,614 of them tagged France, 7,096 Ireland, 6,547 United Kingdom, 5,255 Italy, 4,025 Spain; only 256 carry no country at all. The prefix says who owns the company prefix, not where the product is sold: **declined** |
| Tagged Canada and not United States | | 110,340, names often French, the fortification Canada's: **declined for a US launch**, a candidate for a Canadian one, by barcode lookup first |
| Any country | | 2,431,617: a world pack would be five times the US one, mostly in other languages |

So the widening the data supports is the whole US-tagged set, read without
skipping, plus FNDDS in the generic pack and the refreshed USDA Branded
release. Restaurant menus stay the gap no open source fills.

## Format 5: liquids per 100 mL (MM-650, 2026-10-27)

The build now writes format 5: each food has a `basis` ('g' or 'ml') and a
serving may be a volume (`milliliters`), a weight (`grams`) or both. A USDA
Branded row whose serving unit is `ml` or `MLT` is per 100 mL with its serving
in millilitres (268,295 US rows, 13.5%, had no serving before); `gm` joins the
gram units (344 rows, dropped before). An Open Food Facts product whose
serving text states a number of millilitres is per 100 mL with that serving in
millilitres, or fluid ounces the export converts to them (about 14,000 US
products, written as grams before; a text whose last unit is grams, "240 ml
(245 g)", stays grams). The nutrition rule and the micronutrient ceilings let a
per-100 mL food weigh up to 150 g (honey). The app reads format 4
packs as before, per 100 g with servings by weight, so nothing changes for a
person until the packs are rebuilt.

**Built 2026-10-27** on the dev Mac from main after PR #342 (the cache of
2026-10-19; no data was fetched): `./mm food fetch`, `./mm food build`,
`./mm food package --base-url https://github.com/JacobHeater/martian-macros-food-data/releases/download/2026-10-27/`,
then `gh release create 2026-10-27 … --latest` with the two packs,
`manifest.json`, and `report.txt` and `coverage.txt` from `.food_cache/packs/`
(the publish folder keeps older copies of those two), and both packs pulled
from Settings > Food database. The fetch step is needed even with a full
cache: it reuses every file and only restamps `builtOn` in `provenance.json`,
which becomes the pack version, and the Food database screen offers a pack
only when its version differs from the installed one. A rebuild on an
unchanged cache without it is named 2026-10-25 again and never offered (the
first build of this day was). PR #338 had committed two `node_modules`
symlinks that broke the build on the main checkout; PR #342 removed them.

| Pack | Foods | Per 100 mL | gzip |
|---|---|---|---|
| `generic` | 13,285 | 0 | 1.6 MB |
| `barcode_us` | 521,079 | 61,782 | 58.2 MB |

534,364 foods, 91 more than 2026-10-25: the `gm` rows. Groups as on
2026-10-25 except spreads and sauces 42,897, fats and oils 5,905, drinks
39,549, nuts and seeds 2,793.

The panel's IN-1 figures, computed with DuckDB over the extract among the
latest version of each barcode per source, counting rows that pass the
checks before the energy rule:

| Source | Basis | Checked | Energy disagrees | Rate |
|---|---|---|---|---|
| Open Food Facts | per 100 g | 168,977 | 9,142 | 5.4% |
| Open Food Facts | per 100 mL | 13,286 | 356 | 2.7% |
| USDA Branded | per 100 g | 384,880 | 18,328 | 4.8% |
| USDA Branded | per 100 mL | 58,909 | 1,605 | 2.7% |

A per-100 mL row fails the energy rule about half as often as a per-100 g
row, on both sources. Rows per 100 mL whose household text states grams: 29
of 60,676 Branded `ml`/`MLT` rows and 119 of 69,337 Open Food Facts rows.
Most are liquids with their weight in parentheses ("250 ml (250 g)", "14 ml
(14 G)") or dressings; a few are solids the source serves in millilitres
("1/2 CUP (130g)" for candies, Branded). Two liquid sweeteners' "0.25 ml
(0.3 g)" came out as 0.3 mL: below 1, the ±0.5 tolerance against
`serving_quantity` accepts a gram quantity as millilitres. Open: tighten that
tolerance for quantities under 1; whether the pack version should be the
build day rather than the fetch day.

## The build

Done in MM-383: the FNDDS source entry and the refreshed Foundation and
Branded pins (the 2026-04-30 releases); the fetch cache now re-downloads a
file whose pin moved and records the day each file arrived (MM-388); the
third extract branch; an unknown source fails the build; one name one food
among generic foods; the reliability policy for a shared barcode; the
coverage file per pack and per source with the grade-readiness rows; the
build fails when a configured source reads or writes nothing.

Still to measure at the first build: every per-nutrient share per source,
the `lostDuplicateName` and `lostConflict` counts, how many duplicate
winners stated fewer of the grade's inputs than their loser, the FNDDS
portion text, the Open Food Facts micronutrient shares, and the pack size
with thirteen integer columns over 464k rows.

## The build of 2026-10-25 (done, release published)

Format 4, the first with food groups (MM-616), built on the dev Mac from main after PR #313: `./mm food fetch`,
`./mm food build`, `./mm food package --base-url https://github.com/JacobHeater/martian-macros-food-data/releases/download/2026-10-25/`,
then `gh release create 2026-10-25 … --latest` with the two packs, `manifest.json`, and the build's own `report.txt` and
`coverage.txt` (the publish folder still held 2026-10-19's copies of those two; the fresh ones are in `.food_cache/packs/`).

| Pack | Foods | gzip |
|---|---|---|
| `generic` | 13,285 | 1.6 MB |
| `barcode_us` | 520,988 | 57.1 MB |

The same 534,273 foods as 2026-10-19. Groups:
- 387,814 grouped: snacks and sweets 132,960; spreads and sauces 42,820; prepared meals 40,812; drinks 39,539; dairy and
  yogurt 31,432; breads and grains 26,004; meat and poultry 22,396; vegetables 13,582; breakfast cereals 9,822; fish 8,155;
  fats and oils 5,902; fruit 5,691; legumes 4,869; nuts and seeds 2,792; eggs 1,038.
- 146,459 without a group: Open Food Facts products, which carry no category yet, and the categories reviewed as no group.
- 0 unmapped source categories.

The latest manifest serves format 4. The owner pulled both packs from Settings > Food database on 2026-10-25.

## The build of 2026-10-19 (done, release published)

Run on the owner's Mac (zsh, DuckDB 1.5.6) after three fixes to the
extract (MM-409): `./mm food fetch` (4.6 GB cached), `./mm food build`,
`./mm food package --base-url https://github.com/JacobHeater/martian-macros-food-data/releases/download/2026-10-19/`
(the trailing slash keeps the tag in the URLs), then
`gh release create 2026-10-19 … --latest` with the two packs, `manifest.json`,
`report.txt` and `coverage.txt`. The app's manifest URL
(`releases/latest/download/manifest.json`) serves it.

| Pack | Foods | By source | gzip |
|---|---|---|---|
| `generic` | 13,285 | SR Legacy 7,700, FNDDS 5,315, Foundation 270 | 1.5 MB |
| `barcode_us` | 520,988 | USDA Branded 399,950, Open Food Facts 121,038 | 53.8 MB |

Measured at the build: FNDDS states all thirteen nutrients for every food
(5,129 of 5,315 fully gradeable); `lostDuplicateName` 242 (101 of them FNDDS
names SR Legacy already had), `lostConflict` 42,656 (Open Food Facts records
beaten by USDA Branded on a shared barcode under the reliability policy);
51 duplicate winners stated fewer of the grade's inputs than their loser;
FNDDS portion text reads as "1 item, any size", "1 cup"; Open Food Facts
states potassium for 52%, calcium 52%, vitamin D 38% and vitamin C 14% of its
foods (`coverage.txt`). The coverage table in `docs/food-grades.md` and
MM-51's sizes are rewritten from the files.

Later formats: a category column (fruit, vegetable, legume, drink, oil,
cheese), an added-sugars column (USDA nutrient 1235, Open Food Facts
`added-sugars_100g`) that would retire most of the grade's sugars waiver, and
the FNDDS food code.
