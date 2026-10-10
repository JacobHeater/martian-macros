# Handoff

This is the living handoff document (MM-174). Every agent, whatever its vendor, reads it before working and updates it before
finishing, so the work can change hands without the product owner repeating anything.

It sums up the **three most recent sessions**, newest first. When you start a new session, add it at the top of "Sessions" and delete
the oldest. Keep "Where things stand" true at all times; that part is the state, not the history. `mm req` fails if this file is
missing or holds more than three sessions.

Nothing private goes here: no credentials, no personal or health data.

## Where things stand

Last updated: 2026-10-10, by Claude (Anthropic), after MM-190 and the spike MM-188.

**Branch state.** `main` is green, and no feature work is in flight. PRs #66 (process rewards, MM-92), #67 (monthly report, MM-33),
#68 (the health-platform spike and design, MM-188 and MM-189) and #69 (MM-190) are merged. MM-92 and MM-33 stay `in-progress`: each
has a part that waits on the training log (personal records; strength in the report).

**Database.** Schema version 24 (MM-184). Only one schema change may be in flight at a time (see `roadmap/README.md`).

**Next ticket ID.** MM-191 (`mm req next` is the authority).

**What to build next.** The work follows `roadmap/`. WS-09 (coaching intelligence) has nothing buildable left: the recomp review and signal (MM-133, MM-32) need the training log and strength trend, and phase planning (MM-36) needs the
body-fat estimate (MM-34). So the next work is WS-10, the training log:
- The exercise library (MM-76) first, built to MM-189. Each exercise carries an optional Health Connect segment type, and the
  mapping table in MM-188 is its data. Copy identifiers from that table; do not retype them from memory.
- Then workout logging (MM-75), the strength trend (MM-77) and weekly volume (MM-78).
- Health sync (WS-11) starts with the health-source interface and its fake (MM-67). Workouts sync as sessions first, through the
  `health` plugin; segments on Android are a later piece in the app's own Android code (MM-188 says why).

**Waiting on the product owner.**
- MM-173: honest low days from a noisy logger are dropped as partial, so the expenditure estimate drifts about 160 kcal high. The
  ticket lists four options and recommends judging "far below typical" against the spread of the window. Its test is skipped.
- Reminders are scheduled inexactly on Android, so one can be up to an hour late. Exact timing needs a permission. Not asked yet.
- MM-188 marks some exercise-to-platform mappings as judgement (for example Romanian deadlift written as a deadlift). The owner
  can strike any; a struck one uses the fallback. Two of its questions need a phone and are open: whether other apps fill Health
  Connect segments, and how a written workout looks in each platform's own app.
- The support line for a user with an eating-disorder history on the under-eating notice (MM-114) names no helpline and has not
  been through the wording review (MM-29, MM-96).

**Not verified anywhere.** iOS has never been built or run, including the notifications and text-recognition plugins. On the
Android emulator these were not seen: a reminder actually appearing (it was inside the quiet period), the ease-the-deficit offer,
the per-meal protein marker, the resume screen after a pause, palm-portion logging, the label reader with a real camera. Each
ticket's "Progress" section says what was and was not checked.

**Standing rules from the product owner that are not in `AGENTS.md`.** These were given in conversation and held in one agent's
private notes; they bind whoever picks up the work.
- Current priority is a metrics-heavy Dashboard with a full existing-data
  overview. The owner chose a separate demo app/database for repeatable
  synthetic seeding; never overwrite the normal app's data.
- Work through the roadmap without waiting to be asked. Open pull requests with `gh`, and merge them yourself (`--merge`) once CI is
  green. The owner does not want to be involved in that.
- Do not sit waiting on CI in the middle of a session. Check open pull requests at the start and the end of each turn, merge the
  green ones, and fix failures in a follow-up.
- Branch from a fresh `main` before editing anything. Stage files by name. No stash juggling. Never switch branches while a build
  is running. If work depends on an unmerged pull request, stack on it deliberately and say "builds on #N" in the description.
- Bugs and regressions will be gone through at acceptance testing at the end; until then the focus is roadmap items and features.
  The rule in `AGENTS.md` still holds for any bug you do find: a `BUG` ticket and a regression test at once.
- How the app looks matters as much as what it does. Look at new screens on the emulator before calling them done.
- Say plainly what was and was not verified. Never report a check as passed that you did not run.
- **Training syncs with the phone's health systems (MM-189, MM-188).** Workouts should line up with what Health Connect and
  HealthKit offer, with a fallback for exercises they do not name. Each library exercise carries an optional platform mapping (none
  is normal); the app is the system of record; iOS is session-level only. Mapping data must come from the spike MM-188, checked
  against the platforms' own references, never from memory.
- **The only calorie visual is the arc**, in `CalorieHero`, and it is the only one in the app (MM-187). No screen builds its own hero
  or draws the arc; `mm arch` enforces it. Trend charts over a range are a separate thing; the owner has not been asked whether
  the Dashboard's calorie history lines should be held to the same rule.
