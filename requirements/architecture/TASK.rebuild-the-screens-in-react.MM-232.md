---
id: MM-232
status: in-progress
component: architecture
related: [MM-228, MM-229, MM-230, MM-231]
---

# Task: Rebuild the screens in React

## Context
Part 4 of MM-228, and the last of the Dart that is not a tool. The owner's
instruction on 2026-10-12: the conversion out of the Flutter ecosystem is to
be finished, without stopping. Everything under the screens is already in
TypeScript and tested (MM-230, MM-231): the rules, the engine, the database,
the food catalog, and the wording. What is left in `apps/mobile` is about
19,200 lines: the screens, the state they read, the component library, the
charts, and the platform glue (Health Connect, the barcode scanner, the label
reader, notifications, pack downloads).

## Decisions
Choices I made without asking (say if any is wrong):
- **The Flutter app is the specification.** Every screen is rebuilt to do
  what the Flutter screen does, with the same words, in the same order. No
  screen is redesigned here; a defect found in the Flutter behavior gets its
  own ticket.
- **State is not a React library.** What the Flutter app derived with
  Riverpod providers (the coach's view, the notices that are due, the
  reminders plan) becomes one plain TypeScript object, `AppState`, built on
  the repositories' `Watched` values. It runs and is tested without a
  browser. Screens read it through one hook, `useWatched`.
- **Screens do not import a repository's implementation**, only the
  interfaces, as the Flutter screens did. One file chooses the
  implementations (the database on the phone, the in-memory ones for tests).
- **Tests come over with their screen.** Each Flutter widget test is carried
  over as a test of the React screen, by what a person sees and does.
  Golden screenshots are not carried over as pixel comparisons of Flutter's
  rendering; they cannot match a different renderer.
- **Platform glue is behind the interfaces that already exist**
  (`HealthSource`, `ReminderScheduler`, `FoodBarcodeLookup`, and new ones
  for the scanner, the label reader and pack files). A plugin is written
  only where the phone is needed, and each is verified on a device before
  it is called done.

## Description
In order:
1. The app's state (`providers.dart` and its neighbours).
2. The component library (`ui/`, `theme/`).
3. The screens, a destination at a time: onboarding and the shell,
   Dashboard, Food, Progress, Coach, Train, then Settings and what hangs off
   it (pauses, reminders, health import, food packs, about).
4. The charts.
5. The platform glue and the native SQLite adapter.
6. The switch: the React app becomes the app, and `apps/mobile`, the Dart
   packages and the Dart task runner are removed.

## Acceptance Criteria
```gherkin
Scenario: Every screen is rebuilt
  Given the list of screens in the Flutter app
  Then each has a React screen that shows the same things in the same words
  And each Flutter widget test of it has a counterpart that passes

Scenario: State runs without a browser
  Given the app's derived state
  When its tests are run
  Then they run in Node with the in-memory repositories

Scenario: The system of record on the phone
  Given the app on a phone
  When food is logged and the app is closed and reopened
  Then the entry is there

Scenario: No Flutter is left
  When the switch is made
  Then the repository holds no Dart and no Flutter project
  And `mm check` passes without a Dart or Flutter toolchain installed
```

## Progress
**1. The app's state (2026-10-12).** `apps/web/src/state/`: `AppState`
holds everything the Flutter providers derived (the coach's view, the week's
adherence, stalls, insights, the notices that are due, the reminders plan,
monthly reports), as cells over the repositories. A cell works only while
something watches it. 29 tests, run in Node against the in-memory
repositories: the 7 Dart tests of merging weigh-ins and of the demo
configuration carried over, and 22 new ones. Not done: no screen reads it
yet, and the evidence register (a text asset) is not loaded here.

**2. The component library (2026-10-12).** `apps/web/src/ui/`: the 45
components of the Flutter `ui/` folder that are not charts, with the sizes
and colors of the Flutter theme, and `MmOverlays`, which gives a screen its
questions (confirm, a choice of two, a list of options, a time of day, a
time to the second) and its short messages. 26 tests by what a person sees,
hears and does; the two Flutter component tests are carried over. Every
component is in the gallery (`?gallery`), and a screenshot of it in the
three palettes was looked at. Not done: the four drawn components (the mini
trend, the horizon arc, the muscle volume row, the strength trend card),
which come with the charts; and nothing has been checked on a phone or with
a screen reader.

