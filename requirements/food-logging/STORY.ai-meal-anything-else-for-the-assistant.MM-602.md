---
id: MM-602
status: in-progress
component: food-logging
related: [MM-599, MM-586, MM-603]
---

# Story: Tell my assistant anything else that will help it analyse the meal

## Context
MM-599 has the app ask the questions the assistant used to ask. The owner (2026-10-24) wants one more,
open question: anything else the person wants to tell the assistant that will help it analyse the meal
(how it was cooked, a portion the photo hides, what was swapped).

## Decisions
Made with the product owner (2026-10-24):
- **One more question, after "Brand or restaurant"**, optional and free text.

Choices I made without asking (say if any is wrong):
- **It is called "Anything else that would help your assistant?"**, with the hint "Optional: cooked in olive
  oil, a large bowl, no dressing". "Assistant", as the rest of the step says, for the owner's "agent".
- **It goes into the prompt in the person's words**, as "- Something else that may help: …", after the brand
  line; with nothing typed, the prompt has no such line. Like the other answers, it is the person's own
  text sent to their own assistant, and nothing else about them is added.
- **A field of three lines that grows with the note** (MM-603, the design system's multi-line field, added
  for it at the owner's word).

## Acceptance Criteria
```gherkin
Scenario: Asked after the brand
  Given AI meal analysis is open
  Then "Anything else that would help your assistant?" is asked, after "Brand or restaurant"

Scenario: In the prompt, in the person's words
  Given the person typed "Extra guacamole"
  When the prompt is copied or sent
  Then it has the line "- Something else that may help: Extra guacamole"

Scenario: Nothing typed
  Given the field is empty
  Then the prompt has no such line
```

## UI/UX
- apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (AnalyzeMealStart and the other first-step
  stories draw it). Dictated by the owner, so the panel pass is skipped (`apps/mobile/AGENTS.md`).

## Notes
- Where: `apps/mobile/src/domain/food/meal/MealQuestionAnswers.ts`, `apps/mobile/src/format/mealAnalysisPromptWith.ts`,
  `apps/mobile/src/food/meal/AnalyzeMealStep.tsx`.
- Tests: `test/format/mealAnalysisPromptWith.test.ts`, `test/food/analyzeMeal.test.tsx`. Written for CI; not
  run locally (owner's rule).
