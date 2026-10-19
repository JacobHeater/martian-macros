---
id: MM-399
status: done
component: design-system
related: [MM-398, MM-335, MM-253]
---

# Bug: a section that folds put its heading inside its button

## Context
Found by the UX role reviewing MM-398 (UX-1). A collapsible `MmSection` drew its `h2` inside the button
that folds it. HTML does not allow a heading inside a button, and a button's content is presentational to
assistive technology, so heading navigation lost every folding section (the Food screen's meals, the
Coach tab's recent insights, and all of Settings once it became an accordion).

## Description
A folding section is a heading holding its button, as a section that opens a screen already is (MM-335)
and as the APG accordion pattern has it; the heading is named by the section's title.

## Acceptance Criteria
```gherkin
Scenario: A folding section
  Then it is a level-2 heading named by its title
  And the heading holds a button that says whether the section is open
  And no heading is inside the button
```

## Notes
Regression test: `apps/mobile/test/ui/collapsibleSectionHeading.test.tsx`; it failed before the fix.
