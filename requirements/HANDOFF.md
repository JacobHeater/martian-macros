# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Copilot, starting MM-78.

**Branch state.** `feature/mm78-weekly-volume` deliberately builds on #77
while its final CI runs. MM-78 implements rolling weekly muscle-group volume;
no schema changes. Merge #77 when green, then target the volume PR at main.

**Database.** Schema 27 (pausing the workout clock, MM-191). MM-77 derives
results from existing repositories and needs no migration. One schema change
in flight at a time.

**Next ticket ID.** MM-195 (`mm req next` is the authority).

**What to build next.** WS-10: weekly
volume (MM-78), remaining rest countdown/signals (MM-191), progression (MM-79).
Strength unlocks the recomp review/signal (MM-133, MM-32) and the unfinished
strength/PR parts of monthly reports and rewards (MM-33, MM-92). Phase
planning (MM-36) needs body-fat estimates (MM-34).
Health sync starts at the health-source interface/fixture (MM-67). The
`health` plugin handles sessions; Android segments require app-owned native
code later (MM-188, MM-189).

**Waiting on the product owner.**
- MM-173: noisy honest low intake is dropped as partial, drifting expenditure
  about 160 kcal high. Ticket lists four options; regression is skipped.
- Android reminders are inexact, possibly an hour late. Exact timing needs
  permission; not requested yet.
- MM-188 still needs phone checks: other apps' Health Connect segments, and
  how a written workout looks in each platform's own app. Owner accepted
  the exercise mappings for now.
- Eating-disorder support wording in MM-114 lacks a reviewed helpline
  (MM-29, MM-96).

**Not verified anywhere.** iOS has never been built/run, including native
notifications and text recognition. Emulator checks still missing: a reminder
appearing, ease-deficit offer, per-meal protein marker, resume-after-pause
screen, palm portions, real-camera label reading. Tickets record limitations.

**Standing owner rules beyond AGENTS.md.**
- Dashboard is metrics-heavy, with a full existing-data overview. Synthetic
  seeding belongs to the separate demo app/database, never normal storage.
- Horizon arc is the only calorie visual (MM-187). Dashboard, Food and Coach
  reuse CalorieHero; no compact hero or independent calorie display.
- Martian is the default only for new installs. First launch offers live theme
  preview, saving on Continue; upgrades preserve existing preferences.
- Do not let test/build terminals steal game focus. Use noninteractive
  PowerShell execution, not foreground VS Code terminals.
- Commit/push/open PRs and merge green ones with `--merge`; never idle waiting
  for CI or require owner involvement. Branch from fresh main, stage named
  files, never stash-juggle or switch branches during a build.
- Bugs get tickets and failing-before regressions immediately. Acceptance
  testing will walk through bugs; otherwise stay on the feature roadmap.
- Offline-first; binary biological sex for formulas; US only at launch.
- How it looks matters: inspect changed screens on the emulator and state
  precisely what was/wasn't verified. Primary action buttons have no glow.

**Time-saving notes.**
- `mm check` only passes with exit 0 and final `All checks passed.`.
- Linux alone generates goldens: Update goldens workflow, download, inspect,
  commit changed PNGs. Windows screenshots are not golden baselines.
- Lazy screen controls need `scrollUntilVisible`, `ensureVisible`, then
  `pumpAndSettle` before tapping.
- All time comes from the app's Clock, never `DateTime.now` outside its adapter.
- Windows/FVM: `.\mm.ps1`. Emulator `emulator-5554`; never choose a physical
  phone implicitly. Normal Android package `com.martianmacros.martian_macros`;
  synthetic demo uses `.demo`.
- New native plugins require release-build validation; iOS needs macOS.
- One declaration/file, narrow repository roles, UI design-system controls.
  Stateful screens have a separate `_state.dart` declaration.

## Session 8: 2026-10-11, Copilot

- Owner authorized pushing through the roadmap autonomously. Started MM-78
  after MM-77 implementation, screenshots and full checks passed.
- Weekly volume counts finished workouts in two adjacent rolling seven-day
  windows; RIR 0–4/null, full primary and half secondary contributions.
  Unknown/deleted exercise mappings are explicitly omitted, never guessed.
  Train opens an eleven-group comparison with a broad 10–20 reference band.
- Engine/mobile tests and full `mm check` pass. Linux golden generation and
  headless emulator inspection are next; #77 Android CI build is running.

## Session 7: 2026-10-11, Copilot

- Completed MM-77: per-session Epley e1RM, smoothed per-lift strength,
  four/twelve-week changes in Progress, and every logged lift's history.
- Owner chose total bodyweight plus added/assisted load for bodyweight lifts;
  omit estimates with unknown historical bodyweight, never future readings.
- No schema changes. Engine tests, mobile/seed tests, and full `mm check` pass.
  MM-192/193 have failing-before regressions for error-state propagation and
  duplicated demo workouts; both are fixed. Demo adds training only in its
  isolated store.
- Dart review found deleted custom exercises hid their preserved histories.
  MM-194 now retains stable IDs without guessing a missing resistance type,
  with engine/mobile regressions. Workout, weight and custom-exercise retries
  are tested; final full checks pass.
- Inspected Martian Progress charts, full detail, all-lift navigation and
  unusable high-rep history on a headless Android emulator; phone untouched.
  Linux regeneration passed after fixing its ambiguous scroll selector.
  Reviewed six new strength images in Light/Dark/Martian and two weight-event
  entry backgrounds changed by the longer scrollable Progress content.
  PR #77 is awaiting final CI. iOS was not run.

## Session 6: 2026-10-10 (later), Claude (Anthropic)

- MM-190 fixed main's time-dependent Food failures: meal defaults, date picker
  and demo ask the Clock; architecture rejects other `DateTime.now` calls.
  Validated Windows, Linux at four times of day, and CI.
- MM-188 health-platform spike verified 42 Health Connect segment identifiers;
  HealthKit/plugin are session-level. Phone interoperability questions remain.
  MM-189 records optional mappings, app-owned sets, summary session fallback.
- MM-76 library/picker/custom exercises and MM-75 Train/workout logging merged
  in schema 25. MM-191 added manual workout/set times and timers (26), then
  workout-clock pause/resume (27). Remaining: target rest and signals, typed
  seconds, cross-set overlap validation.
- MM-92 process rewards and MM-33 monthly reports merged but wait on strength
  and personal records for remaining parts. Neither was emulator-inspected.
