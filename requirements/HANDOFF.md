# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-12, by Claude, Session 21.

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

**Standing rule (owner, 2026-10-12).** Screen and design verification is
done in a browser; `requirements/ui-ux-assets/` is where design decisions
are tracked and where the owner opines without running the app. Device and
emulator screenshots verify native behavior only, never the design.
The app folder is `apps/mobile` (renamed from `apps/web` the same day): a
mobile application built on web technologies.

**Database.** The React app's schema lives in `apps/mobile/src/data/schema.ts`
with its migration steps and tests. Only one schema change at a time.

**Next ticket ID.** `mm req next` is the authority (MM-234 at this writing).

**HTML UI/UX assets** live in `requirements/ui-ux-assets/` and are linked
from their tickets under `## UI/UX Assets` (MM-210). Every React view and
component is listed in `coverage.json` (MM-211) against the same drawings
the Flutter app was built from; a UI change is not done until its drawing
and manifest entry are changed with it.

**What to build next.**
- MM-229's leftovers: screenshot tests of the React app, and a run on the
  physical phone (demo identity only, device 47261FDAS00EDR).
- MM-228's leftovers: the demo seed wired into the shell; later, the switch
  of identities from `.demo` to the normal app ID (owner's call on timing).
- Step 5 odds and ends: the label photo path and reading real Health
  Connect data back need a phone; the 47 MB pack download on a device;
  a release build of the shell with the new plugins.
- An architecture checker for TypeScript (one declaration per file, vendor
  imports, raw controls) to replace the Dart `mm arch`; the layers test
  covers imports today.
- MM-214 and MM-215 remain skipped in the web suite as they were in
  Flutter's, each waiting on its fix.
- Health sync, what is left: choosing the primary scale (MM-71); background
  updates (MM-72); history beyond the first month (MM-73); the onboarding
  offer and the other kinds (MM-68).
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

## Session 19: 2026-10-11, Copilot (Add food and cross-app hierarchy)

- Built MM-225's food-entry macro split pie using the shared 4/4/9 chart
  without another card. Manual/recent/edit forms, food amount steps (including
  selected cooking oil), and meal estimates preview the current food's macros.
  Preview labels and semantics distinguish this from logged daily intake.
  Tests verify sector values, live updates, serving scaling, empty/invalid
  states, cooking oil/preparation, estimates, and enlarged-text semantics.
  Added a focused Linux screenshot case and updated browser-inspected drawings.
- The owner reaffirmed that pervasive card overload and choice paralysis are
  a standing mandate, not a new approval question. Added this direction and
  the external-research/evidence rule to the standing owner rules above.
- Opened MM-224 for Dashboard, Food/Add food, Coach, Progress and Train,
  making built-screen evidence, explicit finding outcomes and hierarchy
  acceptance criteria part of the work. Linked MM-37 to it.
- MM-223 separates food discovery (search and recents) from manual entry.
  The form is reached with “Enter manually,” labels its field “Food name,”
  and has a “Back to food choices” route. Search queries carry into the
  manual name; choosing a recent item retains its existing typed-form route.
  Added narrow-screen regression coverage and a manual-entry screenshot case.
- `mm check` passed: mobile 627 passed, 69 skipped; 225 tickets valid;
  formatting, analysis, architecture and all workspace checks passed.
  No emulator was connected (only a physical phone, which was not used).
- Requirements, implementation, tests, and the Add food drawing/manifest are
  published to #81 in d632d64. Linux run 38199739648 passed; nine new/changed
  entry images were inspected and imported with matching hashes. `mm analyze`
  and `mm check` passed (`All checks passed.`). The bounded cross-app panel
  survey is complete; its limits,
  recommendations, and research caveats are recorded in MM-224. ACM pages
  were not freshly retrievable, so DOI metadata and the prior research record
  were used.
- Continue on `feature/mm205-expert-mobile-ux`; updated PR CI is the remaining
  delivery check. The broader MM-224 effort remains
  open; the pie chart does not claim to resolve cross-app hierarchy.
