# WS-04: Food data pack

**Order** 4 · **Group** A (start now) · **State** partially built · **Risk** high

## Summary
Build the offline United States food pack (Open Food Facts and USDA FoodData
Central, validated and merged) and the reader the app queries, as new packages
that touch nothing that exists.

## Why this is a workstream, and why it is this early
Food logging today is typing macros by hand. Search and barcode scanning are
the features a tracking app is judged on in its first minute, and both need a
food database that does not exist. Building it is the longest single piece of
work in the product and the least coupled to the rest:

- it is an offline pipeline (DuckDB over Parquet, producing SQLite) that runs
  on a developer machine, not in the app;
- its output is read through one small API;
- it has open questions that only real data can answer (pack size, which
  source wins on conflict, how much of the crowd data survives validation).

Long lead time and no dependencies mean it should start in the first group,
even though its consumer (WS-08) comes later.

## Capability it unlocks
Search by name, lookup by barcode, raw-and-cooked pairs, per-food nutrient
detail, densities for hand portions, and a trust tier for every food.

## Included
- A spike on sources, licensing constraints, conflict rule and pack size.
- Nutrition validation rules as one pure function, used by the pipeline and
  by the app's entry screens.
- Barcode normalization to GTIN-14.
- The pack format (versioned), a reader with full-text search and barcode
  lookup, and a small fixture pack for tests.
- The pipeline itself, including provenance and trust tiers.
- Licensing and attribution review.
- Download and update of packs in the app.

## Excluded or deferred
- Everything the user sees: the search screen, the scanner, the amount step,
  the display of source and tier. WS-08.
- Live lookup against the Open Food Facts API and contributing corrections
  back: WS-08 step 8.
- Micronutrients beyond what the detail-level ticket lists: a recorded
  non-goal for now.

## Prerequisites
None.

## Enables
WS-08 steps 4 to 8. WS-13, which cannot release without a licensed,
downloadable pack.

## Packages and surfaces
- `tools/food_pipeline/` (new; DuckDB, not shipped in the app)
- `packages/food_catalog/` (new; pure Dart reader)
- `packages/domain/` (the validation function; today's `macrosMatchEnergy`
  in `food_entry.dart` is its starting point)
- static hosting for packs (outside the repository)

## Risks
- **Licensing.** Open Food Facts is under the Open Database License. A merged
  pack is likely a derivative database and must be published under the same
  license with attribution. This is settled by the licensing ticket, and it
  constrains the pipeline's design (keep sources separable).
- **Pack size on a phone.** Unknown until the spike. It decides whether the
  pack ships with the app, downloads on first run, or is split.
- **Data quality.** The validation rules drop bad entries outright. If they
  drop too much, coverage suffers; too little, and one bad entry in a daily
  log corrupts a month of estimates.
- **The pipeline cannot run in CI cheaply.** The source files are many
  gigabytes. Test the pipeline's logic on small fixtures; run the full build
  by hand or on a schedule.
- **A second SQLite database in the app.** The pack is read-only and separate
  from the user's database. Keep it separate: it has its own format version
  and must never be included in a backup.

## Sequence
1. **Sources and pack size spike (MM-51).** M2. It includes the open
   question of which source wins when two disagree about a barcode.
2. **Validation rules and barcode normalization (MM-53, MM-54).** M2. Pure
   functions with tests; no data needed.
3. **Pack format and reader, with a fixture pack (MM-55).** M2. This is the
   contract WS-08 builds against. Include every field later tickets need:
   preparation state and raw/cooked pair links, density, fiber, sodium,
   alcohol, source, trust tier and its reason.
4. **Pipeline and trust tiers (MM-52, MM-153).** M2. The tier is computed
   here; its display is WS-08's.
5. **Licensing and attribution (MM-57).** M2. Before any pack is published.
6. **Download and update (MM-56).** M2.

## Done enough to unblock others
MM-55 is done: the reader API is stable and a fixture pack of a few hundred
foods, with barcodes and at least one raw/cooked pair, is checked in.

## Do not start before this
WS-08 steps 4 onward. Nothing else waits on it.

## Parallel with
Everything. Its only contact with existing code is the validation function in
`packages/domain`, which WS-08 also calls; define it in step 2 and both use it.

## Requirement sources
- Built: MM-53 (nutrition checks), MM-54 (barcode normalization), MM-52 (the pipeline).
- In progress: MM-51 (spike: the 50-product hand check and the pantry test need a person), MM-55 (format and reader built;
  real packs published to the data repository), MM-56 (download, resume, checksum, status strip and cancel built and tried on the
  emulator; the bundled generic pack, the onboarding offer, backup exclusion and slow-network testing are open), MM-153 (source and
  tier wording, ranking and the rounded-to-zero note built; the amount-step display now lives with search; the pipeline's
  near-tolerance, missing-field and age rules, and "Fix this food", are open).
- Remaining: MM-57 (licensing review by a qualified person; the packs are already public).
  Epic: MM-50.

## Notes for whoever builds it
- Design the pack schema in step 3 from the tickets that will *read* it, not
  only from the pipeline ticket. The fields listed in step 3 above come from
  six different tickets, most of them in WS-08.
- The fixture pack is a test asset and a development tool: WS-08 can build
  and demo search and scanning against it long before the real pack exists.
- The pack download is one of the few network requests the app makes. It
  must appear in the privacy documents (WS-13), reveal nothing but an IP
  address, verify a checksum, and swap in only when complete.
- The architecture document names the planned locations as
  `tools/food_pipeline` and `packages/food_catalog`. The existing task runner
  lives in `tool/` (singular). Decide once whether the pipeline goes under
  `tool/` or a new `tools/`, and add it to the workspace file accordingly.
- No food is ever described as "verified". The tiers say what is true:
  reference, label, check this.
