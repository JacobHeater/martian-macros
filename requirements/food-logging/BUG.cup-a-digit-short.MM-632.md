---
id: MM-632
status: done
component: food-logging
related: [MM-167, MM-628]
---

# Bug: the cup was a digit short, so 16 tablespoons were not quite a cup

## Context
Found on 2026-10-26 by CI on MM-628's branch: 2 cups converted to 31.999999932 tablespoons. `PortionUnit`
held the US customary cup as 236.588236 mL. The cup is exactly 8 US fluid ounces of 29.5735295625 mL, which
is 236.5882365 mL. The tablespoon, teaspoon and fluid ounce constants were exact. Its comment also called it
the "US legal cup", the 240 mL label cup, which it is not (the measurement review, `docs/food-logging-plan.md`
L-02).

## Description
A cup is exactly 16 tablespoons, 48 teaspoons and 8 US fluid ounces. Conversions between them are exact.

## Acceptance Criteria
```gherkin
Scenario: A cup in its parts
  Then a cup is exactly 16 tablespoons, 48 teaspoons and 8 fluid ounces
  And 2 cups convert to exactly 32 tablespoons
```

## Notes
- Fixed in `domain/food/portion/PortionUnit.ts`; the comment now names the customary cup.
- Regression test: "MM-632" in `apps/mobile/test/domain/convertedQuantity.test.ts`.
- Effect on what was logged: none worth noticing. A cup weighed through a density was 0.5 µL short, about
  two parts in a billion.
