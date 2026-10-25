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
