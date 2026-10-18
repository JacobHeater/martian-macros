# Panel decision: the workout insight rules (MM-366)

- **Facts versus proposals and traceability.** Three read-only reviews of the drafted MM-366 catalog at 684f870: training
  (13 findings), coaching (9) and safety (10), each "build with the listed changes". Facts are the code and tickets
  they cite; every change below was a reviewer's proposal until accepted here or by the product owner.
- **Coverage.** Source and requirement inspection, plus web research by training (5 sources), safety (1 retrieved) and
  coaching (search listings only). Not inspected by any reviewer: tests, `StrengthHistoryScreen`, renders, a device.
  Referrals left open: measurement (the "held" tolerance) and nutrition (planned versus eaten weeks), both for MM-377.
- **Findings, deduplicated.**
  - *Holding steady repeats or contradicts the MM-79 suggestion, and pushes on a cut* (TR-2, TR-3, TR-7, CO-1, CO-3,
    CO-4, SA-1, SA-2, SA-3). **Owner: dropped.** The suggestion already covers a stalled lift.
  - *It cannot fire on the drawn demo lift* (TR-1): moot once dropped; the stories now draw volume jump from real data.
  - *Volume jump has no baseline and a fragile one* (TR-4, SA-5c): **accepted** as specified: 4 usual weeks, 3 of them
    with sets, ≥ 1.5× and ≥ 4 more sets; figures registered as judgement, not from workload-ratio studies.
  - *Anchored to today, not the workout* (TR-5): **accepted**, judged on the workout's own weeks.
  - *Repeats under every chest exercise* (TR-8, CO-6): **owner: once a workout**, under the first exercise mainly
    training the group.
  - *Repeats every session* (CO-5): **owner: first week, then 28 days' rest.**
  - *After a pause* (SA-4): **accepted**, no line when a pause falls in the five weeks looked at.
  - *Soreness, not injury; name the unit* (SA-5a, SA-8, TR-12, CO-6 words): **accepted**: "A jump this big can bring
    more soreness; adding sets more slowly is easier to recover from." A words test forbids the reviewers' lists.
  - *Strength on a cut undefined, praises the diet, bodyweight lifts wrong* (TR-6, TR-9, CO-2, CO-7, SA-6): **owner:
    later**, as MM-377, with the reviewers' definition and words recorded there.
  - *Evidence rows missing* (TR-11, SA-10, CO-9): **accepted**: `volumeJump`, `VolumeJumpRule.*`, `countHardSets`, with a
    test that fails for a kind without one.
  - *Ticket inconsistencies* (TR-13, SA-9, CO-8): **fixed** in MM-366 and MM-361.
  - *Under 18* (SA-7): **no change**: the app is closed to them and MM-362's filter is a second layer, tested.
- **Rejected:** none. The low-body-weight option (SA-6) and the recovery-signal set (SA-3) lapsed with the rules they
  concerned; SA-6's option is kept as a question in MM-377.
- **Safety blockers:** SA-1 and SA-2 were blocking; both resolved by dropping holding steady. No clinical review.
- **Owner decisions (2026-10-17, through the interactive prompt):** drop holding steady; first week then rest; once a
  workout; strength on fat loss later.
- **Edit owner:** the parent session (chair), on `feat/inline-insights-framework`.
- **Verification:** `test/engine/volumeJumpInsights.test.ts` (10), `test/engine/allowedItemInsights.test.ts` (11),
  `test/coach/inlineInsights.test.tsx` (6), `test/format/itemInsightText.test.ts`, `test/engine/itemInsightEvidence.test.ts`;
  the stories WorkoutWithInsights and WorkoutInsightOpen draw the line the app works out. Not verified on a phone.
