# WS-03: Design system and app shell

**Order** 3 · **Group** A (start now) · **State** partly built · **Risk** medium

## Summary
Give every later screen a component library, a string catalog, a shared chart
language and the dashboard-first navigation, while there are only four screens
to migrate.

## Why this is a workstream, and why it is this early
The app today is five screens (onboarding, Today, Progress, Coach, Settings)
written with inline styles and inline text, three tabs, and one hand-built
chart. About ninety proposed tickets add user-facing surface. Three decisions
already made will change every one of those surfaces:

- the app starts on a dashboard, "Today" becomes "Food", and a Train
  destination joins later;
- the look moves to shared tokens and components;
- all text moves to localization files, with a glossary and a banned-word
  test.

Each of these is a one-time migration whose cost is proportional to the amount
of UI that exists. That amount is at its minimum now.

## Capability it unlocks
Feature workstreams add screens from components, in agreed words, into a
navigation structure that will not move under them.

## Included
- Color, type and spacing tokens; light and dark themes.
- A component library (cards, notices, bars, number-with-unit, entry fields,
  the measurement card) and the migration of existing screens onto it.
- Localization files for every string, the glossary, and the banned-word
  test.
- Navigation with the dashboard first; the dashboard; quick actions.
- Chart components: trend line with band, small trend line, range bar,
  weekly bars.
- A component gallery with screenshot tests; dark theme, small-screen and
  large-text verification; accessibility standards.
- App icon and launch screen.

## Excluded or deferred
- What the dashboard's coach card says beyond what exists today: it shows the
  check-in summary and confidence once WS-06 step 3 provides them.
- The Train destination: added by WS-10 into the structure built here.
- Reward mechanics: WS-09.

## Prerequisites
None in code. Two product-owner decisions gate two steps:
- the visual direction (palette and type) before step 1;
- the dashboard's contents and order before step 3.

Both tickets carry a proposal marked as the author's choice.

## Enables
Every workstream with a screen: WS-05, WS-06, WS-07, WS-08, WS-09, WS-10. And
WS-13, which needs accessibility, both themes and the icon.

## Packages and surfaces
- `apps/mobile/lib/src/app.dart`, `providers.dart`, `widgets.dart`,
  `format.dart`
- every existing screen file, once, for the migration
- a shared component package (new; the gallery ticket decides whether it is a
  package or a folder)
- localization files (new)
- `apps/mobile/lib/src/dashboard/` (new)

## Risks
- **It is the workstream most likely to be skipped under pressure**, because
  nothing visibly new appears until step 3. The cost of skipping is paid by
  every later screen.
- **Migrating screens while others change them.** In group A nothing else
  edits screens except the coverage tests in WS-01 step 2; keep it that way
  until step 3 is done.
- **Screenshot tests are brittle across platforms.** Fonts render differently
  on Windows, macOS and CI. Decide where goldens are generated (CI only is the
  usual answer) before writing the first one.
- **The chart library.** The existing chart uses `fl_chart` directly. The
  shared components should wrap it so that the uncertainty band and "one
  reading is one dot" rules live in one place.

## Sequence
1. **Tokens and component library; migrate the existing screens
   (MM-102, MM-103, MM-104).** M2. Split `onboarding_screen.dart` (531 lines)
   into one file per step as part of the migration; five workstreams add to
   onboarding later.
2. **Strings (MM-108).** M2. One pass over all text into localization files,
   with the glossary and the banned-word test. Do it immediately after step 1
   while the screens are fresh.
3. **Navigation and dashboard (MM-99, MM-98, MM-100).** M2. Rename Today to
   Food, move the calibration banner to the dashboard, keep each destination's
   state.
4. **Charts (MM-107).** M2. Move the trend chart into the shared component;
   add the small trend line the dashboard needs.
5. **Gallery, screenshot tests, dark theme, small screens, accessibility
   (MM-105, MM-91, MM-106).** M3.
6. **Icon and launch screen (MM-109).** M3.

Steps 3 and 4 can swap or overlap; the dashboard's weight card wants the small
trend line.

## Done enough to unblock others
MM-104, MM-108 and MM-99 are done: existing screens use library components
and localized strings, and the destination list is Dashboard, Food, Progress,
Coach.

## Do not start before this
Large amounts of new UI in any workstream. A small, urgent screen (the health
re-check in WS-05, the check-in summary in WS-06) can be built earlier if M1
needs it, on the understanding that it is migrated in step 1 or 2.

## Parallel with
WS-01, WS-02 and WS-04 from the start. Engine work in any workstream never
conflicts with this one.

## Requirement sources
- Built: MM-90 (three tabs and day rollover; superseded in part by the
  dashboard navigation).
- Remaining: MM-102, MM-103, MM-104, MM-108, MM-99, MM-98, MM-100, MM-107,
  MM-105, MM-91, MM-106, MM-109. Epics: MM-89, MM-97, MM-101.

## Notes for whoever builds it
- The current three-tab shell is recorded as built and marked superseded.
  Its known gap (a day picked on the Today tab is remembered separately from
  the day rollover) should be fixed in step 3, not carried over.
- The existing widget tests switch tabs by label. Step 3 changes the labels;
  update the tests in the same change.
- The voice ticket's rules apply to every later workstream: state, do not
  judge; no moral words about food; estimates labelled as estimates. The
  banned-word test is how that is enforced, so build the test in step 2, not
  later.
- Display rounding and "on target" bands are WS-06 step 4. Do not build
  number formatting here that assumes exact targets.
- The weight-display setting (WS-07 step 5) hides readings in every chart and
  card. Give the chart components a single switch for "show raw readings"
  from the start.
