---
id: MM-14
status: done
component: onboarding
related: [MM-9, MM-10, MM-60, MM-69, MM-83]
---

# Task: Biological sex is male or female, required, and enforced at every layer

## Context
Resting energy, body-fat estimation, essential-fat floors, the body-fat ranges that decide goals and loss rates, the calorie floor and the
minimum fat intake all differ between males and females. A unisex model, or a default applied when the answer is missing, gives a female
user male limits or the reverse.

## Decisions (made with the product owner)
- **The application models biological sex as a strict binary, male or female**, and uses it for every formula. It does not model gender
  identity and has no third or "unspecified" value. This is a fixed product constraint.
- **There is no fallback.** When sex is unknown the engine does not run.

Choices I made without asking (say if any is wrong):
- **A health platform's value may only pre-fill the question.** HealthKit's biological sex has four values (female, male, other, not set);
  only male and female are used, and the user still confirms. Health Connect has no such field, so on Android the app always asks.

## Description
The rule is enforced four times, so that no single mistake can break it:

1. **Type**: `BiologicalSex` is an enum with exactly `male` and `female`. Every engine function that depends on sex takes it as a required,
   non-null parameter, and switches on it exhaustively (adding a value would be a compile error everywhere it matters).
2. **Parsing**: `BiologicalSex.parse` throws on any other string, so a corrupt stored value can never become a default.
3. **Schema**: the database column is `NOT NULL` with `CHECK (sex IN ('male', 'female'))`.
4. **Screens**: onboarding cannot continue until one is chosen.

## Acceptance Criteria
```gherkin
Scenario: Other values cannot be parsed
  When "other", "unknown", an empty string or "Male" is parsed
  Then parsing fails

Scenario: Other values cannot be stored
  Given a stored profile
  When its sex is set to any value other than male or female, or to null, directly in the database
  Then the database rejects the write

Scenario: Sex-specific formulas differ
  Given two profiles identical except for sex
  Then their resting energy, estimated body fat, calorie floor and goal body-fat floors differ as the formulas specify
```

## Notes (built and verified)
- `packages/domain/lib/src/biological_sex.dart`; the `sex` column in `packages/data/lib/src/database.dart`.
- Domain test "rejects anything outside the binary instead of defaulting"; data test "the schema itself rejects any sex outside the binary"
  (four bad values and null).
- Health platform pre-fill is not built (MM-69). Correcting a mis-tapped sex after onboarding is not built (MM-83).
