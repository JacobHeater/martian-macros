# Review: measurement

## Scope and traceability
- **Role:** measurement and adaptive systems; protocol and contract read in full. Read-only subagent, one session, no credentials claimed. Nothing run or edited.
- **Brief:** `docs/agent-runs/mm377-strength-on-fat-loss/brief.md`; mode `change`.
- **Requirements inspected:** MM-377 (subject), MM-77, MM-117, MM-366, MM-141 (36-65).
- **Prior panel inputs:** the mm366 training (TR-6, TR-9; TR-2, TR-7, TR-11), coaching (CO-2) and safety (SA-6) reports and decision.
- **Code inspected:** `engine/buildStrengthTrends.ts`, `StrengthTrend.ts`, `StrengthPoint.ts`, `estimatedOneRepMax.ts`, `consecutiveDeficitWeeks.ts`, `findReliefOffer.ts`, `analyze.ts`, `TargetsRecord.ts`, `DailyTargets.ts`, `volumeJumpInsights.ts`, `VolumeJumpRule.ts`, `itemInsightKinds.ts`, `ItemInsightKind.ts`, `ItemInsight.ts`, `InsightSafeguards.ts`, `recentInlineInsights.ts`, `nextLoadKg.ts`, `defaultLoadStepKg.ts`; `domain/training/WorkoutSet.ts`, `domain/Units.ts`, `domain/CalendarDate.ts`, `domain/evidence/EvidenceRegister.ts`; `format/Fmt.ts`, `loadNumber.ts`, `parseNumber.ts`; `train/SetEditor.tsx`; `data/SqlWorkoutRepository.ts`, `currentSchema.ts`.
- **Tests inspected by source:** `test/engine/strengthTrends.test.ts`, `test/engine/itemInsightEvidence.test.ts`. **Docs:** `docs/evidence.md`.
- **Commit:** f2e8dfe, dirty tree. Hashes not computed; the chair records them.

## Existing facts versus proposals
- F1. e1RM = resistance × (1 + (reps + RIR)/30); undefined above 12 effective reps, at RIR 5, for a bodyweight lift with no weigh-in, or resistance ≤ 0; a missing RIR counts as 0.
- F2. A session's point is its best set's estimate; `trendKg` is the mean of that estimate and up to the 2 previous points within 28 days inclusive. The mean is trailing: a point's `trendKg` never depends on later workouts. Two sessions on one day make two points.
- F3. `StrengthPoint` carries `workoutId, date, estimateKg, trendKg`; not how many points the mean rests on.
- F4. MM-77's comparison convention: baseline = the last point on or before the target date, within 7 days before it, else unavailable.
- F5. `consecutiveDeficitWeeks` returns `trunc(days/7)` from the earliest record in the unbroken run of `weeklyRateFraction < 0`, or `restartOn` if later; the start date is not exposed. `restartOn` is `snapshot.deficitRestartOn`. A recomp goal's targets also have a negative rate.
- F6. MM-117's sibling threshold for strength "falling" is a smoothed e1RM drop of 5% or more on two lifts; not built.
- F7. A load typed in pounds is stored as `lb × 0.45359237` with no rounding; `loadNumber` rounds for display only.
- F8. The default load step is 2.5 kg or 5 lb.
- F9. MM-366's automatic rest was superseded by the snooze; MM-377 line 36 still says "shown once, then rested".
- F10. `itemInsightEvidence.test.ts` requires a row for every kind id and every key of each `*Rule` object.
- F11. `volumeJumpInsights` judges a workout on its own date.

Everything under Findings is a proposal unless it cites F1–F11.

## Audit coverage
Mode `change`. Not inspected: `suggestProgression.ts`, `StrengthHistoryScreen`, `pauseDeficitRestartOn`, `GapRule`, the relief, pause, gap, coach and targets tests beyond confirming they exercise `consecutiveDeficitWeeks`, renders, `DemoSeed` lifts. No implementation exists. Methods: source inspection, arithmetic, four web retrievals. Referrals: coaching (words for a band; the weeks figure), nutrition (recomp; planned versus eaten), training (session semantics).

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

