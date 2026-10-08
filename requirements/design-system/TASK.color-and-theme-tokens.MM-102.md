---
id: MM-102
status: proposed
component: design-system
related: [MM-101, MM-91, MM-104, MM-106, MM-107]
---

# Task: Colors with meanings, in light and dark

## Context
See MM-101. Today a screen reaches into Material's generated palette directly (`primary`, `tertiary`, `secondaryContainer`), so the same
idea is colored differently in different places: protein is `primary` on the Today screen only because that file says so.

## Decisions
Choices I made without asking (say if any is wrong):
- **Keep Material 3's generated palette as the base**, seeded from the rust accent, for surfaces, text and controls.
- **Add a small set of named, semantic colors on top**, each defined for light and for dark:

| token | used for |
|---|---|
| `protein`, `carbs`, `fat` | the three macros, wherever they appear (bars, legends, entry rows) |
| `energy` | calories |
| `trend` | the weight trend line; `trendBand` for its uncertainty band; `reading` for raw weigh-in dots |
| `positive` | progress the user made (a personal record, a waist measurement down). **Never** used for "ate less" |
| `caution` | health cautions and safety notices |
| `info` | explanations and calibration notices |
| `danger` | destructive actions only (erase, delete) |

- **Being over a calorie target is not `danger` and not red.** It is stated in the normal text color (MM-108).
- **Macro colors are distinguishable without color vision**: they differ in lightness as well as hue, and are always labelled.
- **The direction for the palette**: warm and earthy, built around the rust accent, with a cool contrasting color for the trend line so it
  reads clearly against warm surfaces. This is a proposal for the product owner to react to.
- **Screens use tokens, never literal colors.** A lint or a test flags a `Color(0x...)` outside the theme files.

## Description
A theme extension holding the semantic colors, defined for both themes, with the existing screens changed to use it.

## Acceptance Criteria
```gherkin
Scenario: One meaning, one color
  Then protein is the same color on the dashboard, the Food screen and any chart, in each theme

Scenario: Both themes defined
  Then every token has a light and a dark value

Scenario: Contrast
  Then every token used for text or for a chart line meets the contrast rules in MM-106 against the surfaces it appears on, in both themes

Scenario: No stray colors
  Given a screen file containing a literal color
  Then a check fails

Scenario: Without color vision
  Given the three macro bars viewed in grayscale
  Then they are still told apart by lightness and by their labels
```

## Notes
- Show the proposed palette as a rendered sheet (in the gallery, MM-105) before applying it to screens; a table of hex values cannot be
  judged.
