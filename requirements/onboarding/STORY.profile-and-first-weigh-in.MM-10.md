---
id: MM-10
status: done
component: onboarding
related: [MM-9, MM-13, MM-14, MM-16, MM-81]
---

# Story: Tell the app who you are, and record a first weigh-in

## Context
See MM-9.

## Decisions (made with the product owner)
- **United States first**: imperial units by default, metric available.
- **Onboarding should take under three minutes**; photos and other baselines are not required to start.

Choices I made without asking (say if any is wrong):
- **Units are chosen on the measurements screen** (lb and ft/in, or kg and cm) and become the app's unit setting. Changing units clears
  what was typed, since "5" feet is not "5" centimeters.
- **Height must be 100 to 250 cm and weight 30 to 350 kg** to continue.
- **Training experience defaults to "Under 1 year"** and days per week to 3.
- **Body fat is optional**: a switch reads "I don't know" until turned on, then a slider from 5% to 55% starting at the app's own estimate.
- **The date picker opens on the year list**, thirty years back, because a birth date is chosen by year first.

## Description
Three screens (about you, measurements, training) collect: biological sex, date of birth, unit system, height, current weight, training
experience (not lifting yet; under 1 year; returning after 6+ months off; 1 to 3 years; 3+ years), training days per week (0 to 7), and
optionally body fat. On finishing, the profile is saved and the current weight is saved as today's weigh-in.

Everything is stored in SI units whatever the user typed.

## Acceptance Criteria
```gherkin
Scenario: Nothing proceeds without sex and birth date
  Given the first screen
  Then Next is disabled until a sex is chosen and a date of birth is picked

Scenario: Measurements are required and sane
  Given the measurements screen
  Then Next is disabled until height and weight are entered and within range

Scenario: Imperial entry is stored as SI
  Given 5 ft 11 in and 200 lb are entered
  When onboarding is finished
  Then the stored height is 180.3 cm and today's weigh-in is 90.7 kg

Scenario: Body fat left unknown
  Given the body-fat switch is left off
  When onboarding is finished
  Then no body-fat value is stored and the app uses its own estimate
```

## Notes (built and verified)
- `apps/mobile/lib/src/onboarding/onboarding_screen.dart`; `UserSetup` in `mm_domain`; saved through `MmStore.saveSetup` and `saveWeight`.
- Verified by the widget test "onboarding requires sex and birth date, then creates a plan" and by hand on an Android emulator.
- Not built: baseline waist and photos at onboarding (waist can be logged afterwards, MM-21; photos are not planned yet).
