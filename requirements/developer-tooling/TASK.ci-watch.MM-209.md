---
id: MM-209
status: done
component: developer-tooling
related: [MM-7, MM-174, MM-190]
---

# Task: Watch pull request checks in the background, without waiting for them

## Context
The delivery workflow in `AGENTS.md` says to check open pull requests at the start and the end of each session or turn and never to sit
waiting on CI. Between those two checks an agent learns nothing: a failure sits unseen until the next check, and a green result is acted
on late. The product owner asked for local monitoring, shared by Copilot and Claude Code, that sees changes while agents keep working,
keeps them reliably, and offers them to the chair whenever it can read, not only at the two ends.

## Decisions (made with the product owner)
- **It adds to the working agreements and replaces none of them.** The start and end checks stay mandatory. Nobody waits on CI.
- **The monitor only reads GitHub.** Merging and every other delivery action stay with the chair, under `AGENTS.md`.
- **Seeing, offering and acting are three things.** The monitor guarantees the first, offers the second through a read that returns at
  once, and never claims the third: nothing is said to have reached a model that was not shown to.
- **A result is for one commit.** A green result for an old head is not a result for the current one.

Choices I made without asking (say if any is wrong):
- **It is an `mm` command (`mm ci`)**, in the task runner, which has no dependencies. GitHub is reached only through the `gh` already
  installed and logged in.
- **State is under `.mm/ci-watch/`, gitignored**, one directory per watch. It is local to one machine.
- **One pull request has one watch**, so two watchers of the same one cannot be started.
- **One owner per watch** (the chair). Anyone may read; only the owner acknowledges; ownership is handed over explicitly.
- **A watcher outlives the session that started it** and stops by itself: when the pull request is merged or closed, when asked, after
  eight hours, when the login is refused, or after eight failed polls in a row.
- **Skipped and neutral checks are not a pass**, "no checks seen" is not a pass, and "no required checks reported" is reported as that.

## Description
`mm ci start <pr>` takes a snapshot and starts a detached watcher that polls on an interval. Each meaningful change becomes a stored
event with a rising id. `mm ci events` returns the events after a reader's cursor at once; `mm ci ack` records that the owner has dealt
with them. `mm ci check <pr>` reads GitHub directly, storing nothing, for the moment before a merge. The full interface, the state
format, recovery and the handoff rules are in `agents/ci-monitoring.md`.

## Acceptance Criteria
```gherkin
Scenario: A change is kept before anything is told of it
  When a check changes state
  Then the event is on disk before any notification is attempted
  And a notification that fails loses nothing

Scenario: Reading does not wait
  When the chair asks for events
  Then it gets what is stored at once, and the same events again until it acknowledges them

Scenario: Nothing changed
  When a poll sees what the last one saw
  Then no event is stored

Scenario: A push
  Given the checks of the head commit passed
  When a new commit is pushed
  Then the old result no longer counts, and the snapshot is of the new commit only

Scenario: No checks
  Given no check has registered
  Then the summary says none, not passed

Scenario: Restart
  Given events the owner has not acknowledged
  When the watcher or the machine restarts
  Then those events are still returned

Scenario: Handing over
  When another chair takes the watch over
  Then it starts from the old chair's cursor, and the old chair can no longer acknowledge

Scenario: Another machine
  Given the local state is not there
  Then the watch is rebuilt from GitHub and says its earlier history is not known

Scenario: GitHub cannot be read
  When the login is refused
  Then the watcher records why, says what to do, and stops without retrying

Scenario: Before merging
  Then GitHub is read again directly, and a stored result is never the only basis
```

## Notes
- Regression tests: `tool/test/ci_watch_test.dart`, 54 tests against a simulated `gh` (`tool/test/support/fake_gh.dart`).
- Verified on Windows with `gh` 2.87.3, and from Claude Code in VS Code. **Copilot was not tested**; see the capability matrix in
  `agents/ci-monitoring.md`.
- Not built: a desktop notification, an MCP server, and anything that writes to GitHub.
