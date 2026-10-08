---
id: MM-99
status: done
component: dashboard
related: [MM-97, MM-98, MM-90, MM-41, MM-75, MM-80]
---

# Story: A navigation bar with the dashboard first

## Context
MM-90 records the navigation as built: three tabs (Today, Progress, Coach), opening on Today. The dashboard changes that.

## Decisions (made with the product owner)
- **The app starts on the dashboard, with the other views (Food, Coach, and so on) on their own icons in the navigation bar.**

Choices I made without asking (say if any is wrong):
- **The destinations, in order**: Dashboard, Food, Progress, Coach. **Train** becomes the fifth when the training log exists (MM-75),
  placed between Food and Progress.
- **"Today" is renamed "Food"**: with a dashboard, "Today" would be an odd name for the food log, and the dashboard is the screen about
  today.
- **Five destinations is the limit** for a bottom navigation bar. Anything further goes behind the gear (Settings) or inside one of the
  five.
- **Settings stays behind the gear** in the top bar of every screen.
- **Icons**: a home icon for Dashboard, a fork-and-knife for Food, a dumbbell for Train, a chart line for Progress, and the existing
  insights icon for Coach. Each has a text label; an icon alone is not enough.
- **Each destination keeps its place** when the user leaves and returns, as now.
- **The "Add food" button stays on the Food screen**, and the dashboard has its own way to start logging (MM-100).

## Description
The navigation bar and the app's starting destination. This supersedes the tab structure described in MM-90; that ticket stays as the
record of what was built first.

## Acceptance Criteria
```gherkin
Scenario: Destinations
  Then the navigation bar shows Dashboard, Food, Progress and Coach, each with an icon and a label

Scenario: Starting point
  When the app is opened
  Then Dashboard is the selected destination

Scenario: The food log moved, not changed
  When Food is selected
  Then it shows what the Today tab showed: the day picker, intake against targets, entries by meal, and Add food

Scenario: With training
  Given the training log exists
  Then Train appears between Food and Progress, and there are five destinations

Scenario: Keeping place
  Given the user scrolled the Progress screen and switched to Coach
  When they return to Progress
  Then it is where they left it
```

## Notes
- On a wide screen (a tablet, or a phone in landscape) a bottom bar wastes space; a navigation rail is the Material answer. Out of scope
  until tablets matter.

## Notes (built and verified)
- Navigation is Dashboard, Food, Progress, Coach (`MmNavigationBar`), opening on Dashboard; selection lives in `homeTabProvider`. Today was renamed Food (`apps/mobile/lib/src/food/`). Each destination keeps
  its state (`IndexedStack`). Settings stays behind the gear. Train is not added (no training log yet).
- Tests: `dashboard_test.dart` (opens on the dashboard, four labelled destinations, drill-in) and the updated `app_test.dart`.