### ME-1: The baseline point must be defined from the deficit's start date, which the code does not expose
Severity **high**, confidence high. "The value at the start" has no definition. Rejected: the first point in the window (3 weeks of evidence could claim 6). MM-77's strict on-or-before convention excludes a person who began logging with the diet. **Recommended:** the latest point dated within 7 days either side of the deficit start whose smoothed value rests on at least 2 points (ME-4); if none, no line. **Change:** add `deficitStartOn(history, today, { restartOn })` returning the start `consecutiveDeficitWeeks` computes, and have the latter call it; the rule receives `snapshot.deficitRestartOn`.

### ME-2: 2.5% is the honest tolerance; 0% is a coin flip on noise and 5% calls a problem "held"
Severity **high**, confidence medium. One effective rep in Epley moves the estimate 2.4–3.2% (n = 1 to 11); one plate step is 2.5% at 100 kg, 4.2% at 60 kg. Session-to-session noise: 1RM retest CV median 4.2%, trained 3.3% (Grgic 2020); a 1-RIR load CV 2.7–6.2% (Lovegrove 2022); RIR misjudged by about a rep (Halperin 2022). Take σ_s ≈ 4%; a 3-point mean 2.3%; a difference of two 3-point means σ_d ≈ 3.3%. At 0% a truly held lift fails 50% of the time; at 2.5% about 22%; at 5% a lift down 5% (MM-117's "falling") is called held 50% of the time. **Verdict:** keep 97.5%, relative, on the smoothed values; register it as judgement with this arithmetic.

### ME-3: "Gone up" needs a rise of at least 5%
Severity **medium**. A positive claim needs a larger step than the neutral tolerance; `latest >= baseline × 1.05`: two effective reps, the mirror of MM-117's 5% drop, so falling, held and up sit on one scale (≤ −5%, [−2.5%, +5%), ≥ +5%).

### ME-4: Both ends rest on at least 2 smoothed points; "sessions" means qualifying points on distinct days; the 28-day gap matches the smoothing window
Severity **medium**, confidence high. A 29-day gap leaves an unsmoothed value. Require ≥ 2 points in each end's mean (derivable: points within 28 days before and at the end). Count points with an e1RM on distinct dates, inclusively from the baseline's date to the latest's; 4 is judgement.

### ME-5: "Latest" and "today" must be the shown workout's, and the count must receive the restart date
Severity **medium**, confidence high. For a finished workout the latest point is its own; for one in progress, the last finished point within 7 days; the weeks are counted to the workout's date with `deficitRestartOn`. The trailing mean means one build indexed by `workoutId` serves every card; test that a later workout does not change an earlier card.

### ME-6: The numbers shown must include the tolerance
Severity **medium**. Figures `fromKg`, `toKg`, `heldDownToKg` (= from × 0.975), `weeks`, `sessions`, dates; every kilogram through `Fmt.weight`, labelled "smoothed estimate".

### ME-7: Pounds and a tenth of a kilogram do not affect the test
Severity **low**. The brief's premise is wrong (F7); the comparison is relative and unit-free. Add a test in pounds.

### ME-8: Mixed RIR logging is a noise source larger than the tolerance
Severity **low**; unverified hypothesis. A best set at RIR 2 then one with no RIR loses 2 effective reps (−5.3%). Optional guard: evaluate only when both ends' best sets either carry an RIR or both lack one; otherwise record as a limitation.

### ME-9: "Shown once, then rested" is stale, and the weeks figure must be live
Severity **low**. The line shows on every workout while it holds, until snoozed; the words use the live count.

### ME-10: A recomp deficit counts as "fat-loss weeks"
Severity **low**; referred to nutrition and coaching. Guard on the fat-loss mode or word per goal.

### ME-11: Evidence register rows for every figure
Severity **medium**, required by the test. Rows: `strengthOnFatLoss` (judgement; the direction moderate per Murphy and Koehler 2022 as cited), `StrengthOnFatLossRule.minDeficitWeeks` (6), `heldTolerance` (2.5%, with the noise arithmetic: Grgic 2020, Lovegrove 2022), `upBy` (5%), `minSessions` (4 distinct days), `maxGapDays` (28, MM-77's window), `baselineWithinDays` (7 either side), `minSmoothedPoints` (2; the statistics strong, the figure judgement); upstream `estimatedOneRepMax` (Epley; Halperin 2022 supports the 12-rep cap; judgement) and `buildStrengthTrends.smoothing` (judgement).

### ME-12: Deloads and in-window pauses fail safe
Severity **low**. A deload drops the smoothed value for as long as it sits in the latest 28-day window; "held" fails and no line shows; it returns once the deload leaves the window.

## Sources and evidence
All accessed 2026-10-18.
1. Grgic J, Lazinica B, Schoenfeld BJ, Pedisic Z. "Test–Retest Reliability of the One-Repetition Maximum (1RM) Strength Assessment: a Systematic Review." *Sports Medicine – Open*, 17 Jul 2020. DOI 10.1186/s40798-020-00260-z. PMC7367986. 32 studies, n = 1,595; CV median 4.2%, trained 3.3%, untrained 5.5%.
2. Halperin I et al. "Accuracy in predicting repetitions to task failure in resistance exercise." *Sports Medicine* 52:377-390, 2021. DOI 10.1007/s40279-021-01559-x. Abstract. Underprediction 0.95 reps (95% CI 0.17-1.73), I² 97.9%; better at ≤ 12 reps.
3. Lovegrove S et al. "Repetitions in Reserve Is a Reliable Tool for Prescribing Resistance Training Load." *J Strength Cond Res* 2022;36(10):2696-2700. DOI 10.1519/JSC.0000000000003952. Abstract. 15 novice men aged 17; between-session load at 1 RIR CV 2.7-6.2%.
4. Anders JPV et al. *J Funct Morphol Kinesiol* 2020;5(1):4. DOI 10.3390/jfmk5010004. PMC7739404. Reliability sub-sample: bench 1RM CV 2.4%. Weak.
Searched, not used: Grant 2025; a Paralympic powerlifting record; bench-specific equations. Not opened: Murphy and Koehler 2022 (nutrition's).

## Research
Status performed. Questions: session-to-session noise of a 1RM and of an RIR-anchored load; RIR misjudgement; an Epley validity figure (none found). WebSearch (three) and WebFetch (five, one blocked), direct.

## Confidence and limitations
High on the facts and the Epley arithmetic; medium on the noise model (other populations; independence assumed). Source inspection only; no tests run; no render; hashes not computed.

## Acceptance criteria and edge cases
Proposed, with bench 100 kg × 6 at RIR 1 (123.33 kg) unless said, deficit from day 0: held with one bad day absorbed (sessions −3, 4, 11, 18, 25, 32, 39, shown day 46 at 100 × 5 RIR 1: ratio 0.991); not held (95 kg: 0.950); gone up at 107.5 kg (1.075), held at 102.5 kg (1.025); no baseline near the start (first session day 12); a lone baseline; a gap of 29 days; same-day sessions count once; judged on the workout's own date (a later weaker workout changes nothing); in progress (the last finished point, fact only); a restart date 20 days before (2 weeks, no line); pounds (225 lb held; 230 lb held; 240 lb up); the numbers show the band (100.0, 98.0, 97.5); a deload fails safe. Edge cases: mixed RIR; recomp; a deleted exercise; an edited workout; a changed exercise id.

## Dependencies
coaching (words for a band, the live weeks, "gone up"); nutrition (recomp; planned versus eaten); training (distinct-day sessions; the deload note); architecture (`deficitStartOn`; passing `deficitRestartOn`; points by `workoutId`); safety (none new). Tickets MM-77, MM-117, MM-141, MM-143, MM-362, MM-366, MM-378.

## Safety concerns
None new. The line is fact-only; its false negatives withhold a positive; bodyweight lifts are excluded. Not clinical clearance.

## Unresolved product decisions
1. The baseline within 7 days either side of the start (recommended) or MM-77's strict rule. 2. "Gone up" at 5% (recommended). 3. The mixed-RIR guard. 4. Recomp in or out. 5. A short pause inside the 6 weeks. Authority: owner.

## Verification
Source inspection and arithmetic only. Requested: engine tests for every scenario including pounds and the leakage test; the rows; `mm req`; `mm check`; a story for the held and gone-up states.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** Blocking: ME-1, ME-2, ME-3, ME-4, ME-5, ME-11. ME-6 to ME-10 and ME-12 before ship.
