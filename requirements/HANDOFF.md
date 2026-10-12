# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-12, by Claude, Session 20.

**The app is being rebuilt as a React HTML5 app (MM-228). Flutter work is
frozen. Read Session 20 below before anything else.**

**Delivery.** #81 is merged at `c226eb6`; #100 was already merged to `main`.
The final verification was still in flight when the owner merged #81.
It includes discovery separation, macro previews, and MM-226's removal of
the "Everything I ate / One serving" switch. Serving entries use nutrition
per serving and servings eaten; other measured amounts retain typed totals.
The precision fix MM-202 and five refreshed Linux screenshots continue on
`fix/mm226-serving-verification`, branched from the merged main. Alcohol
defects MM-203/MM-204 are fixed too; all four existing regression guards are
enabled. Full local `mm check` passes (mobile 633 passed, 65 skipped).
Linux run 38200742381 succeeded for #81's final source head `85f5542`;
the five changed screenshots were visually inspected and imported. The follow-up is merged as #101 at `c324222`; CI was still running when
last checked, not claimed green. No emulator/device check.
MM-227 now corrects a confirmed HTML parity defect: amount-step Back to search
was drawn full-width/centered despite the app's content-width left placement.
The correction is published in #102 with failing-before/passing-after browser
assertions for three amount frames. MM-218 to MM-221 and MM-224 are reconciled
with the shipped changes; historical observations are not current defects
unless their remaining criteria say so. Full phone/reference parity remains
unverified.
Session 13's pull requests (#90 to #94), the expert panel (#79), `mm ci`
(#82, MM-209) and the usability-review work (#100, MM-212) are merged.

**Database.** Schema 31 (a rep range and load step per exercise, MM-79),
merged. Nothing in flight changes the schema. Only one schema change at a
time.

**Next ticket ID.** MM-228 (`mm req next` is the authority; MM-209 to MM-227
are taken).

**HTML UI/UX assets** live in `requirements/ui-ux-assets/` and are linked
from their tickets under `## UI/UX Assets` (MM-210). Every view and
component has a drawing there, listed in `coverage.json` (MM-211); a UI
change is not done until its drawing and manifest entry are changed with
it. #81's Dashboard/Food entry-point changes and MM-223's Add food
discovery/manual-entry states and MM-225's macro previews are reflected in the
drawings and manifest. Linux golden images were inspected and imported.

**What to build next.**
- MM-223 and MM-225 are verified with tests and Linux screenshots; device
  verification remains unavailable. Review the cross-app findings for MM-224
  and give each a concrete disposition.
- Verify CI for merged #101; reconcile historical observations in MM-218 to
  MM-221 with shipped changes rather than treating every old finding as open.
- Continue cross-app hierarchy work under MM-224. The owner has approved this
  as a standing mandate; do not ask whether to do it.
- MM-214 and MM-215 remain ready to fix, each with a skipped test waiting.
- MM-218 to MM-222 remain proposed stories with individual behavior choices
  unresolved. Ask only about a consequential choice that evidence cannot
  settle; never treat the broader usability mandate as awaiting approval.
- Health sync, what is left: see an import of a real reading on a phone
  whose Health Connect has data (not yet seen); choosing the primary scale
  in Settings (MM-71); background updates (MM-72); history beyond the
  first month (MM-73); the onboarding offer and the other kinds (MM-68).
- MM-155, the rest: the protocol drawing and the waist chart. The shared
  change function, the three-reading entry and the per-user noise figure
  are built.
- Small leftovers: MM-191's sound, background signal and free-typed rest
  length; MM-155's protocol drawing and chart.
- Blocked: phase planning (MM-36) needs body-fat estimates (MM-34); Android
  exercise segments need app-owned native code (MM-188, MM-189).

**Waiting on the product owner.**
- Session 12 ran with the owner away, on the instruction to use the expert
  panel. Every choice made that way is listed in its ticket under "Choices
  made with the expert panel" or "Progress" (MM-191, MM-79, MM-32, MM-133,
  MM-92, MM-67) and is the owner's to overturn.
