---
id: MM-502
status: done
component: adaptive-coach
related: [MM-34, MM-35, MM-501]
---

# Story: My smart scale's body-fat readings narrow the range, with each scale's own bias

## Context
Split from MM-34, which built the range from the formula and the waist. Smart-scale body-fat readings are not stored yet
(`BodyFatObservation` exists as a type only), so this waits on a health-platform ingest of body fat and its storage.

## Decisions (made with the product owner, in MM-34)
- **Body fat is shown as a range, updated slowly, never as a raw daily reading.** A smart-scale reading is mostly a measure of body water
  and can swing two to five points overnight.
- **Each scale gets its own bias**, learned over time, so switching scales is not read as a change in the body.

## Description
Stored smart-scale readings join `estimateBodyFat`, each weighted by how reliable it is, with a per-device offset learned against the tape
and the formula. The range narrows as readings accumulate. The product says that filtering removes scatter, not a scale's fixed bias.

## Acceptance Criteria
```gherkin
Scenario: Before enough data
  Given a week of smart-scale readings
  Then the app shows the range without them, not a number from the scale

Scenario: A settled range
  Given eight weeks of readings from one scale and weekly tape measurements
  Then the app shows a range narrower than without the scale, updated weekly
  And never narrower than the scale's fixed bias against a body scan allows

Scenario: A scale may only make safety stricter
  Given a settled scale reading 5 points higher than the formula and the tape
  Then the body fat the safety limits read is not raised
  And the energy-availability floor is not lowered

Scenario: A scale back after a long gap
  Given readings that stopped for longer than the two-week window
  When they resume
  Then they settle again before they count

Scenario: The same reading from two sources
  Given each reading copied by a second app
  Then the days counted are the same as from one source

Scenario: A new scale
  Given a settled range
  When readings begin arriving from a different scale that reads 4 points higher
  Then the shown range does not jump

Scenario: One overnight spike
  Given a reading 3 points above the previous day's
  Then the shown range does not move
```

## Decisions
Choices I made without asking (say if any is wrong):
- **No schema change.** Body fat was already a health data type (MM-66) read by both shells (Health Connect
  `BodyFatRecord`, HealthKit `bodyFatPercentage`) and kept by platform id in the health sample store, with its
  source; the range reads them from there. The note above, written before that, no longer applies.
- **The first scale is taken as it reads**, its fixed error (4.5 points, from the review below) left in the uncertainty for the formula and
  the tape to temper; a later scale's offset is learned from its first week against the scales before it in the two
  weeks before it began, and it counts for nothing until then. A scale with no readings before it to learn from is
  taken as it reads.
- **One figure a day per scale, the middle of the last 14 days up to the weekly update day** (a whole number of weeks
  after the first reading), once the first scale's readings span 14 days and the window has 4 days.
- ~~**"A few points wide"** is read as under 8 points from end to end with weekly tape.~~ Replaced by the panel
  review (2026-10-21, safety and measurement): with a consumer scale's real bias the range cannot honestly be that
  narrow, so the criterion is now "narrower than without the scale, and never narrower than its bias allows".
- **Review fixes (2026-10-21, safety and measurement panel).** A scale's fixed error is 4.5 points one-sigma, not 2:
  consumer foot-to-foot scales against DXA have limits of agreement about -14.5 to +8.6 points (Bosy-Westphal 2008,
  Obes Facts 1:319) and about +/-9.5 points (Pateyjohns 2006, Obesity 14:2064). Its error is taken to go 0.4 with the
  formulas' (`rho = s_shared^2 / (s_scale * s_outside)`, the shared part from the height, weight, age and sex a
  scale's equation also uses). **A scale may only make safety stricter**: `BodyFatEstimate.withoutScale` keeps the
  estimate without it, and `cautiousBodyFatPercent` and `fatFreeMassUpperKg` take the more cautious of the two, so
  the loss limit, the protein rule, the energy-availability floor and the phase plan never loosen for a scale.
- **Settling restarts after a gap** longer than the 14-day window, from the first reading after it; and the days are
  calendar days: every scale's and source's figures for one day (each scale's offset out) are taken as one.
- **A scale is its app and its device** (integrations review): the shells now hand over the device (Health Connect
  `metadata.device` manufacturer and model; HealthKit `sample.device` and `sourceRevision.productType`) and whether
  the reading was typed in (`recordingMethod` manual entry; `HKMetadataKeyWasUserEntered`). With no schema change,
  a body-fat sample's stored source id is its app and device joined (`app|device`), and a typed-in body-fat reading
  is not imported, so it never counts as a scale's. Weight samples keep the app alone as their source (the chosen
  primary scale is stored by it). Body-fat readings stored before this keep the app alone and read as one more
  scale, whose offset is learned as any other's.
- The model is this ticket's own; MM-35 was not needed.

## Notes
- MM-501 (the Navy tape) joins `estimateBodyFat` the same way, as one more combined estimate.

## Progress
Built 2026-10-21. Not run locally; CI validates.
- `scaleBodyFat` (engine) and `ScaleLevel`; seven `BodyFatRule` figures, each with an evidence row, and the body-fat
  question in `docs/evidence.md` says that averaging removes scatter, not a scale's fixed bias.
- `estimateBodyFat` takes `bodyFatReadings` and combines the scale with the formula (and the waist) as an independent
  estimate; basis `scale`, "(from your scale)", with a note that averaging removes scatter, not fixed bias.
  `analyze` and `buildMonthlyReport` pass the readings through (the report counts a scale's range as measured).
- `AppState.bodyFatReadings` reads the stored `bodyFat` samples after each import (`bodyFatReadingsOf`, each with its
  source as the scale).
- Guarding tests: `test/engine/scaleBodyFat.test.ts` (a week of readings leaves the range as it was; eight weeks and
  weekly tape give a range under 8 points; unchanged between weekly updates; a new scale 4 points higher does not move
  it; a 3-point spike moves nothing that day or at the next update; the user's figure still first; analyze uses it);
  `test/format/bodyFatText.test.ts`; `test/state/bodyFatReadingsOf.test.ts`. The ingest of body fat was already
  covered (`healthIngest.test.ts`, `healthBackfill.test.ts`).

Review fixes 2026-10-21 (branch fix/body-comp-review). Not run locally; CI validates.
- `BodyFatRule.scaleBiasSigmaPercent` 2 -> 4.5, `scaleErrorCorrelation` 0 -> 0.4 (evidence rows updated).
- `BodyFatEstimate.withoutScale`; `cautiousBodyFatPercent` and `fatFreeMassUpperKg` take the more cautious;
  `estimateBodyFat` sets it when a scale joins.
- `scaleBodyFat`: settling restarts after a gap; one figure per calendar day across scales and sources.
- Shells: `deviceId` and `manual` on each record (`MmHealthPlugin.kt`, `MmHealthPlugin.swift`, uncompiled here);
  `healthConnectSample` keys a body-fat sample by app and device and leaves a typed-in one out.
- Tests: `test/engine/scaleBodyFat.test.ts` (the settled-range criterion rewritten; a scale 5 points higher lifts no
  safety figure; a lower one may stricten; a scale back after a gap settles again; a copied source counts the same
  days; the spike test now puts the spike inside the window on an update day), `test/platform/healthConnectSample.test.ts`.

## Owed on a phone
- A smart scale writing body fat to Health Connect (and to Apple Health): after two weeks of readings the Coach's Body
  row says "(from your scale)" and the range is narrower; switching scales does not move it.
