---
id: MM-619
status: in-progress
component: developer-tooling
related: [MM-7, MM-237, MM-321, MM-394]
---

# Task: CI in minutes, not half an hour

## Context
On 2026-10-25 the owner saw screen tests taking 1–2.5 seconds each in CI and asked why CI takes so long. A run measured from
CI's own log (run 40158233027):
- The test phase took **22.4 minutes**. 86% of it was test execution, not imports or setup.
- **Logic tests ("rules"):** 4,000 tests summed to 74 seconds. Fine.
- **Screen tests ("screens"):** 1,955 tests summed to 2,748 seconds, about 1.4 s each. 939 took over a second and 269 over
  three.
- **`test/gallery/stories.test.tsx`:** 670 stories in one file, 576 seconds. As one file it runs in one worker, so it alone
  sets the wall clock of the test phase.
- **The stories run twice:** `npm run check` runs `npm run test`, which includes the stories file, and then
  `npm run unseen`, which runs the same file again under coverage (MM-321).
- **Everything runs in one job,** one step after another: requirements, panel, tool tests, type check, tests, the stories
  again, the build, then Android's build.

## Decisions
By the product owner, 2026-10-25: fix CI's speed tonight, on a branch from main.

Choices made without asking (say if any is wrong):
- **The stories run once:** under coverage, in `npm run unseen`. `npm run test` no longer runs them.
- **The stories are drawn in 8 shard files.** Each draws every eighth story, so they spread over the workers. The
  register's checks (a story for every screen, every component shown) move to a file of their own.
- **CI runs in parallel jobs, each through `mm`** (MM-7: CI calls `mm`, never npm directly). `mm check` keeps running
  everything in order for a person. `mm check --part <static|tests|stories>` runs one part, and `--shard i/n` splits the tests.
  - **static:** requirements, panel, tool tests, type check, build, offline, legal page.
  - **tests:** rules and screens, split over 3 jobs.
  - **stories:** the stories under coverage and the unseen check.
  - **android:** the shell's build.
- **Per-test speed is measured in CI, not locally** (the owner's rule: no tests on the dev machine). A CPU profile of the
  slowest screen files is uploaded as an artifact, and the causes are fixed from it.

## Description
`mm check --part`, `--shard`, a `stories` vitest project with 8 shard files, the CI workflow as parallel jobs, and then the
causes of slow screen tests found from CI's profile, fixed.

## Acceptance Criteria
```gherkin
Scenario: The stories run once
  When CI runs
  Then the stories are drawn once, under coverage, and the unseen check reads that coverage

Scenario: Parallel jobs
  When CI runs on a pull request
  Then the static checks, three test shards, the stories and the Android build run as separate jobs at the same time
  And each job calls mm

Scenario: Same gate
  When a person runs mm check
  Then every step CI runs is run, in order, and a failure in any stops it

Scenario: Faster
  Given the run measured on 2026-10-25 (about 27 minutes for a green run)
  Then a green run takes 12 minutes or less from push to the last job
```

## Progress
Built 2026-10-25, measured in CI (nothing run locally).

| Run | Change | Push to last job |
|---|---|---|
| 40158233027 (before) | one job: the test phase alone took 22.4 min, the stories drawn twice | about 27 min green |
| 40162469689 | parallel jobs, stories once in 8 shards | 8.1 min (stories 8 min) |
| 40163095361 | screens and stories without stylesheets | 4.2 min (stories 4 min) |
| 40163517596 | `getComputedStyle` from the element alone | about 3 min (Android's build 2.9 min is now the longest) |

- **Parallel jobs:** `mm check --part static|tests|stories [--shard i/n]` (`tool/src/checkPlan.ts`, tested in
  `tool/test/checkPlan.test.ts`). CI runs static, three test shards, stories and Android at the same time, with a newer
  push cancelling an older run. `mm check` alone still runs every part in order.
- **Stories once:** a `stories` vitest project of 8 shard files (`test/gallery/stories/`, drawing through
  `test/support/storyCases.tsx`), run only by `npm run unseen` under coverage. The register's checks moved to
  `test/gallery/storyRegister.test.tsx`. Under coverage a story gets 30 s.
- **Why a screen test took 1.4 s:** CI's CPU profiles of the test workers (a temporary job, since removed).
  - **The stylesheets:** about 90% of worker time was jsdom matching CSS rules for the visibility checks of role queries and
    user-event's pointer-events checks. React and the app came to under 5%.
    - Screens and stories now load no stylesheets (`css: false`).
    - The ten tests whose assertions read CSS (`toBeVisible` and the like) run in `screens-css`, with them.
    - That took a screen test from 1.4 s to 0.83 s.
  - **The cascade itself:** jsdom's `getComputedStyle` still ran the whole cascade on every call. `test/fastComputedStyle.ts`
    answers `display`, `visibility` and `pointer-events` from the element's `hidden` attribute and inline style, which is all
    a page without stylesheets can say. It covers screens and stories, not `screens-css`.
- **One open question:** `test/food/searchMoreResults.test.tsx` passes with jsdom's own styles. With
  `fastComputedStyle` its "7 more results, every match listed" status never appears, even after a 15 s wait, though all 27 rows
  do. The component's `firstNew` is pure state and reads no style, so the cause was not found without running the test, which
  the owner's rule keeps off the dev machine. The file runs in `screens-css` (real styles, still every run) until it is found.
  The test now waits for the status and the focus rather than looking in the same tick, which is right either way.
