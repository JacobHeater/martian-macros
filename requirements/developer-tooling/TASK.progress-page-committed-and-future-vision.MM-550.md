---
id: MM-550
component: developer-tooling
status: done
related: [MM-166, MM-245]
---

# Task: the progress page tells committed work from future vision

## Context
The owner (2026-10-21), looking at the progress page's "The application, by area" section: "I want to separate items out
that are above the cut and below the cut for committed and future vision." Since 2026-10-21 the release gates (the Coach
unlock, the store release, the professional and legal sign-offs) sit in M5, a milestone the owner keeps as future vision:
not scheduled, built only if they decide to release. Counted together with the committed work, those tickets make areas
such as monetization and release look stalled when they are only parked.

## Decisions
Choices I made without asking (say if any is wrong):
- **A milestone is future vision by a flag in `roadmap.json`** (`"futureVision": true`), not by its id, so the page needs
  no change if the milestones are renumbered. M5 carries it.
- **A ticket is future vision when every milestone that lists it is future vision.** A ticket in no milestone, or in
  any committed one, counts as committed.
- **The split is worked out in `roadmapPageData`**, where it is tested, and the page only draws it: "Committed" first,
  then "Future vision (not scheduled)", each with its own rows and bars by area. An area appears in each group it has
  tickets in.
- **The milestone card of a future-vision milestone says so** in its tag.
- **The release gates are filed under `release`** (the owner, 2026-10-21: a clinician's review and the terms' legal pass showed
  as "adaptive coach" and "app shell" below the cut). MM-29, MM-242 and MM-453 moved from `adaptive-coach` and
  `app-shell` to `requirements/release/`, so only monetization and release sit below the cut.

## Acceptance Criteria
```gherkin
Scenario: The areas are split at the cut
  Given M5 is marked future vision and holds the monetization tickets
  When the progress page is drawn
  Then "Committed" lists the areas from the committed tickets only
  And "Future vision (not scheduled)" lists the areas of the tickets only M5 holds

Scenario: A ticket in a committed milestone stays committed
  Given a ticket listed by M3 and by M5
  Then it counts under "Committed"

Scenario: Without a future-vision milestone the page is as before
  Given no milestone is marked future vision
  Then the areas show in one list, as before
```

## Progress
- 2026-10-21: built. `roadmapPageData` gives `futureVision` (the ticket ids); the template draws two groups and tags the
  milestone. Guarded by `tool/test/roadmapPageData.test.ts` ("future vision is the tickets only future-vision
  milestones hold", "with no future-vision milestone, nothing is future vision").
