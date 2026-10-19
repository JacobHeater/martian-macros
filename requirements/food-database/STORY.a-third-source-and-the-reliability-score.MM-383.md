---
id: MM-383
status: done
component: food-database
related: [MM-381, MM-380, MM-382, MM-384, MM-388, MM-42, MM-43, MM-51, MM-52, MM-53, MM-55, MM-57, MM-153, MM-307]
---

# Story: A third food source, USDA FNDDS, and the app's reliability score ordering search and scans

## Context
The packs are built from USDA Foundation, SR Legacy and Branded foods and Open Food Facts (MM-51, MM-52). MM-381's spike
(`docs/agent-runs/mm380-proprietary-grade/findings/integrations.md`, `micronutrients.md`) found the USDA pins a year behind,
recommended USDA's Food and Nutrient Database for Dietary Studies (FNDDS 2021-2023: about 5,400 foods as eaten, every one of
the thirteen MM-307 nutrients, public domain) as a third generic source, and declined FDC Experimental Foods and the Canadian
Nutrient File for a US launch. Search listed reference foods before label foods before "check this" ones, then the better
text match (MM-42, MM-153); a barcode was looked up pack by pack and the first hit won; a barcode two sources both carried
went to the fresher record at build time, Open Food Facts on a tie (MM-51).

## Decisions
The product owner's (2026-10-18, by message, no questions): "a mandatory part of the requirements will be to add additional food
data sources"; the ranking of barcode scanning on source reliability is left to the author; "use the panel of experts to add an
additional food data source, and order the search in terms of the data source reliability, which is a score you will derive
entirely"; rely on the panel.

Choices I made without asking (say if any is wrong), from the panel's integrations, product and React findings
(`docs/agent-runs/mm383-sources-and-downloads/`):
- **The source is FNDDS 2021-2023**, as the FDC CSV download (`FoodData_Central_survey_food_csv_2024-10-31.zip`), joining the
  generic branch of `extract.sql` with the same nutrient ids under `data_type = 'survey_fndds_food'`; its nutrient and portion
  rows are read only for its own foods (the survey zip may carry other types, IN-14); its portions drop a bare numeric
  portion code and the "Quantity not specified" portion (IN-13). Its foods are `reference` with their own sentence
  ("Compiled by USDA from analysed foods and recipes for the national dietary survey."). Names stay as the source states
  them ("NFS", "NS as to …", IN-21). An unknown source id now fails the build instead of passing as Open Food Facts data
  (IN-3). The Foundation and Branded pins move to the 2026-04-30 releases (IN-1), and the fetch cache now re-downloads a
  file whose pin moved (MM-388).
