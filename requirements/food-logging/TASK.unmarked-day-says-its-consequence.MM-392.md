---
id: MM-392
status: proposed
component: food-logging
related: [MM-389, MM-27, MM-173]
---

# Task: an unmarked day says what happens to it

## Context
Raised in the MM-389 review by the UX role (UX-2) and the product designer. The completeness row's
subtitle on an unmarked day, "Mark it complete or partial.", explains how to answer a question the
sheet already asks, while its siblings state a consequence ("Counted as a whole day.", "Left out of
your metabolism estimate."). An unmarked day counts unless it falls well below the person's usual
intake (`engine/usableIntakeDays.ts`, MM-27). The designer proposes "Counted unless it looks short.";
the coaching and safety roles have to confirm that it is accurate and judges no one before it ships.

## Description
The unmarked day's subtitle states what the estimate does with the day, in words the coaching and
safety roles have checked.

## Acceptance Criteria
```gherkin
Scenario: An unmarked day
  When a day with food on it has not been marked
  Then the completeness row says what the metabolism estimate does with it
  And it does not tell the person to press the row
```
