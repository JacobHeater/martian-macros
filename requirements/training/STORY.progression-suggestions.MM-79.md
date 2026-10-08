---
id: MM-79
status: proposed
component: training
related: [MM-74, MM-75, MM-77, MM-78]
---

# Story: A suggestion for what to lift next time

## Context
See MM-74. Progressive overload means doing slightly more over time, and many people simply repeat last week.

## Decisions (made with the product owner)
- **Suggestions follow double progression**: add reps within a range until the top of the range is reached on every set, then add load and
  return to the bottom of the range.

Choices I made without asking (say if any is wrong):
- **The rep range is per exercise**, defaulting to 6 to 10 for barbell lifts and 8 to 12 otherwise, and editable.
- **The load step** is 2.5 kg (5 lb) for barbell lifts and the smallest sensible step otherwise.
- **A suggestion is shown, never imposed**: it pre-fills the first set and the user changes it freely.
- **After two sessions with no progress on a lift, the app says so** and suggests holding the load, rather than suggesting more.
- **In a deficit, holding strength is success.** The wording changes with the goal: on fat loss the suggestion is to match last time.

## Description
When an exercise is added to a workout, the first set is pre-filled with the suggestion and a one-line reason ("All sets hit 10 last time;
add 2.5 kg").

## Acceptance Criteria
```gherkin
Scenario: Add reps
  Given last session was 3 sets of 8, 8, 7 at 60 kg in a 6-10 range
  Then the suggestion is 60 kg for 8 or more

Scenario: Add load
  Given last session was 3 sets of 10 at 60 kg in a 6-10 range
  Then the suggestion is 62.5 kg for 6

Scenario: On a cut
  Given the goal is fat loss
  Then the suggestion is to match last session, and says that holding strength is the aim

Scenario: Stalled
  Given two sessions without progress
  Then the app says so and suggests holding the load
```

## Notes
- This is deliberately simple. Periodization, deloads and programs are out of scope.
