# Review: measurement

## Scope and traceability
- Role: measurement (`agents/roles/measurement.md`). Reviewer: Claude Code read-only subagent, panel run `mm301-waist-in-place`.
- Requirements: MM-301; MM-155 (`requirements/body-measurements/STORY.measurement-protocol-and-noise.MM-155.md`).
- Inputs: `brief.md`; `DashboardScreen.tsx`, `WaistRow.tsx`, `WeighInRow.tsx` (hint), `saveWaistReadings.ts`, `WaistEntryCard.tsx`, `ProgressScreen.tsx`, `WaistRule.ts`, `waistNoiseOf.ts`, `waistChangeOf.ts`, `ReminderRule.ts`, `ReminderFacts.ts`, `recompSignalOf.ts`, `assessStall.ts` (100–149), `recompReviewOf.ts` (call site), `WaistObservation.ts`, `SqlWaistRepository.ts`, `InMemoryWaistRepository.ts`, `waistSummary.ts`, `waistAmount.ts`, `Fmt.ts`, `waistDueScenario.ts`, `dashboard.test.tsx` (173–223).
- Commit: `feature/dashboard-waist-in-place`, uncommitted on `0ad476a`. Hashes: not computed by the reviewer; recorded by the chair.

## Existing facts versus proposals
- MM-155's protocol: first thing in the morning, after the bathroom, before eating; standing, relaxed, end of a normal breath out; tape level with the navel. One-reading quick entry is allowed and recorded as such; the app "says once what it costs".
- Noise: 1.0 cm middle of three, 1.5 cm single; personal figure after 8 three-reading entries, floor 0.5 cm; a change must exceed 1.4 × noise. Any single reading at either end widens the whole comparison by 1.5.
- Every consumer (recomp signal, stall diagnosis, recomp review, Progress summary) goes through `waistChangeOf`.
- The Dashboard stores `waistCm` = the reading with `readings=[cm]`; `isSingleReading` is true on read-back; the test checks it.
- Window: the Dashboard asks when the last is 7+ days old; the reminder and Progress' "next is due" use the same window.
- Hints: the Dashboard gives only the tape technique; the weigh-in row and Progress give the time of day.
- Saves upsert on the day (MM-155 records it).
- Display: the Dashboard uses `fmt.length` (0.1); Progress uses `waistAmount` (0.5 cm / 0.25 in), as MM-155's "Rounding" scenario requires.

## Audit coverage
Mode `change`. Source inspection and arithmetic only; no runtime, no tests run, renders not opened, waist engine tests and `Units.inchesToCm` not inspected. Referrals: safety and nutrition (ME-1), ux-accessibility and product-designer (ME-2, ME-3).

## Novice mobile experience (when UX/product design is assigned)
Not assigned; the hint is reviewed only where it affects how the measurement is taken.

## Findings

**ME-1. The one-reading path widens the change threshold 50% and blocks the personal noise figure; downstream handling is correct.** Evidence-supported domain concern. Medium. Non-blocking. Confidence high (arithmetic), medium (user impact).
- Threshold 1.4 cm (three) vs 2.1 cm (any single at either end): a steady change is called ~50% later (about 6 weeks instead of 4). Only three-reading entries count toward the personal figure, so Dashboard-only users stay on the default. The penalty is all-or-nothing for up to 21 days.
- Downstream: the recomp signal "holds" less often; the stall diagnosis' `masked` branch fires less often, so more stalls fall to `intake` or `estimate`, which can move the target. The honest price of noisier data, but it leans one way.
- Remediation: keep one reading; record the cost in MM-301; offer a way to three readings (ME-3); safety and nutrition to confirm a rarer `masked`. Proposed engine test: only single entries give the single-reading noise and no personal figure.

