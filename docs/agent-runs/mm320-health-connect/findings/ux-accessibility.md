# Review: ux-accessibility (the UX guard)

Reviewer: ux-accessibility role, read-only subagent of the parent session acting as chair, 2026-10-14. Run
`mm320-health-connect`; baseline `d4d6eae` plus the working tree. Saved by the chair, condensed. Two passes:
the section as drawn (fail), then as built (pass).

## Scope and traceability
Read MM-320, rule 9; `HealthConnectSection`, `SettingsScreen` (Data), `RemindersSection`, `settings.css`,
`MmListRow`, the list rules of `ui.css`, the snack in `MmOverlays`, `test/settings/healthConnect.test.tsx`,
the new stories and `healthPlatform`. Five renders, then seven. No hashes.

## Existing facts versus proposals
The note and button sat inside the Data card, between hairlines, at the card's edge; "Stored only on this
device" was heard after the note, cut off from the Data rows.

## Audit coverage
Mode change. Not inspected: TalkBack, contrast, text scaling, the Food database screen; on pass 2 the new
tests and stories were taken from the chair's summary.

## Novice mobile experience (when UX/product design is assigned)
Allow weight: the pressed row stops being a button, focus drops, nothing heard (UX-3). Refuse: a snack, but
after Health Connect stops asking, "allow it here" goes in a circle (UX-4). Read now: no sign of success
(UX-6). A failed read: passes.

## Findings
- **Answer first (pass 1): no. UX guard: fail.** **(Pass 2): yes. UX guard: pass.**
- **UX-1 (blocking).** The note inside the card; give Health Connect Reminders' shape.
- **UX-2 (blocking).** The only button inside a Settings card; make Read now a row.
- **UX-3 (should-fix).** Allowing removes the focused button; say what happened.
- **UX-4 (should-fix).** Lock-out after repeated refusals ("permission requests will no longer appear", the
  Health Connect codelab, read 2026-10-14).
- **UX-5 (should-fix).** Rows in a group have no hairlines (= PD-3).
- **UX-6 (should-fix).** Read now: no busy state, no sign of success.
- **UX-7 (consider).** "Allowed" heard twice (the check's label repeats the subtitle).
- **UX-8 (should-fix).** States with no story: allowed with nothing to read, every kind allowed, a successful
  allow, a successful read.
- **UX-9 (consider).** The 70-word note reads better as a caption under its own section.
- Pass 2: **UX-10** (a snack not in the captured frame), **UX-11** (an allow whose first read fails never
  says "allowed"), **UX-12** ("Reading…" inside the focused button may not be read), **UX-13** (the absent
  row's title and subtitle say the same thing); all consider.

## Sources and evidence
[Your First Health Connect Integrated App](https://developer.android.com/codelabs/health-connect), read
2026-10-14.

## Research
Performed for UX-4: whether Health Connect stops asking after repeated refusals. Confidence medium.

## Confidence and limitations
High for UX-1, UX-2, UX-5; medium for UX-3, UX-6. Code and renders only, no assistive technology.

## Acceptance criteria and edge cases
No Health Connect element inside a group but rows; the note level with Reminders' caption in three palettes.

## Dependencies
react-capacitor: can the plugin tell a refusal from a lock-out, and open Health Connect's permissions.

## Safety concerns
None. The note's privacy and how-to-stop words stay visible.

## Unresolved product decisions
None.

## Verification
Nothing executed.

UX guard: pass

## Targeted challenges
None.
