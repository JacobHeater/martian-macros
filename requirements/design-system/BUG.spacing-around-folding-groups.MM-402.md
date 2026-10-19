---
id: MM-402
status: done
component: design-system
related: [MM-398, MM-253, MM-291]
---

# Bug: spacing around folding groups and between sections

## Context
The owner, on a phone (2026-10-18): "Padding is a serious problem throughout the application around the
dropdown areas in between sections." The product designer's audit: a disclosure on a screen's body had
no spacing rule (12 px under a card where sections get 24, its first card 0 px under its header); a
section's card sat on its header; closed Settings headers were spaced like whole groups.

## Description
One rhythm: 24 px between top-level groups (margins add in the body's column); 8 px from a header, or a
disclosure, to the card it opens; 4 px between closed headers stacked, 24 px around an opened section.
No hairlines are added.

## Acceptance Criteria
```gherkin
Scenario: The Dashboard's "More about this week"
  Then it stands 24 px from the group above it
  And opened, its first card is 8 px under its header

Scenario: Settings closed
  Then its headers are 4 px apart
```

## Notes
Measured in the static Storybook at 412 × 915: Today › History, disclosure 24 px above and 8 px to its
card; Settings › Settings, closed headers 4 px apart.
