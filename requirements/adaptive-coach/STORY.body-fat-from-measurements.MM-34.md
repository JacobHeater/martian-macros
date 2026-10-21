---
id: MM-34
status: done
component: adaptive-coach
related: [MM-22, MM-21, MM-26, MM-35, MM-68, MM-155, MM-156, MM-36, MM-450, MM-501, MM-502]
---

# Story: A body-fat range that comes from my own measurements

## Context
Body fat decides the goal recommendation, the loss-rate cap, the protein rule and the energy-availability floor. Today it is either the
user's one-time guess or a formula from height, weight, age and sex (Deurenberg) with an uncertainty of plus or minus ten points, shown as
"14-34% (rough estimate)". It never improves.

## Decisions (made with the product owner)
- **Body fat is shown as a range, updated slowly, never as a raw daily reading.** A smart-scale reading is mostly a measure of body water
  and can swing two to five points overnight.
- **Each scale gets its own bias**, learned over time, so switching scales is not read as a change in the body.
- **Without a smart scale, the fallback is a tape**: weekly waist, and the Navy method.

Choices I made without asking (say if any is wrong):
- **This ticket builds the waist part only; the rest is split off.** Nothing the app stores today holds a neck, a hip or a scale's body-fat
  reading, and no schema change belongs here. The Navy method waits on MM-156's neck and hip and is MM-501; smart-scale readings with a
  per-device bias wait on WS-11's ingest and are MM-502. The scale scenarios below moved to MM-502.
- **The waist formula is relative fat mass** (Woolcott and Bergman 2018): body fat from height and waist alone, validated against a body
  scan, sex-specific, with no neck or hip needed.
- **It joins the formula, it does not replace it.** The two are combined by how reliable each is, with their errors taken to go together
  (`BodyFatRule.formulaErrorCorrelation`), so the range narrows from about ten points either way to about eight, not to a point. Each
  further entry narrows it only a little: the formulas' own error dominates the tape's.
- **The waist joins after three entries in four weeks**, and the middle of them is used, so one mistyped entry moves nothing and the range
  moves about weekly, as the entries do.
- **The user's own figure still wins** when they gave one, as before.
- **With an eating-disorder history the app does not ask for more measuring**: a rough range has no line saying what would narrow it.
  The range itself shows as before, as weight does.
- **The line rests on the Body row's `detail`** (MM-342), the sibling pattern for what a figure rests on.

## Description
The engine estimates body fat from the user's stored measurements (`estimateBodyFat`): their own figure if they gave one; otherwise the
formula from height, weight, age and sex, joined, once there are enough recent waist entries, by the waist-to-height formula on their
middle value. The result is a range with its uncertainty and what it rests on (`EstimatedBodyFat`, `CoachSnapshot.bodyFatBasis`), so phase
planning (MM-36) and the monthly report (MM-450) can use it without ever showing a point figure. Coach's Body row shows the range, says
what it rests on, and before the waist joins says what would help.

## Acceptance Criteria
```gherkin
Scenario: Before enough data
  Given fewer than three waist entries in the last four weeks
  Then the app shows the rough formula range
  And says that three waist measurements within four weeks narrow it

Scenario: From the waist
  Given three or more waist entries in the last four weeks
  Then the app shows a range from the formula and the waist, narrower than the rough range
  And says that a tape narrows the range but cannot pin body fat down

Scenario: One mistyped entry
  Given a settled range from four weekly waist entries
  When one entry is mistyped six centimetres high
  Then the shown range does not move

Scenario: An eating-disorder history
  Given an eating-disorder history and no waist entries
  Then the app shows the rough range and does not ask for more measuring

Scenario: The user's own figure
  Given the user gave their own body fat
  Then it is used and shown as before
```

## UI/UX
- CoachBodyFatRough — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachBodyFatRough). The rough range and what would help.
- CoachBodyFatFromWaist — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachBodyFatFromWaist). The range from the waist.
- CoachBodyFatRoughEatingDisorder — apps/mobile/src/gallery/screens/Coach.stories.tsx (Story: CoachBodyFatRoughEatingDisorder). No ask.

## Notes
- The model is the subject of MM-35; this is the small estimator its notes allow for.
- A consumer scale's reading can be biased by several points for a given person, in a fixed direction. Filtering removes scatter, not bias,
  so the settled range is only as true as the tape and trend can pin it. Say so in the product (MM-502).
- Built in `apps/mobile/src/engine/estimateBodyFat.ts`, `relativeFatMass.ts`, `combineBodyFatEstimates.ts`, `BodyFatRule.ts`; shown by
  `format/bodyFatRangeText.ts` and `format/bodyFatNote.ts`. Evidence rows: `relativeFatMass`, `combineBodyFatEstimates` and the four
  `BodyFatRule` figures. Tests: `test/engine/estimateBodyFat.test.ts`, `test/format/bodyFatText.test.ts`. Not run locally; CI validates.
- The narrower range moves the cautious body fat the safety rules read (MM-132); the deadband still keeps a rule from flipping.