- MM-191: whether to add an audio package and a sound file for the end of a
  rest (only a vibration is given now).
- MM-92: a personal record on a bodyweight lift can come partly from a change
  in body weight; it is shown to everyone, including people with a history
  of an eating disorder, because the wording never mentions weight.
- MM-173: noisy honest low intake is dropped as partial, drifting expenditure
  about 160 kcal high. Ticket lists four options; regression is skipped.
- Android reminders are inexact, possibly an hour late. Exact timing needs
  permission; not requested yet.
- MM-188 still needs phone checks: other apps' Health Connect segments, and
  how a written workout looks in each platform's own app. Owner accepted
  the exercise mappings for now.
- MM-218 to MM-222 contain unresolved, individual behavior choices. Present
  a concrete, evidence-backed recommendation only when one blocks
  implementation; the overall usability effort is not awaiting approval.
- `design/screen-direction.md` does not describe the built Add food and Train
  screens; reconcile it during evidence-led design rather than treating it as
  an unresolved gate.
- Needs a phone, nobody has checked: the rest signal with the display off;
  a screen-reader pass over Add food and a workout; both at large text; how
  the Add food sheet answers a drag or the back gesture.
- MM-210: whether the palette preview's Today mock is the reference for
  the dashboard. It is linked only from the two color tickets.
- Eating-disorder support wording in MM-114 lacks a reviewed helpline
  (MM-29, MM-96).

**Not verified anywhere.** iOS has never been built/run, including native
notifications and text recognition. Emulator checks still missing: a reminder
appearing, ease-deficit offer, per-meal protein marker, resume-after-pause
screen, palm portions, real-camera label reading. Tickets record limitations.

**Standing owner rules beyond AGENTS.md.**
- **Cross-app usability is a standing product mandate (MM-224, Session 19).**
  Prevent choice overload and equal-weight card piles across Dashboard, Food,
  Coach, Progress and Train. Research and apply professional information
  hierarchy; do not use cards as the default wrapper. Do not ask the owner
  again whether this class of usability work is warranted, and do not park an
  obvious inspection finding just because no user study was run. Ask only
  about a consequential product choice that evidence cannot settle.
- **Simple servings (MM-226).** Remove the manual "Everything I ate / One
  serving" switch; do not rename or restore it. Enter nutrition per serving,
  specify servings eaten, and show calculated totals.
- Material screen reviews and redesigns use current, credible external
  research and cite it. Distinguish built-screen evidence from a reference
  drawing, and give every finding an explicit disposition.
- Dashboard is metrics-heavy; synthetic seeds belong only to the separate
  demo app/database, never normal storage.
- Horizon arc is the only calorie visual (MM-187). Dashboard, Food and Coach
  reuse CalorieHero; no compact hero or independent calorie display.
- Martian defaults only for new installs. First launch offers live theme
  preview; Continue saves. Upgrades preserve existing preferences.
- Do not let test/build terminals steal game focus. Use noninteractive
  PowerShell, not foreground VS Code terminals.
- Commit/push/open PRs and merge green ones with `--merge`. Branch from fresh
  main unless explicitly continuing an existing PR. Stage named files; never
  stash-juggle or switch branches during a build.
- Never block the session waiting on PR checks. Check GitHub at the start/end
  and use background CI monitoring between them; merge only a green current head.
- Bugs get tickets and failing-before regressions immediately. Otherwise
  focus on feature roadmap; acceptance testing will walk through bugs.
- Offline-first; binary biological sex for formulas; US only at launch.
- Inspect changed screens on the emulator and state verification precisely.
  Primary action buttons have no glow.

**Time-saving notes.**
- `mm check` passes only with exit 0 and final `All checks passed.`.
- Linux generates goldens; download, inspect and commit them. Windows
  screenshots are not golden baselines.
