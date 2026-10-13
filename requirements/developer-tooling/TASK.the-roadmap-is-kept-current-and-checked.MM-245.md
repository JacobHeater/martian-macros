---
id: MM-245
component: developer-tooling
status: done
related: [MM-1, MM-166, MM-174, MM-209]
---

# Task: the roadmap is kept current, and checked

## The decision

The owner's call (2026-10-13): agents keep the roadmap up to date, always,
and at the end of a session check whether they moved the needle at all.

## Why

`roadmap/` is where an agent is told to look to choose what to build next,
and it had not heard about a ticket since MM-191: the React conversion,
Storybook, the expert panel and the terms of use were in no workstream, its
"start here" table pointed at tickets long done, and seven done tickets were
still listed as remaining. The working agreements asked for the handoff
document to be kept current and said nothing about the roadmap; the only
rule for it was inside the roadmap's own README, which also said finishing
a ticket needs no change there. Nothing checked any of it.

## What is built

- **A working agreement** in `AGENTS.md`, beside the handoff one: a ticket
  is placed in a workstream and a step when it is created, moved to built
  when it is done, in the same pull request; and before a session ends the
  agent says in the handoff which step or milestone moved, or that none did.
- **`mm req` checks the roadmap** against the tickets, so `mm check` and CI
  fail when they disagree: every ticket in exactly one workstream, as built
  when done and remaining otherwise; every remaining ticket but an epic in
  exactly one step of its workstream; every edge satisfied by tickets of its
  own workstream and scoped to steps that exist; `dependsOn` and `unlocks`
  equal to the ordering edges; no cycle among them; and each milestone's
  list equal to the steps tagged with it. These are the six checks the
  roadmap README listed as "none is automated yet".
- **The catch-up.** The 79 tickets from MM-166 on are placed; built and
  remaining follow status in every workstream; the milestone lists are
  regenerated from the steps; the workstream states, the provenance and the
  file paths name the React app instead of the Dart packages.

## Acceptance criteria

```gherkin
Scenario: a new ticket must be placed
  Given a ticket in requirements/ that no workstream lists
  When mm req runs
  Then it fails and names the ticket

Scenario: finishing a ticket moves it
  Given a done ticket listed as remaining, or an unfinished one listed as built
  When mm req runs
  Then it fails and says which list it belongs in

Scenario: a remaining ticket has a step
  Given a remaining ticket that is not an epic and is in none of its workstream's steps
  Then mm req fails

Scenario: the graph is sound
  Given an edge satisfied by a ticket of another workstream, a scope naming a missing step,
    a dependsOn that disagrees with the edges, a cycle, or a milestone list that disagrees with the tagged steps
  Then mm req fails and says which

Scenario: the roadmap matches the tickets
  Given the repository as committed
  Then mm req passes and mm roadmap --check passes

Scenario: the session says whether it moved
  Given a session ends
  Then the handoff says which workstream step or milestone advanced, or that none did
```

## Regression test

`tool/test/roadmapChecker.test.ts` covers each rule with a small roadmap
that passes and one change per rule that fails.

## Progress

**Done (2026-10-13, PR #138).** The checker failed against the committed
roadmap (85 problems: 75 unplaced tickets, 7 done tickets listed as
remaining, 3 milestone lists out of step) before the catch-up and passes
after it. The agreement was followed in the next two pull requests (#139
placed MM-246 on creation; this one moves MM-7, MM-175 and MM-245 to
built), and the handoff says what moved.
