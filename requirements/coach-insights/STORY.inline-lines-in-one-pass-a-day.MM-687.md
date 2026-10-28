---
id: MM-687
status: in-progress
component: coach-insights
related: [MM-362, MM-365, MM-666, MM-673, MM-682, MM-684, MM-685]
---

# Story: The inline lines under the day's foods, phrased by the model in one pass

## Context
The lines under logged foods (MM-365, MM-666) are built-in words. The owner (MM-682): the model phrases them too, in
one request per day for every food at once, cached by the day's state, never a request per food.

## Decisions
- `inlineLinesNarrationRequest(day, items)` (`format/coach`): the day's food insights with each item's built-in line,
  figures and MM-684 move go as a numbered list; the model answers one line per number, in the approved voice, with the
  day's toolbox (`my_foods_at_meal`, `search_catalog`, `price_move`) so it may look a food up. Keyed by the day and a hash
  of the lines, so a day whose foods did not change is asked once.
- The answer is parsed by number (`inlineLinesOf`). The numbers are checked over the whole answer by the narrator, as
  every ask is (the items' figures and the tools' answers); each line is then checked on its own words
  (`whyCoachNarrationRejected` without numbers: no field name, no banned word, the protected path kept), and a line
  that fails, or is missing, leaves that item its built-in words.
- `useItemInsightContents` reads the day's pass (`useInlineNarration`): while it is awaited the row shows the busy line
  (MM-673), the model's line once it is in, the built-in line once it failed or at once when no model is set up.
- **A choice made without asking:** no "Answer now" under a food row (the sheet's and the brief's are enough; a row has
  no room for one); the built-in words show when the pass fails.

## Description
One request a day phrases every inline food line; each line verified on its own; the rows wait as every network wait does.

## Acceptance Criteria
```gherkin
Scenario: One request for the day's foods
  Given three foods with insights today and a BYOK coach set up
  When the Food tab draws
  Then one narration request is made, carrying the three items, and each row shows its own line from the answer

Scenario: A line that fails the check falls back alone
  Given the model's second line cites a number not in its figures
  Then the second row shows the built-in words and the first and third show the model's
```

## Notes
- Tests: `test/coach/inlineLinesNarration.test.tsx`, `test/format/inlineLinesNarrationRequest.test.ts`. Not run locally; CI validates.
