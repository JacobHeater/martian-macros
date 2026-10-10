# Handoff

This is the living handoff document (MM-174). Every agent, whatever its vendor, reads it before working and updates it before
finishing, so the work can change hands without the product owner repeating anything.

It sums up the **three most recent sessions**, newest first. When you start a new session, add it at the top of "Sessions" and delete
the oldest. Keep "Where things stand" true at all times; that part is the state, not the history. `mm req` fails if this file is
missing or holds more than three sessions.

Nothing private goes here: no credentials, no personal or health data.

## Where things stand

Last updated: 2026-10-10, by Copilot, during the Dashboard pivot.

**Branch state.** Handoff PR #61 and phone-shortcut PR #62 are merged.
Dashboard MM-176 and isolated demo seeding MM-177 are in flight on
`feature/mm176-dashboard-metrics`, draft PR #63. The combined delivery includes
the Food pie, meal-card/vector-control refinements and flat FAB. No unrelated
roadmap work is being started.

**Database.** Schema version 23. Only one schema change may be in flight at a time (see `roadmap/README.md`).

**Next ticket ID.** MM-184 (`mm req next` is the authority).

**What to build next.** The work follows `roadmap/`. WS-09 (coaching intelligence) is where the last two sessions worked. In it:
- Buildable now: process rewards (MM-92) and the monthly report (MM-33). Rewards must count exactly what the adherence summary
  counts (MM-149), and must neither advance nor break during a pause (MM-148).
- Blocked: the recomp review and signal (MM-133, MM-32) need the training log and strength trend (WS-10, MM-75 and MM-77) and the
  measurement protocol (MM-155). Phase planning (MM-36) needs the body-fat estimate from measurements (MM-34).
- Good work to hand off, with no dependencies: the exercise library (MM-76) and the health-source interface with its fake (MM-67).

**Waiting on the product owner.**
- MM-173: honest low days from a noisy logger are dropped as partial, so the expenditure estimate drifts about 160 kcal high. The
  ticket lists four options and recommends judging "far below typical" against the spread of the window. Its test is skipped.
- Reminders are scheduled inexactly on Android, so one can be up to an hour late. Exact timing needs a permission. Not asked yet.
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
- Fixed product constraints, not to be reopened: offline only; biological sex is male or female for every formula; United States
  only at launch.

**Things that will cost you time if you do not know them.**
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

## Session 4: 2026-10-10, Copilot

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

## Session 3: 2026-10-09 (late), Claude (Anthropic)

Workstream WS-09, steps 3 to 5 and part of 8. All merged.

| Pull request | Ticket | What changed |
|---|---|---|
| #55 | MM-141 | Insight framework: a fixed catalog of rules, rationed to one a day and three a week, on the dashboard. |
| #56 | MM-148 | Pause for travel, illness or injury. Schema 20. |
| #57 | MM-146 | Local reminders for weigh-in, food and the weekly measurement. Schema 21. |
| #58 | MM-116 | Weekly recovery check-in: five questions, shown as five lines over eight weeks. Schema 22. |
| #59 | MM-117 | Offer to ease a deficit after two hard check-ins: a maintenance week, a slower pace, or carry on. Schema 23. |
| #60 | MM-125 | Protein per meal at Full detail, a quiet marker, and one insight. |

Things a successor should know:
- **A pause is read in many places.** The estimator, gap detection, the check-in, the adherence summary, the stall diagnosis,
  insights, the under-eating rule and reminders all consult it. Anything new that judges a day, counts a streak or prompts the user
  must too. The helpers are `pauseOn`, `withoutPausedDays` and `pausedDaysBetween` in the engine.
- **Reminders record nothing when they fire.** The plan is a pure function (`planReminders`) remade whenever the app opens or data
  changes; the device's schedule is replaced by it. "Ignored seven times" is derived from the days since the reminder was turned on
  with the thing not done. Each reminder is only ever scheduled seven sends ahead, which is how an absent user is left alone.
- **New dependencies**: `flutter_local_notifications` 22.3.1 and `timezone` 0.11.1, with core-library desugaring, two receivers in
  the Android manifest, and Gson's shrinker rules. iOS needs its app delegate looked at before reminders can be trusted there.
- **A maintenance week the user takes** is a new target flag, `requestedBreak`, issued at once by `nextTargets` when
  `UserSetup.maintenanceWeekFrom` is set. It is separate from the automatic diet break after sixteen weeks.
- **Left out on purpose**, each noted in its ticket: the check-in-ready and recovery reminders, the reminder offer in onboarding, the
  missed-period question (needs cycle logging, MM-20), the strength trigger for the ease-the-deficit offer (needs the training log),
  and a date picker (pause dates are set with sliders).
- Two rules were added to the working agreements this session: every bug gets a ticket and a regression test at once, and this
  handoff document (MM-174). Bugs MM-168 to MM-173 were filed in retrospect; all but MM-173 are fixed.

## Session 2: 2026-10-09 (evening), Claude (Anthropic)

Workstream WS-09, steps 1 to 3. All merged. Written from the pull requests and the commit history, not from notes taken at the time.

| Pull request | Ticket | What changed |
|---|---|---|
| #51 | MM-149, MM-123 | Weekly adherence summary on the Coach screen: five facts and no score. Tolerance bands for intake. |
| #52 | MM-114 | Notice when logged days sit far below the calorie floor for two weeks, with a one-tap fix. Schema 17. |
| #53 | MM-147 | Returning after a gap: the welcome-back screen, the deficit count restarting, the starting estimate. Schema 18. |
| #54 | MM-140 | Stall diagnosis: says which of four kinds of stall it is. |

Things a successor should know:
- **One rule decides which days count.** `usableIntakeDays` is shared by the expenditure estimate, the adherence summary and the
  under-eating notice, so they always agree. MM-173 is a defect in that rule and touches all three.
- **Nothing here praises eating under target**, and no notice comes from a single day. Several of these rules are enforced by tests
  that forbid particular words on a screen. Treat those tests as the specification.
- **No composite scores**, for adherence, recovery or confidence. Each ticket says why.
- The stall diagnosis offers options as text only, because the things it would offer (pace choice MM-128, weekly budget MM-124, diet
  break policy MM-135) are not built.
