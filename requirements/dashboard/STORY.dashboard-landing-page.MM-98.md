---
id: MM-98
status: proposed
component: dashboard
related: [MM-97, MM-99, MM-100, MM-17, MM-23, MM-24, MM-32, MM-41, MM-77, MM-92, MM-104]
---

# Story: A landing page that shows how I am doing

## Context
See MM-97.

## Decisions (made with the product owner)
- **The dashboard is the page the app starts on.**

Choices I made without asking (say if any is wrong):
- **The contents, top to bottom**:
  1. **Today's intake**: calories eaten against the target with what remains, and protein against its target. Carbohydrate and fat are on
     the Food screen, not here; protein is the macro that matters most for body composition.
  2. **Weight**: trend weight, its change over the last seven days, and a small trend line of the last thirty days. If there is no
     weigh-in today, this card asks for one.
  3. **Coach**: one line on what the coach is doing. During calibration, "Calibration, day 6 of 14". Afterwards, the next check-in date,
     or what changed at the last one ("Targets went down 80 kcal on Monday").
  4. **This week** (when the training log exists): workouts done, and any personal record.
  5. **Recomp signal** (MM-32), when it applies.
- **Each card opens its detailed screen** when tapped: Food, Progress, Coach, Train.
- **It is for today.** There is no day picker here; past days are looked at on the Food screen.
- **A card with nothing to show says what would fill it**, rather than disappearing, so the layout does not jump around between days.
- **Nothing on it is a reward for eating less** (MM-92). Being over target is stated the same plain way as being under.
- **It fits one screen** on a typical phone for the first three cards, without scrolling.

## Description
A new screen, first in the navigation bar, built from the same data the other screens use (so the numbers always agree with them).

## Acceptance Criteria
```gherkin
Scenario: Opening the app
  Given a user with a profile
  When the app is opened
  Then the dashboard is shown

Scenario: A normal day
  Given 1,400 of 2,400 kcal and 95 of 170 g of protein logged, and a weigh-in today
  Then the dashboard shows 1,400 of 2,400 kcal with 1,000 remaining, 95 of 170 g protein, the trend weight and its 7-day change

Scenario: No weigh-in yet
  Given no weigh-in today
  Then the weight card asks for one

Scenario: Calibration
  Given day 6 since onboarding
  Then the coach card says calibration, day 6 of 14

Scenario: After a check-in
  Given targets changed two days ago
  Then the coach card says what changed and when

Scenario: The numbers agree
  Then the calories, protein and trend weight shown match the Food and Progress screens exactly

Scenario: Drilling in
  When the intake card is tapped
  Then the Food screen is shown for today
```

## Notes
- The calibration banner now on the Today screen (MM-41) moves here; showing it in both places is noise.
- Trend weight needs at least one weigh-in, which onboarding guarantees.
