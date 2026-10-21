---
id: MM-450
status: proposed
component: adaptive-coach
related: [MM-33, MM-34, MM-11, MM-92]
---

# Story: The body-fat range in the monthly report

## Context
The owner's decision for the monthly report (MM-33) puts the body-fat range in it "if one has settled". There is no measured range
yet: the estimate from the user's own measurements is MM-34, still proposed. MM-33 was built without it and is done; this ticket
carries that one item so it is not lost.

## Decisions
- From MM-33 (made with the product owner): the range is in the report only once one has settled.

Choices I made without asking (say if any is wrong):
- **A range, never a single figure**, as MM-34 shows it, and as it stood at the end of the month, like the report's strength.
- **No card until a range has settled**: a month before that says nothing about body fat rather than showing the formula's guess.
- **Users with a history of an eating disorder (MM-11)** get no body-fat change in the report, as with weight-based rewards (MM-92).

## Description
The monthly report's "What your body did" card gains the settled body-fat range at the end of the month, and its change since the
report before when both have one.

## Acceptance Criteria
```gherkin
Scenario: No settled range
  Given a month in which no body-fat range from measurements has settled
  Then the report says nothing about body fat

Scenario: A settled range
  Given a body-fat range from measurements has settled by the end of the month
  Then the report shows that range as a range, not one number

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then the report shows no change in body fat
```

## Notes
- Waits for MM-34. Placed in WS-09 step 8 beside phase planning, which waits for the same estimate.
