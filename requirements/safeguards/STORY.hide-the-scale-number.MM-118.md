---
id: MM-118
status: done
component: safeguards
related: [MM-110, MM-11, MM-16, MM-17, MM-68, MM-92, MM-98, MM-107, MM-146]
---

# Story: Be coached by my weight without having to look at it

## Context
The engine needs weigh-ins. Some users are harmed by seeing them: a morning number sets their mood, drives compensating behavior, or
restarts old patterns. Today the only option for them is not to weigh, which removes the trend and the measured expenditure, or not to use
the app.

Evidence:
- **Strong** for adults with overweight in weight-management programs: regular self-weighing improves weight outcomes without adverse
  psychological effects on average (Zheng 2015; Madigan 2015; Pacanowski 2015 reviews).
- **Moderate** in the other direction for young women and people with eating-disorder vulnerability: self-weighing is associated with
  worse body satisfaction and mood, and a randomized trial in emerging-adult women found daily weighing increased swings in negative mood.
- So the average effect is good and the effect is not the same for everyone. That is a case for a setting, not a single policy.

## Decisions
Choices I made without asking (say if any is wrong):
- **A "Weight display" setting with three values**:
  - **Everything** (default): as today.
  - **Trend only**: raw readings are not shown anywhere. The chart draws the trend line and band without dots (MM-107); the dashboard shows
    trend weight and its change; a weigh-in typed by hand is confirmed with "Saved" and no echo of comparisons.
  - **Hidden**: no weight figure appears anywhere. Progress is described in words against the goal's intended pace ("on pace", "slower
    than planned", "faster than planned", "steady"), with the same confidence wording as everywhere else. Waist and strength are shown
    normally.
- **Hidden works best with a connected scale** (MM-68), since the phone then never shows the number; with manual entry the user sees what
  they type and nothing after.
- **The default for a user with an eating-disorder history is Trend only**, shown and explained at onboarding, and changeable.
- **The setting is offered, once, when a pattern suggests it would help**: more than one weigh-in a day on five or more days in two weeks.
  Offered as a choice with no comment on the behavior.
- **Every notification obeys the setting** (MM-146): no weight figure on a lock screen in any mode.
- **The coach is unaffected.** The engine uses every reading in every mode.

Where the experts disagreed:
- The progress-tracking expert: hiding the trend removes the product's central teaching tool, the visible band that shows a spike is
  noise. True, and the reason "Everything" stays the default and "Trend only" is the recommended alternative.
- The adherence expert suggested weekly instead of daily weighing as a milder option. The engineer's answer: a trend from one reading a
  week is far less certain and the expenditure estimate needs eight readings in its window (MM-23). Weighing can be daily and unseen.

## Description
A display setting read by every component that shows weight; wording rules for the Hidden mode's pace descriptions.

## Acceptance Criteria
```gherkin
Scenario: Trend only
  Given the setting is Trend only and three weeks of weigh-ins
  Then the chart shows a line and band with no dots
  And no raw reading appears on any screen

Scenario: Hidden
  Given the setting is Hidden
  Then no screen, summary, report or notification shows a weight in any unit
  And the dashboard describes pace in words

Scenario: The coach still works
  Given the setting is Hidden and two weeks of synced weigh-ins and logged food
  Then the first adaptive check-in happens exactly as it would with the setting on Everything

Scenario: Words follow the data
  Given the setting is Hidden and trend loss of 0.2% a week against an intended 0.75%
  Then the pace is described as slower than planned

Scenario: Default for eating-disorder history
  Given that screening answer is ticked at onboarding
  Then the setting starts at Trend only and the user is told and can change it

Scenario: Switching back
  When the setting is changed to Everything
  Then the full history of readings is shown
```

## Notes
- Priority: should-have.
- The unit and backup exports still contain the numbers; say so in the setting's description.
- Calories have the same problem for some users. A "macros without calories" display was discussed and not specified; note it if asked.

## Decisions (made while building, 2026-10-21; say if any is wrong)
- **The setting is kept unchosen until the person chooses** (`weight_display` null): the default then follows the
  health check, so ticking or unticking an eating-disorder history moves an unchosen display between Everything and
  Trend only. The health check says so under that answer, at onboarding and in Settings.
