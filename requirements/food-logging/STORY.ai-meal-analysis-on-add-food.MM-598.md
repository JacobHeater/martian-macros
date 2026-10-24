---
id: MM-598
status: in-progress
component: food-logging
related: [MM-586, MM-150, MM-438, MM-253, MM-236]
---

# Story: AI meal analysis is offered on Add food, not inside Estimate

## Context
AI meal analysis (MM-586) was put inside Estimate: Food, a meal's "+", Estimate, then "AI meal analysis".
The owner uses it more than any other way of logging a meal and found it buried (2026-10-23). This brings
it out to the add-food sheet's first view, one press from a meal's "+".

**This reverses one of MM-586's decisions, by the owner (2026-10-23):** "It lives inside Estimate … The
add-food sheet's row of buttons does not grow." The row still does not grow: the analysis is its own
full-width button, and Estimate goes back to being the hand estimate (MM-150) alone.

## Decisions
Made with the product owner (2026-10-23):
- **The analysis is on the add-food sheet's first view**, so it is Food, a meal's "+", "AI meal analysis".
  Food is still added only from a meal's "+" (MM-438); nothing is added to the Food screen. (A second
  button beside each meal's "+" was considered and turned down: it doubles the controls on Food for one
  feature.)
- **It is no longer offered inside Estimate.** One way in, not two.
- **No camera.** The app never takes the photos, the person's assistant does, so a camera promised a
  capture that does not happen. This is a step toward making the analysis faster; the rest is still being
  worked out with the owner.

Choices I made without asking (say if any is wrong):
- **A full-width secondary button between the search and the Scan · Saved · Estimate row.** It stands out
  from the row without becoming a fourth chip, and like the row it is hidden while a search is typed, so
  the field never moves under the person's fingers. The sibling is "Enter manually", the sheet's other
  full-width secondary button. No caption beside it (the owner, 2026-10-22).
- **A new icon, `assistant`**, Material's AutoAwesome (sparkles), the shape commonly read as "AI". The icon
  set is mapped by meaning (MM-236, MM-253), and nothing in it meant this: `insight` is the coach's.
- **Back from the analysis returns to the sheet's first view**, where it was opened from.

## Acceptance Criteria
```gherkin
Scenario: Add food offers the analysis
  Given the add-food sheet is open with nothing typed in the search
  Then "AI meal analysis" is offered
  When the person presses it
  Then the analysis's first step opens

Scenario: Back returns to Add food
  Given the analysis was opened from Add food
  When the person presses Back
  Then the add-food sheet's first view is shown

Scenario: Estimate is the hand estimate alone
  When the person presses Estimate
  Then "AI meal analysis" is not offered

Scenario: Hidden while searching
  When the person types in the search
  Then "AI meal analysis" is not shown
```

## UI/UX
- Add food — apps/mobile/src/gallery/screens/AnalyzeMeal.stories.tsx (Story: AddFoodOffersAnalysis; the
  analysis stories now open from Add food). The owner dictated the change, so the panel pass is skipped
  (`apps/mobile/AGENTS.md`).

## Notes
- Where: `apps/mobile/src/food/AddFoodSheet.tsx`, `apps/mobile/src/food/estimate/EstimateMealStep.tsx`,
  the icon in `apps/mobile/src/ui/MmIconName.ts` and `apps/mobile/src/ui/mmIcons.tsx`.
- Tests: `test/food/analyzeMeal.test.tsx` (every scenario above). Written for CI; not run locally (owner's
  rule).
