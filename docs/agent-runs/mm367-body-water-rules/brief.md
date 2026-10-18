# Brief: the body and water insight rules (MM-367)

## Question
Can the drafted inline insight rules for weigh-ins, waist readings and water be built as written: "unusual time", "within
the noise" and "water on few days"? Check each trigger, its figures, its words and its safeguards.

## Why now
The product owner approved building coaching insights inline (MM-361) on 2026-10-17 and asked for the whole feature. The
epic says the domain roles check each catalog first. The workout set (`docs/agent-runs/mm366-workout-rules/`) set the
pattern; the snooze (MM-378) now replaces any automatic rest.

## Inputs
- `requirements/coach-insights/STORY.inline-insights-for-body-and-water.MM-367.md`: the draft catalog
- `requirements/coach-insights/STORY.insight-under-the-item.MM-362.md`
- `requirements/coach-insights/STORY.explain-a-weight-jump.MM-142.md`
- `requirements/safeguards/STORY.hide-the-scale-number.MM-118.md` (not built)
- the waist noise code (`apps/mobile/src/engine/waistNoiseOf.ts`, `waistChangeOf.ts`, MM-301), weigh-in records
  (`apps/mobile/src/domain/WeightObservation.ts`, whether a time of day is stored at all), the water log and goal
  (`apps/mobile/src/domain/water/`), `docs/evidence.md`
- the built framework: `apps/mobile/src/engine/ItemInsightKind.ts`, `allowedItemInsights.ts`, `volumeJumpInsights.ts`

## Roles
- measurement: the 3 h and median-of-14-days rule and whether weigh-in times exist in the data; the waist noise test;
  "fewer than half of 14 days" for water; the evidence rows.
- coaching: the words (fact, then a direction), nagging under a daily weigh-in, and the water line's habit advice.
- safety: eating-disorder history and hidden weight for the weigh-in and waist lines; whether a water line could push
  fluid on someone whose clinician limits fluids (`fluid_limited_by_clinician`, MM-359).

Omitted: nutrition (no intake), training, product-designer and ux-accessibility (the Dashboard lines were drawn and passed
in `docs/agent-runs/mm361-coaching-insights/`), react-capacitor.

## Output
One report per role in `findings/<role>.md` using `agents/templates/findings/role.md`. Read-only: no edits.
