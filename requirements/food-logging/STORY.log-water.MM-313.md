---
id: MM-313
status: done
component: food-logging
related: [MM-305, MM-311, MM-314, MM-100, MM-254, MM-255, MM-301, MM-302, MM-81, MM-108]
---

# Story: Log the water I drink

## Context
See MM-305. The owner asked that the app track water intake. Nothing in the app records water today.

## Decisions
The product owner's (2026-10-14): one-tap glass and bottle plus a typed amount, in the units setting; an
optional goal the user types, off by default, with no formula; plain water only, so drinks logged as food
do not count; shown on the Food screen and the Dashboard, with a one-tap add from the Dashboard; written to
the phone's health platform (MM-314, separately).

Choices I made without asking (say if any is wrong):
- **The sizes**: a glass is 250 ml in metric and 8 fl oz in imperial; a bottle is 500 ml, shown as
  16.9 fl oz in imperial. "Other" takes a typed amount from 1 to 3,000 ml (or the same in fl oz).
- **Amounts** are shown in litres to two decimals in metric ("1.25 L") and whole fluid ounces in imperial
  ("42 fl oz"). They are stored in millilitres.
- **The Dashboard row** sits in the Dashboard's list group after the waist row: a water icon, today's total
  ("1.25 L today"), the goal when one is set ("of 2.5 L"), and a visible "+ Add a glass" action (heard as
  "Add a glass of water") that adds a glass in one tap. The snack says "Added a glass: 1.5 L today" and
  offers Undo, standing above the navigation bar (MM-302). The row itself opens nothing, so the action is
  its only control (the panel's PD-4, UX-3); the day's drinks are on Food. This is the in-place pattern of
  MM-301 and keeps the app bar to its one Add food action (MM-100). It never says the goal is reached:
  that is said once, on Food.
- **The Food screen section** "Water", after the meals and before "More about today": the day's total and
  goal in its summary; in the first row of its group (nothing bare on the canvas, MM-291) "Glass, 250 ml"
  and "Bottle, 500 ml" (or 8 and 17 fl oz) in two columns, and an "Other amount" text action that opens
  the field; the day's additions as rows with their time, each removable. Every add and removal is said
  in a snack naming the day, with Undo (UX-2). It follows the day shown, so a past day's water can be
  added or corrected.
- **The goal** is in Settings under "Nutrition goals" (MM-311): a switch, then the amount, suggested at
  2 L (68 fl oz) when first switched on and accepted from 500 ml to 6 L (owner, 2026-10-14). Above 4 L
  the field's hint says "More than most people need; spread it through the day.", and with kidney
  disease the switch says a care team may limit how much you drink (the panel's SA-5). Reaching it says
  "Goal reached" once in the section's summary; there is no streak, badge or reminder. "Goal" is the
  owner's word; the glossary allows it for an amount a person chooses to aim for (the panel's CO-7).
- **A separate table, `water_entries`**, with a repository interface, a SQL implementation, an in-memory
  fixture and a contract suite (rule 6), in the same schema version as MM-308.
- **Erase all data** erases water too.

## Description
Water entries, their repository, the Dashboard row with its one-tap add, the Food screen section, the goal
preference and its Settings rows.

## Acceptance Criteria
```gherkin
Scenario: One tap from the Dashboard
  Given no water today, metric units
  When Add a glass is tapped on the Dashboard's water row
  Then 250 ml is logged for today, the snack says "Added a glass: 0.25 L today" and offers Undo

Scenario: Undo
  When Undo is tapped on that snack
  Then the glass is removed and the row says no water today

Scenario: Imperial
  Given imperial units
  When a bottle is added
  Then the total is shown as 17 fl oz

Scenario: Another amount
  When Other amount is chosen on the Food screen and 330 ml is typed and saved
  Then 330 ml is added to the day shown and the snack names the day

Scenario: A past day
  Given the Food screen showing yesterday
  When a glass is added
  Then it is logged for yesterday

Scenario: Removed
  When a water row on the Food screen is removed
  Then the day's total goes down by its amount

Scenario: A goal
  Given a goal of 2.5 L and 1.25 L today
  Then the Dashboard row says "1.25 L today" and "of 2.5 L"

Scenario: Goal reached
  Given a goal of 2 L and 2.25 L today
  Then the Food screen's water summary says "Goal reached"

Scenario: No goal
  Given no goal
  Then no goal, percentage or "reached" appears anywhere

Scenario: Food drinks are not water
  Given 500 ml of milk logged as a food
  Then the water total does not change

Scenario: Kept and erased
  Then water entries survive a restart, and Erase all data removes them
```

## UI/UX
- Today — apps/mobile/src/gallery/screens/Today.stories.tsx (Stories: Water, Water Glass Added, Water None).
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Water Section, Water Goal Reached,
  Water Other Amount, Water Other Open, Water Other Refused, Water Removed).
- Settings — apps/mobile/src/gallery/screens/Settings.stories.tsx (Stories: Nutrition Goals, Nutrition
  Goals Kidney, Water Goal High).

## Progress
Built: `WaterEntry`, `WaterServing`, `WaterUnits`, the water repository (SQL, in memory, the contract),
`water_entries` in schema version 4, `logWater`, `WaterRow` on the Dashboard, `WaterSection` on Food, the
water goal in Settings, water in the demo seed, erased with everything else. Tested in the water and
preferences contracts and `test/food/waterAndMicros.test.tsx`.

Not looked at: the phone.
