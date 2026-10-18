# Review: measurement

## Scope and traceability
- Role: measurement and adaptive systems (`agents/roles/measurement.md`); panel protocol and review contract read. Read-only subagent; nothing run or edited.
- Brief: `docs/agent-runs/mm367-body-water-rules/brief.md`; mode `change` applied.
- Under review: MM-367 (proposed). Related: MM-361, MM-362, MM-366, MM-378, MM-142 (proposed), MM-118 (proposed), MM-301, MM-155, MM-71, MM-313, MM-358, MM-359; the mm366 decision.
- Code inspected (apps/mobile): `domain/WeightObservation.ts`, `domain/repositories/WeightReader.ts`, `data/SqlWeightRepository.ts`, `fixtures/InMemoryWeightRepository.ts`, `data/currentSchema.ts` (40-45, 272-277), `state/mergeWeighIns.ts`, `state/AppState.ts` (164, 216-222, 423-452, 825-831, 1067-1075), `healthIngest/{DayWeighIn,dailyWeighIns,HealthSample,WeighInBasis,HealthImporter,HealthSampleStore}.ts`, `platform/{healthConnectSample,MmHealthRecord}.ts`, `android/.../MmHealthPlugin.kt` (124-135), `format/importedWeighInText.ts`, `dashboard/DashboardScreen.tsx` (158-216), `dashboard/WaterRow.tsx`, `engine/{waistNoiseOf,waistChangeOf,WaistRule,WaistChange,ItemInsightKind,ItemInsight,ItemAnchor,ItemAnchorKind,InsightSafeguards,InsightArea,InsightPriority,InsightRationing,allowedItemInsights,volumeJumpInsights,itemInsightKinds}.ts`, `engine/findInsights.ts` (20-160), `format/waistSummary.ts`, `format/itemInsightText.ts`, `domain/water/*.ts`, `domain/repositories/{WaterReader,WaterRepository}.ts`, `data/SqlWaterRepository.ts`, `fixtures/InMemoryWaterRepository.ts`, `food/{WaterSection.tsx,logWater.ts,waterEntryWhen.ts}`, `domain/NutritionGoals.ts`, `fixtures/DemoSeed.ts`, `gallery/screens/CoachingInsights.stories.tsx` (379-450), `domain/CalendarDate.ts`.
- Tests inspected by source: `test/healthIngest/dailyWeighIns.test.ts`, `test/state/mergeWeighIns.test.ts`, `test/engine/waistChange.test.ts`, `test/engine/itemInsightEvidence.test.ts`, `test/engine/evidenceRegister.test.ts`. Docs: `docs/evidence.md`.
- Commit f2e8dfe on `spec/food-insights-and-snooze`. Hashes not computed; the chair records them.

