# Panel decision

The chair's outcome for every finding of the two reviews of the coaching-insights and food-grades design (MM-361 to
MM-371), drawn 2026-10-17 on the real screens through the design seam `InsightPreview`. **The UX guard passed on the
second pass** (first pass BLOCKED on UX-1 and UX-4). Both reviewers answered the sibling question first.

## Changes the chair made before the panel
- "New best" dropped from the inline catalog: the first capture showed the finished workout's Personal records card
  already says it, and the design's figures contradicted the real ones beside them (MM-366 amended).
- Two rule-test failures fixed: the "?" badge moved into the design system as `MmGradeBadge` (a raw `<button>` in a
  screen file is not allowed); `gap` taken from the spacing scale.

## Findings and where each went

| Finding | Outcome |
|---|---|
| UX-1, PD-2 (popover off the left edge) | Built: both edges clamped in `MmPopover`, width set where placed. Bug MM-372 with regression test `test/ui/popoverPlacement.test.tsx` (failed before the fix). Re-captured at 100% and 200%. |
| UX-4 (no large text or narrow stories) | Built: `screenStory` takes `textScale` and `viewport` (new `narrowPhone`, 320 px); stories FoodLargeText, FoodMealGradeWhyLargeText, DashboardLargeText, FoodNarrow. They found two of ours (fixed: badge sized in rem; day grade moved out of the app bar) and two older bugs (MM-373, MM-374). |
| UX-3 (raw button) | Built: `ui/MmGradeBadge.tsx`, registered as a button home, in the Components catalog. |
| PD-1 (line too heavy) | Built: the line is a caption in `--text2`. |
| PD-3, PD-4, UX-6 (bare letter; only "?" pressable; names) | Built: every badge is a button opening a popover with what the grade means or why there is none; names "Lunch: grade C". MM-370 amended. |
| PD-5 (workout line before its fact) | Built: after "Last time" and the suggestion. |
| PD-6 (Recent insights open) | Built: folded to its count like Monthly reports; the day moved from the title to the detail. MM-363 amended. |
| PD-7 (kinds without icons) | Kept, reason written in MM-364 (accepted by the product designer on that condition). |
| PD-8, UX-7 (off state drawn two ways) | Built: the area switch's subtitle carries the off state; story CoachSettingsFoodWhileAllOff. |
| PD-9 ("1 tips") | Built: "1 kind". |
| PD-10 (figures disagree) | Built: 67% and one grade per food across stories. |
| UX-2 (opened kind not identified) | Built: "Settings for “Mostly fat”"; the area screen names, scrolls to and focuses that kind. |
| UX-8 (three words) | Built: "insights", and "kinds" of insight. MM-364 amended. |
| UX-9 (swipe includes the line) | Recorded in MM-362; no change. |
| UX-5 ("one line") | To the owner, recorded in MM-362. Drawn as one insight wrapping at caption size (the panel's recommendation). |
| Safety request (Large portion with an eating-disorder history) | Built conservatively: left out for that history until the safety role answers. MM-365 amended. |
| Coaching request ("That is what a well-run cut looks like" as praise) | Not changed: MM-141 and MM-92 allow praise for an outcome earned by training; it is already left out with an eating-disorder history. For the coaching role when MM-366 is reviewed. |
| UX-10 (navigation labels at 200%) | Bug MM-373, test skipped with its ID (`test/app/largeTextLayout.test.ts`); with MM-91. |
| Dashboard title and water row at 200% (PD second pass) | Bug MM-374, test skipped with its ID; with MM-91. |
| UX-11, PD-12 (name squeezed at large text) | Recorded in MM-370 as a proposal for the build, with MM-91. |
| UX-12 (marker not heard) | Built: the marker is part of the switch row's subtitle, so it is in the switch's name. |
| UX-13 ("Grade B-" read badly) | Built: the popover is labelled "Grade B minus". |
| PD-11 (day row unlike its sibling) | Built: built as the completeness row (trailing, same insets), subtitle "Counted by calories". |
| PD-13 (day row bare on the canvas) | Recorded in MM-370: it follows its sibling; both go in a group together if MM-291 is to hold for them. |
| PD-14 (switch drawn on while all off) | Accepted: the switch shows the kept position and its words say it is off; recorded in MM-364. |

## Verification
`npm run typecheck`; the architecture, stylesheet, pressed-state, UI and gallery suites (497 passed, 5 skipped) after
the last change; the full suite earlier in the run (2,526 passed before the panel's changes, its two failures fixed). Renders
re-captured after every change in three palettes. Not looked at: the phone, TalkBack, a real browser's focus return.
