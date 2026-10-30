# WS-03: Design system and app shell

**Order** 2 (after WS-14, since 2026-10-08) · **Group** A (start now) · **State** in progress · **Risk** medium

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
- all text follows one voice guide, with a glossary and a banned-word
  test (strings stay in place; no localization files, MM-108).

Each of these is a one-time migration whose cost is proportional to the amount
of UI that exists. That amount is at its minimum now.

## Capability it unlocks
Feature workstreams add screens from components, in agreed words, into a
navigation structure that will not move under them.

## Included
- Color, type and spacing tokens; light and dark themes.
- A component library (cards, notices, bars, number-with-unit, entry fields,
  the measurement card) and the migration of existing screens onto it.
- The voice guide, the glossary, and the banned-word and glossary tests.
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
None in code. Two product-owner decisions gated two steps:
- the visual direction (palette and type): **decided 2026-10-08**, recorded in
  [`design/`](../design/README.md) and shown in Storybook's Tokens story; MM-102 and MM-103 stay `proposed` until it is
  seen in the app and the gallery;
- the dashboard's contents and order before step 3 (MM-98): still open.

## Enables
Every workstream with a screen: WS-05, WS-06, WS-07, WS-08, WS-09, WS-10. And
WS-13, which needs accessibility, both themes and the icon.

## Packages and surfaces
- `apps/mobile/src/app/` (the shell, `openAppServices.ts`), `ui/`,
  `format/`
- every existing screen file, once, for the migration
- a shared component package (new; the gallery ticket decides whether it is a
  package or a folder)
- `apps/mobile/src/dashboard/` (new)

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
1. **Theme, then components and gallery; migrate the existing screens
   (MM-102, MM-103, MM-104, MM-105, MM-163).** M0. Staged:
   - **1a, theme only.** Replace `colorSchemeSeed` with explicit light and dark
     color schemes and the color tokens (`design/color-and-theme-system.md`),
     component themes (navigation bar, FAB, buttons, inputs, cards), spacing
     and radius constants. No layout change; the existing screens lose the muddy
     palette at once. Keep the platform font until the font decision is made.
   - **1b, components, gallery, migration.** Waits for WS-14 step 1 (one
     declaration per file, so components and screens are written that way). Each
     component takes meaning, never styling, and a screen may not use a raw
     Material control (MM-163, enforced by `mm arch`). Shared components, the gallery
     with a palette sheet and a contrast test (this is where MM-102's rendered
     review is completed), then migrate screens. Split `OnboardingScreen.tsx` (531 lines)
   into one file per step as part of the migration; five workstreams add to
   onboarding later.
2. **Strings (MM-108).** M0. The voice guide and glossary, and a test that
   reads every string in place and fails on a banned word, filler or a name
   the glossary forbids. Moving strings into localization files was not taken
   up: no translation is planned.
3. **Navigation and dashboard (MM-99, MM-98, MM-100).** M0. Includes the Today
   redesign in `design/screen-direction.md`. Rename Today to
   Food, move the calibration banner to the dashboard, keep each destination's
   state.
4. **Charts (MM-107).** M0. Move the trend chart into the shared component;
   add the small trend line the dashboard needs.
5. **Dark-theme, small-screen, large-text and accessibility verification
   (MM-91, MM-106).** M2. The gallery (MM-105) moved to step 1.
6. **Icon and launch screen (MM-109).** M3. Closed 2026-10-21 with the owner's own art.

Steps 3 and 4 can swap or overlap; the dashboard's weight card wants the small
trend line.
7. **Storybook as the design register (MM-237).** M0. Placed 2026-10-13.
8. **The terms of use before anything else (MM-242).** M5 (backburner since 2026-10-21; the terms screen stays in the app). Placed 2026-10-13. MM-453 (the terms and the Apple Health permission text still say no copy leaves the phone, which the backup contradicts; wording for the owner and the attorney) placed here 2026-10-21.
- Also placed 2026-10-13 in earlier steps: step 1: MM-181, MM-184, MM-185, MM-186, MM-236, MM-239, MM-240; step 3: MM-176, MM-179, MM-183, MM-206, MM-208; step 4: MM-187.
9. **Hierarchy and wayfinding (MM-224; MM-253 to MM-259).** M2. The owner's diagnosis of 2026-10-13: monolithic views, no iconography, cognitive overload. The direction and the panel pass (MM-253) first, then Dashboard, Food, Coach, Progress, Train and Settings, each with before and after stories. **Built 2026-10-13** in one pull request: the direction in design/screen-direction.md, the panel pass in docs/agent-runs/mm253-hierarchy, the six destinations in tiers with MmSection, MmRhythmStrip and the icon set, the checkable rule in test/gallery/hierarchy.test.tsx, and the three bugs the panel found (MM-283 to MM-285). The step is done.
11. **What the hierarchy panel left for later (MM-286 to MM-289).** M2. Destinations keep their state across tabs (MM-286), Progress with one figure and the lifts as rows (MM-287), the Ember budget for text actions, an owner decision (MM-288), a demo seed that shows every mark (MM-289).
10. **Own the full visual experience (MM-262; MM-263 to MM-282 less MM-278).** M2. The owner's rule of 2026-10-13: nothing native shows. Custom date, time and select pickers; checkbox and slider drawn by us; a pressed state on every control; menus never clipped; focus trapped in overlays; a story for every component and state; tokens honoured; the written system. From the component walk in docs/agent-runs/mm253-components. **Built 2026-10-13**, the same day, in one pull request: the step is done.
20. **The iOS shell (MM-403).** M4. Started 2026-10-19 on the owner's Mac (macOS Sequoia, Xcode 26.3): the Capacitor iOS project under the DEMO identity with Swift Package Manager, the plugins registered from `MainViewController` as `MainActivity` registers the Kotlin ones, `AppServices.platform`, the terms declined on iOS without "Close the app", `mm build ios`, `mm run --ios`, `mm simulator` and the simulator in `mm screenshot`. The plugins themselves are MM-404 (WS-14), MM-405 (WS-09), MM-406 (WS-08) and MM-69 (WS-11). Done 2026-10-21; the phone checks are owed.

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
  dashboard navigation); MM-165 (light, dark or system theme); MM-105 (gallery and screenshot tests); MM-163 (one implementation per control).
