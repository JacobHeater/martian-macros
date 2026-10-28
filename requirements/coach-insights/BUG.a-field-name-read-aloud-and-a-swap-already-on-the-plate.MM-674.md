---
id: MM-674
status: done
component: coach-insights
related: [MM-665, MM-666, MM-671, MM-672]
---

# Bug: a field name read aloud, and a swap for a food already on the plate

## Context
The owner (2026-10-28), on Food's coach breakdown with Anthropic writing: "a boolean leaked here. also this swap
doesn't make sense since the chicken is already in the meal." The lunch breakdown read "Because
proteinUnrecoverable is true, the remaining 114 g protein gap cannot fit…"; the breakfast breakdown suggested
"Just Bare lightly breaded chicken breast original fillet in place of Biscuit, home recipe", the fillet being the
next line of the same breakfast.

Two causes. The system prompts named the JSON field (`When proteinUnrecoverable is true, state that…`), so the
model named it back, and the check had no rule against it. And `mealBreakdownAnalysisOf` offered the swap finder
the person's whole history as candidates, the meal's own foods among them, and the catalog strategy can return a
plated food under its own spelling.

## Decisions
- The prompts speak of the condition, not the field ("When the JSON marks the protein left as unable to fit inside
  the calories left today…"), and tell the model never to say a field name or a true or false value.
  `whyCoachNarrationRejected` refuses a camelCase word ("It read out a field name (proteinUnrecoverable)"), so the
  built-in words show instead and Settings' test says why.
- A food already on the plate is no swap for what else is on it: the candidates lose every entry that names a
  plated food (the outlier itself excepted), and a swap found by the catalog or the table under its own spelling of
  a plated food is dropped. `isSameFoodName` knows a food under another spelling: every telling word of the shorter
  name in the longer, two words at least.

## Acceptance Criteria
```gherkin
Scenario: No field names
  When the model's words contain "proteinUnrecoverable is true"
  Then they fail the check for a field name read aloud, and the built-in words show

Scenario: No swap from the plate
  Given a breakfast of a biscuit, eggs and a chicken fillet
  Then the biscuit's suggested swap is never the fillet or the eggs, under any spelling
```

## Notes
- Tests: `test/engine/mealSwapOffThePlate.test.ts`, `test/format/narrationFigures.test.ts` (the field name).
- The owner's call-out: no panel. Not run locally; CI validates. Not yet seen on a phone.
