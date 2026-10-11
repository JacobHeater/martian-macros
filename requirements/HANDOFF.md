# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Claude, Session 12 (rest target, MM-191). The
paragraphs below about #79 are Copilot's from Session 10; #79 has since merged.
CI monitoring (`mm ci`, MM-209) is merged (#82); see Session 11.

**Tooling in flight.** Existing PR #79, `copilot/implement-expert-panel`,
adds canonical roles, Claude/Copilot adapters, research evidence and portable
state validation. Owner explicitly requests completing it **without merging**.
Local SDK checks pass; no repeat download needed. Claude native research and
fresh artifact resume passed on Windows; Copilot chair-delegated research passed.
Copilot native picker/CLI/cloud profile enforcement remains untested.
MM-201 existing-code audit acceptance is implemented and exercised with actual
independent nutrition/QA food-feature reviews and targeted challenge. Final
full Windows checks pass; inspect current PR CI/readiness before further work.
Implementation/audit artifacts are committed and pushed to existing #79.
Main conflict is resolved; inspect current PR CI/readiness there before merge
(owner explicitly prohibits merging #79).

**Branch state.** Strength #77, weekly volume #78 and typed-set overlap #80
are green and merged. PR #79 merges that upstream work without changing app
behavior. Its handoff conflict was resolved and the merge pushed.

**Database.** Schema 28 (a target rest per workout exercise, MM-191), merged.
Only one schema change in flight at a time.

**Next ticket ID.** MM-205 (`mm req next` is the authority). Cloud panel's
provisional MM-195 collided with training MM-195. Allocated MM-197 for the
panel bug after inspecting fresh main; upstream MM-195/MM-196 are unchanged.

**What to build next.** The recomp review (MM-133), which can reuse
`recompSignalOf`'s parts; then the strength parts of the monthly report and
rewards (MM-33, MM-92). MM-79 (progression) is merged with default rep ranges
and load steps; editing them per exercise needs a table (schema 29). MM-191 has only a sound
at the end of a rest left (needs an audio package: owner's decision), a
background signal, and a free-typed rest length.
Strength unlocks recomp (MM-133, MM-32) and remaining strength/PR parts of
monthly reports/rewards (MM-33, MM-92). Phase planning (MM-36) needs body-fat
estimates (MM-34). Health sync starts at the interface/fixture (MM-67);
Android segments require app-owned native code later (MM-188, MM-189).

**Waiting on the product owner.**
- MM-191: whether to add an audio package and a sound file for the end of a
  rest (only a vibration is given now), and the choices the panel made in the
  owner's absence, listed in the ticket (rests on offer, "Target rest
  reached", the twelve-hour rule for times after midnight).
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

## Session 12: 2026-10-11, Claude (rest target)

- Merged #82 (`mm ci`, MM-209) after reading GitHub directly: check passed on
  head `3994982`. Its watch stops by itself; no CI watch of that PR remains
  to act on.
- MM-191, the rest of it: a target rest per exercise (None, 1:00, 1:30, 2:00,
  3:00, 5:00), remembered per exercise; the bar counts down to it, then says
  "Target rest reached" and shows the whole rest; one vibration at the target
  through a `RestSignal` interface; a set's times typed to the second in a new
  design-system entry (`showMmClockTime`); a workout, and a set in it, can end
  after midnight. Schema 28 adds `workout_exercises.rest_target_seconds`.
- The product owner was away and said to use the panel. `panel-training` and
  `panel-ux-accessibility` were asked; what they decided is in the ticket
  under "Choices made with the expert panel". Their reports were read-only
  source reviews; nothing was run by them.
- **Not built:** a sound (Flutter has no system alert sound on Android or
  iOS; needs a dependency). **Not verified:** a screen reader, and the
  vibration on a phone.
- MM-79: `suggestProgression` in the engine and a suggestion line on each
  exercise of a workout in progress; the first set starts from it. The rules
  were set by `panel-training` (in the ticket). PR stacked on the MM-191 one.
- A screenshot test broke on the taller exercise card (it could not find
  the Add exercise button) and failed CI on the MM-191 PR; fixed by scrolling
  to it. Lesson: read the whole Linux golden run, not its last line.
- #83 (MM-191) and #84 (MM-79) merged after a direct read of GitHub showed
  the check passed on each head. No CI watch is left to act on.
- MM-32: `recompSignalOf` and a card on Progress. `panel-measurement` set the
  thresholds (in the ticket); the waist rule is interim until MM-155.
- Draft PR #81 (Copilot's, MM-205 to MM-208) was not touched. Its handoff
  edits will conflict with this file.

## Session 11: 2026-10-11, Claude (CI monitoring)

- MM-209: `mm ci` watches a pull request's checks in the background and keeps
  each change as a stored event, so the chair reads them at task boundaries
  without waiting. Read-only on GitHub. It supplements the delivery workflow;
  the start and end checks, and merging by the chair, are unchanged. Full
  instructions, state format, recovery and the capability matrix are in
  `agents/ci-monitoring.md`.
- Verified: 54 tests against a simulated `gh`; a read-only run against the real
  PR #81 with a detached watcher; on Claude Code in VS Code, a finished
  background command (`mm ci next`) reached the model at the next tool boundary
  with no user prompt. Its tests also pass on Linux (WSL). **Not tested: any Copilot surface,
  macOS**, and
  on a real pull request a failing check or a rerun (simulated only).
- **One CI watch is open**, on this change's own PR #82 (`feature/ci-watch`):
  watch `JacobHeater-martian-macros-pr82`, owner `claude-chair`, on the
  machine this was built on. Next chair: `./mm ci own` it (or start it again
  on another machine), read `./mm ci check 82`, merge when green. The watcher
  stops by itself when the PR merges. The demonstration watch on #81 was
  stopped and removed. PR #81 (`feature/mm205-expert-mobile-ux`, draft, not this session's)
  was read only: checks passed on head `6a75f5c`; it was not merged.
- MM-209 was taken because the open PR #81 uses MM-205 to MM-208, although
  fresh `main` reported MM-205 as next. Next is MM-210 once both merge.

## Session 10: 2026-10-11, Copilot (local panel takeover)

- Owner requests finishing existing #79: install Copilot adapters, audit all
  roles, verify research capability, run local checks. No merge.
- Initial tree clean; fetched and safely switched existing branch. Merged
  main; handoff conflicts resolved retaining upstream product decisions.
- `.github/agents/` omission was a cloud environment restriction, not a
  repository policy. Allocated panel bug MM-197 using `mm req next`.
- Current official VS Code, GitHub and Claude configuration docs retrieved.
  Role audit is read-only; this session is the sole write owner.
- Audited all 15 roles; installed 15 Copilot adapters and research tools on
  15 Claude adapters. Chair has bounded delegation/artifact edits, not shell;
  specialist tools exclude writes/execution. Product design remains distinct
  from UX. Research gates, source evidence/capability state and invalid fixtures
  added (MM-198). 22 focused cases/full Windows `mm check` pass.
- Copilot research specialist performed actual GitHub source discovery and
  page retrieval. Claude native specialist performed WebSearch/WebFetch, then
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
  limits and deferred defects. New trusted CI runs (old cloud runs required
  action and were not test evidence); PR is now mergeable. Read final CI/
  readiness from PR. No tooling owner decision remains; do not merge.