- **Generic foods with one name keep one record** (IN-4, IN-15, P-6): candidates whose names match after trimming,
  lower-casing and collapsing spaces are one food. The record stating both fiber and sodium (the grade's floor) wins; then
  the source with the higher reliability base; then the source named first in the base table, then the lower source id,
  so the result never depends on the order read. The others are dropped as `lostDuplicateName`, before the raw and cooked
  links are made, so the report still reconciles and no pair points at a dropped record. The report counts how often the
  winner stated fewer of the grade's inputs than its loser.
- **The reliability score is the app's own**, 0 to 100, from the source and what the record states. It is **never shown
  beside a food** (MM-153): search rows, the amount step and a scan result show the source in words and the tier mark.
  The figures live only in the evidence register, as every figure does, under "How are foods ranked?" (P-3).

  | Source | Base | What it is |
  |---|---|---|
  | USDA Foundation | 95 | analytically derived values, sample level, current |
  | USDA SR Legacy | 90 | analyses, calculations and published literature, final April 2018 |
  | USDA FNDDS | 80 | compiled by recipe mainly from Foundation and SR Legacy for the national dietary survey, with some ingredient values from other sources; one step from measurement |
  | USDA Branded | 65 | the maker's declaration through the GS1 data pool, rounded and tolerated by 21 CFR 101.9, median record date January 2020, submitted not verified |
  | Open Food Facts | 40 | a volunteer's transcription, unchecked; "check this" as the pipeline marks it today (MM-153's finer tiering is not built, P-12) |
  | any other | by tier: reference 85, label 60, check this 35 | the fixture pack and a future source |

  Then −15 when the record carries the disagreement mark (its tier reason is the one sentence the pipeline writes when
  another source's record for the barcode differed by more than 10%; it applies to every source, IN-17, P-4); +3 when it
  states both fiber and sodium; +2 when it states both sugars and saturated fat. Clamped to 0 to 100. The modifiers
  reward completeness, not accuracy, and never cross a source: **the order refines the tiers and never crosses them**
  (every reference food scores above every label food, and every label food above every "check this" food), so MM-42's
  generic-first and MM-153's reference-first stand (P-2). Each figure has an evidence row (judgement).
- **Search lists by reliability, then by the text match**: the score descending, ties by the match score. A person's own
  and recent foods still list above the packs' (MM-42). Within one pack the top twenty by text match are fetched, as
  before, then ordered; a branded food whose name twenty generic foods share is reached by scanning it (MM-43) or by
  Saved until MM-42's paging is built (P-2).
- **Which record a scan shows is decided when the pack is built** (P-1, IN-16), because the pack keeps one record per
  barcode: the build's conflict policy is now the reliability score (`ReliabilityPolicy`, the default `--prefer
  reliability`): the record from the source with the higher base is written, so the manufacturer's label (USDA Branded)
  is written over Open Food Facts; two records of one base fall to recency; a difference of more than 10% still marks the
  winner "check this". This supersedes MM-51's recency rule; its result table (Open Food Facts winning all 33,736 shared
  barcodes) is re-measured at the next build, and MM-153's "One barcode, two sources" scenario now holds. The app's
  `byBarcode` chooses by the score across installed packs, which matters only when two packs carry one barcode (none
  published does today).
- **The pack's terms state USDA's CC0 1.0 and its requested citation** (IN-6, IN-19); the Open Food Facts reading stays
  with MM-57.
- **`coverage.txt` counts per pack and per source**, with the grade-readiness rows the publish gate needs (IN-5): fiber,
  sodium, both, sugars, saturated fat, each of the ten vitamins and minerals, at least four of the ten, all ten, and
  "fully gradeable" (those, and 10 kcal or more, and alcohol at most 1.2 g). A reference source's nutrient under 90% is
  marked LOW (IN-12). **The build fails when a configured source reads or writes nothing** (IN-12): a wrong file name or
  data type cannot pass silently.
- **Not built tonight**: a real build (no DuckDB on this machine, sources not downloaded); the owner runs the commands in
  `docs/food-packs-data.md`, reads `report.txt` and `coverage.txt`, spot-checks three FNDDS foods' servings and names,
  and publishes the release. FDC Experimental Foods and the Canadian Nutrient File are declined (IN-7, IN-8). A category
  column, an added-sugars column and the FNDDS food code are later formats. Paging search results is MM-42's.

## Description
`tool/src/foodSource.ts` (the FNDDS source, the refreshed pins), `tool/src/food.ts` (the versioned cache, `--expect`), `extract.sql`
(a third generic branch with its own portions), `packEntryFor` (the FNDDS tier and sentence, a thrown error for an unknown
source), `GenericPrecedencePolicy` and the `lostDuplicateName` drop reason in `PackBuilder`, `ReliabilityPolicy` as the build's
default, `BuildReport` with expected sources, the missing-source failure and the coverage rows per pack and source,
`packTerms`; `SourceReliabilityRule`, `sourceReliability` and the shared `disagreementReason` in the catalog,
`FoodCatalog.search` ordering by the score and `byBarcode` choosing by it, `foodSourceLabel` for FNDDS ("USDA, survey foods as
eaten"); the register's "How are foods ranked?" entry; the Food database screen's credit naming the USDA data types.

## Acceptance Criteria
```gherkin
Scenario: FNDDS foods are reference foods
  Given a candidate from usda_fndds that passes the checks
  When the packs are built
  Then it is written to the generic pack as a reference food with the FNDDS sentence

Scenario: An unknown source fails the build
  Given a candidate from a source the pipeline does not know
  Then the build throws, naming the source

Scenario: One name, one food
  Given "Carrots, raw" from usda_sr_legacy stating fiber and sodium, from usda_foundation stating neither, and from usda_fndds stating both
  Then the SR Legacy record is written and the others are dropped as lostDuplicateName, whatever the order read, and the report reconciles

Scenario: A dropped duplicate is never a pair's target
  Given a raw food from two sources and its cooked state from one
  Then the cooked food points at the raw record that was written

Scenario: The score
  Given a Foundation food stating fiber and sodium
  Then its reliability is 98; a Branded food marked by a disagreement, stating fiber, sodium, sugars and saturated fat, is 55; an Open Food Facts food stating nothing beyond the macros is 40, and one marked by a disagreement is 25

Scenario: The order never crosses a tier
  Then the lowest reference score exceeds the highest label score, which exceeds the highest "check this" score, whatever the modifiers

Scenario: Sources within one tier, then the text match
  Given an Open Food Facts "Oats" that matches the query more tightly, an SR Legacy "Oats, rolled, dry", an SR Legacy "Oats, steel cut" matching less tightly, and a Foundation "Oats, whole grain"
  When "oats" is searched
  Then the order is Foundation, SR Legacy rolled, SR Legacy steel cut, then the rest by their scores

Scenario: Marked for a disagreement
  Given a USDA Branded record marked "check this" for a disagreement and an Open Food Facts record not so marked
  Then the Branded record lists first

Scenario: A shared barcode at build time
  Given a barcode carried by an Open Food Facts record and a USDA Branded record
  When the packs are built
  Then the Branded record is written and the Open Food Facts one dropped as lostConflict, and a difference of more than 10% marks the winner "check this"

Scenario: A scan across two packs
  Given two installed packs each carrying a record for one barcode
  When it is scanned
  Then the record with the higher score is shown, the tie going to the pack listed first

Scenario: A source that gives nothing
  Given the build expects usda_fndds and no candidate comes from it
  Then the report marks it missing and the build fails

Scenario: Coverage per source
  When a pack is built
  Then coverage.txt lists, for each pack and each source, how many foods state fiber, sodium, both, sugars, saturated fat, each vitamin and mineral, at least four of the ten, all ten, and are fully gradeable, and marks a reference source's nutrient under 90% LOW

Scenario: Never beside a food
  When a search row, the amount step or a scan result is drawn
  Then the source is in words and the tier is the mark, and no screen module reads the score

Scenario: The register answers "How are foods ranked?"
  Then the evidence register has that question, its answer gives the order in words, and every figure of SourceReliabilityRule has a row it names
```

## UI/UX
No new control and no screen state changes: the search screens draw the same rows in a different order, proved by tests
over packs of several sources (the fixture pack is one source, so no story can show the blocks, P-9). The credit line on
the Food database screen names the USDA data types (FoodDatabase in `Settings.stories.tsx`).

## Progress
- Built 2026-10-18. Tests: `test/foodPipeline/thirdSource.test.ts` (every pipeline scenario), `test/foodCatalog/sourceReliability.test.ts`
  (the scores, the tier bands, the search order, the scan across packs, no screen reads the score), `tool/test/foodFetch.test.ts`
  (MM-388), the parity test compares the pack headers without the terms, which are the app's current words.
- Evidence register: "How are foods ranked?" with `sourceReliability` and `SourceReliabilityRule.*`.
- The offer card's purpose line is keyed by pack id (`AvailablePackCard.tsx`): a pack published under a new id needs its line.
- Not done: a real build and publish (the owner's, `docs/food-packs-data.md`); MM-51's result table re-measured on the new
  policy; the fifty-package hand check (MM-51) that would settle freshness against provenance.

## Built and published (2026-10-19)
The build ran on the owner's Mac after MM-409's three fixes to the extract, and release 2026-10-19 of martian-macros-food-data is live with FNDDS in `generic` (5,315 of 5,432 foods written; 101 lost to an SR Legacy name, 13 to the energy check) and the measurements `docs/food-packs-data.md` lists.
