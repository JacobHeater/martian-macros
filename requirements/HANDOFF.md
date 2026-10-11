# Handoff

Living handoff (MM-174): three most recent sessions, newest first. Nothing
private belongs here. Requirements are authoritative for behavior.

## Where things stand

Last updated: 2026-10-11, by Claude, end of Session 12.

**Open pull requests.** #81 (draft, Copilot's: novice meal logging, MM-205 to
MM-208) is not Claude's and was not touched; its handoff edits will conflict
with this file. The MM-67 pull request from Session 12, if still open: read
`./mm ci check <pr>` and merge it when its check has passed on its head.
Nothing else is in flight. The expert panel (#79) and `mm ci` (#82, MM-209,
`agents/ci-monitoring.md`) are merged.

**Database.** Schema 28 (a target rest per workout exercise, MM-191), merged.
Nothing in flight changes the schema. Only one schema change at a time.

**Next ticket ID.** MM-210 once #81 merges (it uses MM-205 to MM-208, and
MM-209 is taken). `mm req next` is the authority.

**What to build next.**
- MM-67, second half: a Drift table for imported readings behind
  `HealthSampleStore` (schema 29), the eraser, and the app's providers. Then
  Health Connect behind `HealthSource` (MM-68).
- MM-155 (waist protocol and noise): replaces the interim waist rule that
  MM-32 and MM-133 share.
- Small leftovers: the recomp review in the monthly report (MM-33, MM-133);
  an editable rep range and load step (MM-79; needs a table); MM-191's
  sound, background signal and free-typed rest length.
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
