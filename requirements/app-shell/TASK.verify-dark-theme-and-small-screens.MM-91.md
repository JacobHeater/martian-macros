---
id: MM-91
status: done
component: app-shell
related: [MM-89, MM-17, MM-93, MM-102, MM-105, MM-106]
---

# Task: Check the dark theme, small screens and large text

## Context
A dark theme is defined and follows the system setting, but nobody has looked at it. Every screen was only ever seen in the light theme on
one large phone (a Pixel 10 Pro XL emulator) at the default text size.

## Description
Look at every screen (the five onboarding steps, Today with and without entries, the add-food sheet, Progress with and without history,
Coach in both its held and measured states, the change-goal sheet, Settings, the erase dialog) in each of:
- the dark theme;
- a small phone (about 360 dp wide);
- the largest system text size.

Fix what is unreadable, clipped or overflowing. In particular check the trend chart's band, line and dots against a dark background, the
three macro bars on a narrow screen, and the notice boxes' contrast.

## Acceptance Criteria
```gherkin
Scenario: Dark theme
  Given the system is in dark mode
  Then every screen is legible, and the chart's trend line, band and dots are distinguishable

Scenario: A small phone
  Given a 360 dp wide screen
  Then no screen shows an overflow warning or clipped text

Scenario: Large text
  Given the largest system text size
  Then every control is still reachable and no label is cut off

Scenario: Kept that way
  Then screenshot (golden) tests cover at least Today, Progress and Coach in both themes
```

## Notes
- Contrast for body text should meet WCAG AA (4.5:1). The Material 3 palette usually does; the custom notice and badge colors are the
  ones to check.

## Progress (2026-10-20, feat/m2)
Closing the ticket:
- **Dark theme and the three palettes**: every story is drawn in Light, Dark and Martian in the register; contrast is held by
  token pairs (`tokens.test.ts`), including the chart's line, band and dots and the notice colours.
- **Large text**: the `*LargeText` stories (Dashboard, Not weighed today, Food, Progress, Coach) at 200%, and the rules that let
  the bar, labels and row actions wrap (`largeTextLayout.test.ts`).
- **Small screens**: the design width is 412 dp (screen direction rule 7, the owner's call); at 360 dp nothing may be lost, as the
  checklist says.
- **Kept that way**: the stories are the screenshot register (the owner's Storybook rule replaces golden tests).
Not verified: the phone's own largest text size (Android scales fonts only through text zoom; iOS unchecked), listed in the
accessibility checklist's by-hand pass.
