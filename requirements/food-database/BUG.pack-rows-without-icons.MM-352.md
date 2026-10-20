---
id: MM-352
status: done
component: food-database
related: [MM-346, MM-253]
---

# Bug: the food database's rows carry no icon, and its Light notice has no edge

## Context
Found by the panel's product designer reviewing MM-346 (2026-10-16). On the food database screen,
"Nothing downloaded yet" and each installed pack's row have no leading icon, against rule 2 of the screen
direction (every list row carries one). In Light, the notice in the Download group ("… is on your phone.")
is white on the canvas with no hairline, beside list groups that have one.

## Description
The screen's rows carry icons by meaning, and its notice stands apart from the canvas in Light as its
siblings do.

## Acceptance Criteria
```gherkin
Scenario: The food database screen
  When it is opened
  Then every row of "On this phone" has a leading icon
  And in Light the notice in the Download group is told apart from the canvas
```

## Notes
Not yet guarded. A design fix through Storybook and the panel.

## Fix (2026-10-19)
The rows of "On this phone" carry icons by meaning: `download` for "Nothing downloaded yet", `document` for an installed pack (`test/settings/foodDatabase.test.tsx`). The notice in the Download group no longer exists in that form (MM-346 restructured the screen), but every `Notice` now carries the hairline the list groups beside it have (`ui.css`, guarded in `test/ui/listRowColumn.test.ts`), so it stands apart from the canvas in Light. Reviewed in `docs/agent-runs/m2-design-bugs`.

## Decisions after the panel (2026-10-19)
- The hairline holds on the canvas and is dropped for an info notice drawn as a well of a sheet or dialog, where a rim on a sunken surface reads as a raised card (the designer's PD-1); `design/screen-direction.md`'s notice table now says so.
- "Nothing downloaded yet" carries `info`, as the screen's other empty row does (PD-7); `document` for an installed pack.
- The notice's 12 px radius against the groups' 16 px (PD-2) is left for the owner's word; `.mm-surface-compact` is the precedent for keeping it.
