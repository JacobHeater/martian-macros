# Panel decision

The chair's outcome for every finding of the two reviews of Water rebuilt as a section like the meals
(MM-318, 2026-10-14). **The UX guard passed.** Both reviewers answered the sibling question first: Water
looks and behaves like the meal sections.

## Findings and where each went

| Finding | Outcome |
|---|---|
| PD-1 (inert row; delete-and-add loses the time) | Built: pressing a drink opens "Edit water" as a food opens "Edit food"; the amount changes, the time is kept, Undo (`WaterWriter.updateWater`, the contract, a test). The inert row was itself a second breach of rule 9; the stated reason was not good enough. |
| PD-2 (goal states with no story) | Built: Water Goal Set None, Water Goal Partway. |
| PD-3 (chevron column on a past day) | Not built: `MmSection` behaviour shared with empty meals; recorded in MM-318. |
| PD-4 (story list) | MM-318's list complete. |
| UX-1 (today's time on a past day) | Bug MM-319, regression test: the row shows its time only when logged on its own day, else "Added later"; the stored moment stays true. |
| UX-2 (identical menu names) | Built: "More actions for 0.25 L of water at 8:00 AM" / "…, added later"; the same for Edit. |
| UX-3 (inert row) | Resolved by PD-1. |

## Verification
Renders at 412 by 915 from the static Storybook: Water Section in Martian, Light and Dark beside the meals,
Water None, Goal Set None, Goal Partway, Add Sheet, Edit, Other Amount, Other Refused, Removed, Goal
Reached. `mm check` on the branch (see `state.json`). Not looked at: the phone, TalkBack.

## Process notes for the next run
- The brief named the siblings and asked the comparison first (rule 9); both reviewers answered it.
