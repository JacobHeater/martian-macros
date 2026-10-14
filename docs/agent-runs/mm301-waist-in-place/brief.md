# Run brief

- **Task ID and requested outcome:** `mm301-waist-in-place`. The owner,
  looking at the Dashboard on his phone (2026-10-14): rows that are windows
  into a measurement should let him record it without another screen, the
  waist among them, and the confirmation should offer to take him to see
  it in the other screen. Outcome: the proposal drawn in stories, reviewed
  by the panel (MM-293), an outcome for every finding, then the build.
- **Audit mode:** `change`: the Dashboard's waist row (MM-301), its
  confirmation snack, and the weigh-in confirmation (MM-294) gaining the
  same action. Components composed: `MmListRow entry`, `NumberEntry`,
  `MmTextField`, `MmButton`, the snack (`Overlays.snack`, MM-272).
  Unreviewed: the Android shell, any device.
- **Existing facts (chair, before the review):** before this change the
  waist row only opened Progress ("No waist measurement yet · Waist ·
  measure it in Progress"). Progress takes one reading or three and keeps
  the middle (MM-155, `WaistEntryCard`); one reading is kept as it is and
  counted noisier (`WaistRule.singleReadingNoiseCm`). The weekly
  measurement reminder treats a measurement as current for 7 days
  (`ReminderRule.measurementEveryDays`). A snack with an action waits for
  its action, the next snack or a dismissal (MM-272).
- **The proposal reviewed** (requirements/dashboard MM-301,
  `apps/mobile/src/dashboard/WaistRow.tsx`, `DashboardScreen.tsx`,
  `progress/saveWaistReadings.ts`):
  - With no waist measurement in the last 7 days, the waist row is an
    entry row like the weigh-in: tape icon, "Waist", a line ("Last 37.0 in
    · Sat, Oct 3", or "Once a week is enough" before the first), one field
    in the length unit, Save, and the hint "Tape level with the navel,
    snug, breathe out normally."
  - One reading is kept as it is. The three-reading protocol stays in
    Progress.
  - A value outside 30–300 cm is refused with "That value looks off. Check
    it." under the field (the same rule as Progress, now one function).
  - On save: the snack "Saved 36.0 in waist for today" with the action
    "Open Progress"; the weigh-in's snack gains the same action.
  - Measured within 7 days: the row shows the value and opens Progress,
    as before.
- **Roles:** product-designer (visual hierarchy, design system),
  ux-accessibility (the UX guard: the build waits on no open blocking
  finding), measurement (one reading on the Dashboard vs three in Progress;
  the 7-day window).
- **Evidence given to the reviewers:** captures at 412 by 915 in the
  scratchpad (Screens/Today: Not Weighed Today, Waist Due, Dashboard in
  Martian, Light and Dark, and the lower half of Not Weighed Today and
  Waist Due), the ticket and the source paths.
- **Findings template:** `agents/templates/findings/role.md`; reports go
  to `findings/<role>.md` in this folder.
- **Omitted roles** (the reasons as recorded in `state.json`):
  - chair: The parent session chairs and owns the edits; its synthesis is decision.md, with no separate chair review.
  - training: An entry row, its wording and the snack on the Dashboard over an approved measurement model (MM-155); no health rule, target, coaching message or engine change.
  - nutrition: An entry row, its wording and the snack on the Dashboard over an approved measurement model (MM-155); no health rule, target, coaching message or engine change. ME-1 asks whether a rarer masked stall is acceptable; recorded as an unresolved question, not convened.
  - coaching: An entry row, its wording and the snack on the Dashboard over an approved measurement model (MM-155); no health rule, target, coaching message or engine change.
  - safety: An entry row, its wording and the snack on the Dashboard over an approved measurement model (MM-155); no health rule, target, coaching message or engine change. ME-1 and the PD body-checking question are recorded as unresolved, not convened.