**3. The shell and onboarding (2026-10-12).** The app is drawn from
`AppState` now. Rebuilt: the root that decides which screen is due, the
theme chooser, onboarding (welcome and its seven steps), the adults-only
screen, welcome back and resume, the repeat health check, and the check-in
that saves new targets while the app is open. Screens are pushed and
closed by a small navigator of our own; there is no router library. 32
tests: the Flutter tests of theme start-up (9 of its 10; the tenth is the
Settings one, carried into the shell's tests), onboarding (2), welcome back
(6) and the health check on opening (4 of 6; the other two go through
Settings and Coach), and 6 added. The built app was opened in headless
Chrome: the database opens and the theme chooser draws as it should.
**Known limits:** the five destinations and all of Settings but the theme
are placeholders; and the app keeps its data in memory, so **nothing
survives closing it** until the native adapter exists (MM-231).

**4. The charts (2026-10-12).** `apps/web/src/charts/`: the history chart,
the weight trend with its band and event marks, the sparkline, the trend
figures, the macronutrient split and the small trend line, drawn as SVG
here with no chart library. `DashboardHistory` (the facts the dashboard
charts) is carried over with its 8 tests. 23 tests in all; the Flutter
macro-split tests are carried over. Looked at in the gallery in three
palettes. One difference from Flutter: the trend line joins its points with
straight segments, where Flutter's chart library curved them.

**5. Dashboard, Coach and Pause (2026-10-12).** `apps/web/src/dashboard/`
(the screen, the weight card, the logging line, the report notice and the
history under it), `apps/web/src/coach/` (the screen and its cards: targets,
last change and its account, target history, the summary of an unseen
change, stall, insight, under-eating, relief offer, recovery and its
check-in, recomp review, monthly reports, metabolism, confidence, goal
change through the health check), `apps/web/src/pause/` (the banner and the
screen, reached from Settings and from the Coach screen) and the calorie
hero. The app's state gained the strength trends, the recomp review, the
dashboard's range and the selected day; overlays gained the bottom sheet;
the navigator gained a way back to the root. 123 tests: the Flutter tests of
`dashboard`, `dashboard_metrics`, `process_rewards`, `pause_state_display`,
`coach_flows`, `coach_confidence_widget`, `one_calorie_visual`,
`stall_card`, `insight_card`, `last_change`, `adherence_summary`,
`relief_offer`, `under_eating_notice`, `recovery_check_in`, `recomp_review`,
`monthly_report`, `target_change_summary`, `target_history`, `pause` and
the two Coach cases of `health_recheck`. Looked at in headless Chrome over
the demo seed, dark and light. **Still to come with the Food screen:** the
Dashboard's "Add food" action and the cases of these files that go through
it (MM-206, the low-day question, the easy-to-miss line, the Food screen's
arc and its wait for pauses, bariatric logging). The two Flutter cases that
measured whether "Add food" covers something (MM-208, the insight's
Dismiss) have no equivalent in a test without layout; they belong to the
screenshot tests of MM-229.

**6. Food (2026-10-12).** `apps/web/src/food/`: the Food screen (the day in
the top bar, the hero, the macronutrient split, fiber and alcohol lines, a
card for each meal with its entries, copying a meal or yesterday, marking
the day and the easy-to-miss line), and the add-food sheet with every way
in: search of the installed packs, the amount step (servings, weight, hand
portions, raw or cooked, cooking oil), typing a food by its macros, editing
an entry, saved foods and recipes, estimating a meal, scanning a barcode and
reading a label. The services gained the food catalog, a barcode scanner and
a label reader, each behind an interface in `apps/web/src/platform/`; the
app is given an empty catalog and "no camera" until step 5. Overlays now
stack, so a confirmation sits over the sheet. 118 tests: the Flutter tests
of `food_flows`, `food_edit`, `food_copy`, `food_portion`, `food_search`,
`food_trust`, `hand_portion_summary`, `add_food_discovery`,
`add_food_macro_split`, `add_food_method_change`,
`default_meal_follows_clock`, `alcohol`, `barcode_scan`, `custom_foods`,
`label_read`, `detail_level`, `easy_to_miss`, `estimate_meal`, `meal_cards`,
`protein_across_meals` and `raw_or_cooked`, and the cases left over from
step 5 above that go through this screen. **Differences from Flutter:** the
barcode step has a "Scan with the camera" button that opens the camera,
where Flutter embedded a live view in the sheet (the scanner is asked for
one barcode, which is what a native scanner plugin gives); and a
destination's own state (which meals are closed) is not kept while another
destination is showing, where Flutter kept all five alive. One Flutter case
is not carried over because it measures layout (`add_food_route_labels`,
MM-213: three labels on one line at 360 wide); it belongs to the screenshot
tests of MM-229. The food database screen (`food_database_test`) comes with
Settings.

**7. Progress (2026-10-12).** `apps/web/src/progress/`: today's weigh-in
(with where an imported one came from), the weight trend over 30 or 90 days
with its events marked, the weight events card and the sheet that adds one,
the waist card (three readings or one), the recomp signal, and strength:
the four most-trained lifts, every lift's history and its sessions.
`StrengthTrendCard` joins the component library; the app's state gained the
recomp signal and a retry for the strength history. 38 tests: the Flutter
tests of `progress_flows`, `waist_entry`, `recomp_signal` and
`strength_progress`, the Progress half of the bariatric case, and what the
screens do with weigh-ins already imported (`imported_weigh_ins`). **Still
to come with the health import:** the cases of `imported_weigh_ins` that
read the health platform as the app opens. The Flutter case that drew the
strength cards at a narrow width and a large text size measured layout and
belongs to the screenshot tests of MM-229; the count of cards is tested.

**8. Train (2026-10-12).** `apps/web/src/train/`: the Train screen, a
workout (its clock, pausing, exercises, sets and their controls, the set
and rest timer, the rest alarm), editing a workout's times, choosing an
exercise and creating one, the suggestion's own range and step, and weekly
training volume. `WorkoutController` is in the app's state; `MuscleVolumeRow`
joins the component library; the services gained the rest signal. 82 tests
(and 3 skipped): the Flutter tests of `train`, `progression`,
`personal_records`, `weekly_volume`, `workout_times` and `rest_target`. The
three skipped are `workout_set_editor_findings` (MM-214, MM-215), which are
skipped in Flutter too: known defects, each to be enabled with its fix.
**Difference from Flutter:** the rest alarm asks the app's clock a few
times a second instead of setting one timer for the whole rest, because a
phone holds timers while its screen is off and the clock is right whenever
it is next asked.

**9. Settings, reminders, the health import and About (2026-10-12).**
`apps/web/src/settings/` (appearance, units, activity and training, body
fat, the profile and its corrections, the health check, nutrition detail,
the easy-to-miss line, pause, reminders, Health Connect, erase),
`apps/web/src/about/` (How this works, read from `docs/evidence.md`, which
the app is now built with directly, so there is no copy to keep in step).
The services gained the reminder scheduler, the health source, the evidence
text and the build's environment; the app's state gained the health
connection, the health sync (run when the app opens and comes forward) and
keeping the phone's reminders equal to the plan. Until step 5 the app is
given "no notifications" and "no health platform", which the screens say in
words. 48 tests: the Flutter tests of `settings_flows`, `profile_correction`,
`reminders`, `health_connect_section`, `health_import`, `how_this_works`,
the Settings and Coach cases of `activity_and_theme`, and the cases of
`imported_weigh_ins` that read the platform as the app opens. Carrying
`profile_correction` over found MM-233, a fault in the React app's state
that the Flutter app does not have; it is fixed with its own tests.

**10. Food packs (2026-10-12).** The download itself, which MM-230 had left
in Dart: `apps/web/src/foodCatalog/download/` now has `PackDownload` (resume
from what is kept, the checksum, unpacking, the check that it is a pack this
app reads, and only then the swap), with the storage (`PackStore`) and the
network (`PackHttp`) each behind an interface and an in-memory one of each
for tests. `apps/web/src/foodPacks/`: the food database screen, the card for
the download as it stands, the card for a pack on offer, and the strip
shown on every screen while a download runs. The app's state holds the one
download, the check of what is on offer and what is installed. 29 tests:
the Dart tests of `pack_download` (the package's) and
`pack_download_controller`, and the Flutter tests of `food_database`, which
here run the real download over a file of the size the host serves where
Flutter stood a fake controller in. The app is given no address to read a
list from until step 5, so it makes no request; the screen says downloads
are not set up.

**11. The last of the Flutter tests (2026-10-12).** An audit of
`apps/mobile/test` against what had been carried over found six files with
nothing here: `underweight_flows`, `voice`, `mode_reason_estimate`,
`demo_configuration`, `demo_notice` and `gallery`. They are carried over
(31 tests). `voice` reads the app's text two ways here, quoted strings and
the words written between the tags of a screen, and finds none of the words
MM-108 bans. The seventh, `health_connect_sample`, tests the mapping from
the Health Connect plugin's readings and comes with that plugin in step 5.
The golden images of `apps/mobile/test/goldens` are MM-229's screenshot
tests.

## Notes
- MM-229's leftovers (screenshot tests of the React app, a CI build of the
  Android shell, a run on a physical phone) are still open and belong with
  step 5.
