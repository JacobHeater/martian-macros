---
id: MM-6
status: done
component: developer-tooling
related: [MM-1, MM-2]
---

# Task: The requirements tracker command

## Context
Requirements are tracked as files in `requirements/`, in the manner of the Good Stuff DS Game Maker repository, with one change: every
ticket has a short_id. Ids are only useful if they are unique and references to them resolve, and nobody checks that by hand.

## Decisions (made with the product owner)
- **The short_id is `MM-<n>` from one sequence for the whole repository.**
- **Tickets refer to each other by short_id only**, never by filename.

Choices I made without asking (say if any is wrong):
- **The id is also in the frontmatter (`id:`)**, so a ticket read on its own says what it is; the tracker checks it against the filename.
- **`mm check` runs the tracker**, so a broken reference fails CI like a failing test.

## Description
- `mm req` validates the folder and prints a board of tickets per component and status, and the next free id.
- `mm req list [--status S] [--component C]` lists tickets.
- `mm req next` prints the next unused id.
- `mm req show MM-42` prints a ticket's path.

A ticket is invalid when: its filename is not `TYPE.brief-description.MM-<n>.md`; it has no frontmatter; its frontmatter `id` differs from
the filename; its `component` differs from its folder; its `status` is not `proposed`, `in-progress` or `done`; a `related` entry is not a
short_id, is the ticket itself, or does not exist; or two tickets share an id. A file directly under `requirements/` other than the README,
and a component folder that is not kebab-case, are also reported.

## Acceptance Criteria
```gherkin
Scenario: A valid folder
  When "mm req" is run
  Then it prints the board and the next id, and exits 0

Scenario: A dangling reference
  Given a ticket whose related list names an id no ticket has
  When "mm req" is run
  Then it names the ticket and the missing id, and exits non-zero

Scenario: Two branches took the same number
  Given two tickets with the same short_id
  When "mm req" is run
  Then it names both files

Scenario: Finding a ticket
  When "mm req show MM-6" is run
  Then it prints this file's path
```

## Notes (built and verified)
- `tool/src/requirements.dart`. Frontmatter is read with a small hand parser (the runner has no dependencies), which understands
  `key: value` lines and a flow list such as `[MM-1, MM-2]`; block-style YAML lists are not supported.
- Verified by running it over this folder. The failure paths were exercised by hand, not by an automated test.
