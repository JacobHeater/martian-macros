# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Copilot, after checking PR #81 CI.

**Panel and novice experience.** PR #79 merged to `main` at
`44251604bac61bdc5dd9eb69bec045e13f7e2929`. MM-205's distinct UX/Product
Designer guidance and bounded novice meal-logging audit are complete on
`feature/mm205-expert-mobile-ux`. Copilot native picker/CLI/cloud enforcement
remains untested; cup terminology research remains explicitly unverified.

**MM-206/207/208.** Dashboard Add food now targets today regardless of Food's
retained historical date; Food's own action still targets the selected date.
Meal rows have a named visible delete menu with Undo while swipe remains.
Dashboard Add food is a labeled app-bar action, no longer obscuring the macro
chart. All three regression guards are enabled and pass. MM-205 audit,
research, decisions, and limits remain persisted in
`docs/agent-runs/mm205-novice-mobile-experience/`. No Simple-mode chart policy
change was made; existing MM-176/MM-179 behavior remains.

**Food audit follow-up.** MM-202, MM-203 and MM-204 record reproduced existing
food-edit/alcohol defects; each has a skipped regression guard pending a
separately scoped application fix. Other audit hypotheses and unreviewed
areas are recorded in `docs/agent-runs/pr79-food-feature-audit/`.

**Branch state.** Strength #77, weekly volume #78 and typed-set overlap #80
are green and merged. PR #79 merged to main at
`44251604bac61bdc5dd9eb69bec045e13f7e2929`; this branch carries the MM-205
panel work and its separately ticketed follow-up fixes.

**Database.** Schema 27 (pausing the workout clock, MM-191). No panel migration.
Only one schema change in flight at a time.

**Next ticket ID.** MM-209 (`mm req next` is the authority). Cloud panel's
provisional MM-195 collided with training MM-195. Allocated MM-197 for the
panel bug after inspecting fresh main; upstream MM-195/MM-196 are unchanged.

**What to build next.** Continue WS-10: remaining rest countdown/signals and
timing gaps (MM-191), then progression (MM-79). Food-log fixes MM-202/203/204
remain separately ticketed follow-ups.
Strength unlocks recomp (MM-133, MM-32) and remaining strength/PR parts of
monthly reports/rewards (MM-33, MM-92). Phase planning (MM-36) needs body-fat
estimates (MM-34). Health sync starts at the interface/fixture (MM-67);
Android segments require app-owned native code later (MM-188, MM-189).

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

## Session 13: 2026-10-11, Copilot (implementing novice-experience findings)

- Implemented MM-206: Dashboard Add food explicitly targets today; Food
  retains selected-day logging. Enabled the end-to-end regression covering
  both routes and persisted dates.
- Implemented MM-207: added a named, 48-by-48 design-system row menu with
  Delete; swipe and Undo remain. Enabled the delete/Undo regression.
- Implemented MM-208: moved Dashboard Add food to the labeled app bar so it
  cannot overlay the macro chart. Enabled geometry and 1.5x text reachability
  checks for all chart labels. Simple-mode chart behavior is unchanged.
- Focused Dashboard/Food/insight/app tests passed (24 tests); the full mobile
  suite passed (519 passed, 56 skipped). `mm format --check`, `mm analyze`,
  `mm req`, `mm panel` and repository-wide `mm check` passed. No emulator or
  native screen-reader check was performed.
- Linux golden workflow 38112620983 succeeded. Imported and visually reviewed
  the 15 changed Dashboard and meal-row screenshots from its artifact; these
  include the app-bar Add food action and visible row menu. No Windows golden
  baseline was used.
- Commits `2a04f86`, `a54fe81` and `a1868a2` are pushed on
  `feature/mm205-expert-mobile-ux`; draft PR #81 is open and mergeable. GitHub
  CI on the golden-update commit is still in progress. Keep the PR in draft
  until CI passes on the latest head.

