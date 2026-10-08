---
id: MM-102
status: done
component: design-system
related: [MM-101, MM-91, MM-104, MM-106, MM-107]
---

# Task: Colors with meanings, in light and dark

## Context
See MM-101. Today a screen reaches into Material's generated palette directly (`primary`, `tertiary`, `secondaryContainer`), so the same
idea is colored differently in different places: protein is `primary` on the Today screen only because that file says so.

## Decisions
Choices I made without asking (say if any is wrong):
- **Superseded by the product owner's redesign brief (see `design/color-and-theme-system.md`).** No seed palette: define both `ColorScheme`s explicitly
  (cool ink canvas, Ember action, Ion measurement color, blue/gold/violet macros). Ember is never tinted. The rust-seed proposal that was here
  produced the muddy look and is withdrawn.
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
- **The direction for the palette**: see `design/color-and-theme-system.md`. Values were checked for contrast and color-blind separation but
  not yet seen rendered in the app; `design/palette-preview.html` is the review sheet. Still a proposal until the gallery (MM-105) shows it.
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
## Progress (step 1a, built and verified)
- Built: `apps/mobile/lib/src/theme/` (`mm_colors.dart`: `MmColors` theme extension with light and dark values and `context.mm`;
  `mm_theme.dart`: explicit `ColorScheme`s, no seed, no surface tint, and component themes for navigation bar, FAB, buttons, inputs, cards,
  sheets, dialogs, snack bars, switches, progress). `app.dart` uses it. Today's macro bars use the macro tokens; the Progress chart uses the
  trend token; swipe-to-delete no longer uses a tinted error container.
- Verified: `apps/mobile/test/theme_test.dart` computes contrast for every token pair in both themes (text 4.5:1; graphics and bars 3:1),
  lightness separation of the three macros, both themes defined, and fails on a literal `Color(0x…)` or a seed palette outside the theme
  folder, or on a tinted Ember. `mm check` passes (80 app tests). Seen on the Android emulator in light and dark on Today and Progress.
- **Not yet done**: macro bars were seen only empty (no food logged), so the macro colors are unseen in the app; the rendered gallery and
  palette sheet (MM-105); the Coach, Onboarding and Settings screens in the new theme; grayscale and color-blind review on device; the
  `Notice` and `ChoiceCard` still use their old shapes (step 1b). Status stays in-progress until the gallery shows the palette.

## Notes (completed)
- Both themes, the semantic tokens, the contrast test, the no-stray-colors test and the rendered review (`design/palette-preview.html`, and the in-app gallery's color swatches, MM-105) exist. The
  product owner reviewed the rendered palette and approved it.
- **Not verified**: grayscale and color-blind review was done numerically (L* separation and simulated ΔE in `design/color-and-theme-system.md`), not with a person who has color-vision deficiency.