- Lazy controls need `scrollUntilVisible`, `ensureVisible`, `pumpAndSettle`.
- All time comes from Clock, not `DateTime.now` outside its adapter.
- Windows/FVM: `.\mm.ps1`. Emulator `emulator-5554`; never implicitly select
  the phone. Normal Android package `com.martianmacros.martian_macros`;
  synthetic demo uses `.demo`.
- Native plugins need release-build validation; iOS needs macOS.
- One declaration/file, narrow repository roles, design-system controls;
  stateful screens have a separate `_state.dart`.

## Session 20: 2026-10-12, Claude (the move to a React HTML5 app)

- **The product owner decided to rebuild the app as a React HTML5 app in a
  native shell.** MM-228 is the epic: read it first. Offline stays a hard
  requirement; the web is never a product; we write our own plugins where
  none fits; everything on `main` at the decision is approved as it stands.
- **Flutter work is frozen** except for a defect whose fix carries over. Do
  not add or restyle Flutter screens. Do not patch the hand-drawn HTML
  sheets to chase the Flutter app either; they are replaced as each
  destination is rebuilt.
- **New app work goes in `apps/web/`** (TypeScript, Vite, React, design
  tokens as CSS variables, no UI kit; Capacitor as the shell).
- **Order:** a walking skeleton (MM-229), then the engine under its Dart
  tests (MM-230), data, screens starting with Food and Add food, phone
  plugins, the switch, iOS.
- **One agent owns the new app's structure at a time.** If you are not that
  agent, work on a ticket inside what already exists and say so here.
- **The web half of the skeleton exists** (MM-229, read its Progress): the
  app in `apps/web/` with tokens checked against the Flutter theme, the five
  destinations, Settings with the theme choice, and a `?gallery` page of
  every token and component. `mm bootstrap` now runs `npm ci` there and
  `mm check` ends with `mm web` (type check, tests, build, offline check),
  so Node 22 is needed locally. Not built: screenshot tests.
- **The Android shell exists** in `apps/web/android/` (Capacitor, demo app
  ID only). It was built and run on the emulator with the network off; it
  has not been on a physical phone. `apps/web/README.md` says how to build
  it. Always name the device with `adb -s`: the owner's phone is usually
  connected and only the demo app may go on it.
- **The owner decided all of the Dart is converted to TypeScript** (MM-230,
  read it: the table under Progress says which package is done). Nothing is
  compiled from Dart. The domain is done in `apps/web/src/domain/`, with
  every Dart test carried over and passing. The engine's source is done in
  `apps/web/src/engine/` and its simulator matches the Dart engine exactly;
  99 of its 566 tests are carried over and MM-230 lists the rest. Read
  "Carrying Dart over" in `apps/web/README.md` before converting anything:
  it says how enums, nulls, dates, rounding and streams are written.
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

## Session 18: 2026-10-11, Copilot (joining the meal-logging PRs)

- PR #100 (MM-212) had already merged to `main`; brought that review contract,
  screenshot tests, and reference-library changes into #81 by merging current
  `main`. Resolved overlapping panel instructions by retaining #81's novice
  audit guidance alongside #100's task-walkthrough rules.
- Preserved #81's MM-206/207/208 entry-point fixes and updated the Add food
  drawing/manifest for its changed UI.
- Fixed MM-213 by letting the Scan/Saved/Estimate controls size to their
  labels and wrap at 360 dp and 2.0x text. Fixed MM-216 by explaining when a
  previously entered amount is cleared by changing methods. Fixed MM-217 by
  marking hand-portion grams, totals, and saved summaries as estimates.
- Enabled the three regression tests. `mm test apps/mobile` passed: 617 passed,
  67 skipped. `mm req`, `mm analyze`, and `mm format --check` passed.
- Linux Update goldens run 38197178829 passed; hash comparison found two
  changed images, which were copied from its artifact after visual review.
- `mm check` passed, exit 0 with `All checks passed.` Updated PR CI is pending.
  No emulator was available; only a physical phone was connected, and it was
  not used. MM-218 to MM-221 remain proposed; no open product decisions were
  silently made.
