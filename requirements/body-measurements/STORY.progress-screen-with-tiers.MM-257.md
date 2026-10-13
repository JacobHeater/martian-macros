---
id: MM-257
component: body-measurements
status: proposed
related: [MM-253, MM-224, MM-17, MM-136, MM-155, MM-77]
---

# Story: the Progress screen in tiers

## What is built

- **The hero**: the weigh-in field and the trend chart as one surface, the
  three figures (trend, last 7 days, since start) above the chart, the
  30-day and 90-day switch in the header.
- **"How to read this"** as a disclosure under the chart; the four-line
  caption leaves the surface.
- **Weight events as rows** with an icon per event type (illness, travel,
  training change, big meal, creatine), newest first, the add action in
  the section header; the four-line paragraph becomes the empty state's
  one sentence.
- **Waist and strength as sections** with their icons and a one-line
  summary each, opening on press.
- **One primary action**: Save the weigh-in; everything else is a row or a
  header action.

## Acceptance criteria

```gherkin
Scenario: The chart stands alone
  Then no explanatory text is on the surface with the chart; "How to read this" opens it

Scenario: Events as rows
  Given an illness and a travel event
  Then each is a row with its icon and date, and the empty state is one sentence

Scenario: Nothing lost
  Then every figure and control the old screen showed is reachable within one tap
```

## UI/UX

`apps/mobile/src/gallery/screens/Progress.stories.tsx` (Progress), before
and after.
