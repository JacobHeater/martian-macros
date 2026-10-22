---
id: MM-501
status: done
component: adaptive-coach
related: [MM-34, MM-156, MM-35]
---

# Story: The Navy tape method joins my body-fat range

## Context
Split from MM-34, which built the range from height, weight, age, sex and waist. The owner's decision there was that without a smart
scale the fallback is a tape: weekly waist, and the Navy method. The Navy method needs neck, and hip for a female profile, which nothing
stores until MM-156 adds more measurement sites.

## Description
Once MM-156 stores neck and hip, the Navy formula (sex-specific; neck and waist for men, neck, waist and hip for women) joins
`estimateBodyFat` as a third estimate, combined by how reliable it is and with its error allowed to go together with the other formulas'.
It uses recent entries' middle values, as the waist does. Every new figure gets an evidence row.

## Acceptance Criteria
```gherkin
Scenario: Neck entered
  Given a male profile with three or more waist and neck entries in the last four weeks
  Then the range rests on the Navy method as well, and is no wider than without it

Scenario: A female profile
  Given a female profile with waist, neck and hip entries
  Then the Navy method is not used, and the range is MM-34's, unchanged

Scenario: Only some sites
  Given waist entries but no neck entries
  Then the range is MM-34's, unchanged

Scenario: One mistyped neck entry
  Given a settled range
  When one neck entry is mistyped
  Then the shown range does not move
```

## Notes
- Depends on MM-156. No schema change of its own.

## Decisions
Choices I made without asking (say if any is wrong):
- **The Navy method joins only with the waist**, since it reads the same waist: the waist's middle value, and neck (and
  hip for a female profile) each needing the waist's three entries in four weeks, each on its own middle value.
- **Its error is taken to go together with the waist and BMI formulas' (0.6)**: only the neck and hip are new
  information, so the range narrows a little, never as if the tape were independent. Combined by reliability, it is
  never wider than without it.
- **A basis of its own, "from your tape"**, with the note naming the Navy method; a smart scale, once settled, still
  joins on top (MM-502).
- **No suggestion is switched on for it**: the app cannot tell who wants a tape estimate, so MM-156's sites screen
  names neck (and hips) for it and `suggestedSites`' `tapeBodyFat` stays unused.

- **Not for a female profile (panel review, 2026-10-21).** The female Navy equation is fitted to the waist at its
  narrowest (the natural waist) and the hip; the app's waist is at the navel (`MeasurementSite` has no natural-waist
  entry), which reads larger and would raise her figure. Until a natural-waist entry exists, the method is used for
  men only (whose equation reads the abdomen at the navel). The sites screen and the note say so.
- **The neck's middle carries the neck's own noise** (`MeasurementSite.facts`, 0.5 cm per entry, half as much again
  with a single reading), times sqrt(1.25) for a middle rather than a mean, over the square root of the entries.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- `navyBodyFat` (engine): the published formulas in centimetres, with the tape's noise carried through; nothing for
  a neck at or above the rest, or a female profile with no hip.
- `estimateBodyFat` takes every site's measurements (`sites`, MM-156) and, with the waist, joins the Navy estimate
  (`BodyFatRule.navySigmaPercent` 4, `navyErrorCorrelation` 0.6), basis `tape`. `analyze`, `buildMonthlyReport` (a
  tape range counts as measured) and `AppState` pass `state.measurements` through.
- Wording: "(from your tape)" and its note (`bodyFatRangeText`, `bodyFatNote`).
- Evidence rows for the formula, its error, the correlation and the entries rule in `docs/evidence.md`.
- Guarding tests: `test/engine/navyBodyFat.test.ts` (the formulas; neck and hip entered: the range rests on the tape
  and is no wider; only some sites: MM-34's range unchanged; one mistyped neck entry moves nothing; old entries do not
  count; no waist, no tape); `test/format/bodyFatText.test.ts`.

Review fixes 2026-10-21 (branch fix/body-comp-review). Not run locally; CI validates.
- `estimateBodyFat`: the Navy method for a male profile only; the neck's noise from `MeasurementSite.facts` x sqrt(1.25).
- Copy: `bodyFatNote` ('tape') no longer names hips; `MeasurementSitesScreen` says the method is for men only.
- Tests: `test/engine/navyBodyFat.test.ts` pins the formula to an independent reference worked by hand from the
  imperial equation (19.93% for 180 cm, waist 90, neck 38; the metric form gives 19.81); a female profile is not
  given the method; the neck's noise is carried as stated. `test/format/bodyFatText.test.ts` follows the note.

## Owed on a phone
- With three weeks of waist and neck entries on a male profile, the Coach's Body row reads "(from your tape)".

