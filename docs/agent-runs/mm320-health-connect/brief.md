# Run brief

- **Task ID and requested outcome:** `mm320-health-connect`. The owner, 2026-10-14, with a screenshot of
  Settings' Data section on the phone: "this atrocity of padding". Its Health Connect rows had never been
  drawn in Storybook (MM-320). Outcome: the Data section with Health Connect laid out like its siblings,
  reviewed from renders of every state, an outcome for every finding.
- **Audit mode:** `change`: the Data section of `SettingsScreen` and `HealthConnectSection`, and their
  stories. Not in scope: the wording of the rows' purposes, the Food database screen.
- **For a new section, row or control: its nearest siblings on the same screen** (rule 9 of
  `design/screen-direction.md`): `RemindersSection` (`apps/mobile/src/settings/RemindersSection.tsx`), whose
  note is a caption below its card; the other sections of `SettingsScreen` (each an `MmSection` holding one
  `MmListGroup` of rows). **The question every design reviewer answers first: does the Data section look
  and behave like its siblings on Settings, and where it does not, what should change?** As drawn, the
  note "The app only reads…" and the "Read from Health Connect now" button sit inside the card, between
  hairlines, at the card's edge (16 px) where the rows' words start past their icons, with "Stored only on
  this device" below them in the same card.
- **Baseline:** `fix/unseen-states` (stacked on `feature/water-sodium-micronutrients`, PR #159) plus the
  working tree.
- **Requirements:** MM-320 (this), MM-68 (connecting Health Connect), MM-259 (Settings in sections), MM-321.
- **Existing facts and owner decisions:** The app only reads from Health Connect; each kind is allowed by
  itself; the note's words stand (MM-68). Settings is sections of rows (MM-259).
- **Renders supplied** (412 by 915, static Storybook, in the chair's scratchpad `shots7`): Health Connect
  None Allowed (Martian, Light), Some Allowed (Dark), Woman (Martian), Refused (Martian), Read Failed and
  Absent (Martian). The stories are in `apps/mobile/src/gallery/screens/Settings.stories.tsx`.
- **Roles:** product-designer (sameness with the siblings, hierarchy) and ux-accessibility (the UX guard).
- **Omitted roles:** chair (the parent session chairs and owns the edits); training, nutrition, coaching,
  measurement, safety (a layout change; no health rule, advice, measurement or engine change).
- **Writer:** the parent session (Claude Opus 5.5), single edit owner. Reviewers are read-only.
