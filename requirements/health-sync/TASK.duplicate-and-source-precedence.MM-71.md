---
id: MM-71
status: proposed
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

## Notes
- "First morning reading" assumes a usual sleep schedule. A night-shift worker's morning is not 04:00 to 12:00; a setting for the weigh-in
  window is a small later addition.
- When the primary scale changes, the trend filter will see a step if the scales disagree. The outlier rule (MM-18) absorbs a small one;
  a large one needs a per-source offset, which MM-34's design should cover for weight as well as body fat.
