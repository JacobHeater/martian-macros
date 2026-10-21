---
id: MM-71
status: done
component: health-sync
related: [MM-66, MM-67, MM-16, MM-18, MM-34, MM-68, MM-69, MM-441, MM-442, MM-443]
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

Scenario: The primary scale is chosen automatically until the user names one
  Given weigh-ins from two scales and no scale chosen
  Then the scale with the most weigh-ins in the last thirty days is primary
  And Settings says so, as "Automatic"

Scenario: Choosing the primary scale in Settings
  Given weigh-ins from two scales
  When the user chooses the one with fewer weigh-ins as primary in Settings
  Then its readings count first from then on
  And choosing "Automatic" goes back to the scale with the most weigh-ins

Scenario: Nothing to choose with one scale
  Given weigh-ins from one source only
  Then Settings offers no primary scale

Scenario: The choice survives an update and goes with an erase
  Given a database from before the choice existed
  When the app is updated
  Then no scale is chosen and the automatic rule applies
  And erasing all data forgets a scale that was chosen
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

Built (2026-10-21):
- **The primary scale chosen in Settings.** A "Primary scale" row in the health platform's section, laid out as
  Appearance is (rule 9): the scale in force, with "Automatic: Bathroom scale, with the most weigh-ins in 30 days."
  until one is chosen, and a chooser of "Automatic" and each named source. Shown only when weigh-ins come from more
  than one source. The choice is kept in `user_preferences.primary_scale_source_id` (schema version 15; none,
  automatic, until chosen), behind `PrimaryScaleReader` and `PrimaryScaleWriter`, and the day's weigh-ins are
  chosen again as soon as it changes. The section's note says the primary scale counts first.
- Guarding tests: `test/settings/primaryScale.test.tsx` (automatic, chosen, Settings round trip, one scale);
  the `PreferencesRepository` contract (`test/contracts/preferencesRepositoryContract.ts`) against both
  implementations; `test/data/upgrade.test.ts` ("a version 14 database comes up to date with the primary scale
  chosen automatically"); the erase contract (`test/contracts/dataEraserContract.ts`); `test/data/schema.test.ts`
  and `test/data/schemaFingerprint.test.ts` (version 15). Not run locally; CI validates.

Choices I made without asking (say if any is wrong):
- **A source the platform did not name is never offered** in the chooser (MM-395); it still counts when it is the
  automatic choice.
- **A chosen scale with nothing kept** (its readings deleted) stays chosen, and the row says every source's readings
  count alike until it weighs again.
- **The choice is forgotten when all data is erased**, with the readings it was chosen from.
- **The first CI run found MM-443**: a choice saved before the app opened never reached the day's weigh-in, because the
  state cell that reads it asked once, before the choice had loaded. Fixed in `StreamCell`.
- **No panel pass**: one row in an existing section, built like its sibling Appearance; the stories draw it.

Moved to their own tickets:
- A weigh-in window for people whose morning is not 04:00 to 12:00: MM-441.
- Steps through the platform's own aggregation: MM-442. Body fat tracked per source stays with MM-34.

## UI/UX
- The primary scale in Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx
  (Stories: HealthConnectTwoScales, HealthConnectPrimaryScaleChosen, HealthConnectPrimaryScaleFails).

## Notes
- "First morning reading" assumes a usual sleep schedule. A night-shift worker's morning is not 04:00 to 12:00; a setting for the weigh-in
  window is a small later addition (MM-441).
- When the primary scale changes, the trend filter will see a step if the scales disagree. The outlier rule (MM-18) absorbs a small one;
  a large one needs a per-source offset, which MM-34's design should cover for weight as well as body fat.
