# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Claude, end of Session 17.

**Open pull requests.** #81 (draft, Copilot's: novice meal logging, MM-205 to
MM-208) is not Claude's and was not touched; its handoff edits will conflict
with this file. Nothing else is open: Session 13's pull requests (#90 to
#94) are merged. The expert panel (#79) and `mm ci` (#82, MM-209,
`agents/ci-monitoring.md`) are merged.

**Database.** Schema 31 (a rep range and load step per exercise, MM-79),
merged. Nothing in flight changes the schema. Only one schema change at a
time.

**Next ticket ID.** MM-223 once #81 merges (it uses MM-205 to MM-208;
MM-209 to MM-222 are taken). `mm req next` is the authority.

**HTML UI/UX assets** live in `requirements/ui-ux-assets/` and are linked
from their tickets under `## UI/UX Assets` (MM-210). Every view and
component has a drawing there, listed in `coverage.json` (MM-211); a UI
change is not done until its drawing and manifest entry are changed with
it. #81 adds or changes screens and will need its drawings brought up to
date when it merges: `mm req` will say which files.

**What to build next.**
- Ready to fix, each with a skipped test waiting: MM-213 to MM-217.
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
- **Usability, from the walkthrough reviews (Session 17). Each is a proposed
  story; say accept, change or decline:** MM-218 (the sheet says what it will
  log; includes whether typed numbers should default to "Everything I ate",
  MM-167 decision 3), MM-219 (finding a food against typing one), MM-220 (the
  action in view, a reason when it is off, a way out of the sheet), MM-221
  (editing shows what was typed), MM-222 (a logged set looks logged; which
  action leads on a workout).
- Is `design/screen-direction.md` still the target for the Add food sheet,
  and should Train have a section in it? The built screens match neither.
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

## Session 17: 2026-10-11, Claude (why the panel missed the Add food concerns)

- **MM-212, done.** An outside review of one sheet raised usability concerns
  the owner already had; the panel's earlier audit (the MM-205 run, on #81's
  branch) had not put them to the owner. Its records show the reviewers saw
  part of it and filed it as an "unverified hypothesis" for want of observed
  users; only confirmed defects were ticketed; nobody could see the sheet (no
  screenshot test; the designer asked for one); and depth was never chosen.
- **What changed in how the panel reviews** (`agents/review-contract.md`,
  `agents/panel-protocol.md`; role files untouched):
  a step-by-step **task walkthrough** of the built screen is evidence, with
  its own finding class, *usability problem found by inspection*; the chair
  names **depth targets by counting** controls and branches and gives each a
  **render of the built screen**; reports say **walked or surveyed**; and
  **every finding gets an outcome** (bug ticket, proposed story, owner
  question, verified now, or rejected). "Needs verification" is not one.
- **A drawing is not the screen.** The sheets in `requirements/ui-ux-assets/`
  orient a reviewer; a walkthrough is done on screenshot tests or a device.
  The first real screenshot of the Add food sheet showed a defect the drawing
  did not have.
- **Two runs under the new rules**, both valid with `mm panel <run>`:
  `docs/agent-runs/mm212-add-food-walkthrough/` and
  `docs/agent-runs/mm212-workout-logging-walkthrough/` (chosen by count, not
  named by the owner). Reviewers were given tasks, never leads.
- **Five defects, each with a test that failed once and is now skipped under
  its ticket:** MM-213 (Saved and Estimate break mid-word), MM-214 (a reps
  field shows what is not stored), MM-215 (removing a set cannot be undone),
  MM-216 (changing the method clears the amount silently), MM-217 (a hand
  portion of a found food reads as exact). None is fixed.
- **Five proposed stories for the owner:** MM-218 to MM-221 (Add food) and
  MM-222 (workout logging). Nothing in the app was changed.
- Eight new screenshot tests (seven of the Add food sheet, one of a set being
  timed). The reference library's fields now take typing and its text scales
  alone.

## Session 16: 2026-10-11, Claude (HTML reference library)

- **MM-211, done.** `requirements/ui-ux-assets/index.html` opens an HTML
  drawing of every view and component as built: eight view sheets, a
  component catalog, a flows sheet. `coverage.json` lists all 165 widget
  files with the frame that draws each, the states drawn, its tickets, how
  it was checked and what limits it. 83 tickets link their drawings under
  `## UI/UX Assets`, status `Current`.
- **Standing rule (AGENTS.md):** a new view, component, sheet or dialog is
  drawn, listed in the manifest and linked from its tickets in the same pull
  request; a changed one is redrawn; a removed one loses its frames and its
  entry. `mm req` fails on a widget file the manifest does not list, on an
  entry pointing at a file, symbol, frame or ticket that does not exist,
  and on a link to a frame that does not exist.
- **How to add a frame:** sheets are built by `shared/mm.js` from helper
  calls (`m.phone`, `m.info`, `m.row`, `m.frame('id', ...)`); copy a
  neighboring frame. Styles and tokens are in `shared/mm.css`, copied from
  `apps/mobile/lib/src/theme/`.
- **Checked how:** 76 entries compared by eye with a screenshot test, 83
  drawn from the source alone, 6 not drawn (hosts, the camera, the phone's
  pickers) with the reason. Every sheet was opened in headless Edge. Nothing
  was compared with the app on an emulator or phone.
- **Corrections the comparison forced**, worth knowing when reading the
  source for a drawing: confirm dialogs use the primary button, not a red
  one; `showMmOptions` is a dialog, not a sheet; the download strip is at
  the bottom of the screen; a lift's history is titled with the lift.
- The session began by misreading the request as "track the HTML that
  exists" (that is MM-210, Session 15). The owner meant "draw everything".

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
