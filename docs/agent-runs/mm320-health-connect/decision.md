# Panel decision

The chair's outcome for every finding of the two reviews of Settings' Health Connect rows (MM-320,
2026-10-14), drawn in Storybook for the first time. The first pass failed the UX guard; the section was
rebuilt on Reminders' pattern and **the UX guard passed** the second. Both reviewers answered the sibling
question first.

## Findings and where each went

| Finding | Outcome |
|---|---|
| PD-1, UX-1 (note and button inside the card) | Built: Health Connect is its own `MmSection` between Reminders and Data, one card of rows, the note a caption under it; `.settings-inset` deleted. Test: "is its own section…". |
| PD-2 (Health Connect not named first) | Built: the section heading. |
| PD-3, UX-5 (rows lost their hairlines) | Bug MM-322, regression test `test/ui/listGroup.test.tsx` (failed before); `.mm-list-group > :not(:first-child)` after the row rule. The slider row's `border-top: 0` still wins (rendered with body fat on). |
| PD-4, UX-2 (Read now a button) | Built: the last row of the card. |
| PD-5 (an icon per kind) | Built: `healthDataTypeIcon`. |
| PD-6 (two text columns) | Bug MM-324, not this ticket's. |
| PD-7 (Height and Units share an icon) | Not built: the icon names the measure in both; recorded. |
| PD-8, UX-6 (no sign of a read) | Built: "Reading…" while it reads, presses ignored, a snack when done. Test. |
| UX-3 (focus dropped after allowing) | Built: a snack says "Weight allowed."; the row still stops being a button (consider, recorded). Test. |
| UX-4 (lock-out) | Story MM-323, waits on the plugin question. |
| UX-7 (Allowed heard twice) | Built: the check is a plain icon, hidden from the reader. Test. |
| UX-8 (states with no story) | Built: Nothing Yet, All Allowed, Allowing, Read Done (ten Health Connect stories). |
| UX-9 (the note's length) | Resolved by UX-1; the words stand (MM-68). |
| UX-10 (snack not in the frame) | The capture tool takes the frame after the snack has gone; the stories' test finds the words on the drawn page. Recorded. |
| UX-11 (allow, then a failed read) | Built: "Weight allowed, but Health Connect could not be read just now…". Test. |
| UX-12 ("Reading…" may not be heard) | Not built: the closing snack says the outcome; `MmListRow` has no busy state. Recorded. |
| UX-13 (absent row says it twice) | Built: "Health Connect is not on this phone" / "Nothing to connect. Everything in the app works without it." |

## Verification
Renders at 412 by 915 from the static Storybook: None Allowed (Martian, Light), Some Allowed (Light, Dark),
Absent (Martian, Light), Read Done, Measured Body Fat, Settings, Workout Times, the Dashboard.
`test/settings/healthConnect.test.tsx` 18 passed; the stories' test; `mm check` (see the handoff). Not looked
at: the phone, TalkBack.

## Process notes for the next run
- The Health Connect rows were never drawn because the stories' health platform was empty. MM-321 makes the
  stories' reach a check: markup no story draws fails `mm check` unless the register names it with a reason.
