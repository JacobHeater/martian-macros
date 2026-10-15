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
