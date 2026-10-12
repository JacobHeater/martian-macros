# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Copilot, Session 19.

**Open pull requests.** #81 (novice meal logging, MM-205 to MM-208) remains a
draft; #100 is already merged to `main`. Session 19's Add food,
cross-app-usability work and MM-225 macro preview continue on
`feature/mm205-expert-mobile-ux`. Linux screenshot baselines and updated PR CI
are still pending.
Session 13's pull requests (#90 to #94), the expert panel (#79), `mm ci`
(#82, MM-209) and the usability-review work (#100, MM-212) are merged.

**Database.** Schema 31 (a rep range and load step per exercise, MM-79),
merged. Nothing in flight changes the schema. Only one schema change at a
time.

**Next ticket ID.** MM-226 (`mm req next` is the authority; MM-209 to MM-225
are taken).

**HTML UI/UX assets** live in `requirements/ui-ux-assets/` and are linked
from their tickets under `## UI/UX Assets` (MM-210). Every view and
component has a drawing there, listed in `coverage.json` (MM-211); a UI
change is not done until its drawing and manifest entry are changed with
it. #81's Dashboard/Food entry-point changes and MM-223's Add food
discovery/manual-entry states are reflected in the drawings and manifest;
Linux golden images remain pending.

**What to build next.**
- Finish MM-223 verification after importing Linux goldens; review the
  cross-app findings for MM-224 and give each a concrete disposition.
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
  updated in the local worktree. Linux golden images have not been
  generated/imported. `mm analyze` and `mm check` passed (`All checks
  passed.`). The bounded cross-app panel survey is complete; its limits,
  recommendations, and research caveats are recorded in MM-224. ACM pages
  were not freshly retrievable, so DOI metadata and the prior research record
  were used.
- Continue on `feature/mm205-expert-mobile-ux`; Linux baseline generation and
  PR CI are the remaining delivery checks. The broader MM-224 effort remains
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
