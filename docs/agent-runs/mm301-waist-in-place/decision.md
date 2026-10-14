# Panel decision

The chair's outcome for every finding of the three reviews of the waist
measured on the Dashboard (2026-10-14). The panel advises; the owner
decides. **The UX guard passed once its two blocking findings were built**
(UX-1 as MM-302, which the owner also asked for directly the same session:
"Toasts should always display above the nav bar"; UX-2 as the state
stories). The product designer's blocking finding (PD-1) and the
measurement role's (ME-2) are built.

## Findings and where each went

| Finding(s) | Outcome |
|---|---|
| UX-1 (the waiting snack covers the navigation bar) | Built, MM-302: the bar publishes its height and the snack stands above it; Food's Add food rises above a snack, which lifting the snack would otherwise have covered. |
| UX-2, PD-5 (no story for typed, refused, saved) | Built: Waist Typed, Waist Refused, Both Typed, Weigh In Saved, Waist Saved (`Screens/Today`) and Entry Removed (`Screens/Food`), captured in Martian, Light and Dark. |
| PD-1 (two Ember Saves with both typed) | Built: `NumberEntry saveKind`; the waist Save is secondary; a test and the Both Typed story. |
| UX-3 (two buttons named "Save") | Built: `MmButton name`, `NumberEntry saves`; heard as "Save weigh-in" and "Save waist". |
| PD-2, UX-4 ("36.0 in waist" reads as a preposition) | Built: "Waist saved: 36 in", the unit last; the field is heard as "Today’s waist, inches". The weigh-in's MM-294 text is unchanged. |
| ME-2 (the hint leaves out the timing) | Built: "Morning, before eating. Tape level with the navel, snug, breathe out normally." Two lines at 412. |
| ME-5 (0.1 precision) | Built: `waistAmount` for every waist value on the Dashboard; 35.25 in is confirmed as typed. |
| ME-4 (the 6/7-day boundary untested) | Built: a test against `ReminderRule.measurementEveryDays`. |
| ME-1 (one reading costs more) | Recorded in MM-301; the one-reading path stays. Safety and nutrition were not convened: the rarer `masked` stall errs toward missing real waist loss (the reviewer's reading). |
| UX-7 (any failure is "looks off") | Built, MM-303: only a `FormatError` is a refusal; storage failures say "Could not save. Try again." |
| PD-7 (the direction names only the weigh-in's field) | Built in `design/screen-direction.md`. |
| UX-5 (focus after save), UX-6/PD-6 (landing on the waist), ME-6/UX-8 (correcting today's waist), ME-3 (saying the cost) | Ticket MM-304 (proposed), WS-03 step 14. |
| PD-3 (the stacked morning), UX-1 option B (the snack's lifetime), PD-4 (one wording before the first waist) | The owner's, listed in MM-304. |
| ME-7 (the 1.5× factor may overstate) | Deferred to MM-155's re-estimation; needs research and domain review. |
| UX bounded request (M3 placement page) | Not retrieved; MM-302 rests on the owner's instruction and the geometry. |

## Verification

The tests named in MM-301, MM-302 and MM-303 pass; MM-302's and MM-303's
failed before their fixes. Renders at 412 by 915: the five new Today
stories and Entry Removed in the three palettes, with animation stopped
for the capture. The chair is also the edit owner, so its view of the
result is not independent. Not seen on a device: TalkBack, the keyboard
with a waiting snack.
