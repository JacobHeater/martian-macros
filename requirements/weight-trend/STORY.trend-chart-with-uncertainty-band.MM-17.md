---
id: MM-17
status: done
component: weight-trend
related: [MM-15, MM-16, MM-18, MM-93]
---

# Story: See the weight trend, and how sure the app is of it

## Context
See MM-15. The point of the chart is to stop a single morning's reading from being read as progress or failure.

## Decisions (made with the product owner)
- **Trend weight is a headline number**, shown with a visible noise band.

Choices I made without asking (say if any is wrong):
- **The band is the trend plus and minus two standard deviations** of the filter's own uncertainty.
- **Ranges of 30 and 90 days.**
- **Three figures above the chart**: trend weight now, change over the last 7 days, change since the first weigh-in. The last two show a
  dash until there is enough history.
- **A sentence under the chart explains it**: dots are weigh-ins, the line is the trend with water swings filtered out, and jumps inside
  the band are noise, not fat.

## Description
The Progress screen's "Weight trend" card draws raw weigh-ins as dots, the trend as a line, and the band behind it, in the user's unit.
Before the first weigh-in it says to log one.

## Acceptance Criteria
```gherkin
Scenario: Before any weigh-in
  Then the card says to log a weigh-in to start the trend

Scenario: With history
  Given three weeks of weigh-ins
  Then the chart shows a dot per weigh-in, a trend line, and a band around the line
  And the figures show trend weight, the 7-day change and the change since start

Scenario: Switching range
  When 90d is selected
  Then the chart covers the last 90 days

Scenario: Units
  Given the user's unit is pounds
  Then the axis and figures are in pounds
```

## Notes (built and partly verified)
- `_TrendChart` and `_TrendStats` in `progress_screen.dart`, using `fl_chart`.
- **Only the single-reading case was seen on a device** (one dot, no line). A widget test renders the screen with eleven days of weigh-ins
  and checks the figures appear, but nothing asserts what the chart draws. Checking the line and band against real history is MM-93.
