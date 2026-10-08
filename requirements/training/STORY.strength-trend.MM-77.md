---
id: MM-77
status: proposed
component: training
related: [MM-74, MM-75, MM-32, MM-33]
---

# Story: See whether I am getting stronger

## Context
See MM-74. Sets of different reps and loads cannot be compared directly; an estimated one-rep max puts them on one scale.

## Decisions (made with the product owner)
- **Estimated one-rep max (e1RM) by the Epley formula, using reps plus reps in reserve**: load x (1 + (reps + RIR) / 30).

Choices I made without asking (say if any is wrong):
- **A session's e1RM for a lift is its best set's.**
- **Sets above 12 effective reps are not used** for e1RM; the formula is poor there.
- **A set with no RIR recorded is treated as RIR 0** (taken to failure), which understates strength rather than flattering it.
- **The trend is a smoothed line through session values**, since one bad day is not a loss of strength.
- **The Progress screen shows the user's most-trained lifts** (up to four) with the change over four and twelve weeks; any lift's history
  can be opened.

## Description
From logged sets, the app computes e1RM per session per exercise and shows a trend per lift.

## Acceptance Criteria
```gherkin
Scenario: The formula
  Given a set of 5 reps at 100 kg with 2 reps in reserve
  Then its e1RM is 123.3 kg

Scenario: The best set counts
  Given a session with sets worth 120, 123 and 118 kg
  Then the session's e1RM is 123 kg

Scenario: High-rep sets are ignored
  Given a set of 20 reps
  Then it does not contribute to e1RM

Scenario: Progress
  Given a lift's e1RM rose from 100 to 106 kg over four weeks
  Then the Progress screen shows +6 kg (or the equivalent in pounds) for that lift
```

## Notes
- e1RM is a comparison tool, not a prediction of a real one-rep max. Say so where it is shown.
