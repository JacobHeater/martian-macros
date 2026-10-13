---
id: MM-9
status: done
component: onboarding
related: [MM-10, MM-11, MM-12, MM-13, MM-14, MM-22, MM-83]
---

# Epic: Onboarding

## Context
The engine cannot produce a single number without knowing who it is coaching: sex, age, height and weight feed every formula, training
background decides which goals are realistic, and some health conditions make a calorie deficit unsafe.

## Narrative
A new user answers five short screens and leaves with a goal and starting targets:

1. **About you**: biological sex and date of birth (MM-10, MM-13, MM-14).
2. **Measurements**: height and current weight, in the units they choose (MM-10).
3. **Training**: experience, days per week, and an optional body-fat estimate (MM-10).
4. **Health check**: conditions that change or switch off recommendations (MM-11).
5. **Your plan**: the recommended goal with the reason, and the goals they may choose (MM-12).

The current weight becomes the first weigh-in, which is what lets the coach issue targets immediately (MM-24).

Editing these answers afterwards is partly built (MM-82) and partly not (MM-83).

## Acceptance Criteria (narrative)
The Epic is done when a new user can go from first launch to the Today screen with targets in under three minutes, cannot proceed without
choosing a sex, cannot proceed if under 18, and is never offered a goal their health check rules out.

## Outcome
Built and run on an Android emulator end to end: a 200 lb, 5 ft 11 in novice was recommended recomp and landed on Today with 2,473 kcal and
172 g protein. Widget tests cover the male and female paths.
