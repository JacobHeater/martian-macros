---
id: MM-381
status: done
component: food-database
related: [MM-380, MM-382, MM-307, MM-305, MM-306, MM-49, MM-51, MM-52, MM-55]
---

# Spike: Food packs with fuller data for the grade

## Context
The packs published 2026-10-09 are format 1: calories, the macros, fiber (stated for 91% of common foods and 85% of barcode
foods), sodium (99%), alcohol. MM-307 added thirteen nutrients to the pipeline (sugars, saturated fat, cholesterol, five
minerals, five vitamins) in format 2, but no format 2 pack has been built: the build needs DuckDB and the sources are
large downloads. The grade of the app's own (MM-380) counts the vitamins and minerals, so what the packs carry sets how many
foods get the full grade.

On 2026-10-18 the product owner asked: "Is it time to explore alternate food packs that are more robust in their data?"

## Decisions
The product owner's (2026-10-18): the grade uses more micronutrient data; the packs' robustness is to be explored.

## Description
Answer, in `docs/food-packs-data.md`, with the integrations and micronutrients roles (`docs/agent-runs/mm380-proprietary-grade/`):
1. **What today's sources carry** of the thirteen MM-307 nutrients, per source: USDA Foundation and SR Legacy (complete
   profiles for generic foods), USDA Branded (label nutrients: sugars, saturated fat, sodium, fiber, and since the 2020 label
   potassium, calcium, iron, vitamin D; the rest rarely), Open Food Facts (label fields, patchy). Which of the grade's inputs
   each source answers.
2. **Candidate sources** that would make generic foods fuller or add foods as eaten: USDA FNDDS (survey foods, complete
   profiles for about 7,000 foods as eaten, public domain), the FDC "Experimental" set, the Canadian Nutrient File, and any
   other open set fit for a US launch. For each: licence, format, size, coverage of the thirteen nutrients, update cadence,
   and how it would join the pipeline (`extract.sql`, the conflict policy, the pack's provenance).
3. **The recommendation**: whether to rebuild in format 2 as is, add a source, or both; what the build report's
   `coverage.txt` should show before a pack is published; and whether a later format needs a category column.
4. **What is measurable now** without a build: the sources' own documentation; what must wait for a build on a machine with
   DuckDB and the downloads.

## Acceptance Criteria
```gherkin
Scenario: The question is answered
  When the spike is done
  Then docs/food-packs-data.md says, per source, which of the grade's inputs it carries, names the candidate sources with their licences, and recommends what to do before the next pack is published

Scenario: The owner's next step is concrete
  Then the report ends with the commands or the tickets that produce the next pack
```

## Progress
- Done 2026-10-18: `docs/food-packs-data.md`, from the integrations and micronutrients roles' findings in two runs (`docs/agent-runs/mm380-proprietary-grade/`, `mm383-sources-and-downloads/`) and the chair's measurements of the published packs. FNDDS 2021-2023 is added and wired (MM-383); Experimental Foods and the Canadian Nutrient File are declined; the first build and publish are the owner's, with the commands in the report.
