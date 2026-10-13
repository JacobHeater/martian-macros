---
id: MM-71
status: in-progress
component: health-sync
related: [MM-66, MM-67, MM-16, MM-18, MM-34, MM-68, MM-69]
---

# Task: Which reading counts when several sources report the same thing

## Context
A user may have a smart scale, a second scale at the gym, a watch and two fitness apps all writing to the same health store. The original
brief asked for a fixed precedence between named wearables. Planning found the question smaller than it looked: for the data this app
actually uses, the conflict is almost entirely about weigh-ins.

## Decisions (made with the product owner)
- **For steps, trust the platform's own aggregation**, which already applies the priority the user set in their phone's health settings.
- **For weight and body fat, read raw samples with their source** and apply the app's rule.
- **One weigh-in counts per day**: the first reading between 04:00 and 12:00 local time, otherwise the median of the day's readings.

Choices I made without asking (say if any is wrong):
- **Order of preference for a day's weigh-in**: a value the user typed for that day; else readings from the scale the user named as
  primary; else readings from any other source. The time rule above is applied within the winning group.
- **The primary scale is chosen automatically** as the source with the most weigh-ins in the last thirty days, and can be changed in
  Settings.
- **A sample's identity is the platform's own record id**, so re-reading never duplicates.
- **Each source of body-fat readings is tracked separately** (MM-34), never merged, because each scale has its own bias.

## Description
A pure function from a day's samples (value, time, source) and the user's preferences to the reading that counts, with its reason, in the
engine or the health package. The weigh-in screen can show the reason ("from Withings, 6:42 am").

## Acceptance Criteria
```gherkin
Scenario: Morning and evening
  Given readings at 06:40 and 21:10 from the same scale
  Then the 06:40 reading counts

Scenario: No morning reading
  Given readings at 13:00, 18:00 and 22:00
  Then the median counts

Scenario: Two scales
  Given a reading from the primary scale and one from another
  Then the primary scale's reading counts

Scenario: A typed value wins
  Given imported readings and a value the user typed for that day
  Then the typed value counts

Scenario: Deterministic
  Then the same samples in any order give the same result
```

## Progress
Built (2026-10-11):
- **`dailyWeighIns`** (pure, in `packages/health_ingest`): one imported weigh-in per day. The primary scale's readings count
  before any other source's; among those, the first between 04:00 and 12:00 local time, otherwise the middle value. The same
  readings in any order give the same answer.
- **`primaryWeightSource`**: the source with the most weigh-ins in the last thirty days; a tie goes to the id that sorts first.
- **A typed value wins**: `mergeWeighIns` in the app puts what the user typed over the import for that day; the import is kept.
- **The weigh-in card says the reason**: "From Bathroom scale at 6:42 AM." or "The middle of 3 readings from Bathroom scale."

Choices I made without asking (say if any is wrong):
- **The middle of an even number of readings is half way between the middle two.**
- **A middle value taken across two sources is said to be from "several sources".**
- **The morning is 04:00 up to, not including, 12:00.**

Not built:
- **Changing the primary scale in Settings**: it is chosen automatically only.
- Steps through the platform's own aggregation, and body fat tracked per source (MM-34): only weight is used so far.
- A weigh-in window for people whose morning is not 04:00 to 12:00.

## Notes
- "First morning reading" assumes a usual sleep schedule. A night-shift worker's morning is not 04:00 to 12:00; a setting for the weigh-in
  window is a small later addition.
- When the primary scale changes, the trend filter will see a step if the scales disagree. The outlier rule (MM-18) absorbs a small one;
  a large one needs a per-source offset, which MM-34's design should cover for weight as well as body fat.
