---
id: MM-291
component: dashboard
status: done
related: [MM-254, MM-253, MM-292, MM-257]
---

# Bug: the Dashboard's weigh-in floats on the canvas with no padding

## What the owner found

On the phone (2026-10-14), on a morning with no weigh-in yet, the
Weigh-in section drew its field and Save bare on the canvas, indented
under the heading, with the hint below and the waist card touching the
hint. Everything around it sits in a card, so the field read as
misaligned and unpadded. Once saved, the weight becomes a row in the card
below, so the two states of the same thing did not even live in the same
place.

## The fix

The weigh-in asks in the same place it answers: the first row of the
Dashboard's list group, with the scale icon, "Weigh-in" and the hint
in the row's own padding, and the field and Save beneath on the row's
text column. Once saved, the weight row takes that slot. Nothing that
holds a field sits bare on the canvas; `hierarchyProblems` fails a screen
that draws one. The row is `MmListRow`'s `entry` variant, so no screen
restyles a row. The panel's pass also moved the streak (`ProcessCard`),
a lone row on the canvas, into the group as its last row (PD-6).

## Regression test

- `test/dashboard/dashboard.test.tsx` ("asks for the weigh-in in the first
  row of the list group"): the field is in the group's first row with the
  waist row, and the trend row answers in the same slot; failed before the
  fix.
- `test/gallery/hierarchy.test.tsx`: the rule fails a bare field on a
  built fragment, and the Not Weighed Today story keeps it.

## Acceptance criteria

```gherkin
Scenario: The weigh-in asks inside the card
  Given no weigh-in today
  When the Dashboard opens
  Then the weight field, Save and the hint are in the first row of the list group
  And the waist row follows in the same group

Scenario: Saving puts the answer in the same slot
  Given the weigh-in row
  When 184.2 is saved
  Then the first row of the group shows the trend weight

Scenario: No bare field
  Given any destination story
  Then no text field sits outside a card, the hero, a list group or a sheet
```

## UI/UX

Storybook: Screens/Today/Not Weighed Today (before and after are in
`docs/agent-runs/mm291-weigh-in/`).

## Progress

Built 2026-10-14 (Session 25), through Storybook and the panel first (`docs/agent-runs/mm291-weigh-in/`).
