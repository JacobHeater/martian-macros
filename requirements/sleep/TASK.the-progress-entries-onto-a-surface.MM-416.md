---
id: MM-416
status: proposed
component: sleep
related: [MM-250, MM-155, MM-291, MM-257]
---

# Task: the Progress entries onto a surface, or the exception written

## Context
The panel's product-designer review of MM-250 (PD-1, `docs/agent-runs/mm250-sleep`)
found that the Sleep section's fields and Save sit bare on the canvas inside
an open `MmSection`, which screen-direction rule 1 as amended by MM-291
forbids ("anything that holds a control sits on a surface"); `hierarchyProblems`
encodes the rule but the hierarchy test runs only the destination stories, in
which Sleep is folded. The Waist section (MM-155, MM-257) has done the same
since before this change, so rule 9 was met (the sibling was copied) while
rule 1 was not. The reviewer's instruction under rule 9 is to ask whether the
sibling is right rather than copy it; the UX guard found no blocking issue in
the entry itself. The owner decides.

## Decisions
Owner's decision wanted: are fields inside an open Progress section an
accepted exception (Waist today, Sleep now), to be written into
`design/screen-direction.md`, or do both entries move onto a surface?

## Description
Either both the Waist and Sleep entries on Progress are drawn as an
`MmListGroup` holding one `MmListRow entry` (the pattern of the Dashboard's
weigh-in and waist rows, MM-291, MM-301), or the exception is written in
`design/screen-direction.md` with its reason and `hierarchyProblems` is taught
it. In both cases the hierarchy test runs the open-state stories
(`SleepNotRecorded`, `SleepFromWatch`, `SleepMistyped`, and a Waist one), so
the rule is checked where the controls show.

## Acceptance Criteria
```gherkin
Scenario: The rule holds where the controls show
  Given the Sleep and Waist sections open on Progress
  When the hierarchy check runs over their stories
  Then no bare field is reported, or the written exception names them
```

## Notes
Also from the review, for the same pass: whether the fortnight of chips should
sit before or after the fields (PD-3), whether chips carry their hours (PD-3b,
PD-5), the folded recovery line's length (PD-10), the Progress group budget in
`design/design-map.json` (PD-12), and a device pass with TalkBack and
VoiceOver over the chips' "·", "h" and "m" (F8). Not bugs; the owner's and the
designer's calls after a render in the three palettes.
