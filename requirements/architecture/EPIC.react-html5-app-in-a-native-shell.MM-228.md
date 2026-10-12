---
id: MM-228
status: in-progress
component: architecture
related: [MM-159, MM-160, MM-161, MM-162, MM-211, MM-212, MM-224]
---

# Epic: The app becomes a React HTML5 app in a native shell

## Context
The app was built in Flutter. On 2026-10-12 the product owner decided to
rebuild it as an HTML5 application written in React, running offline inside a
native shell on the phone.

What led to it: a design drawn in HTML could not be made to match a screen
drawn by Flutter, so neither the owner nor an agent could see an honest
picture of what exists or what is proposed without a Linux-only screenshot run
or an emulator. In an HTML app the concept and the product are the same
medium, and any agent can open the real screens in a browser.

## Decisions (made by the product owner, 2026-10-12)
- **The app is rebuilt as a React HTML5 app.** This is decided, not a spike.
- **Offline stays a hard requirement.** Nothing about the move loosens it:
  the system of record is on the phone, nothing is fetched to run the app,
  and health data does not leave the device.
- **The web is never a product.** The browser is where the app is developed,
  tested and reviewed. What ships is an app on a phone.
- **Where a phone capability needs a plugin and none fits, we write our
  own.** Health data in particular goes through code we own.
- **Everything on `main` when this was decided is approved as it stands.**
  The Flutter app at that point is the reference for behavior.

Choices I made without asking (say if any is wrong):
- **TypeScript, Vite and React, with the design tokens as plain CSS
  variables and no third-party UI kit.** The design system stays ours.
- **Capacitor is the shell.** It is the smallest wrapper that gives a web app
  native plugins, and a plugin is a small Kotlin class and a small Swift one.
- **The new app lives in `apps/web/`; the Flutter app stays in
  `apps/mobile/` until the new one replaces it**, then it is deleted. Both
  build from one repository meanwhile.
- **Flutter work is frozen** except for a defect whose fix carries over (a
  rule, a calculation, a requirement). No new Flutter screens.
- **The requirements do not change because the toolkit does.** Every ticket's
  acceptance criteria apply to the new app as written. A criterion that names
  a Flutter mechanism is restated when its area is rebuilt.
- **The engineering principles carry over in substance** (MM-159): interfaces
  at every integration point, narrow interfaces for consumers, all database
  access behind repositories with an in-memory fixture, a contract test suite
  run against every implementation, and one design-system component per
  control. How each is enforced in TypeScript is settled in MM-229.
- **Storage is native SQLite through a plugin, never browser storage**, so
  the system can evict nothing. The schema starts again at version 1: the app
  has not been released, so there is no installed data to migrate.
- **The coaching engine is carried over under test, not rewritten on trust.**
  Its Dart tests are the reference. Whether it is compiled from Dart to
  JavaScript or ported to TypeScript is decided by measuring both on the
  weekly check-in (MM-230); either way the same cases must give the same
  numbers before any screen depends on it.
- **The UI coverage manifest is the migration checklist.** The 165 surfaces
  in `requirements/ui-ux-assets/coverage.json` each get a status in the new
  app; the Flutter screenshot tests are the picture each is compared with.
- **iOS waits for the Mac**, as it did before. Nothing here has been built
  for iOS in either toolkit.

## Description
The work, in order. Each numbered part is a ticket or a group of tickets,
opened when it starts.

1. **A walking skeleton** (MM-229): `apps/web/` builds, runs in a browser and
   as an Android app under the demo app ID, with the design tokens, the five
   destinations, tests, and its place in `mm check` and CI.
2. **The engine and the rules** (MM-230): domain types, the coaching engine,
   health import and the food catalog, with their tests.
3. **Data**: the schema, repositories behind interfaces, in-memory fixtures
   and contract tests; native SQLite on the phone.
4. **The screens**, one destination at a time, hardest first: Food and the
   Add food sheet, then Dashboard, Progress, Coach, Train, Settings, and
   first launch. Each is compared with the Flutter screenshots and walked
   under MM-212 before it counts.
5. **Phone capabilities**: our own Health Connect plugin and label reader;
   existing plugins for barcode scanning, reminders and SQLite.
6. **The switch**: every surface in the manifest accounted for, the Flutter
   app and its tooling removed, `AGENTS.md` and `docs/architecture.md`
   rewritten for what is then true.
7. **iOS**, on the Mac.

What the move is expected to give: a concept and the product in one medium; a
real app any agent can open in a browser; screenshot tests on any operating
system; shorter checks.

What it risks, each with where it is faced:
- a silent difference in the engine's arithmetic (part 2);
- typing, keyboards and bottom sheets feeling wrong in a web view (part 4,
  Add food first, judged on the owner's phone);
- Health Connect behaving differently through a plugin, including refused
  reads when the screen is locked (part 5);
- a long stretch with two apps and no new features (the freeze above).

## Acceptance Criteria
This epic is complete when:
- the React app does everything the tickets marked done require, on Android,
  offline, with no Flutter code in the repository;
- the engine's reference cases give the same results as they did in Dart;
- every surface in the coverage manifest is built, replaced by decision, or
  dropped by decision, and each built one has been compared with its Flutter
  screenshot and seen on a phone;
- concepts for future screens are made in the same components the app uses,
  and are linked from their tickets before the work starts (MM-210, MM-211);
- `mm check` and CI run the new app's tests and no Flutter step;
- `AGENTS.md`, `docs/architecture.md` and the design documents describe the
  app that exists.

## Notes
- Size of what is replaced, measured 2026-10-12: screens and components
  20,800 lines with 15,300 of tests; engine, domain, health import and food
  catalog 13,900 lines of pure Dart with 12,000 of tests and no Flutter
  import; the Drift data layer 2,300 lines; no native code of our own.
- CI took 12 to 13 minutes a run at the time of the decision.
- The hand-drawn HTML sheets under `requirements/ui-ux-assets/` (MM-211)
  described the Flutter app approximately and are not the new app. As each
  destination is rebuilt, its sheet is replaced by the real screen and by
  screenshots of it.
- Not yet verified by anyone: that a plugin can read Health Connect change
  tokens; that label text recognition works through a plugin; how the app
  feels in a web view on a phone.
