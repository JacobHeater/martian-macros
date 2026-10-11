# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Claude, end of Session 12.

**Open pull requests.** #81 (draft, Copilot's: novice meal logging, MM-205 to
MM-208) is not Claude's and was not touched; its handoff edits will conflict
with this file. Nothing else is open: Session 13's pull requests (#90 to
#94) are merged. The expert panel (#79) and `mm ci` (#82, MM-209,
`agents/ci-monitoring.md`) are merged.

**Database.** Schema 31 (a rep range and load step per exercise, MM-79),
merged. Nothing in flight changes the schema. Only one schema change at a
time.

**Next ticket ID.** MM-210 once #81 merges (it uses MM-205 to MM-208, and
MM-209 is taken). `mm req next` is the authority.

**What to build next.**
- MM-71 (which weigh-in counts for a day; the owner's rule is in the
  ticket), then imported weight feeding the trend with a typed value
  overruling it (MM-68). The Health Connect adapter and its Settings group
  are built; readings are kept but not used yet.
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
- Eating-disorder support wording in MM-114 lacks a reviewed helpline
  (MM-29, MM-96).

**Not verified anywhere.** iOS has never been built/run, including native
notifications and text recognition. Emulator checks still missing: a reminder
appearing, ease-deficit offer, per-meal protein marker, resume-after-pause
screen, palm portions, real-camera label reading. Tickets record limitations.

**Standing owner rules beyond AGENTS.md.**
- Dashboard is metrics-heavy; synthetic seeds belong only to the separate
  demo app/database, never normal storage.
- Horizon arc is the only calorie visual (MM-187). Dashboard, Food and Coach
  reuse CalorieHero; no compact hero or independent calorie display.
- Martian defaults only for new installs. First launch offers live theme
  preview; Continue saves. Upgrades preserve existing preferences.
- Do not let test/build terminals steal game focus. Use noninteractive
  PowerShell, not foreground VS Code terminals.
- Commit/push/open PRs and merge green ones with `--merge`, except #79 which
  the owner explicitly says **do not merge**. Branch from fresh main unless
  explicitly continuing an existing PR. Stage named files; never stash-juggle
  or switch branches during a build.
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

## Session 14: 2026-10-11, Claude (Health Connect)

- MM-68, first part: `HealthConnectSource` over the `health` plugin
  (13.3.2, new dependency; read permissions only), a Health Connect group
  in Settings, and `HealthReadFailure`: a platform that cannot be read is
  an error, never an empty answer.
- **Found on a real phone:** Health Connect refuses reads while the app is
  not on screen, and the plugin reports that as no readings. Any import
  must run in the foreground; the adapter now checks every read.
- Run on the owner's Pixel as the **demo app only**
  (`com.martianmacros.martian_macros.demo`), read only:
  `flutter run integration_test/health_connect_test.dart -d <id>
  --dart-define=MM_DEMO_APP=true --dart-define-from-file=../../config/dev.json`
  (`flutter test` uninstalls the app afterwards, which drops permissions).
  The contract passes unlocked. The phone's Health Connect held no
  readings, so a real reading has not been seen imported.
- The phone's normal app was not touched. The demo test app was left
  installed with six read permissions granted over adb.

## Session 13: 2026-10-11, Claude (health table, waist change)

- MM-67, second half: `imported_samples` and `health_import_tokens` (schema
  29), a Drift `HealthSampleStore`, `healthSampleStoreContract` run against
  it and the in-memory one, erasing, and the app's providers
  (`healthSourceProvider` throws until a platform is registered). Ticket
  done; the device run of `healthSourceContract` belongs to MM-68 and MM-69.
- #90 (MM-67 table) merged after its check passed on its head.
- MM-155, first part: `waistChangeOf`, one answer to whether the waist
  changed (smoothed ends; a change only past 1.4 times the noise figure;
  "since start" from the middle of the first three entries). The recomp
  signal, recomp review and stall diagnosis use it; the waist card says
  down, up or no clear change since the start. Entries so far are taken as
  the middle of three readings, as the card has always asked.
- MM-155, second part (schema 30): a waist entry of three readings, the
  middle one stored and all three kept; one reading is a quick entry with
  wider noise; from eight full entries the noise figure is the user's own
  (`waistNoiseOf`). A new `WaistEntryCard` on Progress.
- #91 and #92 (MM-155) merged after their checks passed on their heads.
  The waist card was seen on the emulator, and the demo database there
  upgraded from schema 28 to 30 without error.
- MM-133 done: the recomp review is also in the monthly report of the
  month it fell due in (`RecompReviewBody` serves both places).
- #93 merged after its check passed on its head.
- MM-79 done (schema 31): a rep range and load step per exercise, set from
  a row on the exercise of a workout in progress
  (`ProgressionSettingsScreen`, `ExerciseProgressionRepository`).
- #94 (MM-79) merged after its check passed on its head. Seen on the
  emulator: the "Suggestions use" row and the settings screen as it opens.
- Done this session: MM-67, MM-133, MM-79. In progress: MM-155 (drawing
  and chart left).

## Session 12: 2026-10-11, Claude (training and recomp)

The owner was away and said to use the panel for open questions. Read-only
panel roles were asked (`panel-training`, `panel-ux-accessibility`,
`panel-measurement`); their answers are in the tickets. They inspected
source and ran nothing.

- Merged, each after `mm ci check` showed its check passed on its head: #82
  (`mm ci`), #83 (MM-191), #84 (MM-79), #85 (MM-32), #86 (MM-133), #87
  (MM-33), #88 (MM-92). No CI watch is left to act on.
- MM-191: a target rest per exercise with a countdown, one vibration at the
  target (`RestSignal`), a set's times to the second (`showMmClockTime`),
  and workouts and sets that end after midnight. Schema 28.
- MM-79: `suggestProgression` (double progression) and a suggestion line on
  each exercise of a workout in progress; the first set starts from it.
- MM-32: `recompSignalOf` and a card on Progress. MM-133: `recompReviewOf`
  and a review card on Coach at weeks 8, 12 and every 8 after. Both share an
  interim waist rule until MM-155.
- MM-33: workouts and a "Your lifts" card in the monthly report. MM-92:
  personal records (`personalRecordsOf`), on the workout that set one.
- MM-67, first half: `packages/health_ingest` with the `HealthSource`
  interface, `HealthImporter`, a `FakeHealthSource` that replays a recorded
  history, an in-memory store and `healthSourceContract`. No table, no
  plugin and no screen yet.
- A screenshot test broke on the taller exercise card and failed CI on #83;
  fixed by scrolling to the button. Lesson: read the whole Linux golden run,
  not its last line.
- Seen on the Android emulator: the rest target, countdown and time entry;
  the progression line (fat loss goal only); personal records. Not seen
  there: the recomp signal and review, the report's lifts (the demo data
  does not produce them). Not checked anywhere: a screen reader, the
  vibration on a phone, iOS.
