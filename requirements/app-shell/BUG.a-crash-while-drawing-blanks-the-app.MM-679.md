---
id: MM-679
status: in-progress
component: app-shell
related: [MM-333, MM-334, MM-677]
---

# Bug: a crash while drawing blanks the whole app, with no words

## Context
The owner, 2026-10-28, on the phone: the app opened to a dark, empty screen. A service had been wired to the wrong
object in MM-677's build, so the first subscription to it threw while the Dashboard drew. React drops the whole tree
on an uncaught render error, and nothing in the app catches one: `main.tsx` catches only a failure to open the data
(MM-333), and `ReadFailedNotice` covers only a read that fails (MM-334). The person saw nothing and had no way to know
why. The owner: "the app is broken and the user doesn't even know why."

## Description
A crash while drawing is caught and said in words, in the app's own notice, never a blank screen: what happened,
that nothing logged has been changed, and a way on ("Try again", which draws again; failing that, close and reopen).
The error goes to the console for whoever debugs it, never to the person (MM-333).

## Decisions
Choices made without asking (say if any is wrong):
- **One boundary component, `CrashBoundary`**, used twice: inside `App` around everything it draws, so the notice has
  the theme and the person's words; and in `main.tsx` around `App` itself, so a crash in the app's own root is still
  said, unthemed rather than blank.
- **The notice is `ReadFailedNotice`'s shape** (MM-334): a neutral notice headed "Something went wrong while drawing
  this", "Nothing you logged has been changed.", a Try again that draws again, and "If it keeps happening, close the
  app and open it again." Announced as an alert.

## Acceptance Criteria
```gherkin
Scenario: A screen throws while drawing
  Given a screen that throws when drawn
  When the app draws it
  Then the app shows "Something went wrong while drawing this" with "Nothing you logged has been changed."
  And the error's own words are not on the screen

Scenario: Try again
  Given the notice after a crash that does not recur
  When Try again is pressed
  Then the app draws again and the notice is gone
```

## UI/UX
- The crash notice — apps/mobile/src/gallery/screens/Today.stories.tsx (Story: CrashWhileDrawing).

## Notes
Guarded by `apps/mobile/test/app/crashBoundary.test.tsx`, which fails without the boundary (the render throws).
