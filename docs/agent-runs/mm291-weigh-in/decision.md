# Panel decision

The chair's outcome for every finding of the two reviews of the proposed
weigh-in row and "Split" (2026-10-14). The panel advises; the owner
decides. **The UX guard passed** (no blocking finding); the product
designer approved with changes, and both of its blocking findings were
documentation, fixed in this change.

## Findings and where each went

| Finding(s) | Outcome |
|---|---|
| Row in the group vs a card, the hero, a sheet (PD, alternatives) | Accepted: the row in the group, built (MM-291). A sheet stays the fallback if the field cannot be kept in the first viewport (see PD-5). |
| PD-1, UX-5 (the direction still says "Share") | Built: rule 4 and the register row in `design/screen-direction.md`, MM-254's Progress, `CalorieHero` comments say "Split". The Session 24 entry in `HANDOFF.md` is history and is left as written. |
| PD-2 (rule 1 prescribes bare canvas sections) | Built: rule 1 says anything holding a control sits on a surface, a bare section carries read-only rows only; `hierarchyProblems` fails a bare field, and the Not Weighed Today story is checked with the destinations. |
| PD-3, UX-7 (disabled Save reads as a field in Light) | Ticket MM-297 (proposed): a design-system change in every palette, to be drawn in the States story and passed by the panel first (MM-293). |
| PD-4 (screen-local override of the row) | Built: `MmListRow entry`, the row variant in `ui.css`; `dashboard.css` no longer touches the row; the span-around-div nesting is gone. |
| PD-5, UX-9a (below the fold at 360 by 740) | Confirmed by a render: at 360 by 740 the hero and strip fill the frame and the row starts under the fold. Owner decision (see Open), not built. |
| PD-6 (the streak bare on the canvas) | Built: `ProcessCard` is the last row of the Dashboard's group. |
| PD-7, UX-9b (an empty weigh-in row on a weighed day with no trend yet) | Pending investigation: unverified; recorded in `state.json` pending work. |
| PD-8 (rhythm around the strip) | Pending: a spacing pass for WS-03 step 11, drawn in the story first. |
| PD-9 (unequal segments) | Built: `.mm-segmented` lays its segments in equal columns; the Pause reasons, recovery scales and set editor were looked at after. |
| UX-1, UX-4 (save says nothing; the number typed disappears) | Built, MM-294: the snack (a polite status) says "Saved 184.2 lb for today". The trend row keeps the trend; the bounded question below is still open. |
| UX-2 (hint not heard) | Built, MM-295: the hint's id is in the field's `aria-describedby` (`MmTextField describedBy`). |
| UX-3 (Enter does not save) | Built, MM-296: `MmTextField onSubmit`, `enterKeyHint="done"`; only a savable value. |
| UX-6 (group name "Macro picture") | Pending: the heard name, decided with MM-288's wording pass. |
| UX-8 (no stories for the row's typed and error states) | Pending: state stories for `NumberEntry` in a row. |
| QA note (MM-291 named a test file that did not exist) | Built: MM-291 names `test/dashboard/dashboard.test.tsx`. |

## Open (owner)

- At 360 by 740 the weigh-in row is below the fold on a morning before the
  weigh-in. Options: the group before the rhythm strip on such a morning;
  a smaller hero; or the sheet fallback. Not decided by the chair.
- Bounded requests to coaching and measurement (both reviewers): should
  the row show the last trend before the weigh-in, and should it show
  today's raw entry after? Built meanwhile: neither; the snack confirms the
  number typed.

## Verification

Renders after the build: Not Weighed Today in Martian, Light and Dark at
412 by 915 and Martian at 360 by 740; the demo Dashboard; Pause, Recovery
check-in, Workout in progress and the States story for the segment
change. The tests named in MM-290, MM-291, MM-294, MM-295, MM-296 failed
on `main`'s source and pass on the branch. The chair is also the edit
owner, so its view of the result is not independent.

## Process notes for the next run

- The reviewers were briefed in their prompts; `brief.md` was written
  from those prompts after the reviews, so its hash in `state.json` is of
  the written brief, not of a file they read.
- The chair's prompts did not ask for the findings template, so the
  reports were arranged under its headings afterwards and say where a
  section was not addressed. Next time the prompt names the template
  (`agents/templates/findings/role.md`) and the run is created first.
