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

## Notes
- MM-229's leftovers (screenshot tests of the React app, a CI build of the
  Android shell, a run on a physical phone) are still open and belong with
  step 5.
