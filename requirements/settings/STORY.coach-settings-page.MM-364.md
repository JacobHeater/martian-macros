---
id: MM-364
status: done
component: settings
related: [MM-361, MM-362, MM-80, MM-259, MM-148]
---

# Story: A Coach page in Settings, with switches for all, each area and each rule

## Context
See MM-361. Every qualifying item shows its insight, so the person needs a way to quiet them. The owner put that in Settings,
under a Coach page, and noted that Settings needs more hierarchy than it has (2026-10-17). Today Settings is one screen of
sections (MM-259): Today's setup, Data, Appearance, About. Its sub-screens so far open from a row (the health check, the
reminders).

## Decisions
The product owner's (2026-10-17): toggles in Settings under a Coach hierarchy. A master switch, one per area, one per rule.

Choices I made without asking (say if any is wrong):
- **A new "Coach" section on the Settings screen** with one row, "Coaching insights", that opens a Coach settings screen. The
  sibling is the row that opens the health check (`HealthCheckScreen`), so the hierarchy is a row leading to a screen, the pattern
  Settings already has, not a new pattern.
- **The Coach settings screen**: at the top, "Insights under logged items", on or off. Below it, one row per area: Food, Training,
  Body, Water, Sleep. Each row says its state ("On · 5 kinds", "Off", "Off while insights are off") and opens that area's
  screen.
- **The area's switch is on its own screen, not on its row** (changed at the design review, the panel's product designer
  agreeing): a row that both opens a screen and holds a switch has two targets, unlike any Settings sibling. The area screen
  starts with the area's switch, then lists every kind of insight with its switch, its title and an example line.
- **One word** (the panel's UX-8): "insights" for what the coach says, "kinds" of insight for the rules. No "tips" or "notes".
- **The kinds have no icons of their own** (the panel's PD-7): a kind has no meaning to draw that its area's icon, at the top of
  its screen, does not already give. Inventing one per kind would make icons that teach nothing.
- **Everything is on by default.** Turning off the master switch keeps each area's and kind's position, so turning it back on
  restores them. The off state is said in the area switch's own words ("Off while all insights are off. What you choose here is
  kept…"), not only in a note below (the panel's UX-7, PD-8).
- **Opened from an insight**, the area screen names the kind in words ("The insight you opened is this kind"), brings it into
  view and puts the focus on its switch (the panel's UX-2).
- **Safeguarded kinds are not offered.** A kind hidden by the eating-disorder safeguard or hidden weight is listed as "Not shown
  for your health answers", with no switch. It is never presented as something to turn on.
- **An area is listed once it has a kind of insight** (decided at the build, 2026-10-17): a row for an area with no
  kinds would open an empty screen. So only Training is listed at first, and Sleep joins after MM-250 and MM-368.
- **Switches are stored by the kind's id**, not its title, so a reworded title keeps its switch.
- **Stored on the device** with the other preferences, and erased with everything else.
- **The dashboard insight card (MM-141) and safety notices are not affected** by these switches.
- **Each area's screen lists what is snoozed** in it, each with "Turn back on" (the product owner, 2026-10-18, MM-378).

## Description
The Settings section and row, the Coach settings screen, an area screen, stored switches, and the filter that MM-362 reads.

## Acceptance Criteria
```gherkin
Scenario: Reached from Settings
  When Settings > Coach > Coaching insights is opened
  Then the master switch and one row per area are shown, all on

Scenario: Master off
  When the master switch is turned off
  Then no inline insight is shown anywhere, each area row says it is off while insights are off, and the area and kind switches keep their positions

Scenario: Master back on
  Given food was off before the master was turned off
  When the master is turned back on
  Then food is still off and the other areas are on

Scenario: One rule
  When the "Mostly fat" rule is turned off under Food
  Then no food shows that rule's insight and other food rules still show

Scenario: Opened from an insight
  When "Settings for “Mostly fat”" is tapped under an insight
  Then food's screen opens with "Mostly fat" named as the kind opened, in view, and its switch focused

Scenario: Safeguarded rules
  Given an eating-disorder history
  Then the food-composition rules show "Not shown for your health answers" and have no switch

Scenario: Survives a restart
  Given training is switched off
  When the app is closed and opened
  Then training is still off
```

## UI/UX
In `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx`, reviewed by the panel
(`docs/agent-runs/mm361-coaching-insights/`). The switches are held only while the screens are open
(`InsightSwitchesDraft`) until they are stored.
- SettingsCoachSection. Settings with its Coach section, after Today's setup.
- CoachSettings, CoachSettingsAllOff. The master switch and the areas, on and all off.
- CoachSettingsFood, CoachSettingsFoodOff, CoachSettingsFoodWhileAllOff, CoachSettingsTraining. Area screens.
- CoachSettingsFoodEatingDisorder. Kinds left out for health answers, with no switch.
- FoodInsightToSettings. Opened from an insight.

## Progress
- Built 2026-10-17. Stored in `user_preferences` (schema version 7: `inline_insights_off`, `inline_insight_areas_off`,
  `inline_insight_kinds_off`), read and written through `PreferencesRepository` (one contract, both stores), erased with
  everything else. `InsightSwitchesDraft` is gone.
- The Settings section shows once the app has a kind of inline insight. The design's stories still draw every area with
  the drafted kinds (`draftInsightKinds`), handed in as a preview.
- Tests: `test/coach/inlineInsights.test.tsx` (opened from an insight with the kind named and its switch focused; an area
  off hides its lines and stays off after a restart; all off and back on keeps each area's position),
  `test/contracts/preferencesRepositoryContract.ts`, `test/data/upgrade.test.ts` (a version 6 database comes up with
  everything on), `test/engine/allowedItemInsights.test.ts` (one kind off).
