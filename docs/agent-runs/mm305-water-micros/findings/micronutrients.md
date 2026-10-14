# Review: micronutrients

Reviewer: micronutrients role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm305-water-micros`; baseline `14aa735` plus the working tree. Saved by the chair, condensed.

## Scope and traceability
Read MM-305, MM-306, MM-307, MM-310, MM-311; the seven files of `domain/food/micros/`,
`food/MicrosPanel.tsx`, `ui/MmNutrientRow.tsx`, `format/nutrientAmount.ts`, `domain/CoachingPolicy.ts`,
`domain/Profile.ts` (`ageOn`), `foodPipeline/plausibleMicros.ts` (grep), `foodPipeline/node/extract.sql`
(parts), `Food.stories.tsx`; captures micros light and martian-420. No hashes.

## Existing facts versus proposals
Every RDA/AI and band in `referenceAmount.ts` matches the NASEM tables (via Health Canada): potassium
3,400/2,600; calcium 1,000, 1,200 for women over 50 and men over 70; iron 8, 18 for women 19-50; magnesium
400/420 and 310/320 split at 30/31; zinc 11/8; vitamin A 900/700 µg RAE; C 90/75; D 15, 20 over 70; B12
2.4; folate 400 µg DFE. Band edges are right since `ageOn` returns completed years. Sodium CDRR 2,300
confirmed, no UL. Vitamin D IU ÷ 40 correct. USDA ids in `extract.sql` match MM-307. Coverage counts
entries; a stated 0 counts as stated. `over()` uses the known lower bound, sound. No test covers
`referenceAmount`, `ReferenceWithheld`, `microsDayOf`, `MicronutrientTotal` or `maxPer100g`.

## Audit coverage
Mode change. Not inspected: Settings and water UI, MM-308/309/312/313/314, `PackMicronutrient`,
`candidateFromRow`, the label parser.

## Novice mobile experience (when UX/product design is assigned)
Not addressed.

## Findings
- **MN-1 (should-fix).** Tests missing: a table-driven reference test at ages 18, 19, 30, 31, 50, 51, 70,
  71 for both sexes; withholding precedence; a food stating 0 against one stating nothing.
- **MN-2 (should-fix).** Open Food Facts vitamin A and folate are not µg RAE or µg DFE (OFF's taxonomy:
  vitamin A `iu_value 0.3`, `dv_value 1500`; folates no DFE). MM-307 refuses the same conversions from
  USDA. Drop OFF vitamin A and folate, or keep them only when provably post-2016 µg.
- **MN-3 (should-fix).** Plausible maxima contradict MM-307 ("iron up to 100 mg, vitamin C up to 2,000
  mg") and are too loose to catch a 1,000x unit slip. Set each from a named top food; add a 500 mg iron
  case.
- **MN-4 (should-fix).** A single day is drawn against a reference meant for usual intake (IOM 2000: the
  RDA is a goal for usual intake; intake varies day to day without ill effect). Add one quiet line:
  "Reference amounts are for an average over many days, not one day."
- **MN-5 (consider).** No upper limits: agree, but the reason is that the ULs for magnesium, folate and
  vitamin A apply to a subset of sources the totals cannot separate, not that food rarely reaches one.
- **MN-6 (should-fix).** Bariatric surgery (targets set by the surgical team, `CoachingPolicy.ts:151`)
  still shows general references; MM-310 omits the under-19 rule and has one line where the code has
  three. Refer bariatric to safety.
- **MN-7 (consider).** Label the custom food fields "µg RAE" and "µg DFE".
- **MN-8 (consider).** "No data yet" with foods logged suggests data is pending: "Not stated by today's
  foods".
- **MN-9 (consider).** MM-311's AC text does not match the build.

## Sources and evidence
- Health Canada, DRI tables: reference values for elements,
  https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-elements.html,
  modified 2025-11-19, accessed 2026-10-14 (NASEM values).
- Health Canada, DRI tables: reference values for vitamins,
  https://www.canada.ca/en/health-canada/services/food-nutrition/healthy-eating/dietary-reference-intakes/tables/reference-values-vitamins.html,
  modified 2025-11-19, accessed 2026-10-14.
- IOM, Dietary Reference Intakes: Applications in Dietary Assessment (2000), ch. 1,
  https://www.nationalacademies.org/read/9956/chapter/5, accessed 2026-10-14.
- Open Food Facts nutrients taxonomy,
  https://raw.githubusercontent.com/openfoodfacts/openfoodfacts-server/main/taxonomies/nutrients.txt, accessed
  2026-10-14.
- Blocked: NIH ODS (403), NCBI Bookshelf.

## Research
Performed, direct.

## Confidence and limitations
High on values and the single-day concern; medium on OFF's runtime conversion and bariatric needs.

## Acceptance criteria and edge cases
Proposed: DRI band edges; stated 0 against nothing; the single-day line; withholding precedence and
bariatric; OFF vitamin A excluded; iron 500 mg per 100 g dropped.

## Dependencies
Safety (MN-6, ULs); UX (MN-4, MN-8); coaching (MN-9); pipeline (MN-2, MN-3, MN-7).

## Safety concerns
Single-day references could prompt supplement seeking (MN-4); bariatric references (MN-6).

## Unresolved product decisions
OFF vitamin A and folate; bariatric withholding; an optional multi-day view.

## Verification
None run.

## Targeted challenges
None.
