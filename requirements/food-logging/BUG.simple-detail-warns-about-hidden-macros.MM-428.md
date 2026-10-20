---
id: MM-428
status: done
component: food-logging
related: [MM-49, MM-38, MM-53, MM-218]
---

# Bug: At Simple detail the typed form warned about macros it did not ask for

## Context
MM-49's typed form at Simple detail asks for protein and calories only (built 2026-10-20, feat/m2). The energy check
(MM-38, MM-53) still compared the typed calories with the energy of the macros on screen, which at Simple is protein
alone, so "Macros add up to 120 kcal; the 200 typed is kept. Double-check the label." appeared on nearly every honest
entry, the Calories field offered "120 from macros" as a figure to accept, and a Calories field left blank logged
protein × 4. Found by the panel's product-designer (PD-1) and UX-accessibility (UX-4) reviews of the change
(`docs/agent-runs/ws08-m2-close/`).

## Description
At Simple detail no caution compares calories with macros that are not asked for, nothing is derived from the one
macro shown, and calories are required. At Standard and Full nothing changes.

## Acceptance Criteria
```gherkin
Scenario: No false caution at Simple
  Given the Detail setting is Simple
  When 30 g protein and 200 kcal are typed
  Then no caution about the macros is shown and the field's hint offers no figure from macros

Scenario: Calories are needed at Simple
  Given the Detail setting is Simple
  When protein is typed and calories are left blank
  Then "Log it" is off and the line beside it says calories above zero are still needed

Scenario: Standard keeps the check
  Given the Detail setting is Standard
  When 20 g protein, 30 g carbs, 10 g fat and 400 kcal are typed
  Then the caution says the macros add up to 290 kcal and the 400 typed is kept
```

## Notes
Fixed in the same change: `energy`, `mismatch` and the field's hint follow `showsCarbsAndFat` in
`apps/mobile/src/food/AddFoodSheet.tsx`; the helper reads "As the label states them." at Simple. Regression test:
`test/food/detailLevel.test.tsx`, "MM-428: at Simple no calorie caution fires, no figure comes from macros, and
calories are needed". The Standard case is held by `test/food/addFoodSays.test.tsx` (MM-218).
