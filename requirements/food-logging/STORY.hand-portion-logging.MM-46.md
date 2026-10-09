---
id: MM-46
status: proposed
component: food-logging
related: [MM-37, MM-27, MM-38, MM-42, MM-49, MM-167]
---

# Story: Log with hand portions instead of a scale

## Context
Beginners will not weigh food, and should not have to. The risk is a method so loose that the engine's advice becomes wrong.

## Decisions (made with the product owner)
- **One data model for every way of logging.** A hand portion is stored as an amount of a specific food with a record of how it was
  measured and how uncertain that is; it is not a separate, lesser kind of entry.
- **A hand portion converts to grams of the food chosen**, never to generic macros: a palm of salmon and a palm of chicken come out
  differently. The portion is a volume scaled to the user's hand (estimated from height and sex), times the food's density.
- **Uncertainty**: palm 25%, cupped hand 30%, thumb 40%.
- **A steady bias is absorbed by the adaptive estimate.** What matters is noticing when the user changes method (MM-27).
- **There are no "modes".** Hand portions are an amount unit offered alongside grams and servings.

Choices I made without asking (say if any is wrong):
- **Which portion suits which food**: palm for meat and fish, cupped hand for grains, fruit and other carbohydrate foods, fist for
  vegetables, thumb for fats and spreads. The amount step offers the fitting one first.
- **Where protein precision matters, the app says so.** A user logging protein mostly by palm, whose protein target matters for their goal,
  is nudged to weigh their main protein source for one week to calibrate.

## Description
In the amount step (MM-42), a food can be logged as a number of palms, cupped hands, fists or thumbs. The app shows the grams and macros it
will record.

## Acceptance Criteria
```gherkin
Scenario: The food matters
  When one palm of salmon and one palm of chicken breast are logged
  Then the two entries have different weights and macros

Scenario: The hand matters
  Given a 190 cm man and a 155 cm woman
  When each logs one palm of the same food
  Then his entry is heavier

Scenario: Recorded as a hand portion
  When a food is logged by palm
  Then the entry is recorded as measured by palm, with 25% uncertainty

Scenario: Switching to a scale
  Given three weeks logged by hand portions
  When the user begins weighing everything
  Then the expenditure estimate restarts its window at the switch
```

## Notes
- Needs a density for each food (grams per unit volume), which the food pack must carry or approximate by food group (MM-55).
- The hand-size model (volume from height and sex) needs a source and a sanity check against a few real hands.
- The engine's style-switch rule currently only distinguishes weighed from not weighed (MM-27); it must learn to tell hand portions from
  label servings.

## Clarified by MM-167 (proposed)
A hand portion is stored as a count of palms, cupped hands or thumbs, the model and its version, and the grams it implies as an
estimate. Until the hand model exists, hand methods are a count plus typed totals. Whether "fist" is a method is an open decision in
MM-167.

Decided with the product owner (MM-167): there is **no fist portion**; the hand methods are palm, cupped hand and thumb. Vegetables
use a cupped hand or a cup. Until the hand model is built, these are logged as a count plus typed totals, labelled as an estimate.
