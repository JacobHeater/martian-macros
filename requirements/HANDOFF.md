# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Claude, end of Session 15.

**Open pull requests.** #81 (draft, Copilot's: novice meal logging, MM-205 to
MM-208) is not Claude's and was not touched; its handoff edits will conflict
with this file. Nothing else is open: Session 13's pull requests (#90 to
#94) are merged. The expert panel (#79) and `mm ci` (#82, MM-209,
`agents/ci-monitoring.md`) are merged.

**Database.** Schema 31 (a rep range and load step per exercise, MM-79),
merged. Nothing in flight changes the schema. Only one schema change at a
time.

**Next ticket ID.** MM-211 once #81 merges (it uses MM-205 to MM-208;
MM-209 and MM-210 are taken). `mm req next` is the authority.

**HTML UI/UX assets** live in `requirements/ui-ux-assets/` and are linked
from their tickets under `## UI/UX Assets` (MM-210). `mm req` fails on an
HTML file anywhere else that the folder's README does not account for.

**What to build next.**
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
- MM-210: whether the palette preview's Today mock is the reference for
  the dashboard. It is linked only from the two color tickets.
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

## Session 15: 2026-10-11, Claude (UI/UX assets)

- **MM-210, done.** HTML UI/UX assets (screen prototypes, interaction
  demonstrations, explorations, visual specifications) live in
  `requirements/ui-ux-assets/` and are linked from the tickets they support
  under the exact heading `## UI/UX Assets`, each with a status
  (Exploratory, Proposed, Accepted, Superseded) and what it shows. It is a
  standing working agreement in `AGENTS.md`; the convention is that
  folder's README; six panel roles each say their part.
- `mm req` checks the bookkeeping (`tool/src/ui_ux_assets.dart`, 28 tests):
  links, statuses, unlinked assets, missing local files, network loads,
  copies, and any HTML elsewhere that the README does not account for. It
  cannot judge whether an asset belongs with its ticket, looks right or was
  approved.
- The one existing asset, the palette preview, moved from `design/` with its
  history and is linked from MM-102 and MM-184. Opened in headless Edge after
  the move: it renders whole. Its banner still calls Martian a proposal not
  wired into the app; the MM-184 entry says so, and the file was not redrawn.
- Left open for the owner: the preview also mocks the Today screen, and no
  dashboard ticket links it, because nothing records it as that screen's
  reference.
- Nothing about `mm ci` changed.

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
- MM-71 and the rest of MM-68's weight path, stacked on the first part:
  `dailyWeighIns`, `primaryWeightSource`, `mergeWeighIns`; `weightsProvider`
  is now typed weigh-ins plus the imported one that counts for each other
  day (`typedWeightsProvider` is what was typed); `healthSyncProvider` runs
  when the home shell opens and on resume.

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
