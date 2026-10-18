# Brief: strength held on a fat-loss goal (MM-377)

## Question
Can the "strength on fat loss" inline insight be built as MM-377 drafts it: planned fat-loss weeks from
`consecutiveDeficitWeeks` ≥ 6, "held" as the lift's smoothed estimated max at least the value at the start less a
tolerance of about 2.5%, at least 4 sessions with no gap over 28 days, bodyweight lifts left out, fact-only beside the
progression suggestion, off with an eating-disorder history?

## Why now
The product owner put this rule after "volume jump" (2026-10-17) because its figures needed the measurement role and its
words praised the diet. The words are reworked in MM-377; the figures and the planned-versus-eaten question remain.

## Inputs
- `requirements/coach-insights/STORY.strength-on-fat-loss-inline.MM-377.md`
- `docs/agent-runs/mm366-workout-rules/` (the training, coaching and safety reports and decision; TR-6, TR-7, TR-9, CO-2, SA-6)
- `apps/mobile/src/engine/buildStrengthTrends.ts`, `StrengthTrend.ts`, `StrengthPoint.ts`, `estimatedOneRepMax.ts`,
  `consecutiveDeficitWeeks.ts`, `findReliefOffer.ts`; `requirements/training/STORY.strength-trend.MM-77.md`;
  `requirements/safeguards/STORY.recovery-signals-ease-the-deficit.MM-117.md`; `docs/evidence.md`
- the built inline framework: `apps/mobile/src/engine/volumeJumpInsights.ts`, `itemInsightKinds.ts`, `ItemInsightKind.ts`

## Roles
- measurement: the "held" tolerance against the smoothing (3-point mean within 28 days) and RIR noise; whether 2.5% or 0%
  is honest; the 4-session and 28-day-gap guards; the start-of-window baseline point; evidence rows.
- nutrition: whether "fat-loss weeks" may rest on planned targets (`consecutiveDeficitWeeks`) when intake is partly
  logged, and what the line may say about it; whether strength held says anything about lean mass (Murphy and Koehler 2022).

Omitted: training, coaching and safety (their findings on this rule are in the mm366 run and are carried into MM-377),
product-designer and ux-accessibility (the line reuses the reviewed InlineInsight), react-capacitor.

## Output
One report per role in `findings/<role>.md` using `agents/templates/findings/role.md`. Read-only: no edits.