- Fixed product constraints, not to be reopened: offline only; biological sex is male or female for every formula; United States
  only at launch.

**Things that will cost you time if you do not know them.**
- **A test that passes for you and fails in CI is probably reading something from the machine**: the time, the timezone, the
  locale. Reproduce it before changing anything. Six Food tests failed in CI only after 15:00 UTC, were first blamed on Linux
  layout, and a wrong fix was shipped on that guess (MM-190). To run the tests at another hour, set `TZ` (for example
  `TZ=Etc/GMT-10 flutter test` on Linux or macOS; WSL works on the development machine).
- The time comes from `clockProvider`, never `DateTime.now()`; `mm arch` refuses it outside `SystemClock`. `FixedClock(day, hour:)`
  fixes the hour in a test.
- `mm check` has passed only when its exit code is 0 and its last line is "All checks passed." A tail that reads "All tests passed!"
  can belong to one package while another failed.
- Screenshot ("golden") tests run only on Linux, so only in CI. When a screen changes, push the branch to
  `update-goldens/<name>`, download the `goldens` artifact from that run, copy any changed PNG into
  `apps/mobile/test/goldens/images/`, look at it, and commit it.
- The Coach and Settings screens are long lazy lists. A widget test must scroll a control fully into view (`ensureVisible`) before
  tapping it; adding a card above an existing control has broken older tests twice.
- A new native plugin must be checked with a release build, not a debug one. CI's "Build Android (dev)" step does this.
- The development machine is Windows with FVM-managed Flutter. Run everything through `./mm`. The emulator is `emulator-5554`; the
  app's package is `com.martianmacros.martian_macros`.
- One declaration per file is enforced (`mm arch`), and a file is named for what it declares. A screen that needs state has its
  `State` class in a second file ending `_state.dart`.

## Session 6: 2026-10-10 (later), Claude (Anthropic)

- **`main` was red in CI and is green again (MM-190, PR #69).** The add-food sheet chose a new entry's meal from the device's time
  instead of the app's clock, so six Food tests passed in the morning and failed after 15:00 on the machine running them. It was
  first written up as a Linux layout difference and "fixed" by scrolling in the tests; that was a guess and it did not hold. It was
  then reproduced by shifting the timezone, and fixed in the app: the default meal, the birth-date picker and the demo seed ask the
  `Clock`, and an architecture rule refuses `DateTime.now` anywhere else. Checked: `mm check` on Windows, the whole app suite on
  Linux at 06:00, 13:00, 16:00 and 22:00, and CI.
- **The health-platform spike is done (MM-188)**, read from the AndroidX client library's source (1.1.0 and the development
  branch), Apple's reference data and the `health` plugin's source. Health Connect names 42 strength movements as segment types; a
  segment carries repetitions, and weight, set index and exertion only in an alpha. HealthKit names no exercise. The `health`
  plugin reads and writes sessions only. The ticket holds the mapping table, every identifier checked by script against the
  source. Not answered, because they need a phone: whether other apps fill segments, and how a written workout looks in each
  platform's own app.
- MM-189 is the design that follows from the owner's direction: an optional platform mapping per exercise, the app as system of
  record, a plain strength session as the fallback, iOS session-level only.
