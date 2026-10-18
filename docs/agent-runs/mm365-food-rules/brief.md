# Brief: the first food insight rules (MM-365)

## Question
Can the first set of inline insight rules for logged foods be built as drafted: "mostly fat", "light on protein" and
"large portion"? Check each rule's trigger, its figures, its words and its safeguards, and say what must change.

## Why now
The product owner chose the first set on 2026-10-18 (MM-365 Decisions): mostly fat, light on protein and large portion.
"Salty item" is out of the set and "often logged, low grade" waits for grades. The owner also ruled: lines suggest a swap
or an addition, never eating less; lines only under logged foods; every qualifying line shows and can be snoozed (MM-378).
The epic (MM-361) says the catalogs are checked by the domain roles before they are built. The workout set went first
(`docs/agent-runs/mm366-workout-rules/`); build on its reports.

## Inputs
- `requirements/coach-insights/STORY.inline-insights-for-food.MM-365.md`: the draft catalog
- `requirements/coach-insights/STORY.insight-under-the-item.MM-362.md`: the framework, voice and safeguards
- `requirements/coach-insights/STORY.snooze-an-inline-insight.MM-378.md`
- `requirements/coach-insights/STORY.rule-based-insights.MM-141.md`: the dashboard catalog (protein, estimates)
- `requirements/design-system/TASK.voice-and-wording.MM-108.md`
- `docs/evidence.md`
- the food entry and nutrition code: `apps/mobile/src/domain/FoodEntry.ts`, `apps/mobile/src/domain/food/`, the
  protein targets in `apps/mobile/src/engine/ProteinTargets.ts`, the sibling rules in `apps/mobile/src/engine/findInsights.ts`
  and the built inline framework in `apps/mobile/src/engine/` (`ItemInsightKind`, `allowedItemInsights`, `volumeJumpInsights`)

## Roles
- nutrition: the thresholds (≥ 150 kcal and ≥ 55% from fat; ≥ 400 kcal and < 10% from protein; ≥ 2× the usual serving and
  ≥ 300 kcal), what "usual serving" can mean from the data, and the evidence rows each needs.
- coaching: the words (fact, then a swap or an addition; never eating less), MM-108, whether the lines nag under daily foods,
  and how the snooze changes that.
- safety: eating-disorder history (which rules are off; whether "large portion" is a restriction cue even as an entry check),
  under-18, hidden weight, and whether any line reads as judging a food.

Omitted: training, measurement (no body figure), product-designer and ux-accessibility (the lines were drawn and passed in
`docs/agent-runs/mm361-coaching-insights/`; the snooze is drawn in its own run), react-capacitor.

## Output
One report per role in `findings/<role>.md` using `agents/templates/findings/role.md`. Each finding names the rule, what to
change and the evidence. Read-only: no edits.