## Existing facts versus proposals
- F1. A weigh-in is a calendar day and a kilogram figure: `WeightObservation` has `date`, `weightKg`, optional `deviceId` (`WeightObservation.ts:4-13`); `weight_entries` has `epoch_day`, `weight_kg`, `device_id`, primary key `epoch_day`; `saveWeight(date, weightKg)` takes no time; every typed weigh-in passes `today`.
- F2. Imported readings carry an instant (`HealthSample.start`); the plugin sends Health Connect `record.time` as epoch millis with no zone offset. `dailyWeighIns` keeps `at` only for a `firstMorning` day (04:00-12:00 local); `medianOfDay` days have `at: undefined`. `mergeWeighIns` drops `at`; a typed value replaces the import.
- F3. The waist's one shared answer is `waistChangeOf` (`waistChangeOf.ts:32-103`): smoothed middle-of-three at each end, `days` default 28, latest within 14 days, threshold `WaistRule.differenceFactor (1.4) × waistNoiseOf × (1.5 with a single reading at either end)`; `WaistChange` has `direction`, `fromCm`, `toCm`, `thresholdCm`, entry counts. `waistNoiseOf` is 1.0 cm until 8 triples, then personal, floored at 0.5 cm. MM-155: change is measured between smoothed values, not single entries. The Progress waist card already says "No clear change since you started: a difference under X is within what a tape can tell."
- F4. `WaistRule` has no row in `docs/evidence.md`; `evidenceRegister.test.ts` does not scan it.
- F5. `WaterEntry {id, date, ml, at}`; `water_entries.ml` in (0, 3000]; `WaterReader.watchWater(date)` reads one day only; no range reader. An entry's `date` is the day it counts for; "Added later" marks a drink logged on another day.
- F6. `state.waterGoal` is undefined while off, withheld by the health check (kidney disease, bariatric surgery, a clinician's fluid limit) or loading; on by default otherwise, so a new install has a goal from day one.
- F7. `ItemInsight` has `basis`, `figures`, optional `from`/`to`; anchors `weighIn`, `waist`, `water` exist; the dashboard `weighInTiming` rule is about frequency, not clock time; `InsightRationing.patternDays = 14`, `minimumBasisDays = 7`.
- F8. The preview shows for the waist "Today 35.8 in / A week ago 35.9 in / A tape's usual difference about 0.4 in" and for the weigh-in "Today 11:40 AM / Usually about 7:00 AM / 14 in the last 14 days".

Everything under Findings is a proposal unless it cites F1-F8.

## Audit coverage
Mode `change`. Existing behaviour audited first: weigh-in storage and import, waist noise and change and their callers, the water log and goal, the inline framework, the register and its tests. Not inspected: `ProgressScreen` beyond a grep, `WeighInRow`/`WaistRow`, the water contract suite, `SqlHealthSampleStore`, `test/coach/inlineInsights.test.tsx`, any render or device. No rule exists in code. Methods: source inspection, requirement reading, four web retrievals. Referrals: coaching (wording and cadence), safety (waist with hidden weight; water and the fluid limit), architecture/react-capacitor (a water range reader), integrations (zone offset).

## Novice mobile experience
Not assigned.

## Findings

### ME-1: "Unusual time" has no measured quantity for a typed weigh-in
Blocker for this rule as written; confidence high (F1, F2). A typed weigh-in has no time; an imported one's survives only for `firstMorning` days and is discarded before the engine. Recording the typing time would not fix it: it is the time of logging, not of weighing; a person who weighs at 07:00 and types at 11:30 would be told "Weighed later than usual", which is false (the water log already distinguishes "Added later"). **Remediation (owner):** (a) drop the rule; the trend model already absorbs within-day noise and MM-142 is the planned per-reading explanation; (b) scope it to imported weigh-ins with a known time, carrying `at` past `mergeWeighIns`; (c) not recommended: a logging-time line.

### ME-2: The 3 h threshold needs a "usual time exists" guard
Severity medium. A median alone is not a usual time: a person weighing at 06:00 and 10:30 has a median of 08:00 and half their weigh-ins ≥ 3 h from it. Guard: compute only when the middle half of times spans ≤ 3 h; count minutes since 04:00. The 3 h is judgement; Dittmar 2002 gives direction only.

### ME-3: "At least 7 of 14" is consistent with the app
Severity low. Matches `minimumBasisDays`/`patternDays`. Specify: the 14 days before today; one time per day; only days with a known time; `basis: 'pattern'` with `from`/`to`.

### ME-4: "Within the noise" as drafted compares two single readings, which MM-155 forbids, and the preview shows the wrong figure and period
Confirmed requirement violation; severity **high**; confidence high. `waistChangeOf` never compares the latest entry with the previous; "the tape's noise" is not the difference threshold (that is 1.4 × noise, 2.1 cm with a single reading). The preview's "about 0.4 in" is single-measurement noise and "A week ago" is not the 28-day comparison. **Call it exactly:**
```ts
const change = waistChangeOf({ waist, asOf: reading.date }); // days defaults to 28; never pass noiseCm
if (change === undefined) return [];
if (change.recentEntries + change.baselineEntries < 3) return [];
if (change.direction !== 'noClearChange') return []; // or ME-5
figures: { fromCm, toCm, thresholdCm, days: 28, recentEntries, baselineEntries }
```
`asOf` is the reading's own day. Evidence rows: `fromCm` ("4 weeks ago, smoothed"), `toCm` ("Now, smoothed"), `thresholdCm` ("A change has to pass"), rounded as MM-155 says. Say "within what a tape can tell", the phrase `waistSummary` uses.

### ME-5: A "not a change yet" line under every within-noise reading is the steady state, not information
Severity medium. At 1.4 cm over 28 days and a realistic 0.5-1 cm a month, `noClearChange` is the answer most weeks for months; the rule says nothing in the informative cases. **Proposals:** (i) report all three directions of the shared answer; or (ii) fire only when the latest raw entry differs from the previous by at least the noise figure while the smoothed comparison is `noClearChange`: the waist analogue of MM-142, the one moment the line answers a question being asked. Prefer (ii) for the Dashboard, since Progress already carries (i).

### ME-6: `WaistRule` has no evidence rows, and the defaults are optimistic for home self-measurement
Severity medium. Ten `WaistRule` values are owed rows (MM-143). Verweij 2013: intra-observer error 0.7-9.2 cm, self-measurement excluded. Barrios 2016: home self-duplicate TEM ≈ 1.9 cm, lab ≈ 0.74 cm. So 1.5 cm single-reading and 1.0 cm middle-of-three are at the optimistic end; register as judgement with these as direction.

### ME-7: Water: no reader can see 14 days
Severity medium (F5). A pattern needs a narrow new method (`watchWaterDays({ since })`), SQL and in-memory implementations and the contract suite extended. The rule takes plain entries and a `WaterGoal | undefined`.

### ME-8: Water: define "a day with water", the window, and the guards
Severity medium. A day with water: at least one entry whose `date` is that day. Window: the 14 complete days before the day shown, not including it. Guards: the app in use for the whole window; at least one water entry ever (mirroring `weighInTiming`'s "ever weighed before"); fewer than 7 of 14. The measured quantity is logging, not drinking. "A water goal is on" = `state.waterGoal !== undefined`, which excludes the withheld cases; safety to confirm.

### ME-9: MM-142 precedence is specified against an unbuilt feature with no hook
Severity low. Defer the scenario to MM-142's build.

### ME-10: Imported times are device-local at read time
Severity low; unverified. `dailyWeighIns` uses `getHours()` on the instant; no zone offset is carried. Acceptable if documented.

### ME-11: Evidence register rows each rule needs (proposal)
All Checked = No.

| Name | Value | Where | Decides | Source | Grade | Population |
|---|---|---|---|---|---|---|
| `unusualWeighInTime` | an imported weigh-in with a known time ≥ 3 h from the median of 14 days' timed weigh-ins, ≥ 7 of them, middle half ≤ 3 h; never a typed weigh-in | engine (new) | whether the coach mentions the time of a weigh-in | direction only: Dittmar 2002; figures judgement | judgement | 27 students aged 22-29 |
| `WeighInTimeRule.hoursFromUsual` | 3 h | engine | how far counts as unusual | product judgement | judgement | none |
| `WeighInTimeRule.windowDays` | 14 | engine | the days the usual time is taken from | `InsightRationing.patternDays` | judgement | none |
| `WeighInTimeRule.minimumWeighIns` | 7 | engine | how many timed weigh-ins a usual time needs | `minimumBasisDays` | judgement | none |
| `WeighInTimeRule.maxUsualSpreadHours` | 3 h | engine | whether a usual time exists | ME-2 | judgement | none |
| `withinNoise` | the shared waist answer (`waistChangeOf`, 28 days) is no clear change; said only when the latest reading moved from the previous by at least the noise figure | engine (new) | whether the coach says a waist reading is within what a tape can tell | MM-155; Verweij 2013; Barrios 2016 | judgement | adults measuring their own waist |
| `WaistRule.medianOfThreeNoiseCm` | 1.0 cm | engine WaistRule.ts | the noise of a middle-of-three entry | Verweij 2013; Barrios 2016 lab TEM 0.74 cm; optimistic | judgement | mostly trained observers |
| `WaistRule.singleReadingNoiseCm` | 1.5 cm | engine WaistRule.ts | the noise of a single reading | Barrios 2016 home TEM ≈ 1.9 cm; below it | judgement | 41 mothers |
| `WaistRule.singleReadingFactor` | 1.5 | engine WaistRule.ts | how much noisier a single-reading comparison is | the ratio above | judgement | none |
| `WaistRule.personalAfter` | 8 triples | engine WaistRule.ts | when the noise becomes personal | MM-155 | judgement | none |
| `WaistRule.personalFloorCm` | 0.5 cm | engine WaistRule.ts | the lowest personal noise | the tape reads to 0.5 cm | judgement | none |
| `WaistRule.differenceFactor` | 1.4 (≈ √2) | engine WaistRule.ts | a difference is √2 noisier than one measurement | statistics | strong | n/a |
| `WaistRule.smoothedEntries` | 3 | engine WaistRule.ts | entries smoothed at each end | MM-155 | judgement | none |
| `WaistRule.latestWithinDays` | 14 | engine WaistRule.ts | how recent "now" must be | MM-155 | judgement | none |
| `WaistRule.recentWithinDays` | 21 | engine WaistRule.ts | the oldest entry "now" may include | MM-155 | judgement | none |
| `WaistRule.baselineWithinDays` | 10 | engine WaistRule.ts | how far an entry may be from the day compared with | MM-155 | judgement | none |
| `waterFewDays` | a goal in force, the app in use for the window, ≥ 1 water entry ever, water logged on fewer than 7 of the 14 complete days before the day shown | engine (new) | whether the coach mentions sparse water logging | product judgement; measures logging, not drinking | judgement | withheld with the goal |
| `WaterFewDaysRule.windowDays` | 14 | engine | the days counted | `patternDays` | judgement | none |
| `WaterFewDaysRule.fewerThanDays` | 7 | engine | what counts as few | the half-of-days convention | judgement | none |
| `WaterFewDaysRule.minimumEntriesEver` | 1 | engine | so a feature never used gets no line | `weighInTiming`'s guard | judgement | none |

Extend `itemInsightEvidence.test.ts` to enumerate the new rule objects and `WaistRule`.

## Sources and evidence
Accessed 2026-10-18.
- Dittmar M, Raschka C, Koch HJ. "Effect of diurnal variation on body composition under consideration of selected chronobiological marker systems." *Anthropological Review* 65, 2002, 17-26. Repository record https://repozytorium.amu.edu.pl/items/e6a5532b-7d83-42cf-85bd-e0b0dc5a4e61. Weight and body water rose across one day in 27 students; morning values recommended. Abstract only; low strength.
- Verweij LM, Terwee CB, Proper KI, Hulshof CTJ, van Mechelen W. "Measurement error of waist circumference: gaps in knowledge." *Public Health Nutr* 2013;16(2):281-288, doi 10.1017/S1368980012002741, https://pmc.ncbi.nlm.nih.gov/articles/PMC10271771. Error 0.7-15 cm; self-measurement excluded; individual change hard to tell from error. Moderate.
- Barrios P, Martin-Biggers J, Quick V, Byrd-Bredbenner C. "Reliability and criterion validity of self-measured waist, hip, and neck circumferences." *BMC Med Res Methodol* 2016;16:49, https://pmc.ncbi.nlm.nih.gov/articles/PMC4855335. Home duplicate TEM 0.76 in, lab 0.29 in; 41 mothers, mean age 38. Low-moderate; closest to the app's protocol.
- Android Developers, "Health Connect data types", https://developer.android.com/health-and-fitness/guides/health-connect/plan/data-types, updated 2026-09-23. Weight is an instantaneous record with `time`; zone offset not stated.
- Not retrieved: the `WeightRecord` class reference; the Cambridge PDF of Verweij. Snippets not cited.

## Research
Status: performed (partially blocked). Q1 time-of-day effect: direction only. Q2 imported time: F2 plus the data-types page; the class reference blocked (bounded request: confirm `WeightRecord.zoneOffset`). Q3 self-measured waist error: Verweij, Barrios. Q4 water thresholds: convention, judgement. WebSearch and WebFetch, direct.

## Confidence and limitations
High in F1-F8, ME-1, ME-4, ME-6 (gap), ME-7; medium in the thresholds (ME-2, ME-5, ME-8). Nothing run or rendered; hashes not computed; single reviewer.

## Acceptance criteria and edge cases
Existing traced: "Unusual time" and "Too few weigh-ins" have no data for typed weigh-ins; "Hidden weight" is covered by `aboutWeight`; the MM-142 scenario has no hook; "Within the noise" names a comparison the shared function does not make; "Water" lacks a window and guards. Proposed criteria under ME-1, ME-2, ME-4, ME-5, ME-8. Edge cases: a typed value replacing an import; `medianOfDay` days; two scales; travel across zones; a waist entry corrected or deleted; a water entry undone after logging; water for a past day; the Food screen on a past day; the goal switched off and on; eating-disorder history; under 18; paused.

## Dependencies
coaching (ME-5, the water sentence, the weigh-in direction); safety (waist with hidden weight; `waterGoal === undefined` as the fluid-limit guard); architecture/react-capacitor (the water range reader; `at` on `WeightObservation` if ME-1 b); integrations (zone offset). Tickets MM-155, MM-71, MM-143, MM-378 (the snooze item for a waist reading or the water section).

## Safety concerns
Misleading certainty: "Weighed later than usual" for a typed weigh-in states what the app cannot know; "day-to-day difference of a tape" claims a between-days figure the model does not hold. A within-noise line as the only waist message could read as "no progress". No fluid pushed where withheld (F6); safety to confirm. No clinical clearance.

## Unresolved product decisions
1. Unusual time: drop, or scope to imported weigh-ins with a known time. 2. Within the noise: all three directions, or only when the raw reading moved. 3. Whether a Dashboard waist line is wanted at all when Progress carries the same answer. 4. Water: the in-use and at-least-one-entry guards. Authority: product owner.

## Verification
Nothing run. Requested: extend `itemInsightEvidence.test.ts` to the new rule objects and `WaistRule`; the water range reader in the contract suite; the proposed scenarios as engine tests; `mm req`, `mm check`.

## Targeted challenges
None yet.

## Verdict
**Do not build the catalog as drafted.** "Unusual time" must be dropped or rescoped to imported weigh-ins with a known time (ME-1). "Within the noise" must call `waistChangeOf` on the shared 28-day comparison and its preview must change (ME-4); its cadence needs a decision (ME-5). "Water on few days" is buildable once a multi-day water reader exists and the window, day and guards are written down (ME-7, ME-8). All three need ME-11's rows, including the ten `WaistRule` rows already owed.
