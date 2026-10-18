# Review: training

## Scope and traceability
- **Role:** training (panel read-only reviewer), a single model session acting as a review lens, holding no credentials.
- **Run:** `docs/agent-runs/mm366-workout-rules/` (brief read in full). **Commit:** 684f870 on `feat/inline-insights-framework`.
- **Requirements inspected:** MM-366 (subject), MM-362, MM-141, MM-79 (`requirements/training/STORY.progression-suggestions.MM-79.md`), MM-78 (`STORY.weekly-volume-per-muscle-group.MM-78.md`), MM-77 (`STORY.strength-trend.MM-77.md`).
- **Other inputs:** `docs/evidence.md`; engine `estimatedOneRepMax.ts`, `buildStrengthTrends.ts`, `buildWeeklyVolume.ts`, `suggestProgression.ts`, `consecutiveDeficitWeeks.ts`; domain `Exercise.ts`, `MuscleGroup.ts`; `format/progressionText.ts`; `train/WorkoutExerciseCard.tsx`; `gallery/screens/CoachingInsights.stories.tsx`; `fixtures/DemoSeed.ts`.
- **Not read:** MM-361 and MM-108 (coaching's).
- **Input hashes:** not computed (read-only tools); the chair records them.

## Existing facts versus proposals
**Repository facts (source inspection):**
- **e1RM** is Epley with effective reps (reps + RIR), undefined above 12 effective reps, at RIR 5+, for a bodyweight lift with no weigh-in, and for total resistance ≤ 0 (`engine/estimatedOneRepMax.ts:24-29`). A missing RIR counts as 0 (MM-77).
- **A session's e1RM** is its best set's, per finished workout (`buildStrengthTrends.ts:48-67`). Bodyweight comes from the latest weigh-in at most 7 days old (`:54-59`). `trendKg` is the mean of up to 3 points within 28 days (`:69-76`). A deleted exercise yields no e1RM (`:53`).
- **MM-79 progression** (`suggestProgression.ts`): a session is the sets of the lift in one finished workout, counting only sets at its top load (`:72-87`). On fat loss it always returns `match` and says nothing about a stall (`:106-108`). A stall (`hold`) is the last 3 sessions at one top load, ≤ 28 days apart, neither of the last two with more total reps than the first (`:113-130`). MM-79 rejected e1RM as the progress measure: "it moves with reps in reserve, which is a judgment, and it is not worked out above 12 reps" (`MM-79.md:27-29`).
- **Suggestion words** (`progressionText.ts:21-26`): addReps "One more rep on any set would be a step up."; addLoad "…A step up would be X."; hold "No more reps at this load in three sessions. Holding X is a fair aim."; match "Matching last time holds your strength while you lose fat."
- **Weekly volume** (`buildWeeklyVolume.ts`) uses two rolling 7-day windows anchored at `today` (`:26-28`). A hard set has RIR ≤ 4 or none (`:39`); 1.0 to the primary group, 0.5 to each secondary (`:50-54`); in-progress workouts excluded (`:27`); deleted exercises go to `unmapped*Sets` (`:41-48`). No 4-week computation exists.
- **Muscle mapping** is never missing for an existing exercise: `Exercise.primary` is required (`Exercise.ts:10,35`). Only a deleted exercise is unmapped.
- **Deficit weeks** exist as `consecutiveDeficitWeeks(history, today, {restartOn})`: whole weeks of unbroken *planned* deficit targets; a 2-week gap breaks it (`consecutiveDeficitWeeks.ts:4-27`). Targets, not intake.
- **The workout card** shows the suggestion only on an in-progress workout (`WorkoutExerciseCard.tsx:70-82`); order Last time, suggestion, inline line (`:126-135`); the line comes from the design seam (`:58,61`).
- **The approved story** draws "holding steady" under the demo's dumbbell lateral raise on a finished workout (`CoachingInsights.stories.tsx:314-342`). The demo logs it as 1 × 20 reps at 8 kg with no RIR (`DemoSeed.ts:197-200`): 20 effective reps, so no e1RM exists for it.
- **MM-141's "strength holding on a cut"** is not built (`MM-141.md:113`); its only definition is "e1RM held or up over 6 weeks of deficit" (`:44`).
- **`docs/evidence.md`** has no training rows at all (`:128-224`).
- MM-366's Description says "The four rules" (`:38`); the table has three.

**Proposals:** everything under Findings and Acceptance criteria.

## Audit coverage
- **Mode:** `change`: the proposed rules plus e1RM, strength trend, progression, weekly volume, deficit weeks, the workout card, the story and demo data.
- **Not inspected:** tests under `apps/mobile/test/**`; `WeeklyVolumeScreen.tsx`; `StrengthHistoryScreen.tsx`; `nextLoadKg`, `defaultRepRange`; MM-118; MM-361, MM-108; the mm361 reports; `evidenceRegister.test.ts`.
- **Absent:** no inline workout rule, no multi-week volume baseline, no "strength on a cut".
- **Referrals:** coaching (wording, "well-run cut", "step" clashing with MM-79); safety (deficit praise, bodyweight figures under hidden weight or eating-disorder history); measurement (noise band, smoothing tolerance); nutrition (planned versus measured deficit).
- **Methods:** source inspection and arithmetic only.

## Novice mobile experience (when UX/product design is assigned)
Not assigned. TR-3, TR-5 and TR-8 are training-semantics findings, not walkthroughs.

## Findings

### TR-1: Holding steady cannot fire on the approved demo lift
- Confirmed requirement violation. Severity **high**, confidence high.
- The lateral raise is 20 reps, no RIR (`DemoSeed.ts:197-200`); `estimatedOneRepMax.ts:25` returns undefined above 12 effective reps; the story shows "Change in estimated best: none". The rule "e1RM within 1% across 4 sessions" can never fire for this lift, which MM-77 seeds as high-rep only.
- **Change:** define holding steady on MM-79's session basis (TR-2), or move the story to a lift with an e1RM. Criterion: a lift whose sets are all above 12 effective reps shows no e1RM-based figure.

### TR-2: Holding steady defines "no progress" differently from MM-79
- Evidence-supported concern plus conflict with a sibling decision. Severity **high**, confidence high.
- MM-79 rejected e1RM because RIR is a judgment. Halperin et al. 2022: reps to failure underpredicted by 0.95 (95% CI 0.17–1.73), I² 97.9%.
- One effective rep at 8 reps moves Epley by about 2.6%; the smallest plate step at 100 kg is 2.5%. A 1% band means "the identical best set four times", and an RIR estimate change with unchanged performance breaks it at random.
- False positive: 60 kg × 8,8,7 then 8,8,8 is progress by MM-79, but the best set's e1RM is unchanged, so "about the same" fires.
- "Within 1%" is undefined; there is no gap limit; the app would carry two stall definitions (3 sessions and 4).
- **Change:** a session as `suggestProgression` defines it; fire when the last N finished sessions (N = 3 to match MM-79, or 4) share one top load (±0.05 kg), are ≤ 28 days apart, and no later session has more total reps at that load than the first. Drop the 1% band.

### TR-3 (PD-5): A lift line and the MM-79 suggestion give clashing advice
- Severity **high**, confidence high. **Answer to PD-5: no**, they should not both give advice.

  | MM-79 kind | Suggestion text | Effect of the line |
  |---|---|---|
  | `addReps` | "One more rep on any set would be a step up." | repeats it |
  | `addLoad` | "…A step up would be X." | repeats it |
  | `hold` | "Holding X is a fair aim." | contradicts it, restating the same fact |
  | `match` (fat loss) | "Matching last time holds your strength while you lose fat." | contradicts it, and breaks "On fat loss nothing is said about a stall" (`MM-79.md:31`) |

- **Change:** one direction per card, owned by MM-79 on an in-progress workout. Holding steady is not shown on an in-progress card (MM-79's `hold` is its sibling, MM-318), only on a finished workout and the exercise's history; never on fat loss. Any line beside a suggestion is fact-only.

### TR-4: Volume jump has no data source for its baseline, and the baseline is fragile
- Requirement gap plus evidence concern. Severity **high**, confidence high.
- `buildWeeklyVolume` computes only two windows; the 4-week average needs five. "This week" must mean MM-78's rolling 7 days (`MM-78.md:19`).
- A new user's weeks 3 to 5 average in zero weeks, so nearly everyone ramping up triggers it; a missed week does the same; 2 → 3 sets is 50%.
- The ≥ 1.5 ratio is effectively an acute:chronic workload ratio. Impellizzeri et al. 2020 show ACWR thresholds rest on mathematical coupling and unestablished causality; the AIS advised against ACWR as an injury indicator. The 50% figure is judgement and must never be worded as injury risk.
- **Change:** windows w0..w4 of 7 days ending `ref − 7k`, counted as `buildWeeklyVolume` counts; baseline the mean of w1..w4; fire only if ≥ 3 of w1..w4 have ≥ 1 hard set for the group, w0 ≥ 1.5 × baseline, and w0 − baseline ≥ 4 sets (floor proposed). Halves allowed; baseline rounded with "about". Generalize `buildWeeklyVolume` rather than count a second way.

### TR-5: The volume window is anchored to today, not to the workout shown
- Severity **medium**, confidence high. A workout from 3 weeks ago would show this week's jump; during an in-progress workout today's sets are excluded.
- **Change:** anchor `ref` to the viewed workout's date (for an in-progress one, the finished workouts before it, said in the evidence), or show the line only on the in-progress or latest workout.

### TR-6: "Strength on a cut" is undefined and must be specified before it is built
- Severity **high**, confidence high.
- **Change:** deficit = `consecutiveDeficitWeeks(...) ≥ 6`; held = latest `trendKg` ≥ the baseline point at the 6-week mark (≤ 7 days before it) less a 2.5% tolerance (judgement, measurement to challenge; 0 if "held or up" is literal); ≥ 4 sessions in the window, no gap over 28 days; exclude bodyweight lifts (TR-9). The period is a *planned* deficit, so "eating below maintenance" claims more than the data records (to coaching).

### TR-7: Holding steady pre-empts strength on a cut, the wrong way round
- Severity **medium**, confidence high. With holding steady first, a flat lift on a cut shows "step up" and hides the rule meant for it.
- **Change:** holding steady does not apply on fat loss; strength on a cut is fact-only; volume jump stays above it.
- Murphy & Koehler 2022: strength gains not significantly impaired in deficit (ES −0.31, p = 0.28), lean-mass gains impaired (ES −0.57, p = 0.02). Held strength does not show lean mass was kept or that the cut was "well run".

### TR-8: Which cards get the volume line is unspecified
- Severity **medium**, confidence medium. Anchor only exercises whose `primary` is the group. Owner: once under the first such exercise, or under each.

### TR-9: Bodyweight exercises behave wrongly under the e1RM-based rules
- Severity **medium**, confidence high. Bodyweight e1RM = (bodyweight + added) × Epley factor: losing 3 kg on a cut with the same pull-ups shows a falling e1RM; with no recent weigh-in there is none; evidence figures would let a user work out their bodyweight (MM-118, eating-disorder safeguard; to safety); high-rep bodyweight work never has one.
- **Change:** holding steady on MM-79's basis handles bodyweight by reps at added load; strength on a cut excludes `load: 'bodyweight'`; no inline evidence shows an e1RM including bodyweight.

### TR-10: Edge cases are missing from the criteria
- Severity **medium**, confidence high. Deloads (no marker; one deload week lowers the baseline 12.5%, next normal week about 1.14×, no fire; a deload breaks holding steady and "held", safely); new lifts (test N−1); missed weeks (gap limit, 3 of 4 weeks); deleted exercises (no line); same-day sessions (each counts); RIR 5+ (out of e1RM and hard sets, in MM-79 sessions); edits and deletes recompute.

### TR-11: The evidence register has no rows for these rules or their inputs
- Severity **medium**, confidence high. Rows to add, all Checked = No:

  | Name | Value | Decides | Source | Grade | Population |
  |---|---|---|---|---|---|
  | `holdingSteady` (3 or 4 sessions, 28-day gap, ±0.05 kg) | TR-2 | When the coach says a lift is holding steady | MM-79 double progression; ACSM 2026: progression not necessary for benefit, overload "likely a requirement only for those seeking continued longer term progress" | judgement | Healthy adults; thresholds product judgement |
  | `volumeJump` (1.5, 4 weeks, ≥ 3 weeks with sets, +4 floor) | TR-4 | When the coach mentions a jump in weekly sets | Nosaka & Aoki 2011 (repeated bout effect); ACWR contested (Impellizzeri 2020), not a source for 1.5 | judgement (figures), emerging (direction) | Mostly untrained lab eccentric protocols, extrapolated |
  | `strengthOnACut` (6 weeks, 2.5%, ≥ 4 sessions) | TR-6 | When the coach says strength held in a deficit | Murphy & Koehler 2022 | moderate (strength generally maintained), judgement (figures) | RCTs training in ≥ 3 weeks of deficit |

  Also upstream rows: `estimatedOneRepMax` (Epley, 12-rep cap, missing RIR = 0, RIR 5+ excluded), hard set RIR ≤ 4, the 0.5 secondary weight, the 10–20 set band (ACSM 2026: enhanced at ≥ 10 sets a week, diminishing around 18–20). Words must not claim more than the grade: "can raise soreness".

### TR-12: The wording of the volume line clashes with the suggestion
- Severity **low**. "A smaller step" beside "would be a step up" may read as a lighter load. Name the unit ("fewer added sets").

### TR-13: The ticket's description and criteria disagree with its table
- Severity **low**. "Four rules" (three); the holding-steady criterion uses an undefined band.

## Sources and evidence
All accessed 2026-10-17.
1. Halperin I, Malleron T, Har-Nir I, et al. "Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis." *Sports Medicine* 52:377–390, 20 Sep 2021. DOI 10.1007/s40279-021-01559-x. https://pure.solent.ac.uk/en/publications/accuracy-in-predicting-repetitions-to-task-failure-in-resistance-/ (abstract record). Underprediction 0.95 reps, I² 97.9%; better at ≤ 12 reps. 12 studies, 414 healthy participants. Abstract only.
2. Impellizzeri FM, McCall A, Ward P, Bornn L, Coutts AJ. "Training Load and Its Role in Injury Prevention, Part 2." *J Athl Train* 2020;55(9):893–901. DOI 10.4085/1062-6050-501-19. https://pmc.ncbi.nlm.nih.gov/articles/PMC7534938/ (first 100k characters). ACWR coupling, causality, contested sweet spot; AIS advice. Team-sport literature; a critique.
3. Murphy C, Koehler K. "Energy deficiency impairs resistance training gains in lean mass but not strength." *Scand J Med Sci Sports* 2022;32(1):125–137. DOI 10.1111/sms.14075. https://portal.fis.tum.de/en/publications/energy-deficiency-impairs-resistance-training-gains-in-lean-mass-/. Abstract only.
4. Nosaka K, Aoki MS. "Repeated Bout Effect: Research Update and Future Perspective." *Brazilian Journal of Biomotricity* 2011;5(1):5–15. https://ro.ecu.edu.au/ecuworks2011/697. Abstract only, narrative review.
5. Currier BS, D'Souza AC, Fiatarone Singh MA, … Phillips SM. "ACSM Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults." *Med Sci Sports Exerc* 2026;58(4):851–872. DOI 10.1249/MSS.0000000000003897. https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823 (first 100k characters).

Searched, not used: Schoenfeld, Ogborn & Krieger 2017; Cheung et al. 2003; Hyldahl 2017. Revalidate if the ACSM full text gives volume-progression guidance, or if e1RM is adopted despite MM-79.

## Research
- **Status:** performed. Questions: is a 1% band larger than RIR noise; is ≥ 50% evidenced and is soreness supported; does strength hold in deficit and does that mean a "well-run" cut; current guidance on progression and sets. WebSearch and WebFetch, direct; generic public queries only. PubMed blocked by a cookie wall; alternative records used.

## Confidence and limitations
High on TR-1 to TR-6, TR-9, TR-10 (code-grounded); medium on the proposed figures (+4 floor, 2.5%, 3 of 4 weeks), which are judgement. External evidence read at abstract or partial level. Tests and `StrengthHistoryScreen` not inspected. One session's review.

## Acceptance criteria and edge cases
**Existing, traced:** holding steady relies on the undefined band; not enough history tests 2 sessions only; volume jump has no baseline or anchor; no line under a set is consistent; eating-disorder history consistent; no tests yet.

**Proposed:**
```gherkin
Scenario: Holding steady on MM-79's basis
  Given the last 3 finished sessions of a lift at 60 kg with 8,8,7 / 8,8,7 / 8,7,7 reps, each within 28 days
  And the workout shown is finished
  Then "holding steady" is shown under that exercise

Scenario: Progress in total reps is not "holding steady"
  Given sessions at 60 kg of 8,8,7 then 8,8,8
  Then no holding-steady line is shown

Scenario: Not on an in-progress card / not on a cut
  Given a workout in progress, or the goal is fat loss
  Then no holding-steady line is shown, and the MM-79 suggestion is the only direction on the card

Scenario: Gaps break the pattern
  Given two consecutive sessions of the lift 35 days apart
  Then no holding-steady line is shown

Scenario: High-rep lift
  Given a lift whose sets are all above 12 effective reps
  Then no figure based on an estimated max is shown for it

Scenario: Volume baseline needs history
  Given chest sets in only 2 of the previous 4 weekly windows
  Then no volume-jump line is shown

Scenario: Small base
  Given 3 chest sets this week against an average of 2
  Then no volume-jump line is shown

Scenario: Anchored to the workout
  Given a finished workout dated 21 days ago
  Then any volume-jump line under it uses the five 7-day windows ending on that date

Scenario: Deleted exercise
  Given a workout exercise whose exercise was deleted
  Then no inline training line is shown under it

Scenario: Strength on a cut
  Given 6 whole weeks of planned deficit (consecutiveDeficitWeeks = 6)
  And at least 4 sessions of a barbell lift in that span with no gap over 28 days
  And its latest smoothed e1RM is at least 97.5% of the smoothed value at the start
  Then "strength on a cut" is shown under that lift, with no direction

Scenario: Bodyweight lift on a cut
  Given a pull-up history on a cut
  Then "strength on a cut" is not evaluated for it, and no e1RM including bodyweight is shown
```
Further: deloads, same-day doubles, RIR 5+, edits and deletes, assisted lifts (negative load), pounds users (±0.05 kg).

## Dependencies
coaching (fact-only beside a suggestion, "well-run cut", "can raise soreness", "fewer added sets", planned versus eaten); safety (deficit praise, bodyweight e1RM under MM-118 and eating-disorder history); measurement (2.5% and 3-point smoothing); nutrition (planned or measured deficit). Interfaces: `suggestProgression`, `buildStrengthTrends`, `buildWeeklyVolume` (multi-window), `consecutiveDeficitWeeks`, `ItemInsight`. Tickets MM-77, MM-78, MM-79, MM-141, MM-362, MM-118, MM-143.

## Safety concerns
The volume line points toward less, not more; it must never claim injury risk. "A well-run cut" risks approving eating below maintenance and overclaims. Bodyweight figures could reveal weight. No pain, injury or form inference. Not clinical clearance.

## Unresolved product decisions
1. Keep holding steady (on MM-79's stall, finished workouts and history only) or drop it (MM-79's `hold` already says it). Owner.
2. N = 3 (matches MM-79; recommended) or 4. Owner.
3. Volume line once per workout or under every primary-group exercise. Owner.
4. "Deficit" as planned targets or measured intake. Owner, with nutrition.
5. "Held" tolerance 0% or about 2.5%. Owner, with measurement.

## Verification
Source inspection only at 684f870. TR-1 rests on `DemoSeed.ts:197-200` against `estimatedOneRepMax.ts:25`. Requested: engine tests per criterion, a story re-render, `mm req`, `mm check`, `evidenceRegister.test.ts` with the new rows.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** Do not build holding steady with the 1% band, or strength on a cut, as written. Blocking: TR-1 to TR-4 and TR-6; holding steady on MM-79's basis; one direction per card; the multi-week volume baseline with floors, anchored to the shown workout; a full definition for strength on a cut excluding bodyweight lifts; register rows for every rule and constant.
