# Review: nutrition

## Scope and traceability
- **Role:** nutrition and body composition (panel read-only lens). One subagent session, single pass; not independent personnel. Read-only.
- **Run:** `docs/agent-runs/mm377-strength-on-fat-loss/brief.md`. **Branch:** `spec/food-insights-and-snooze`, HEAD f2e8dfe with the MM-365/367/378 build in the working tree. **Hashes:** not computed; the chair records them.
- **Canonical inputs:** `AGENTS.md`, `agents/roles/nutrition.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, the template.
- **Prior reports built on:** the mm366 training (TR-6, TR-7, TR-9, TR-11), coaching (CO-2, CO-5) and safety (SA-3, SA-6) reports and decision.
- **Requirements inspected:** MM-377 (subject), MM-366, MM-362, MM-378, MM-141, MM-140, MM-149, MM-147, MM-135, MM-31, MM-117, MM-114, MM-118, MM-92, MM-77.
- **Code inspected:** `engine/{consecutiveDeficitWeeks,summarizeAdherence,usableIntakeDays,intakeStandingOf,AdherenceSummary,TargetsRecord,findReliefOffer,ReliefRule,computeTargetsTraced,nextTargets,analyze,assessStall,GapRule,PauseRule,ItemInsightKind,InsightSafeguards,allowedItemInsights,itemInsightKinds,volumeJumpInsights,buildStrengthTrends,StrengthTrend,estimatedOneRepMax,WeightTrendPoint}.ts`; `domain/CoachingPolicy.ts`; `format/itemInsightText.ts`; `test/engine/coach.test.ts`, `activityGap.test.ts`, `evidenceRegister.test.ts`; `docs/evidence.md`.

## Existing facts versus proposals
1. `consecutiveDeficitWeeks` walks the targets history backwards while `weeklyRateFraction < 0` and counts whole weeks; it knows nothing about gaps itself. The restart is an input, `restartOn`, which the caller supplies as `snapshot.deficitRestartOn`: the later of the return from an activity gap of 14+ days (no weigh-in and no food, `GapRule.deficitBreakDays`) and the end of a pause of 7+ days (`PauseRule.deficitBreakDays`). Targets never have gaps. So "a two-week gap in targets breaks it" (MM-377) is not what the code does.
2. Partial logging never breaks the count.
3. **Recomp is a deficit** to this function (rate −0.25% or −0.1% a week); `TargetsRecord.mode` tells recomp and fat loss apart.
4. A requested maintenance week or the forced break issues a record with rate 0, so the count is 0 during it and restarts after. MM-135 will move the offer to 12 weeks and the cap to 20.
5. The adherence summary is descriptive by design (MM-149); partial and unlogged days count against nothing.
6. The stall assessment is the app's measurement of whether a planned deficit is producing loss, with diagnoses data, masked, intake, estimate.
7. Kind flags available: `aboutWeight`, `notWithEatingDisorderHistory`, `notWhileUnderEating`, `notWithCautions`. An eating-disorder history and underweight remove fat loss and recomp from the allowed modes; `lowBodyWeight` is a caution.
8. `trendKg` is the mean of up to 3 points within 28 days; e1RM is undefined above 12 effective reps, at RIR 5+, and for a bodyweight lift without a weigh-in in 7 days. The app has no lean-mass measurement.
9. `docs/evidence.md` has no row for `consecutiveDeficitWeeks`, `GapRule.deficitBreakDays`, `PauseRule.deficitBreakDays`, `estimatedOneRepMax` or the strength smoothing.
10. Murphy and Koehler 2022's abstract says: lean-mass gains impaired (ES −0.57, p = 0.02), strength gains not significantly so (ES −0.31, p = 0.28).
11. MM-377's draft words name the goal, not intake; no "maintenance", "deficit", "cut", "muscle" or grading word. Its criteria lack recomp, a goal switch, a maintenance break, a stall, a looked-back workout and words about muscle.

**Proposals:** everything under Findings, the rows and the criteria.

## Audit coverage
Mode `change`. Methods: source inspection, arithmetic, web research (4 sources opened). Not inspected: `StrengthHistoryScreen`, `activityGaps.ts`, `pauseDeficitRestartOn.ts`, renders, any test run. Absent: no rule, kind, words or row exists. Referrals: measurement (tolerance, baseline, as-of date), coaching (recomp words; "right now" beside a relief offer), safety (NU-6).

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

### NU-1: The ticket misdescribes what the "fat-loss weeks" rest on and what breaks them
Severity **medium**, confidence high. The count is broken by a non-deficit targets record, a 14-day run with no weigh-in and no food, or a 7-day pause, and only when the caller passes `snapshot.deficitRestartOn`. The line is anchored to a workout, so the count must be taken as of the workout's date over the records effective by then. **Change:** state the basis as "whole weeks of fat-loss targets in force as of the workout's date, restarted by `CoachSnapshot.deficitRestartOn`, ended by any maintenance week"; note MM-135 as a dependency.

### NU-2: Recomp weeks count as fat-loss weeks, and the words would then be false
Confirmed requirement violation; severity **high**. Recomp's aim is not to hold strength. **Change:** the line is for the fat-loss goal only: every targets record in the window has `mode === 'fatLoss'` and a negative rate; a mode change inside the window breaks it. Recomp gets no line until a recomp-specific rule is drafted.

### NU-3: No intake requirement should be added; a weight-trend coherence guard should be
Severity **medium**, confidence medium-high. Food records under-report energy intake by 11–41% against doubly labelled water (Burrows 2019, 59 studies, 6,298 adults), more in restrained eaters and at higher BMI; requiring usable days or an adherence standing would make the line a reward for logging (MM-92, MM-149) and still not show a deficit. **So no intake-day or adherence requirement.** But "fat-loss goal" is only meaningful if the plan is producing loss; the app's instrument is `assessStall`. **Change:** not shown while the stall assessment as of the workout's date is `stalled`; `notAssessed` may show. This reads weight but shows none, so the kind need not be `aboutWeight`. The owner may decline the guard.

### NU-4: Strength held says nothing about lean mass; the words comply, the guards do not yet exist
Severity **medium**, confidence high. Murphy and Koehler 2022: strength held even when lean mass is not, so held strength is not evidence that lean mass was kept; their meta-regression put the deficit preventing lean-mass gains at about 500 kcal a day, and the app's default fat-loss pace is about 700 kcal a day at 80 kg. In trained athletes lean-mass change ranged from +1.3 to −6.6 kg and the methods disagreed (Roth 2022). The draft words comply. **Change:** the words test forbids "muscle", "lean", "mass", "body composition", "preserved", "kept your", "well-run", "working", "below maintenance", "deficit", "cut", "eating" and any kcal figure; the evidence shows "Estimated max, smoothed: X at the start, Y now", "Sessions: N in 6 weeks", "Fat-loss targets in force since <date>", and no body-weight or intake figure.

### NU-5: Maintenance break and relief offer: the rule behaves correctly, two points for the ticket
Severity **low**. During a maintenance week the count is 0; after it the count restarts and the line can fire again 6 weeks into the next run; both are right. Beside an open relief offer, "right now" can read as "carry on"; the owner decides; I lean to showing it.

### NU-6: Under-eating and low body weight should withhold the line
Severity **medium**, confidence medium. A line attaching "the aim right now" to a fat-loss goal, read by a restricting person, approves the state MM-114 tries to interrupt. **Change:** `notWhileUnderEating: true`; `notWithEatingDisorderHistory: true` as drafted; `notWithCautions: ['underweight', 'lowBodyWeight']` recommended, the low-weight part the owner's call.

### NU-7: Evidence rows the rule and its figures need
Severity **medium**, blocking before ship. Rows: `strengthOnFatLoss` (moderate for the direction, judgement for the figures and the planned basis; Murphy and Koehler 2022; Burrows 2019; the line claims nothing about muscle), `StrengthOnFatLossRule.weeks` (6, judgement), `heldFraction` (0.975, judgement checked by measurement), `minSessions` (4), `maxGapDays` (28), `consecutiveDeficitWeeks`, `GapRule.deficitBreakDays` (14), `PauseRule.deficitBreakDays` (7); and, seconding TR-11, `estimatedOneRepMax` and the strength smoothing. A plain-language question "What does the coach say about my lifting while I lose fat?".

## Sources and evidence
Accessed 2026-10-18.
1. Murphy C, Koehler K. "Energy deficiency impairs resistance training gains in lean mass but not strength: A meta-analysis and meta-regression." *Scand J Med Sci Sports* 2022;32(1):125-137. DOI 10.1111/sms.14075. Abstract (TUM portal). LM ES −0.57, p = 0.02; strength ES −0.31, p = 0.28; matched: LM −0.11 vs 0.20, strength 0.84 vs 0.81; about 500 kcal/day prevents LM gains. Study counts, CIs and training status not in the abstract.
2. Burrows TL, Ho YY, Rollo ME, Collins CE. "Validity of Dietary Assessment Methods When Compared to the Method of Doubly Labeled Water: A Systematic Review in Adults." *Front Endocrinol* 2019;10:850. DOI 10.3389/fendo.2019.00850. 59 studies, 6,298 adults; food records under-report by 11–41%.
3. Roth C, Schoenfeld BJ, Behringer M. "Lean mass sparing in resistance-trained athletes during caloric restriction: the role of resistance training volume." *Eur J Appl Physiol* 2022;122(5):1129-1151. DOI 10.1007/s00421-022-04896-5 (PMC9012799). 15 studies, 129 trained participants; lean-mass change +1.3 to −6.6 kg; methods disagreed.
4. Loenneke JP et al. "Exercise-Induced Changes in Muscle Size do not Contribute to Exercise-Induced Changes in Muscle Strength." *Sports Med* 2019. Metadata only; not cited.
Searched, not opened: Hill and Davies 2001; Ravelli and Schoeller 2020; Sardeli 2018.

## Research
Status: performed. Questions: strength held as evidence of lean mass kept; whether logged intake can establish a deficit; lean-mass change in dieting lifters. WebSearch and WebFetch, direct; the TUM PDF and Springer page blocked.

## Confidence and limitations
High on NU-1, NU-2, NU-5, NU-7; medium-high on NU-3, NU-4; medium on NU-6. No test run; no render; hashes not computed; single session.

## Acceptance criteria and edge cases
Proposed: recomp is not fat loss; a goal switch breaks the window; a maintenance week ends the run and 6 weeks after it resumes the line may show; judged as of the workout; a silent fortnight restarts the count; partial logging does not matter; a stall withholds (if NU-3); under-eating withholds (if NU-6); words forbid the muscle list. Edge cases: a pause under 7 days; food older than 60 days reading as a gap; the first 6 weeks including calibration; a missing baseline point; a deload; MM-135's later cap; hidden weight with the stall guard.

## Dependencies
measurement (the tolerance, baseline, as-of date; `assessStall`'s window against 6 weeks); coaching ("right now" beside a relief offer; recomp words); safety (NU-6); chair (MM-135 changes the count's semantics). Interfaces: `consecutiveDeficitWeeks`, `CoachSnapshot.deficitRestartOn`, `TargetsRecord.mode`, `assessStall`, `ItemInsightKind` flags, `buildStrengthTrends`.

## Safety concerns
Approval attached to weeks on a fat-loss goal, read by someone restricting or near the underweight boundary (NU-6); an implied muscle-retention claim (NU-4); incoherence beside a stall or relief offer. Not clinical clearance.

## Unresolved product decisions
1. The stall guard (NU-3). 2. Recomp excluded now or a variant (NU-2). 3. `lowBodyWeight` withholding (NU-6). 4. Show while a relief offer is open (NU-5). 5. A logged-days count in the evidence (optional). Authority: product owner.

## Verification
Source inspection and web research only. Requested: engine tests per scenario; the words test extension; the rows; `mm req`; `mm check`.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** Planned targets are the right basis and no intake requirement should be added; the words claim nothing about muscle. Before build: NU-2 (fat-loss mode only) and NU-1 (the basis stated correctly and taken as of the workout). NU-3, NU-6 and NU-7 before ship.
