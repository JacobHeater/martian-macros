---
id: MM-436
status: done
component: design-system
related: [MM-288, MM-106]
---

# Bug: the add plate's plus was Ember at rest

## Description
The add plate (`.mm-icon-button-plate`, the "+" on each meal, Water and Weight events) drew its plus in Ember at rest, so Food and Progress showed more than one Ember action against the budget MM-288 decided. Found by the WS-03 panel's product-designer review (PD1), 2026-10-20.

## Acceptance Criteria
```gherkin
Scenario: Fixed
  Given the design system's stylesheet
  Then the case above holds no more, in every palette
```

## Progress (2026-10-20, feat/m2)
Fixed in the WS-03 close. Regression test: `test/ui/textActions.test.tsx`, "MM-436: the add plate's plus rests in the text colour"; `test/ui/components.test.tsx` updated to the decision.
