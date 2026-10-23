---
id: MM-594
status: in-progress
component: food-logging
related: [MM-570, MM-586]
---

# Story: The assistant asks when the meal was eaten, and the meal is logged then

## Context
The product owner, 2026-10-22: the meal analysis prompt (MM-586) should also ask when the meal was eaten, and
the format the assistant answers in should carry the date and the time, so a meal analysed later is logged on
the day and at the time it was eaten (MM-570).

## Decisions
Made with the product owner (2026-10-22):
- **The prompt asks a fourth question**, "When did I eat it?", for the day and the time.
- **The answer carries both**: `"eaten_at": "YYYY-MM-DDTHH:MM"`, local, 24-hour.

Choices I made without asking (say if any is wrong):
- **Question 4 may be left blank** (the owner, 2026-10-22): the assistant then leaves `eaten_at` out without
  asking again, and the meal is logged on the day Add food was opened on, at now.
- **The assistant never guesses a date**: given a day such as "yesterday" and not knowing today's date, it
  asks for it, since an assistant often does not know it.
- **The review shows the day** as Add food's "Logged on" stepper does, under the time eaten, both filled from
  the answer and both changeable. The slot stays the one Add food was opened for.
- **What the answer does not say stays as it was**: the day Add food was opened for, and now. A day after today
  cannot be logged, so it is not taken; its time is.
- **A time alone, or a 12-hour time**, is read too ("18:45", "6:45 PM"); a date that does not exist is not.
- **The fixes copied back** carry the day and time as they stand in the review.

## Acceptance Criteria
```gherkin
Scenario: Asked
  Then the prompt asks when the meal was eaten, the day and the time, and says it may be left blank
  And tells the assistant to leave "eaten_at" out when it is, and never to guess a date

Scenario: Eaten yesterday
  Given Add food opened on today
  And an answer eaten at "2026-10-21T18:45", the day before
  When the meal is logged
  Then it is logged on the 21st at 6:45 PM

Scenario: Left blank
  Given an answer with no "eaten_at"
  Then the meal is logged on the day Add food was opened for, at now

Scenario: After today
  Given an answer eaten tomorrow at 8:00
  Then the meal is logged on the day Add food was opened for, at 8:00
```

## Notes
- Tests: `test/domain/mealAnalysis.test.ts` ("when a meal was eaten", "a time of day", MM-594 cases) and
  `test/food/analyzeMeal.test.tsx` (MM-594 cases).
