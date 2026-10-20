---
id: MM-437
status: done
component: design-system
related: [MM-288, MM-106]
---

# Bug: a chosen compact segment said its choice by colour alone

## Description
The compact segmented control (Progress' 30d/90d) showed its chosen segment only by the selected fill and Ember text, with no check mark; Ember on the selected fill is under 4.5:1 in Light. Found by the WS-03 panel's UX-accessibility review (F1), 2026-10-20.

## Acceptance Criteria
```gherkin
Scenario: Fixed
  Given the design system's stylesheet
  Then the case above holds no more, in every palette
```

## Progress (2026-10-20, feat/m2)
Fixed in the WS-03 close. Regression test: `test/ui/textActions.test.tsx`, "MM-437: a chosen segment is in the text colour"; `test/gallery/accessibility.test.tsx` asserts the check mark on every chosen segment.
