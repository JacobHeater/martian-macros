# Panel decision

The chair's outcome for every finding of the two reviews of the water bar (MM-326, the owner's new
direction of 2026-10-15). **The UX guard passed.** Both reviewers answered the sibling question first: it
should stay a bar of `MmProgressBar`, the hero's macro bar.

## Findings and where each went

| Finding | Outcome |
|---|---|
| PD-1 (14 px outweighs the hero) | Built: the emphasized macro bar's weight, `regular` (8 px); `prominent` removed. The ripple, scaled to 3 px, still reads at 8 px in the re-captured frames. |
| PD-2 (the front-edge slosh reverses: overshoot) | Built: the slosh removed; only the ripple, which scrolls one way and flattens, remains. Comment and motion doc corrected. |
| PD-3 (Dark water near Dark protein; no figures) | Built: Dark water `#1e88c8`, 10.5 L* below protein, 25.8 below ion; contrast and L* figures for all palettes in `design/color-and-theme-system.md`. |
| PD-4 (a snap, then a shimmer) | Built: ease-out cubic over 1,200 ms; about half the travel at 250 ms in the new frames. |
| PD-5, UX-5 (hairline seam ahead of the fill) | Gone with PD-2 and the ripple held inside the fill (`right: 0`); not in the new Dark or Martian pour frames. |
| PD-6 (pours on every visit to Food?) | Kept: the bar pours whenever it is drawn, as on opening. Whether coming back to Food draws it again was not checked; said so in MM-326. |
| PD-7 (rounded front end) | Kept, with its reason in MM-326 (as the nutrient bars; a liquid's edge is round). |
| UX-1 (reduced motion blinks empty) | Bug MM-327 with its regression test (`test/ui/waterBarReducedMotion.test.tsx`, failing before the fix): `usePoured` starts at the level under reduced motion. |
| UX-2 (a day change moves the bar as an add) | Bug MM-328 with its regression test (failing before the fix): the bar is keyed on its day and drawn once the day's drinks are in. |
| UX-3 (Light track faint) | Not changed: shared by every bar; the summary carries the goal. Recorded in MM-326. |
| UX-4 (re-pour shows less for a moment) | Recorded in MM-326: the summary is exact, the bar draws it. |

## Verification
Re-captured after the changes: settled frames in Martian, Dark and Light; the pour in Dark and Martian at
60 to 1,600 ms after opening and 100 to 1,500 ms after adding a glass. `mm check` on the branch (see
`state.json`). Not looked at: the phone, TalkBack, 200% text, a reduced-motion render (tested instead).
