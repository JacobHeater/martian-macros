---
id: MM-364
status: proposed
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
  Body, Water, Sleep. Each has its own switch and opens that area's screen, which lists every rule with a switch, the rule's
  title and an example line.
- **Everything is on by default.** Turning off the master switch greys out the areas and rules but keeps their settings, so
  turning it back on restores them.
- **Safeguarded rules are not offered.** A rule hidden by the eating-disorder safeguard or hidden weight is listed as "Not shown
  for your health answers", with no switch. It is never presented as something to turn on.
- **Sleep is listed only once MM-250 exists.**
- **Stored on the device** with the other preferences, and erased with everything else.
- **The dashboard insight card (MM-141) and safety notices are not affected** by these switches.

## Description
The Settings section and row, the Coach settings screen, an area screen, stored switches, and the filter that MM-362 reads.

## Acceptance Criteria
```gherkin
Scenario: Reached from Settings
  When Settings > Coach > Coaching insights is opened
  Then the master switch and one row per area are shown, all on

Scenario: Master off
  When the master switch is turned off
  Then no inline insight is shown anywhere, and the area and rule switches keep their positions, greyed out

Scenario: Master back on
  Given food was off before the master was turned off
  When the master is turned back on
  Then food is still off and the other areas are on

Scenario: One rule
  When the "Mostly fat" rule is turned off under Food
  Then no food shows that rule's insight and other food rules still show

Scenario: Opened from an insight
  When "Coach settings for this tip" is tapped under an insight
  Then that rule's area screen opens with the rule in view

Scenario: Safeguarded rules
  Given an eating-disorder history
  Then the food-composition rules show "Not shown for your health answers" and have no switch

Scenario: Survives a restart
  Given training is switched off
  When the app is closed and opened
  Then training is still off
```

## UI/UX
- To be drawn: Settings with the Coach section; the Coach settings screen with master on, master off, and an area off; an
  area screen; an area screen with eating-disorder history.