## Session 12: 2026-10-11, Copilot (novice mobile-experience audit)

- Owner reports novice cognitive overload from card- and analysis-heavy
  screens; this is a problem signal, not proof that cards or required metrics
  are harmful. MM-205 keeps app redesign out of scope.
- Product Designer and UX independently audited the existing novice
  meal-log journey; they remained distinct. Chair-delegated source research
  found indirect food-entry friction evidence but no direct novice
  progressive-disclosure study or support for chart demotion.
- Flutter corroborated Dashboard Add food using Food's retained historical
  date; QA corroborated the visible deletion alternative rule and golden
  overlap. Parent reproduced MM-206 wrong-day, MM-207 missing action and
  MM-208 FAB overlap with targeted widget probes. Each is ticketed with a
  skipped guard pending its own UI fix; no app behavior changed.
- Persisted audit, source provenance, decisions, checkpoint and test results
  in `docs/agent-runs/mm205-novice-mobile-experience/`. MM-49/MM-179 Simple
  scope remains with the owner. Full `mm check` previously failed due Dart
  VM/JIT crash; no claim that it passed.
- Fixed guard syntax to `skip: true` with ticket IDs in comments; focused
  Dashboard/Food tests passed with three tracked skips. Platform/device,
  screen-reader and novice-user behavior remain unverified.

## Session 11: 2026-10-10, Copilot (merge confirmation)

- Owner confirmed switching to main and pulling. Verified clean `main` equals
  `origin/main` at merge commit 44251604; GitHub reports #79 merged.
- Updated this handoff: panel work is complete; no #79 blocker/merge exception
  remains. MM-202/203/204 are separately deferred food behavior fixes.

rformed WebSearch/WebFetch, then
  a fresh Claude session resumed repository artifacts without chat/research
  repetition. Unmodified resume profile exposed exactly five allowed tools.
  Real sources/results/hashes persist in `docs/agent-runs/pr79-research-smoke/`;
  templates remain inert. Copilot picker/CLI/cloud runtime was not exercised.
- Native Claude isolated missing-doc smoke returned PANEL_CONFIG_MISSING,
  stopped without review or fallback. Scoped validator review found MM-199
  malformed-schema crash and MM-200 unexplained omissions; both reproduced
  before fix, regression-tested and fixed. Full check passes (82 tool tests,
  25 panel cases). Earlier PowerShell stream-redirection aborted on expected
  negative-fixture stderr; OS-level redirection ran the real gate successfully.
- Owner added MM-201: every role audits existing code, requirements, tests and
  docs before proposals. Added audit modes, classified findings and portable
  coverage; independent native nutrition and QA food-feature audits in flight.
  Historical research run is explicitly stale for new instructions, retaining
  applicable sources and real prior smoke results.
- Nutrition audit returned classified findings/coverage. Parent reproduced
  unchanged fractional/legacy rounding (MM-202) and per-serving alcohol mismatch
  (MM-203). Added guards and skipped them with ticket IDs until separate app
  fixes; no app implementation changed. Other gaps/hypotheses remain distinct.
  Existing food tests pass (13, three tracked skips); full gate still passes.
- QA completed independently and challenged recents interpretation. Shared
  precision/alcohol causes deduplicated; distinct convert-to-totals alcohol
  loss reproduced (MM-204) and guarded/skipped. No application fixes.
  Real audit reports/state record inspected/uninspected layers, classifications,
  dissent and owner executions. All native review processes quiescent.
  Cup terminology request remains unverified: eCFR blocked, GovInfo unparsed.
- Final post-QA full Windows check passed, exit 0 and All checks passed:
  82 tool tests/25 panel cases. Saved research/audit runs validate. Four
  reproduced app-bug guards are explicitly skipped; not claimed fixed.
- Delivered merge commit 41ca7ae to original #79 branch, no force push.
  PR description preserves original task and records actual checks, runtime
  limits and deferred defects. Trusted CI ran on the merged PR head.
