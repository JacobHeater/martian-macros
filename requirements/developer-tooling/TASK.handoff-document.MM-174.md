---
id: MM-174
status: done
component: developer-tooling
related: [MM-1, MM-6, MM-166]
---

# Task: A handoff document every agent keeps, so work can change hands

## Context
The product owner works with AI agents from more than one vendor and switches between them when one runs out of credits. Each agent
keeps its own private notes, which the next one cannot read. What an agent learned in a session (what is in flight, what the owner
has ruled, what was and was not verified) was lost at every switch, and the owner had to say it again.

The tickets and the roadmap record what the product should do and in what order. Neither records the state of the work this week.

## Decisions
The product owner's rule:
- **Every agent, whatever its vendor, maintains one handoff document under `requirements/`.**
- **It is a living Markdown file that sums up the latest changes in the three most recent sessions**, rolling: a new session pushes
  the oldest out.

Choices I made without asking (say if any is wrong):
- **The file is `requirements/HANDOFF.md`**, beside the README, since it belongs to no one component.
- **It opens with the state of things, not the history**: what is in flight, what to do next, what the owner is waiting to decide,
  and the standing working rules the owner has given that are not in `AGENTS.md`. Then the three sessions, newest first, each under a
  `## Session` heading.
- **A session is one sitting with one agent**, from when the owner starts it to when it ends or its context is cleared. The heading
  carries the date and which agent wrote it.
- **It is updated in the same pull request as the work**, and again at the end of a session, so a session that ends without warning
  (credits running out) still leaves it close to true.
- **It holds nothing private**: no credentials, no personal data, no health data. It is checked in.
- **`mm req` enforces what it can**: the file must exist and hold between one and three `## Session` sections. Whether it is true is
  for the agent and the reviewer.

## Description
`requirements/HANDOFF.md`; a rule in `AGENTS.md`; `mm req` (and so `mm check` and CI) fails when the file is missing, has no session,
or has more than three.

## Acceptance Criteria
```gherkin
Scenario: A new agent picks up the work
  Given an agent that has never seen this repository
  When it reads AGENTS.md
  Then it is told to read requirements/HANDOFF.md before working and to update it before finishing

Scenario: The document is missing
  Given requirements/HANDOFF.md does not exist
  When mm req runs
  Then it fails and names the file

Scenario: A fourth session
  Given the document holds three sessions
  When a fourth is added without removing the oldest
  Then mm req fails and says to drop the oldest

Scenario: It is not a ticket
  Given requirements/HANDOFF.md exists with one to three sessions
  Then mm req does not report it as a misplaced ticket
```

## Notes
- Tests: `tool/test/handoff_test.dart`.
- The first version was written by reconstructing two earlier sessions from the pull requests and the commit history, and says so.
