---
id: MM-321
status: in-progress
component: developer-tooling
related: [MM-237, MM-293, MM-320]
---

# Task: every part of a screen is drawn by a story

## Context
MM-237's check asks that every screen, sheet and step has a story. It passes when a screen has one story,
however much of the screen that story leaves out. The Health Connect rows of Settings (MM-320) were never
drawn: the stories' health platform is empty, so only "not on this phone" appeared, and nobody reviewing
the design saw the rest. The owner, 2026-10-14, chose to find every such hole, draw it, and add a check.

An audit on 2026-10-14 ran every story under coverage and listed the markup no story drew: 393 places in
about 110 files, about half of them inside event handlers (sheets opened from a press, which are drawn by
stories of their own).

## Description
- **The check.** The stories are drawn under coverage; every branch of a component in `src` that renders
  markup and that no story reached is a failure, unless it is in the register of known holes,
  `apps/mobile/test/gallery/unseen.json`, each with its reason. A new unseen branch fails `mm check`; a
  register entry that a story now reaches fails too, so the register only shrinks.
- **The audit worked down.** Each place in the register gets a story, or stays with a reason a reviewer can
  accept (a guard for a state the app cannot reach, a sheet drawn by its own story).

## Acceptance Criteria
```gherkin
Scenario: A new state no story draws
  Given a component gains a branch that renders markup
  And no story reaches it
  When mm check runs
  Then it fails and names the file and line

Scenario: A hole is filled
  Given a story now draws a place in the register
  When mm check runs
  Then it fails until the place is taken out of the register
```

## Progress
**Step 1 (2026-10-14): the check.** `npm run unseen` (part of `npm run check`, so of `mm check`) draws every
story under coverage (`@vitest/coverage-v8`, pinned) and `scripts/check-unseen.mjs` compares what no story
reached with the register `apps/mobile/test/gallery/unseen.json`. Places are matched to the column, by file
and line text. The Health Connect rows (MM-320) were four of the places the first run found; their stories
took them out. The register starts at 211 places, each with its reason: 166 not yet drawn, 28 opened by a
press no story walks (the sheet or screen drawn by its own story), 17 loading or failed-read states that a
story cannot yet make happen. Working it down, story by story, is the next step.

**A story that says it shows `/./` raced its own screen.** The Evidence Question story matched any word on
the page, so its test could end before the question's screen was pushed, and what coverage counted depended
on timing; the check failed on a merge that touched nothing near it. The story now waits for "The rules
behind this", and the register is 207 places. A story's `shows` must be words of the screen it covers.

**Step 2 (2026-10-15): Food and Dashboard.** Stories can now make storage wait or fail: `screenStory`'s
`stores` takes `waitingRead` or `failingRead` (one read of one store, the others as the fixtures have them),
so the 17 loading and failed-read states are drawn like any other. Food and Dashboard have no place left in
the register: 37 stories, and the register is 144 places (207 before). One place was code no phone can reach
(the Dashboard's own failed-profile branch, which the app root shows first) and was removed, not drawn. The
stories' pack adds a food whose numbers disagree (`storyFoods`; the fixture pack stays as the Dart writer
recorded it, MM-231), so a "Check this" food is drawn. Looking at the new
stories found nine defects: three fixed with their tests (MM-330, MM-331, MM-332) and six design defects
ticketed with skipped tests, to go through Storybook and the panel (MM-333 to MM-338). Next: Coach and the
monthly report.

**Step 3 (2026-10-16): Coach.** Coach and the monthly report have no place left in the register: 21
stories over scenarios the engine itself recognises (a stall, a stall over target, a measured estimate with
partial days, one held at a safe limit, creatine settling, two hard weeks bringing the relief offer, twelve
weeks of recomp with a review in its report, targets explained and unchanged), and the register is 109 places
(144 before). Looking at them found four defects: MM-339 (the recovery section folded when due) and MM-341
(a change that rounds to none was signed, in the recomp review and in `Fmt`) fixed with their tests; MM-340
(Coach and the target history with nothing to show are dead ends) and MM-342 (sentences in the weekly
summary's figure column) ticketed with skipped tests, for Storybook and the panel. Next: Progress and Train.

**Step 4 (2026-10-16): Progress and Train.** No place of either is left in the register: 28 stories, and
the register is 70 places (109 before). New scenarios: an old lifter (qualifying squats past 90 days, bench
presses that never qualify, a set of a since-deleted exercise of their own), a workout an hour in with a set
being timed, a finished workout paused along the way, weight events from onboarding and the person.
Looking at them found two defects: MM-343 (Progress asked for a weigh-in while the trend loaded) fixed with
its test; MM-344 (the strength trends are cards inside their section) ticketed with a skipped test. Next:
Settings, the food packs and the app shell.
