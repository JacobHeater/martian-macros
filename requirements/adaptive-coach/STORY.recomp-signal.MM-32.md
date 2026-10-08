---
id: MM-32
status: proposed
component: adaptive-coach
related: [MM-22, MM-17, MM-21, MM-26, MM-77, MM-92]
---

# Story: A recomp signal when the scale is flat but the body is changing

## Context
A recomp done right can leave the scale flat for six weeks. In every other app that reads as failure. Planning identified this as the main
retention risk, and the answer as the product's signature moment.

## Decisions (made with the product owner)
- **When trend weight is flat, waist is going down and strength is going up, the app shows a "Recomp signal".** It is real evidence, not a
  gimmick: those three together are what fat lost and muscle gained look like from outside.

Choices I made without asking (say if any is wrong):
- **Flat** means trend weight changed by less than 0.5% over four weeks.
- **Waist down** means at least 1 cm lower than four weeks ago, with at least two measurements in the window.
- **Strength up** means the estimated one-rep max rose on at least two tracked lifts over four weeks (MM-77).
- **It is shown in any goal**, since it describes what happened, not what was intended.

## Description
A card on the Progress screen, shown while the conditions hold, saying what was seen in plain terms ("Your weight held at 182 lb. Your waist
is down 0.6 in. Your squat and row are up."). When only some conditions have data it says what is missing instead (for example, "Measure
your waist weekly to see this").

## Acceptance Criteria
```gherkin
Scenario: All three hold
  Given four weeks with flat trend weight, a waist 2 cm lower and two lifts stronger
  Then the Recomp signal card is shown with those three facts

Scenario: Weight is falling
  Given the same but trend weight down 2%
  Then the card is not shown (that is fat loss, and the trend already shows it)

Scenario: No waist data
  Given flat weight and rising strength but no waist measurements
  Then the card asks for a weekly waist measurement instead
```

## Notes
- Depends on the training log for strength (MM-77). A first version on weight and waist alone is possible and weaker.
- The thresholds need checking against the measurement noise of a tape (about 0.5 to 1 cm), or the card will flicker.
