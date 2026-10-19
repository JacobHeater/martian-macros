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

## The owner's next commands

PowerShell, from the repository root:

1. Install the DuckDB command-line tool (https://duckdb.org/install) and
   confirm `duckdb --version` in a plain PowerShell.
2. `.\mm food fetch` (about 0.43 GB Branded, 0.2 GB FNDDS, 0.9 GB Open Food
   Facts, small Foundation and SR Legacy). Files from the older pins are
   downloaded again; `provenance.json` names each file's real download day.
3. List the survey zip before building: `tar -tvf .food_cache\usda_fndds.zip`,
   and `Get-Content .food_cache\usda_fndds\food.csv -TotalCount 3` and the
   same for `food_portion.csv`, to confirm the `survey_fndds_food` data type
   and the columns.
4. `.\mm food build`. It fails if a configured source gave nothing. Read
   `.food_cache\packs\report.txt` (every source listed; the duplicate and
   conflict counts) and `coverage.txt` (per pack and per source; a
   reference source's nutrient marked LOW means an id or a unit slipped).
5. Spot-check three FNDDS foods' names and servings in `generic.pack` (the
   chair used node:sqlite for the measurements above).
6. `.\mm food package --base-url <the release's download URL>`; publish the
   release in `martian-macros-food-data` with `report.txt`, `coverage.txt`
   and the FNDDS attribution line ("U.S. Department of Agriculture,
   Agricultural Research Service. 2024. USDA Food and Nutrient Database for
   Dietary Studies 2021-2023."); rewrite the coverage table in
   `docs/food-grades.md` and MM-51's size table from the files; `.\mm check`.

Later formats: a category column (fruit, vegetable, legume, drink, oil,
cheese), an added-sugars column (USDA nutrient 1235, Open Food Facts
`added-sugars_100g`) that would retire most of the grade's sugars waiver, and
the FNDDS food code.
