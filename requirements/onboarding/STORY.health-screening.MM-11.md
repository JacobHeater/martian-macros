---
id: MM-11
status: done
component: onboarding
related: [MM-9, MM-12, MM-25, MM-28, MM-29]
---

# Story: A health check that changes what the app will recommend

## Context
A calorie deficit is the wrong advice for some people and a dangerous one for a few. The app is not a clinician, so it does not diagnose;
it asks, and narrows what it will do.

## Decisions (made with the product owner)
The screening rules proposed in planning were accepted:

| answer | effect |
|---|---|
| under 18 | blocked entirely (MM-13) |
| pregnant | maintenance only; a note to follow their clinician |
| breastfeeding | maintenance only, plus 400 kcal a day |
| history of an eating disorder | no deficit goals (maintenance and lean gain remain); no weight-based rewards anywhere |
| chronic kidney disease | protein capped at 0.8 g per kg body weight; a note to confirm targets with their care team |
| testosterone therapy or anabolic steroids | not blocking; a faster expected muscle-gain rate |
| PCOS, menopause, thyroid condition | a caution only; the adaptive estimate handles the rest |

Choices I made without asking (say if any is wrong):
- **Female-only questions (pregnant, breastfeeding, PCOS, menopause) are shown only to female profiles**, and are cleared if the user goes
  back and changes sex to male. The domain layer also refuses those answers on a male profile, so a bug cannot store them.
- **Each caution shows as a notice at the top of the Coach screen** for as long as it applies.
- **The screen says the app is not medical advice.**

## Description
The fourth onboarding screen lists the conditions as checkboxes. The answers produce a coaching policy (`CoachingPolicy`): which goals are
allowed, an energy offset, a protein cap, whether weight-based rewards are suppressed, and the cautions to show.

## Acceptance Criteria
```gherkin
Scenario: Male profiles are not asked female-only questions
  Given a male profile
  Then the health check does not show Pregnant, Breastfeeding, PCOS or menopause

Scenario: Breastfeeding locks the plan to maintenance
  Given a female profile with Breastfeeding ticked
  Then the plan screen offers Maintenance only
  And every calorie target includes 400 kcal for lactation

Scenario: Eating-disorder history removes deficit goals
  Given History of an eating disorder is ticked
  Then Fat loss and Recomp are not offered

Scenario: Kidney disease caps protein
  Given Chronic kidney disease is ticked
  Then the protein target is at most 0.8 g per kg of body weight

Scenario: A contradictory answer cannot be stored
  Given a male profile with a female-only answer set
  Then deriving the coaching policy fails rather than guessing
```

## Notes (built and verified)
- `ScreeningAnswers` and `CoachingPolicy.derive` in `packages/domain/lib/src/screening.dart` (domain tests cover each rule); the screen is
  `_health` in the onboarding screen; caution messages are in `coach_screen.dart`.
- Widget test "female onboarding offers female-only health questions" covers the breastfeeding path.
- The "no weight-based rewards" flag is stored and exposed but nothing reads it yet, because there are no rewards yet (MM-92).
- These rules are product judgement and must be reviewed by a registered dietitian or clinician before launch (MM-29).
- There is no way to change a screening answer after onboarding short of erasing all data (MM-83).
