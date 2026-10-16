# Panel decision

The chair's outcome for every finding of the two reviews of the water glasses (MM-326, 2026-10-14).
**The UX guard passed.** Both reviewers answered the sibling question first: the tally is composed of its
siblings (the meal section's header and check mark, the rhythm strip's dots) and should stay its own part.

## Findings and where each went

| Finding | Outcome |
|---|---|
| PD-2, UX-1 (the glass never named on screen) | Built: the summary says the glasses ("24 fl oz of 128 fl oz · 3 of 16 glasses", "Goal 2 L · 8 glasses"); the tally is then decoration (`aria-hidden`), like `MmProgressBar`, since the words beside it carry the count. Tests and stories read the words. |
| UX-3 (the half-glass label) | Built: "1½ of 8 glasses", "½ of 8 glasses", one pattern. |
| PD-4, UX-4 (rows wording; reason for the packed grid) | Built: MM-326 and the story say rows of at most 12, of equal length (26 is 9, 9 and 8); the reason is in the Decisions. |
| PD-3 (inherited fill transition) | MM-326 says "no animation" means no celebration; a mark's fill keeps the strip's transition, off under reduced motion. |
| PD-1 (Ion: "estimated", and protein's hex in Martian) | Kept Ion for sameness with the rhythm strip (rule 9); the false "no colour of its own" wording corrected in MM-326 and `MmTally`. Moving both strips to a neutral is put to the owner. |
| PD-5 (mark size at 2-3 rows) | Not built; the owner's call if 2-3 rows read loud. |
| PD-6, UX-5 (folded chevron) | Re-captured after the transition: the chevron points down. A capture artefact, no bug. |
| UX-2 (marks look tappable) | Not built: the strip stays inert; "+" is beside it. |
| Safety referral (marks past the goal) | Marks are capped at the goal; nothing fills past it. |

## Verification
Renders at 412 by 915 from the static Storybook, before and after the changes (after: Water Glasses in
Martian and Light, Folded in Dark, Half in Martian, Most Glasses in Dark, Goal Set None in Light, Goal
Partway in Martian). `mm check` on the branch (see `state.json`). Not looked at: the phone, TalkBack, 200%
text.
