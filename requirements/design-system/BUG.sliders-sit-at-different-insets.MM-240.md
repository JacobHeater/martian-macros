---
id: MM-240
component: design-system
status: done
related: [MM-232, MM-237]
---

# Bug: sliders in a list group sit at different insets

## What happened

The owner looked at Settings on the phone (2026-10-12). The "Training days
per week" slider sat inside its row's inset; the "Body fat estimate"
slider ran from one edge of the card to the other, its thumb touching the
border.

## Why

The first slider is the detail of a list row, so it gets the row's
padding. The second was put into the group bare, beside the switch row,
and a bare slider has no padding of its own.

## What is right

A slider in a list group is always in a row: `MmSliderRow`, which carries
the same inset as every other row and draws no divider above itself, so it
reads as part of the setting over it. Screens do not put a bare `MmSlider`
into a group.

## Acceptance criteria

```gherkin
Scenario: the same inset
  Given a measured body fat is entered in Settings
  Then the body fat slider and the training days slider are both inside a
  list row, at the row's inset

Scenario: one setting, no line through it
  Then no divider is drawn between the switch and its slider
```

## UI/UX

`src/gallery/Fields.stories.tsx (Story: Sliders)` and
`src/gallery/screens/Settings.stories.tsx (Story: Settings)`.

## Regression test

`apps/mobile/test/settings/settingsFlows.test.tsx`: every slider in
Settings is inside a list row.

## Progress

**Fixed (2026-10-12).** Failing first, then passing. Looked at in a browser
in the two stories above.
