---
id: MM-600
status: in-progress
component: food-logging
related: [MM-598, MM-213, MM-318]
---

# Bug: AI meal analysis sits against the search, and the row under it stops short

## Context
MM-598 put "AI meal analysis" on the add-food sheet's first view. On the owner's phone (2026-10-24) the
button touched the search field, with no space between them, and the Scan · Saved · Estimate row under it
ended short of the right edge, so the two did not line up.

## Decisions
Choices I made without asking (say if any is wrong):
- **12 px above and below the button**, the sheet's small gap (`app-gap-small`, and the row's own margin).
- **Scan, Saved and Estimate grow to fill the row**, so its edges are the button's. They still wrap whole
  on a narrow phone rather than breaking a word (MM-213).

## Acceptance Criteria
```gherkin
Scenario: Spaced from the search
  Given the add-food sheet is open with nothing typed
  Then there is a 12 px gap between the search field and "AI meal analysis"
  And a 12 px gap between it and the Scan, Saved and Estimate row

Scenario: The row fills the width
  Then the Scan, Saved and Estimate row spans the same width as "AI meal analysis"
```

## UI/UX
- apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Story: AddFoodOffersAnalysis). A bug the owner
  reported, so the panel pass is skipped (`apps/mobile/AGENTS.md`).

## Notes
- Where: `apps/mobile/src/food/AddFoodSheet.tsx`, `apps/mobile/src/food/food.css`.
- Spacing is checked on the phone (jsdom does no layout); the story draws it.