- **The row lives in Settings, Appearance**, beside Units (rule 9), and opens a sheet of three choice cards built like
  the pace sheets; the sheet says the backup and exports still contain the numbers.
- **One formatting rule guards every screen**: `Fmt.weight` and `weightDelta` are the person's body weight and give no
  figure with Hidden ("hidden"), `Fmt.reading` is one weigh-in and gives a figure only with Everything, and a lifted
  load is `Fmt.load`, always shown (strength is shown normally). The main screens then word each place properly.
- **Pace in words** (`paceInWordsOf`): with a pace intended, under half of it (or the other way) is "slower than
  planned", over one and a half times it "faster than planned", between "on pace"; with none intended, within 0.1% of
  body weight a week is "steady", more is "faster than planned". "So far, ..." until the coach's confidence is good.
- **Hidden shows no weight chart** (its axis is a weight); Trend only draws the line and band without dots, and
  nothing can be picked on it.
- **The offer** is a notice on the Dashboard (built as the relief offer is) only while no display has been chosen;
  "Choose" opens the same sheet, "Not now" or a choice remembers it, and it never shows again.
- Already true and now tested: no notification carries a figure (MM-146's prompts).

## Progress
Built 2026-10-21. Not run locally; CI validates.
- Schema 24 (stacked on MM-156's 23): `user_preferences.weight_display` (null until chosen) and
  `weight_display_offered`; the step keyed 23, the fingerprint for 24, and an upgrade test from 23 (none chosen, other
  preferences kept, one chosen after is kept).
- Progress photos (MM-157) follow it: no weight under the compared photos when Hidden.
- `WeightDisplay` and `WeightDisplayReader`/`Writer` on `PreferencesRepository` (in memory and SQL, the contract
  suite run against both); `state.chosenWeightDisplay`, `state.weightDisplay` (`weightDisplayOf`), and
  `state.weightDisplayOffered`. The SQL columns (`user_preferences.weight_display`, `weight_display_offered`) are
  added by the schema lane's migration on the stacked branch.
- `Fmt` takes the display; every body-weight screen builds its `Fmt` with it (Dashboard and its history, Progress,
  Coach and its cards, insights, the monthly report, what to expect, the pace and target-change sheets). Texts that
  carry a weight say it in words when hidden (weight jump, recomp signal, lean-gain review, rebound, stall, waist
  insight, what to expect); lift loads moved to `Fmt.load`.
- `usePaceInWords` on the Dashboard's weight row and history, Progress's hero and the Coach's Body section.
- A typed weigh-in is confirmed "Saved" with no echo unless Everything; Progress does not put today's reading back
  in its field.
- Guarding tests: `test/engine/weightDisplay.test.ts` (words follow the data: 0.2% against 0.75% is slower than
  planned; the default; the offer's pattern; Fmt hides; no notification has a figure);
  `test/safeguards/weightDisplay.test.tsx` (Trend only: no dots and no raw reading; switching back shows the dots;
  Hidden: no weight in any unit on Dashboard, Progress or Coach, pace in words; the coach's figures are the same as
  with Everything; "Saved" with no echo; the eating-disorder default, said and changeable; the offer once, remembered);
  `preferencesRepositoryContract` (both implementations).
- Stories: `DashboardWeightTrendOnly`, `DashboardWeightHidden`, `DashboardWeightDisplayOffer`,
  `ProgressWeightTrendOnly`, `ProgressWeightHidden`, `CoachWeightHidden`, `ChangeWeightDisplay`,
  `WeightDisplayTrendOnlyByDefault`, `HealthCheckEatingDisorderWeightDisplay`.
- Not built: a weekly report outside the app does not exist, so "report" is the in-app monthly report.

## Owed on a phone
- With Hidden, the morning weigh-in reminder on the lock screen shows no weight (it never had one; check it there).
- With Hidden and a connected scale, a morning's synced weigh-in shows nowhere in the app.
- The upgrade that adds the two preference columns keeps every other preference on the owner's phone.

