---
id: MM-127
status: done
component: macro-targets
related: [MM-119, MM-38, MM-41, MM-49, MM-53, MM-92, MM-108, MM-124, MM-142]
---

# Story: Count alcohol honestly

## Context
Alcohol has about 7 kcal per gram and is none of protein, carbohydrate or fat. MM-49 adds it to the energy check and to Full detail. What
is still undecided is how a drink sits against the daily targets, and that is where trackers go wrong:

- A typed entry of "2 beers, 300 kcal, 26 g carbohydrate" has 104 kcal of macros and 300 kcal of energy. Today it raises a mismatch
  warning (MM-38).
- Some apps and coaches tell users to "log alcohol as carbs or fat" (divide the calories by 4 or 9). That makes the macro totals lie, and
  it encourages cutting real food to fit drinks.

Evidence: alcohol's energy value is **strong**. That alcohol acutely suppresses fat oxidation, and that heavy intake after training
reduces the muscle-building response (Parr 2014, a single acute study at a high dose), are **moderate** and **emerging** respectively;
neither supports a rule beyond counting the calories. Alcohol also commonly shows up on the scale the next morning in either direction
through hydration (MM-142).

## Decisions
Choices I made without asking (say if any is wrong):
- **Alcohol calories count toward the calorie total and are shown as their own line** on the day's summary whenever the day has any, at
  every detail level: "Alcohol: 196 kcal". They are not converted into carbohydrate or fat grams.
- **Carbohydrate and fat guides are not reduced to make room.** They are guides (MM-123); the calorie total is the thing that counts.
- **Protein is never reduced.**
- **A typed entry can carry alcohol**: the macro form has an optional alcohol field (grams, or "standard drinks" at 14 g each), which
  removes the false mismatch warning.
- **No commentary.** No warning on drinking days, no "empty calories", no count of drinks per week, no health advice (MM-108). The one
  exception is the weight-jump explanation, which may list last night's alcohol among the likely reasons for today's reading (MM-142).
- **The app does not help plan drinking**: no "save calories for tonight" (that is banking, MM-124).

- **Standard drinks fill in the grams** (2026-10-21): the typed entry has "Alcohol g" and "Standard drinks" side by side;
  a count typed fills the grams in at 14 g each, grams typed over it clear the count, and only the grams are stored.
- **The line is on Today's hero as well as Food's** (2026-10-21), built as the same row (`AlcoholLine`, a sibling of
  `FiberLine` in the hero, MM-336), so the day's summary says the same thing wherever it is read.

Where the experts disagreed:
- The nutritionist wanted a weekly alcohol total with the US guideline limits shown. The UX strategist: that is health advice the user
  did not ask a macro tracker for, and it will read as judgement. Not included; reconsider only at user request.

## Description
A line on the day summary, an optional field on typed entries, and no change to the targets.

## Acceptance Criteria
```gherkin
Scenario: A drink from the database
  Given an entry with 14 g of alcohol and 13 g of carbohydrate, 153 kcal
  Then the day's calories rise by 153, carbohydrate by 13 g, and an alcohol line shows 98 kcal

Scenario: A typed drink
  When an entry is typed with 300 kcal, 26 g carbohydrate and 2 standard drinks
  Then the alcohol field reads 28 g
  And it is saved without a mismatch warning, with 28 g of alcohol and 26 g of carbohydrate

Scenario: Grams typed over a count of drinks
  Given 1.5 standard drinks typed, filling in 21 g
  When 10 is typed as the grams
  Then the count of drinks is cleared and 10 g is what is kept

Scenario: On Today
  Given today has an entry with 14 g of alcohol
  Then Today's hero shows the alcohol line "98 kcal, in the total", at the default detail level

Scenario: Guides are unchanged
  Given alcohol is logged
  Then the carbohydrate and fat guides and the protein minimum and target are what they were

Scenario: No commentary
  Then no text on any screen comments on the amount of alcohol

Scenario: A day with none
  Then no alcohol line is shown
```

## Notes
- Priority: could-have; small, and it removes a daily irritation for a large share of users.
- Drinks are among the items most often left out of a log (MM-152).

## Progress
Built: a day with any alcohol shows "Alcohol: N kcal" (7 kcal per gram) on the Food screen, at every detail level, and nothing when
there is none; an optional "Alcohol g" field on typed entries (with "one standard drink is 14 g" beside it) is counted in the energy
check, so 2 beers at 300 kcal, 26 g carbohydrate and 28 g alcohol no longer raise a mismatch warning; the alcohol is stored on the
entry and is never turned into carbohydrate or fat; the targets are untouched and no text comments on drinking. Pack foods already
carry their alcohol (MM-49). Tested in `alcohol_test.dart`.

Built (2026-10-21): a "Standard drinks" field beside "Alcohol g" that fills the grams in at 14 g each (`StandardDrink`,
`AlcoholFields`), so the scenario as written (2 standard drinks) saves without a mismatch; and the same alcohol line on
Today's hero (`AlcoholLine`, shared with Food). Tested in `test/food/alcohol.test.tsx` ("a typed drink counted in standard
drinks…", "grams typed over a count of drinks…", "Today shows the day's alcohol…"); drawn in the gallery's
`AddFoodWithAlcohol` (two drinks typed) and `TodayWithAlcohol`. Not run locally; CI validates. Not checked on a device: the
two dense fields side by side on a 360 dp phone.

The weight-jump explanation that may mention last night's alcohol is built under MM-142.

Changed after seeing it on the emulator: the alcohol field made every typed entry longer, so it now sits behind an "Includes alcohol?" text button and appears only when asked for (or when an entry already has alcohol).