- Process rewards (MM-92, PR #66): a "Your logging" card on the Dashboard with a streak of whole logged days, one miss in seven
  forgiven, pauses neither counting nor breaking it. Monthly report (MM-33, PR #67): a 28-day report on the Coach screen with the
  expenditure estimate, trend change and target changes, and a notice on the Dashboard for a week after one is ready. Neither was
  seen on the emulator.

## Session 5: 2026-10-10, Claude (Anthropic)

- MM-187: the owner's rule is that the horizon arc is the only calorie visual in the app. The Dashboard had been drawing the
  calorie hero without its arc (a `compact` mode) and the Coach screen drew a hero of its own. `CalorieHero` has no compact variant
  now; the Dashboard, Food and Coach screens all use it, and the Coach screen's second card is "Your targets" (protein minimum, pace,
  next check-in, confidence, flags). `mm arch` fails a screen that names `MmHeroSurface` or `HorizonArc` outside the design system,
  the calorie hero and the welcome art.
- The taller Coach and Dashboard heroes pushed controls off the first screen and broke six older widget tests until they scrolled to
  what they tapped. Dashboard and Coach screenshots changed in all three themes and were reviewed.
- Merged PR #64 (Martian theme) when its CI was green, then branched from fresh `main`.

## Session 4: 2026-10-10, Copilot

- MM-184 now implements Martian, first-launch preview/confirmation and four
  wrapping Settings choices. Schema 24 changes only the fresh-install default;
  migration retains existing preferences and inserts System for legacy
  installations without a row. Migration paths from all 23 released schemas,
  preference contracts, startup/error/retry and contrast tests pass.
- Broader mobile checks exposed existing tests tapping controls before scroll
  animations settled after the taller Appearance section. Those tests now
  fully reveal controls before tapping; behavioral assertions are unchanged.
  Final full checks, Linux goldens and emulator inspection are still in flight.
- Full `mm check` passed, exit 0 and "All checks passed." PR #63 passed CI
  and was merged. MM-185 then exposed a delayed preference-stream race with a
  failing test: confirmation briefly restored Martian before the saved choice
  emitted. Preview now clears on confirmed stream publication, not write
  completion. Final checks are being rerun with that regression.
- Dart review found the loading state treated unknown preferences as a fresh
  install. MM-186 has two failing-before regressions and restores the System
  fallback until preferences load. Martian activates only when the stored
  value identifies a fresh install or the user explicitly chose Martian.
- Emulator-inspected Martian Dashboard, Food, Settings and the first-launch
  chooser; live Light preview and transition to onboarding worked. Only
  synthetic demo storage was reset, never the physical phone or normal app.
  Linux golden update run `38025912745` passed; images are downloaded for review.
- Full `mm check` passed again after MM-186, exit 0 and "All checks passed."
  Reviewed the Martian golden contact sheet and full-size chooser/Settings;
  screenshots cover Dashboard sections, Food accordions, Progress and Coach.
  Only the emulator's isolated demo was run. Physical phone and iOS are untested.
- PR #64 is ready for review with 11 new Martian screenshots and refreshed
  Light/Dark Settings screenshots. Final requirements/format/diff checks pass.
  No remaining implementation work; final GitHub CI must pass before merge.

- PR #63 combines the seeded isolated demo, Dashboard infographics, Food pies,
  separate meal accordions and flat FAB. Full checks and Linux golden
  regeneration passed; emulator views were inspected. Final CI is pending.
- Owner now wants to preview an extra theme, Martian, before implementing it.
  Added deep grape, acid lime, cyan, pink and violet to the static palette
  preview alongside unchanged Dark/Light palettes. Included notices, swatches,
  grayscale and measured contrast checks. The owner approved implementation
  as the new-install default with a first-launch chooser. Buttons intentionally
  have no incandescent glow.
- Browser-verified the preview at desktop and 375 px phone widths with no
  horizontal overflow. All seven displayed contrast spot checks pass; no
  external resources are loaded. `mm req` and diff whitespace checks pass.

- Owner requested `mm run --env phone` as a shortcut for physical-device testing.
- MM-175 uses dev defines, selects one physical Android device, ignores emulators,
  and reports missing, ambiguous, or malformed discovery results explicitly.
- Existing dev/prod run and build behavior stays unchanged. All 47 tooling
  tests and full `mm check` passed. `mm run --env phone --help` selected the
  connected physical phone over a running emulator and exited successfully;
  the app itself was not installed or launched during this verification.
- No app data, database schema, or product feature behavior changes.
- MM-175 added `mm run --env phone`: dev configuration with automatic physical
  Android selection, never emulator fallback. Full checks passed; discovery
  was verified on connected hardware without launching the app. PR #62 merged.
- Owner pivoted to the Dashboard, explicitly superseding the sparse one-screen
  direction. MM-176 adds a compact summary and 7/30-day nutrition, weight,
  waist, coverage and coaching histories, plus separate recovery trends.
- MM-177 supplies a repeatable synthetic seed in a separately identified demo
  app/database. It must never seed or reset the normal app's data.
- Integrated `mm check` passed (exit 0, "All checks passed.").
  Populated/empty/loading/error/narrow-screen tests cover the Dashboard.
  Seeded Dashboard summary, nutrition, measurements and coaching plus Food
  cards and the flat FAB were inspected on the Android emulator in both themes.
  Linux screenshot regeneration passed; populated/scrolled Dashboard and
  expanded/collapsed Food images were downloaded, inspected and committed.
  PR checks remain the final delivery gate.
- Draft PR #63 packages the complete original request and refinements.
  Linux Update goldens run 38024455576 passed; its changed images are included.
- MM-179 adds a shared macro-energy pie on Dashboard and Food alongside bars;
  MM-180 splits the food log into separate meal cards at the owner's request.
- The owner refined MM-180: expanded-by-default independent accordions,
  compact 12 dp outlined cards, and a separate tinted rounded-square Add action
  beside a muted chevron. Add must not toggle the disclosure; tests cover
  both collapsed and expanded states. Validation of this refinement is underway.
- MM-180 controls now use centered stroked vector paths, not icon-font glyphs.
  MM-181 removes the floating Add food button's glow/shadow in both themes,
  including hover/focus/pressed elevation, at the owner's explicit request.
- MM-182 fixes the demo notice's low contrast in light mode with an explicit
  full-width themed background and contrasting foreground. Both regression
  cases failed before the fix and now pass; identity/seeding are unchanged.
  Its updated device appearance has not yet been rechecked. No unrelated
  roadmap work is in scope.
- Final Dart review found MM-183: Dashboard/Food could show ordinary targets
  while pause history loaded or failed. Four regression cases failed before
  adding explicit pause loading/error gates. Integrated `mm check` passed
  afterward. Both review-discovered defects have tickets and regressions.
