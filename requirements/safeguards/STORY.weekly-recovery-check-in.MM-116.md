---
id: MM-116
status: proposed
component: safeguards
related: [MM-110, MM-20, MM-24, MM-33, MM-61, MM-68, MM-117, MM-140, MM-146]
---

# Story: Twenty seconds a week on how I am holding up

## Context
The coach sees food and weight. It does not see whether the user is starving, exhausted, sleeping four hours or dreading the gym. Those
are what end diets, and they are the earliest signs that a deficit is too large for this person at this time. A human coach asks every
week.

Evidence:
- **Moderate**: in athletes, simple self-reported measures (mood, fatigue, sleep quality, soreness) track training stress more
  consistently and sensitively than common objective markers (Saw, Main and Gastin, 2016, systematic review). Athletes are not the general
  user, and "tracks" is not "predicts".
- **Emerging**: short sleep during a deficit shifts weight loss away from fat. In a 14-day crossover trial, 5.5 against 8.5 hours in bed
  cut the share of loss that was fat by about half (Nedeltcheva 2010). Ten participants; treat as a signal, not a law.
- **Moderate**: loss of menstrual periods is a recognized indicator of problematic low energy availability (IOC consensus statement on
  REDs, 2023).

## Decisions
Choices I made without asking (say if any is wrong):
- **Five questions, each on a five-point scale with words at the ends**, shown once a week with the check-in (MM-24): hunger (manageable to
  constant), energy through the day, sleep quality, how training felt, mood and irritability.
- **One optional number**: typical hours of sleep. Pre-filled from the health platform when connected (MM-68).
- **Skippable**, every week, with no penalty and no streak. An unanswered week is missing data.
- **For female profiles who log cycles** (MM-20): if a previously regular cycle shows no period for 45 days or more, the check-in asks
  whether it is expected (contraception, pregnancy, menopause and "not sure" are answers). "Not sure" on a deficit goal produces a
  non-diagnostic notice: missed periods can follow eating too little for long, and are worth raising with a doctor. Male profiles never see
  this.
- **Answers are stored as observations** and shown back as five small trend lines over the last eight weeks. They are never combined into
  a single "recovery score": a made-up composite hides which thing is wrong and implies a precision the answers do not have.
- **Answers never lower a target.** Their only effect on coaching is to *offer relief* (MM-117).

Where the experts disagreed:
- The recovery expert wanted daily readiness ratings and resting heart rate or heart-rate variability from wearables. The UX strategist
  and behavior-change expert held that a daily survey will not survive the second week, and the researcher noted that consumer HRV as a
  guide to dieting has no evidence behind it. Weekly, five items, no wearable metrics.
- The physique expert wanted libido asked (it is a classic sign of a deficit gone too far, especially in men). Left out of the first
  version as a question many users will not answer honestly to an app; revisit.

## Description
A short sheet shown with the weekly check-in and reachable from the Coach screen; a new observations table (needs MM-61).

## Acceptance Criteria
```gherkin
Scenario: Answering
  Given the weekly check-in is due
  When the five questions are answered
  Then one record is stored for that week and the Coach screen shows the eight-week lines

Scenario: Skipping
  When the sheet is dismissed unanswered
  Then nothing is stored, nothing is lost, and it is offered again next week

Scenario: No composite
  Then no screen shows a single number or grade combining the answers

Scenario: A missed period
  Given a female profile on fat loss with cycles logged about every 29 days and none for 46 days
  Then the check-in asks whether that is expected
  And "not sure" produces the notice

Scenario: Male profile
  Given a male profile
  Then no question about periods is ever shown

Scenario: Never a cut
  Given any set of answers
  Then the calorie target is not lower than it would have been without them
```

## Notes
- Priority: should-have. Best built with the monthly report (MM-33), which should show the lines.
- A reminder for it is covered by MM-146.
- Step count from a health platform is the one objective signal worth showing beside these: average steps commonly fall during a deficit
  as spontaneous activity drops, which lowers expenditure without the user noticing. Display only, future phase; it does not enter the
  estimate (MM-23).
