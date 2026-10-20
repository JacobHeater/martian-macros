# Outcomes

| Finding | Severity | Outcome |
|---|---|---|
| PD1 add plate Ember at rest | blocking | Fixed: the plus in `--text`, Ember only pressed/hovered/focused. Bug MM-436 with regression test. |
| PD2 / F7 text action looks like a value | blocking | Fixed: text actions are underlined (a non-colour, non-weight cue), written into MM-288 and the checklist. |
| F1 compact segment by colour alone | blocking | Fixed: the check mark on every chosen segment, the chosen text in `--text`. Bug MM-437; the destination test asserts the check. |
| PD3 relief offer plus lead Add food | should-fix | Fixed: Add food is a text action while the relief offer shows. |
| PD4 lift rows in a list surface | should-fix | Fixed: on the canvas like Weight events. |
| PD5 range above the figure | consider | Kept, with the reason in MM-287. |
| PD6 three ways into Progress | consider | Left: the waist landing is the one MM-304 asks for; recorded here. |
| PD7 scroll not saved through a link | should-fix | Fixed: kept on any change of destination once a scroll was seen; test added. |
| PD8 waist line weight and two wordings | consider | Fixed: the line in `--text2`; one wording (`waistProtocolText`). |
| PD9 icon `action` kind same as standard | consider | Left for the design-system owner; noted. |
| PD10 MM-288 ticket behind | consider | Fixed: decision recorded on the ticket. Pressed Text/Lead swatches left. |
| F2 checklist over-claims | should-fix | Fixed by narrowing the wording to what each test does. |
| F3 focus flag clears too early | should-fix | Fixed: cleared only once today's value exists. Not reproduced with a deferred store; no deferred-store test. |
| F4 remembered fold beats a due opening | should-fix | Fixed: the fold key carries what is due; `foldDue.test.tsx`. |
| F5 focus lost after the Progress waist save | should-fix | Fixed: focus moves to the recorded line; test added. |
| F6 restored scroll can undo the reveal | consider | Left: no runtime seen; noted for the device pass. |
| F8 text scaling and 360 dp claims | should-fix | Fixed by rewording rule 3 and the 360 dp item, and adding the phone text-size check to the by-hand pass. |
| F9 FAB reading order | consider | Fixed: the exception stated in the checklist. |
