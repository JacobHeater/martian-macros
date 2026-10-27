---
id: MM-658
status: done
component: food-logging
related: [MM-167, MM-221, MM-636, MM-651]
---

# Bug: an entry in fluid ounces is offered no fluid ounces chip

## Context
The owner's orange soda, found online and logged as 4 fl oz, opened for editing with "Cup / spoon" chosen, the
amount reading "4 fl oz", and the unit chips Cups, Tablespoons, Teaspoons and Milliliters: no Fluid ounces
(2026-10-27). The cup-or-spoon units of a food stated per 100 g (MM-167) were cups, spoons and millilitres; the
fluid ounce was added for a drink stated per 100 mL only (MM-651), though it converts exactly as a millilitre
does.

## Decisions
A bug, fixed as found: the fluid ounce is a volume unit for every food under "Cup / spoon", last in the row
after millilitres; a food stated per 100 mL offers the same list.

## Acceptance Criteria
```gherkin
Scenario: The entry's own unit
  Given a soda logged as 4 fl oz from a food stated per 100 g
  When the entry is edited
  Then "Fluid ounces" is among the chips and chosen, and the amount reads 4
```

## Notes
- `domain/food/portion/unitsOffered.ts`; `test/domain/portion.test.ts`; the owner's case in
  `test/food/drinkGradeOnThePhone.test.tsx`.
