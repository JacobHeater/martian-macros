# Review: product-designer

Reviewer: product-designer role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm320-health-connect`; baseline `d4d6eae` plus the working tree. Saved by the chair, condensed. Two passes:
the section as drawn, then as built.

## Scope and traceability
Read MM-320, rule 9 and the Settings direction of `design/screen-direction.md`; `HealthConnectSection`,
`SettingsScreen` (Data), `RemindersSection`, `settings.css`, `MmListRow`, `MmSection`, `MmIconName`, the list
rules of `ui.css`. Five renders, then eight after the build. No hashes (no shell).

## Existing facts versus proposals
Every Settings section is a heading, one card of rows, and a note as a caption under the card (Reminders).
Data held three kinds of thing in one card, with a paragraph and a full-width button inside it at the card's
edge (16 px) where the rows' words start at 56 px.

## Audit coverage
Mode change. Not inspected: the Read Failed render, the wording of the purposes, the Food database screen.

## Novice mobile experience (when UX/product design is assigned)
"Let the app read my scale": nothing names Health Connect before the paragraph under the rows, and seven
identical `sync` icons say nothing (PD-2). After the build, the heading names it first: passes.

## Findings
- **Answer first (pass 1): no.** **(Pass 2): yes**, Health Connect looks like its siblings on the whole screen.
- **PD-1 (blocking).** The note and button inside the card at its edge. Health Connect its own section as
  Reminders: rows in one card, the note a caption under it.
- **PD-2 (should-fix).** Health Connect not named before the rows. Solved by the section heading.
- **PD-3 (should-fix).** Rows straight in a group lost their hairlines (`.mm-list-row { border: 0 }` won).
- **PD-4 (should-fix).** "Read from Health Connect now" as an outlined button is the heaviest thing on
  Settings; make it a row.
- **PD-5 (consider).** An icon for each kind instead of seven `sync`.
- **PD-6 (should-fix, own ticket).** Rows with an action start their words 4 px further left.
- **PD-7 (consider, pass 2).** Height (Health Connect) and Units share the set-square icon.
- **PD-8 (pass 2, for the UX guard).** A successful read's sign.
- Pass 2 risk: the slider row's `border-top: 0` against the new divider rule; render with body fat on.

## Sources and evidence
None external.

## Research
Unnecessary: a sibling-consistency judgement against the repository's own rules.

## Confidence and limitations
High for PD-1, PD-3, PD-6 (cascade and renders); medium for PD-2, PD-4; low for PD-5.

## Acceptance criteria and edge cases
The note a sibling after the group, level with the heading's words; the card holds only rows; a divider
between any two rows in every palette.

## Dependencies
Chair: whether the app reads Health Connect by itself (Read now placement).

## Safety concerns
None.

## Unresolved product decisions
None.

## Verification
Source and render inspection only.

## Targeted challenges
None.
