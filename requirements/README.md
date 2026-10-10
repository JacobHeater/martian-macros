# Summary

Think of this folder as a ticketing system like Jira.
This folder defines all the components of the system
and defines the stories, tasks, bugs, epics, etc., that
are necessary to define the functionality of each of the
components of Martian Macros (MM).

## The handoff document

[HANDOFF.md](HANDOFF.md) is not a ticket. It is the living summary every
agent keeps of the three most recent sessions and the current state of the
work (MM-174). It and this README are the only files allowed at the top of
this folder.

## Folder Structure

Each folder represents a component of Martian Macros. Inside each
folder shall be a set of files in this notation.

- Story => STORY.{brief-description-here}.{short_id}.md
- Task => TASK.{brief-description-here}.{short_id}.md
- Bug => BUG.{brief-description-here}.{short_id}.md
- Epic => EPIC.{brief-description-here}.{short_id}.md
- Spike => SPIKE.{brief-description-here}.{short_id}.md

If you're going to contribute to the functionality of a given
section of the app, you will do by FIRST defining a ticket in
the folder that you are working on. That must be one of the artifacts
submitted _with_ your pull request. Any pull request without
this will be rejected.

If a piece of already-implemented functionality doesn't have a
matching component folder, create the folder (kebab-case, named for
the feature/experience, not necessarily the package name) and
write a ticket documenting the current behavior before moving on.
Missing a folder for shipped functionality is itself a gap to close,
not something to leave undocumented.

## Ticket ID (short_id)

Every ticket has a **short_id**: the project key `MM`, a hyphen, and a
number from one sequence shared by the whole repository (`MM-1`,
`MM-2`, ...). Numbers are never reused, even if a ticket is deleted,
and they carry no meaning beyond order of creation.

The short_id is the ticket's identity. It appears in two places that
must agree: the last segment of the filename, and the `id` field in
the frontmatter.

- **To get the next id**, run `mm req next`.
- **To refer to a ticket**, use its short_id and nothing else, in
  `related` and in prose ("see MM-42"). Never refer to a ticket by its
  filename or path: the description part of a filename may be reworded
  and a ticket may move to another component folder, and neither
  breaks a reference by id.
- **To find a ticket's file**, run `mm req show MM-42`.
- **To check the whole folder**, run `mm req`. It fails on a malformed
  filename, a duplicate id, an id that disagrees with the filename, a
  `component` that disagrees with the folder, an unknown `status`, or a
  `related` id that doesn't exist. `mm check` runs it, so CI does too.

Two branches can take the same next number. `mm req` reports the
duplicate when they meet; the later branch renumbers its ticket (a new
ticket has nothing referring to it yet, so this is cheap).

## Tracking completion status (do not rename files to do this)

A ticket's status lives **inside the file, in frontmatter** — never in
the filename, and a completed ticket is never moved to a "done"
folder. Renaming or moving a file is a `git mv`, and while Git *can*
follow renames (`git log --follow`), it's a similarity heuristic, not
a guarantee, and plain `git log <path>` (and most tools' default file
history view) silently stops at the rename point. A stable path that's
only ever edited in place has none of that fragility — every default
git/GitHub view just works, forever, for that one file.

Status (and the other header fields) go in YAML frontmatter at the top
of the file, not a bold markdown line, so `mm req` can build a status
board by parsing frontmatter across every ticket instead of scraping
prose:

```yaml
---
id: MM-{n}
status: proposed | in-progress | done
component: { component-folder-name }
related: [ { short_ids of tickets this depends on or informs } ]
---
```

`status` is a lightweight field, not a full board — `proposed` for
not-yet-built, `in-progress` while active, `done` once shipped. A
`done` ticket for already-implemented functionality is still valuable:
it's the record of what was decided and why, so it doesn't get
silently re-litigated or re-broken later.

`mm req list` prints the board; `--status` and `--component` filter it.

## Ticket Template

Every ticket (Story, Task, Bug, Spike) follows this shape. Epics use
the same frontmatter but a narrative body instead of Gherkin (see
below).

```markdown
---
id: MM-{n}
status: proposed | in-progress | done
component: { component-folder-name }
related: [ { short_ids, if any } ]
---

# {Story|Task|Bug|Spike}: {Title}

## Context
Why this exists — background, prior decisions, links to relevant code
paths. For retroactively-documented (already-shipped) tickets, this is
where the "why we built it this way" history belongs, especially if
an earlier approach was tried and rejected.

## Decisions
Optional. Decisions made with the product owner, and separately,
choices the author made without asking (so they are easy to overrule).

## Description
What needs to be true when this is done (Story/Task/Bug), or what
question needs answering (Spike).

## Acceptance Criteria
\`\`\`gherkin
Scenario: ...
  Given ...
  When ...
  Then ...
\`\`\`

## Notes
Optional: implementation notes, explicitly out-of-scope items, open
questions. For a `done` ticket, what was built, where, and how it was
verified — including anything that was *not* verified.
```

## Acceptance Criteria

All acceptance criteria associated with any ticket that
has acceptance criteria, which is all of them, shall be written
in Gherkin syntax, except for Epics, whose ACs shall be written
in narrative format.
