---
id: MM-107
status: proposed
component: design-system
related: [MM-101, MM-102, MM-17, MM-23, MM-34, MM-77, MM-98]
---

# Task: How charts and uncertain numbers are drawn

## Context
See MM-101. This product's whole argument is that single readings are noisy and trends are trustworthy. How it draws a measurement and its
uncertainty is therefore part of the product, not decoration. One chart exists (the weight trend, MM-17); more are coming: waist, strength
per lift, a small trend line on the dashboard, body fat as a range, intake over a week.

## Decisions
Choices I made without asking (say if any is wrong):
- **One visual language for "measurement, estimate, uncertainty"**, used by every chart:
  - a raw reading is a small dot in the `reading` color;
  - the app's estimate is a solid line in the `trend` color;
  - uncertainty is a soft band of the same hue behind the line.
- **A number with uncertainty is written with it**: "2,739 ± 411 kcal", or as a range, "18-22%". It is never shown to more precision than
  it has: no decimals on calories, one decimal on weight, whole percents on body fat.
- **A target is a thin dashed line**, labelled, never a filled region.
- **Axes are quiet**: light horizontal grid lines only, few labels, the unit stated once. The vertical axis is scaled to the data, not
  forced to zero, for weight and body measurements (a weight chart from zero shows nothing); bar charts of amounts do start at zero.
- **Every chart has a one-sentence caption** saying what it shows in words, which is also what a screen reader reads (MM-106).
- **A small trend line** (for the dashboard) is the same line and band with no axes and no dots.
- **Too little data is shown honestly**: one reading is one dot and a sentence, not a flat line that implies a trend.
- **Time ranges are the same everywhere**: 30 days and 90 days, and later a year.

## Description
A small set of chart components in the component package (trend chart, small trend line, range bar, weekly bars) that screens configure with
data and never restyle.

## Acceptance Criteria
```gherkin
Scenario: The same language
  Then weight, waist and strength charts draw readings, estimate and uncertainty the same way

Scenario: No false precision
  Then calories are shown without decimals and an estimate is shown with its uncertainty or as a range

Scenario: One reading
  Given a single weigh-in
  Then the chart shows one dot and says a trend needs more weigh-ins

Scenario: Legible in both themes
  Then the line, band and dots are distinguishable from each other and from the background in light and in dark

Scenario: In words
  Then every chart has a caption that a screen reader reads in place of the drawing
```

## Notes
- The existing trend chart already draws dots, a line and a two-sigma band; this makes that the rule and moves it into a shared component.
