---
id: MM-392
status: done
component: food-logging
related: [MM-389, MM-27, MM-173, MM-114]
---

# Task: an unmarked day says what happens to it

## Context
Raised in the MM-389 review by the UX role (UX-2) and the product designer. On an unmarked day, the
completeness row's subtitle is "Mark it complete or partial.". It explains how to answer a question the
sheet already asks. Its siblings state a consequence instead: "Counted as a whole day." and "Left out of
your metabolism estimate.". An unmarked day counts unless it falls well below the person's usual intake
(`engine/usableIntakeDays.ts`, MM-27). The designer proposed "Counted unless it looks short." The
coaching and safety roles had to confirm that it is accurate and judges no one before it shipped.

## Decisions
- The coaching and safety roles were asked on 2026-10-21. Both turned down "looks short", which can read
  as "you ate too little": a judgement of the eating rather than of the log, and a risk for someone who
  restricts. Coaching proposed "Counted unless it's well below your usual." Safety proposed "Counted
  unless it looks unfinished.", which points at the log and states no amount.
- Choice made without asking (easy to overrule): the safety role's line ships, "Counted unless it looks
  unfinished.". Where the two roles differed, the safety concern decided.

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

## UI/UX
- DayCompleteness — apps/mobile/src/gallery/screens/Food.stories.tsx (Story: DayCompleteness). The row on
  an unmarked day, and the three answers.

## Notes
Progress: built 2026-10-21 in `apps/mobile/src/food/FoodCompletenessRow.tsx`. Guarding test:
`apps/mobile/test/food/unmarkedDay.test.tsx`. Not run locally; CI validates.

The safety role pointed out an existing gap that is outside this line. A genuinely low unmarked day can
be left out without anyone being told, and the same rule feeds the under-eating notice (MM-114). The gap
is referred to the coaching and safety roles. It is not decided here.