- Remaining: MM-102, MM-103, MM-104, MM-108, MM-99, MM-98, MM-100, MM-107,
  MM-91, MM-106, MM-109. Epics: MM-89, MM-97, MM-101.
- Placed 2026-10-13 (MM-245), from the React conversion onward: MM-181 (Remove the primary action's incandescent glow); MM-184 (Martian by default, with a first-launch theme choice, done); MM-185 (Theme confirmation resets the preview before storage publishes it, done); MM-186 (Preference loading incorrectly previews Martian for existing users, done); MM-236 (the hand-drawn icons are unreadable, so the set becomes Material, done); MM-239 (a focused text field draws two outlines, done); MM-240 (sliders in a list group sit at different insets, done); MM-176 (A metrics-heavy dashboard with useful history); MM-179 (See the logged macronutrient split on Dashboard and Food); MM-183 (Do not present ordinary targets before pause state is known); MM-206 (Dashboard Add food can log to a historical day, done); MM-208 (Dashboard Add food action obscures a chart label, done); MM-187 (One calorie visual, the arc, everywhere a day's calories are shown, done); MM-237 (Storybook is the design register, done); MM-242 (the terms of use come before anything else); MM-224 (Cross-app usability and information hierarchy).
- Built (2026-10-13): MM-103 (the owner left measurements, training and the health check grouped on one screen each).
- Added 2026-10-28 (the owner; step 24): MM-679 (a crash while drawing blanks the whole app with no words; a boundary says it, inside the app with the theme and around it).
- Added 2026-10-24 (the owner; step 22): MM-601 (every snack goes after ten seconds, Undo too, replacing MM-272's waiting snack; in progress).
- Added 2026-10-24 (the owner; step 23): MM-603 (a multi-line text field, `MmTextField` with `lines`; first used by MM-602; in progress).
- Built 2026-10-21 (step 18): MM-391 (one way into the check-in on Coach, done); MM-392 (an unmarked day says what the estimate does with it, done).
- Added 2026-10-14 (steps 15, 16): MM-320 (Settings' Health Connect rows drawn and rebuilt as their own section, done); MM-321 (every part of a screen drawn by a story: the check and its register); MM-322 (hairlines between rows in every list group, done); MM-324 (one text column for list rows).
- Added 2026-10-21 (step 15): MM-546 (the app's three startup spinners each drawn by a story that holds its read out, so `npm run unseen` no longer depends on timing, done).
- Placed 2026-10-13 (the hierarchy pass) and built the same day: MM-253 (the direction and the panel pass), MM-254 Dashboard, MM-255 Food, MM-256 Coach, MM-257 Progress, MM-258 Train, MM-259 Settings; with them the panel's bugs MM-283 (the coach line said "on Today"), MM-284 (a field's unit not heard), MM-285 (weight event dates and default).
- Placed 2026-10-13 (left by the hierarchy panel, step 11): MM-286, MM-287, MM-288, MM-289.
- Placed 2026-10-13 in step 1: MM-260 (the date dialog's chevron and flat surface; the phone's date control follows the palette and the dialog floats).
- Placed 2026-10-13 (the component walk): MM-262 (epic), MM-263 date picker, MM-264 time picker, MM-265 select, MM-266 checkbox and slider, MM-267 pressed states, MM-268 menus, MM-271 overlays, MM-272 snack, MM-273 stories, MM-274 tokens, MM-275 focus ring, MM-276 Ember tint and glyph, MM-277 sheet and cards, MM-279 field errors, MM-280 destructive kind, MM-281 48 dp, MM-282 the document.
- Added 2026-10-19 (step 20): MM-403 (the iOS shell); MM-407 (the health section stopped folding when it became platform-aware, found by the panel and fixed the same day, done).
- Added 2026-10-28 (the owner; step 15): MM-668 (cards stand 12 px apart whichever comes first, a section or a surface; a text button in a section body lines up with its words wherever it stands, done).
- Added 2026-10-28 (the owner; step 15): MM-669 ("Save key" in one row with its field, 12 px apart; a secondary button outlined in the text colour, never the field's violet, done).
- Added 2026-10-28 (the owner; step 15): MM-673 (a wait on the network is shown as a wait: `MmBusyLine`, `useCoachNarration`, the built-in words only once an ask failed or at once when off, done).
- Added 2026-10-28 (the owner; step 15): MM-675 (the sheet's head stays put while its content scrolls; its drag and leaving run on the compositor, done).
- Added 2026-10-30 (the owner, MM-703; step 25): MM-704 (a side drawer beside the bar: the menu button, the lettering, the four destinations, Profile, Library and Settings; the gear leaves), MM-705 (Profile is its own screen: the profile section and nutrition goals out of Settings); both in progress.

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
