---
id: MM-74
status: proposed
component: training
related: [MM-75, MM-76, MM-77, MM-78, MM-79, MM-22, MM-32, MM-28, MM-68, MM-189, MM-191]
---

# Epic: Training log

## Context
Recomposition is caused by training: muscle is built in response to progressive overload, and diet only permits it. Planning put the
question to the product owner directly ("how do you coach recomp without knowing whether the user trains?") and the answer was to track
training.

Strength is also one of the three headline progress measures, with trend weight and waist, and the one that most often improves while the
scale stands still.

## Decisions (made with the product owner)
- **Track training**: sets with reps, load and reps in reserve; an estimated one-rep max per lift; weekly hard sets per muscle group;
  progression suggestions.
- **No social features.** This is a body-composition tool, not a competitor to dedicated lifting apps.

## Narrative
A user logs a workout as exercises and sets (MM-75), choosing exercises from a built-in library (MM-76). From the log the app derives a
strength trend per lift (MM-77), which feeds the recomp signal (MM-32) and the monthly report (MM-33), and weekly training volume per
muscle group (MM-78). It suggests what to attempt next time (MM-79).

Logged training also lets the engine estimate training energy, which the calorie floor for lean users needs (MM-28) and currently receives
as zero.

## Acceptance Criteria (narrative)
The Epic is done when a user can log a typical gym session in less time than the rest between sets allows, sees whether each main lift is
getting stronger over weeks, and the coach's recomp signal and reports use that.
