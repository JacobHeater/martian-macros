---
id: MM-686
status: in-progress
component: coach-insights
related: [MM-665, MM-666, MM-667, MM-673, MM-682, MM-684, MM-685]
---

# Story: The sheet and the brief ask with tools, and "Answer now" after three seconds

## Context
The breakdown sheet (MM-666) and the Executive summary (MM-667) show the wait while the model writes and the built-in
words only once it failed (MM-673). With tools (MM-685) the ask takes several round trips. The owner (MM-682): no
limit on the wait, a spinner, and after 3 seconds an "Answer now" button that shows the deterministic words, on both.

## Decisions
- `MealBreakdownSheet` and `ExecutiveSummaryCard` build their requests with the app's toolbox (`state.coachToolbox`),
  so the model is asked with tools; the built-in words of MM-684 stay the fallback.
- **"Answer now"** (`coach/CoachWritingLine`): the busy line (MM-673) and, 3 seconds after the wait began, an `MmButton`
  of the secondary kind under it, "Answer now". Pressed, the built-in words show at once and the model's later answer is
  not shown over them (nothing provisional is ever swapped, MM-673); the ask is let finish so the cache has it for
  next time. `useCoachNarration` gains `answerNow()` and `answeredNow`.
- The brief's button and the sheet's are the same component with the same timing (the owner).
- Settings' "Test AI coach" (MM-671) asks the brief's request with tools, so the test exercises the loop; a tool
  failure is reported as the outcome it was.

## Description
Both surfaces ask with tools and offer "Answer now" after three seconds of waiting.

## Acceptance Criteria
```gherkin
Scenario: Answer now on the sheet
  Given a BYOK coach set up whose model has not answered after 3 seconds
  When the person presses "Answer now"
  Then the built-in words show, and a later answer from the model does not replace them

Scenario: No button before three seconds
  Given the model answers within 3 seconds
  Then no "Answer now" button was drawn

Scenario: The brief the same
  Given the Executive summary waiting 3 seconds
  Then "Answer now" shows under the busy line and works the same
```

## UI/UX
- Answer now — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: MealCoachBreakdownAnswerNow) and
  Coach.stories.tsx (Story: CoachWritingAnswerNow): the busy line with the button under it, at phone width
  (`smallPhone`). Dictated by the owner, so no panel.

## Notes
- Tests: `test/food/mealBreakdownAnswerNow.test.tsx`, `test/coach/coachNarrationWait.test.tsx` extended (fake timers).
  Not run locally; CI validates.
