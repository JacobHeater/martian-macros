---
id: MM-81
status: done
component: settings
related: [MM-80, MM-10]
---

# Story: Choose pounds and inches, or kilograms and centimeters

## Context
The launch market is the United States, so imperial is the default. The engine and the database work only in SI units.

## Decisions (made with the product owner)
- **Imperial by default; metric available. Conversion happens only at the screen.**

Choices I made without asking (say if any is wrong):
- **One setting covers weight and length together.**
- **Weights show one decimal place** in either unit.
- **Changing the setting changes every screen at once** and alters no stored value.
- **Food is always in grams and calories** in both systems, as on US labels.

## Description
A two-way control at the top of Settings. Weigh-ins, the trend chart, the waist card and the intended pace follow it.

## Acceptance Criteria
```gherkin
Scenario: Switching
  Given a trend weight shown as 200.0 lb
  When kilograms are selected
  Then it is shown as 90.7 kg and the stored weigh-ins are unchanged

Scenario: Entry follows the setting
  Given kilograms are selected
  When 89.5 is saved as today's weigh-in
  Then 89.5 kg is stored

Scenario: Round trip
  Then converting a weight to pounds and back gives the same kilograms
```

## Notes (built and partly verified)
- `Fmt` in `apps/mobile/lib/src/format.dart` is the only place imperial units exist; `Units` in `mm_domain` holds the constants.
- The widget test for the Progress tab runs in metric and saves a metric weigh-in. **Switching units in Settings has no test** (MM-93).
- Height is shown in feet and inches in imperial; the rounding of inches can show "5 ft 12 in" for a height just under 6 ft. Fix when
  editing height is built (MM-83).