**ME-2. The Dashboard hint leaves out the timing the protocol relies on.** Confirmed requirement violation (MM-155 lines 26–27). Medium. **Blocking.**
- `WaistRow` gives only technique; the field shows all day from day 7, so it is often seen after meals. Measuring after eating is a systematic upward shift that neither the noise figure nor three readings remove; mixing morning (Progress) and afternoon (Dashboard) entries can make or hide a change.
- Remediation: the hint carries the condition, e.g. "Morning, before eating. Tape level with the navel, snug, breathe out normally." Proposed criterion: the hint says morning, before eating, at the navel.

**ME-3. The Dashboard never says what a one-reading entry costs, and offers no way to three readings.** Requirement gap. Low. Non-blocking.
- Options: (a) say it once, on the first Dashboard save; (b) a quiet "Three readings in Progress" route; (c) rely on "Open Progress" and record that Progress meets the "says once" duty. Preference (a) or (c).

**ME-4. The 7-day window is right, but the day-6/day-7 boundary is untested.** Gap. Low. Non-blocking.
- Proposed: 6 days ago, no field; 7 days ago, the field; asserted against `ReminderRule.measurementEveryDays`.

**ME-5. Dashboard waist values shown to 0.1, against MM-155's rounding rule; the snack may not echo a quarter inch.** Confirmed requirement violation (MM-155 "Rounding"). Low. Non-blocking.
- "Last 37.0 in", the snack and the measured row use `fmt.length`; Progress uses `waistAmount`. 35.25 in typed may be confirmed as 35.3 or 35.2.
- Remediation: `waistAmount` for every waist value on the Dashboard; proposed criterion "35.25 in saved, the confirmation says 35.25 in".

**ME-6. Same-day replace adds no defect, but correcting a Dashboard typo is undocumented.** Gap. Low. Non-blocking.
- After a save the Dashboard shows the row, not the field, so it cannot downgrade a Progress triple. A plausible typo can only be corrected by re-saving in Progress, which does not say today's entry exists or will be replaced.
- Remediation: state the correction route in MM-301; whether Progress should show today's entry is the owner's.

**ME-7. The 1.5× single-reading factor may overstate the cost (hypothesis).** Low. Non-blocking. Confidence low.
- Three readings in one sitting do nothing about 1–2 cm between mornings; if that dominates, a single reading is only modestly worse. No change now; a question for MM-155's re-estimation, with research and domain review first.

## Sources and evidence
No external sources. Repository files and order-statistic arithmetic; MM-155's magnitudes quoted, not re-verified.

## Research
Status: unnecessary. The questions apply an approved model to a new entry path. Research would be needed before resizing `singleReadingFactor` (within-day vs between-day variation of self-measured waist at the navel).

## Confidence and limitations
High on code facts and arithmetic; medium on user impact; low on ME-7. Renders and engine tests not inspected; hashes not computed; single reviewer.

## Acceptance criteria and edge cases
Existing: asked at −9 days, shown at −3, one reading kept, 3 refused, "Open Progress" on both saves. Proposed: the boundary (ME-4), the hint's timing (ME-2), the quarter-inch echo (ME-5), the single-only engine test (ME-1), the correction route (ME-6). Edge cases: legacy entries without readings count as three (correct); no future dates from this path; MM-155's cycle note applies more to unconditioned singles.

## Dependencies
safety and nutrition (ME-1); ux-accessibility and product-designer (ME-2, ME-3); architecture (one waist formatter, ME-5). Tickets: MM-155, MM-301, MM-146, MM-32, MM-133, MM-140.

## Safety concerns
ME-1 errs toward missing real waist loss, the honest direction, but safety should confirm. ME-2 could produce a spurious "up". No privacy concern. Not clinical clearance.

## Unresolved product decisions
- ME-3: how the Dashboard discloses the quick-entry cost. Owner, advised by ux-accessibility.
- ME-6: whether Progress shows today's entry and says a save replaces it. Owner.
- ME-7: re-estimating `singleReadingFactor`, deferred to MM-155's re-estimation.

## Verification
Source inspection only. Requested: dashboard tests after ME-2, ME-4, ME-5; an engine test for ME-1; `mm check`.

## Targeted challenges
None yet.
