# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-13, by Claude, Session 22.

**The conversion out of the Flutter ecosystem is complete (MM-228/MM-232).**
The app is the React one in `apps/mobile/`, inside a thin Capacitor shell with
the app's own Kotlin plugins; the Flutter app, the Dart packages and the
Dart task runner are removed (git history keeps them). `mm` is TypeScript
run by Node itself. Read Session 21 below before anything else.

**Delivery.** PRs #120 to #130 are merged: every screen in React with its
tests carried over (suite ~1,880), the phone's own storage (`MmDb` over
bundled SQLite with FTS5, `MmPacks` for pack files and the one HTTP fetch),
the camera (`MmScanner`), reminders (`MmReminders`), Health Connect
(`MmHealth`, read-only) and the hardware back button. All verified on the
emulator: onboarding survives `am force-stop`; the real manifest lists two
packs; Common foods downloads, checks, unpacks, commits and answers a
search; a weigh-in reminder puts alarms in `dumpsys alarm`; Health Connect
grants weight and syncs. The switch itself (this session's PR) replaces the
task runner, re-points `coverage.json` at `apps/mobile/src` (150 surfaces),
records the Flutter theme in `apps/mobile/test/support/flutterTheme.json` for
the tokens test, and rewrites CI to Node + a debug Android build.

**Standing rules (owner, 2026-10-12).** Screen and design verification is
done in a browser; **Storybook is the design register** (MM-237,
`mm storybook`), where design decisions are tracked on tickets (`## UI/UX`
story links) and where the owner opines without running the app. The old
HTML register (`requirements/ui-ux-assets/`) is deleted, by the owner's call,
with every ticket's `## UI/UX Assets` section; never add HTML drawings of
screens. The panel's implementation role is `react-capacitor` (MM-241);
there is no `flutter` role.
Icons are Material's Outlined set behind `MmIcon` (MM-236); no hand-drawn
glyphs. Device and emulator screenshots verify native behavior only, never
the design. The app folder is `apps/mobile` (renamed from `apps/web` the
same day): a mobile application built on web technologies.

**The roadmap is current and checked (MM-245, owner's rule 2026-10-13).**
`roadmap/roadmap.json` is where you choose what to build; keep it that way.
A ticket you create goes into a workstream and a step in the same pull
request; a ticket you finish moves to built; `mm req` (so `mm check` and
CI) fails when the roadmap and the tickets disagree; `mm roadmap`
regenerates the progress page. Before you finish, say in this file which
step or milestone your session advanced, or that none did. The "What is
available right now" table in `roadmap/README.md` is current as of
2026-10-13.

**Terms of use (MM-242, in progress).** The first guard on every
installation is the terms of use (`apps/mobile/src/terms/`): a short
account, the full text, "I agree" and "Not now". The agreement (version
and day) is in `user_preferences`, schema version 2. A test or a story
has agreed already unless it says otherwise (`renderApp`'s `terms`
option, `screenStory`'s `terms`). **The text is a draft by non-lawyers
and blocks release** until an attorney reviews it and the owner settles
what MM-242 lists as still to be decided. The expert panel's reports,
sources and the chair's decisions are in `docs/agent-runs/mm242-eula/`.
Change what the app does with data and the terms together: they say
only what the code does, and never "nothing is uploaded" (MM-244).

**Database.** The React app's schema is `apps/mobile/src/data/currentSchemaVersion.ts`,
`currentSchema.ts` and `migrationSteps.ts`, with their tests (version 2
since MM-242). Only one schema change at a time.

**The engineering rules are checked (MM-246).** `test/architecture.test.ts`
fails the suite on a file with two declarations or the wrong name, a
library imported outside the folders it lists, or a raw control in a
screen; `MmPressable` is the component for content pressed as a whole.

**Next ticket ID.** `mm req next` is the authority (MM-246 at this writing).

**The register is complete (MM-237, done).** Every screen, sheet and step
has a story under `apps/mobile/src/gallery/screens/`: the whole app as
shipped over in-memory stores on a fixed day, in a phone's viewport, opened
at that screen (`screenStory({ covers, shows, open, walk })`). A new
`*Screen.tsx`, `*Sheet.tsx` or `*Step.tsx` with no story fails
`test/gallery/stories.test.tsx`, which also draws and walks every story.
Two rules came out of the owner's phone review the same day: a stylesheet
rule that removes an outline must name `:focus-visible` (MM-239, a focused
field drew two rings), and a slider inside a list group is an
`MmSliderRow`, never a bare `MmSlider` (MM-240). Do not start a second
`storybook dev` while one is running: they share a dependency cache and
the first one starts answering 504 until it is restarted.

**What to build next** (the roadmap's "What is available right now", in
order; `mm roadmap` draws it).
- WS-03 step 1 leftovers (MM-103 one question per screen, MM-181). WS-14
  step 4 (MM-229) and WS-01 step 3 (MM-7) are closed; the demo seed wired
  into the shell (MM-177, MM-228) is what is left of the conversion.
- WS-06 step 3, the last of M1: MM-138 and MM-139 want simulator calibration
  and the owner's confirmation of holding a reduction.
- WS-04, the gap to M2: close the MM-51 spike; the pack download, a barcode
  scan and a label photograph on a device with a release build, under a
  network monitor, which also answers MM-244 (WS-13 step 1).
- Then WS-08 step 4's storage gaps (MM-167), MM-57 licensing, MM-153's
  ranking by trust tier.
- MM-214 and MM-215 remain skipped in the web suite, each waiting on its fix.
- Blocked: phase planning (MM-36) needs body-fat estimates (MM-34).

**Waiting on the product owner.**
- MM-191: whether to add a sound for the end of a rest (vibration only now).
- Android reminders are inexact, possibly an hour late. Exact timing needs
  permission; not requested yet.
- Eating-disorder support wording in MM-114 lacks a reviewed helpline
  (MM-29, MM-96).

**Not verified anywhere.** iOS has never been built or run, and the shell
has no iOS project yet. Phone checks listed above. Tickets record
limitations.

## Session 22: 2026-10-13, Claude (the roadmap caught up and checked, MM-245)

- The owner asked how the roadmap looked. It was derived on 2026-10-09 and
  knew tickets only to MM-191: 79 tickets (the React conversion, Storybook,
  the expert panel, the terms of use) were in no workstream, seven done
  tickets were listed as remaining, its "start here" table pointed at MM-61
  and MM-160, and the file paths were the Dart packages'. The working
  agreements asked for the handoff to be kept, and said nothing about the
  roadmap.
- The owner's rule: agents keep the roadmap up to date, always, and at the
  end of a session check whether they moved the needle. It is now a working
  agreement in `AGENTS.md` and in the Completion section, and `mm req`
  checks the roadmap against the tickets (`tool/src/roadmapChecker.ts`,
  nine tests): placement, built/remaining by status, steps, edges,
  `dependsOn`/`unlocks`, cycles, milestone lists.
- The catch-up: every ticket placed (new steps: WS-01 5 and 6, WS-14 4,
  WS-03 7 and 8, WS-08 9, WS-10 8, WS-02 8), built/remaining and workstream
  states derived from status, milestone lists regenerated from the steps,
  paths translated to `apps/mobile/src`, the README's "available now" and
  "do not touch" rewritten for 2026-10-13, the progress page regenerated.
- Then the first item of that table, WS-14 step 4: the TypeScript
  architecture checker (MM-246, `test/architecture.test.ts`): one
  declaration per file named for it, libraries only in their adapter
  folders, no raw control in a screen. Twelve files were split to meet it
  (`schema.ts` is now `currentSchemaVersion.ts`, `currentSchema.ts`,
  `tables.ts` and `Table.ts`), `MmPressable` replaced the three raw buttons
  in `CalorieHero` and `MealSection`, and `columns.ts` is the one file on
  the baseline.
- Then the leftovers the table named: `mm run --env phone` installed and
  launched the demo app on the owner's Pixel (the normal app untouched;
  the phone was locked, so the screen was not seen), MM-175 and MM-229
  closed, MM-7 closed (CI green on every pull request since the switch),
  MM-245 closed. MM-229's screenshot tests are superseded by the stories
  test under the owner's Storybook rule.
- MM-181 (the flat floating action) closed: the React rebuild never had the
  glow; `test/ui/flatFab.test.ts` now guards it by reading the stylesheet.
- Moved the needle: M0 went from 39 of 47 to 43 of 48 (MM-246, MM-229,
  MM-245, MM-181 done; MM-103, MM-108, MM-176, MM-179 and MM-183 remain);
  M2 gained MM-7 and MM-175. No milestone closed. M1 is 11 of 13.
- MM-103's leftover, one question per onboarding screen, is a design
  change the owner should call: measurements, training and the health
  check each hold several related fields on one screen today.
- Not done: the workstream files' prose still describes the plan as
  written in October's first week; only their sources and sequences carry
  the additions. The 58 in-progress tickets were not walked; many are built
  with a leftover and could close.

## Session 21: 2026-10-12, Claude (the switch out of Flutter, MM-232 step 5 and 6)

- Step 5 in two merged PRs (#129, #130): five Kotlin plugins in the shell
  (`MmDb`, `MmPacks`, `MmReminders`, `MmScanner`, `MmHealth`) behind the
  interfaces the app already had, TypeScript adapters in `sql/native/`,
  `foodCatalog/download/native/` and `platform/`, `openAppServices`
  branching once on the shell, the hardware back button, `minSdk` 26.
  The `SqlDatabase` contract runs against the native adapter over a fake
  bridge; `healthSourceContract` runs against `NativeHealthSource`; the
  Dart `health_connect_sample_test` is ported. Everything above was
  exercised on the emulator end to end.
- Step 6 (this PR): the Dart task runner is rewritten in TypeScript
  (`tool/`, run by Node 22.18+, zero dependencies), with `req`, `panel`,
  `ci`, `roadmap`, `food`, `run/demo/emulator/build/clean`, `check`; its
  Dart tests are ported to `node:test` (140 pass). `apps/mobile`,
  `packages/`, `.fvmrc` and the goldens workflow are deleted; CI runs on
  Node and assembles the debug APK; `coverage.json` lists the React
  sources; the evidence register and docs now name the TypeScript files.
- Late in the session the owner rejected the hand-drawn nav icons
  ("hammers fucking each other") and ruled: standard Material icons
  (MM-236) and Storybook as the design register, replacing the HTML
  register entirely (MM-237). Both shipped the same day; screen stories
  remain MM-237's open step.
- The pack build keeps DuckDB extract + the TS pipeline
  (`mm food build` drives `apps/mobile/scripts/food-build.mjs` through vite).

## Session 20: 2026-10-12, Claude (the move to a React HTML5 app)

- **The product owner decided to rebuild the app as a React HTML5 app in a
  native shell.** MM-228 is the epic: read it first. Offline stays a hard
  requirement; the web is never a product; we write our own plugins where
  none fits; everything on `main` at the decision is approved as it stands.
- **Flutter work is frozen** except for a defect whose fix carries over. Do
  not add or restyle Flutter screens. Do not patch the hand-drawn HTML
  sheets to chase the Flutter app either; they are replaced as each
  destination is rebuilt.
- **New app work goes in `apps/mobile/`** (TypeScript, Vite, React, design
  tokens as CSS variables, no UI kit; Capacitor as the shell).
- **Order:** a walking skeleton (MM-229), then the engine under its Dart
  tests (MM-230), data, screens starting with Food and Add food, phone
  plugins, the switch, iOS.
- **One agent owns the new app's structure at a time.** If you are not that
  agent, work on a ticket inside what already exists and say so here.
- **The web half of the skeleton exists** (MM-229, read its Progress): the
  app in `apps/mobile/` with tokens checked against the Flutter theme, the five
  destinations, Settings with the theme choice, and a `?gallery` page of
  every token and component. `mm bootstrap` now runs `npm ci` there and
  `mm check` ends with `mm web` (type check, tests, build, offline check),
  so Node 22 is needed locally. Not built: screenshot tests.
- **The Android shell exists** in `apps/mobile/android/` (Capacitor, demo app
  ID only). It was built and run on the emulator with the network off; it
  has not been on a physical phone. `apps/mobile/README.md` says how to build
  it. Always name the device with `adb -s`: the owner's phone is usually
  connected and only the demo app may go on it.
- **The owner decided all of the Dart is converted to TypeScript** (MM-230,
  read it: the table under Progress says which package is done). Nothing is
  compiled from Dart. The domain is done in `apps/mobile/src/domain/`, with
  every Dart test carried over and passing. The engine is done in
  `apps/mobile/src/engine/`: all 567 of its tests are carried over with their
  expected values unchanged, and its simulator matches the Dart engine with
  no difference at all. Health import is done in `apps/mobile/src/healthIngest/`
  with its 71 tests.
- **What is left of the Dart all touches SQLite** (food catalog, data layer,
  fixtures, food pipeline), so it waits on MM-231: one `SqlDatabase` seam
  with a WebAssembly adapter for tests and the browser and a native plugin
  on the phone. Read its Progress first: Node's own SQLite has no FTS5 and
  cannot read a food pack; the official SQLite WebAssembly build can. The
  seam, that adapter and a 14-test contract suite are built
  (`apps/mobile/src/sql/`), and on it the food catalog
  (`apps/mobile/src/foodCatalog/`): it reads a pack the Dart writer wrote and
  gives the same searches with the same scores. The food pipeline
  (`apps/mobile/src/foodPipeline/`) builds the same packs as the Dart one from
  a recorded extract; `mm food build` still runs the Dart one. The in-memory
  repositories and their 23 contract suites are in `apps/mobile/src/fixtures/`
  and `apps/mobile/test/contracts/`. Not built: the native
  adapter, downloading a pack (it needs an interface to the phone's files
  first). The data layer is built (`apps/mobile/src/data/`): every repository
  on SQLite, passing those same suites, with the schema at version 1 in
  the shape the Dart database had; it has run only against the WebAssembly
  build, never on a phone. The Flutter app's wording is carried over too
  (`apps/mobile/src/format/`), checked against what Dart printed. Whether a native
  plugin has FTS5 on Android is not verified.
  Read "Carrying Dart over" in `apps/mobile/README.md` before converting
  anything: it says how enums, nulls, dates, rounding and streams are
  written.
- **What Dart is left, and in what order.** (1) The Flutter app's screens
  and their state, about 19,200 lines and 81 test files: rebuilt as React
  screens (MM-228 part 4), not started. (2) Downloading a pack and the
  native SQLite adapter, which need the phone. (3) The task runner
  (`tool/`), last, at the switch: most of what it does is check and build
  the Dart, and that part goes when the Dart goes. MM-230's table has the
  state of every package.
- **To prove TypeScript matches Dart**, have the Dart write a file and
  compare against it in a test: `test/engine/dartParity.test.ts`,
  `test/foodCatalog/dartParity.test.ts`, `test/foodPipeline/`,
  `test/data/schema.test.ts` and `test/format/` all do. Record the file
  with a throwaway script run by `fvm dart run` and do not commit the
  script.
- **Open when the session ended:** #115 (data layer), #116 (wording) and
  #117 (messages), stacked in that order, each passing `mm check` locally
  with CI still running. Merge in order when green; retarget the next to
  `main` after each.
- **The Dart stays until the switch** and is the reference. A fix made in
  one language is made in the other.
- #102 (Copilot's, green) was merged at the start of this session under the
  standing rule.
