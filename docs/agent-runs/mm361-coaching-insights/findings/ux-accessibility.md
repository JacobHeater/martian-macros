# Review: ux-accessibility (UX guard), run `mm361-coaching-insights`

Saved by the chair, as returned by the read-only reviewer (Claude Opus 5.5 subagent, 2026-10-17). First pass.

## Scope and traceability
Role ux-accessibility, read-only. No edits, no commands. Requirements read: MM-362, MM-370 in full; MM-364 by
grep. Baseline: `design/inline-insights-and-grades` + working tree. SHA-256 hashes not computed (cannot
execute). Source: `coach/InlineInsight.tsx`, `coach/RowWithInsight.tsx`, `coach/inlineInsightRules.ts`,
`coach/coach.css`, `food/FoodGrade.tsx`, `food/MealSection.tsx`, `food/FoodDayHeader.tsx`, `food/food.css`,
`ui/MmPopover.tsx`, `ui/MmOverlays.tsx`, `ui/MmMenu.tsx`, `ui/MmDisclosure.tsx`, `ui/MmSwipeToRemove.tsx`,
`ui/ui.css`, `settings/CoachSettingsScreen.tsx`, `settings/CoachAreaScreen.tsx`, `settings/settings.css`,
`theme/tokens.css`, `gallery/screens/CoachingInsights.stories.tsx`, `test/architecture.test.ts`. Renders:
food-with-insights (martian, dark), food-insight-open, food-insight-to-settings, food-grade-why (martian),
food-meal-grade-why (martian, light), food-with-insights-eating-disorder (light), search-with-grades (light),
amount-step-with-grade, dashboard-with-insights, settings-coach-section, coach-settings-all-off (martian),
coach-recent-insights (light), coach-settings-food-off (dark), coach-settings-food-eating-disorder (light).

## Audit coverage
Walked: the four depth walkthroughs. Surveyed only: workout line, Dashboard rows, Recent insights, search
grades, amount step, Settings > Coach row. Not inspected: `RecentInsightsSection.tsx`,
`WorkoutExerciseCard.tsx`, `FoodSearchResults.tsx`, `FoodAmountStep.tsx`, `InsightSwitchesDraft.ts`, the
Popover story. Not available: device, TalkBack, 200% text, 320 px. No tests exist for MmPopover, FoodGrade or
InlineInsight.

## Task walkthroughs (source + render)
**W1. Peanut butter line to its switch.** (1) Line seen under the entry, tied to it by the missing hairline:
pass. (2) Opens to "What this rests on" and "Coach settings for this tip": pass. (3) Food insights opens;
"Mostly fat" marked only by a 3 px `--info` bar; the line never said "Mostly fat"; the example's 62% differs
from the line's 76%; focus does not move to the row (`CoachAreaScreen.tsx:41-45`): fails for screen-reader
users, weak for sighted users (UX-2). (4) Switch: acceptable.

**W2. "?" on a snack.** (1) Dashed "?" beside 220 kcal: pass. (2) Entry "?" opens "Can't be graded" with focus
on "Got it": pass. (3) Meal header "?": popover clipped off the left edge (food-meal-grade-why martian, light):
fails (UX-1). (4) Closing: Got it, Escape, Back, outside; focus return from source only.

**W3. Screen reader through Lunch.** Order from source is logical (`MealSection.tsx:68-127`). Graded badges
never name what they grade ("Grade C" for the meal, "Grade B minus" for the day) while "?" names its subject:
marginal (UX-6). The line's whole text is the button name, long but complete: pass.

**W4. Food tips off, then all back on.** Settings > Coach row: pass. Food switch off with its note: pass.
Master and area are separate; the Food row says "Off": pass. With the master off, the area screen still shows
its switches on, explained only by a note below them, and no story draws it: marginal (UX-7).

## Accessibility checks
Targets meet 48 dp (grade slot, "?" via `::before`, disclosure toggle). Text contrast from tokens: line
`--text2` on `--surface` ≈10.9 (martian), 8.7 (dark), 7.8 (light); badge letter well above 4.5; popover text
≈8.5 (martian). Badge border `--outline-strong` vs `--surface` ≈5.6 / 3.3 / 3.6 (meets 3:1, dark marginal).
Popover: role dialog, labelled, focus in, trap, Escape, app inert; focus return as `MmMenu` (source only). No
colour-only meaning.

## Findings
- **UX-1 (high, BLOCKING), reproducible implementation defect.** Popover clipped at the left edge:
  `MmPopover.tsx:39-40` places from `right = innerWidth − anchor.right` with width min(300 px, 100vw − 32) and no
  left clamp; the meal "?" at x≈260 puts the left edge near −40 px. Clamp so left ≥ 16 px. Acceptance: for any
  anchor at 320–412 px and 100%/200% text, left ≥ 16 and right ≤ innerWidth − 16; a story and a regression test.
- **UX-2 (medium), usability problem by inspection.** "This tip" is not identified on the settings screen: only
  a colour bar, the rule title never appears on the line, focus stays at the top beside the area switch; a
  novice could turn off all of Food. Move focus to the rule's switch; a text marker; name the rule.
- **UX-3 (medium), confirmed requirement violation (rule 8).** `FoodGrade.tsx` writes a raw `<button>`. Use a
  design-system component.
- **UX-4 (medium, BLOCKING for the gate), documentation or requirement gap.** Large text and narrow width are
  not drawn though MM-362 and MM-370 ask for them. Risks: the entry's trailing slot at 320 px, the day header,
  a 4-row line reaching 10+ rows at 200%. Stories at 200% and 320 px for the food log, day header and popover.
- **UX-5 (low-medium), documentation or requirement gap.** "One line" is ambiguous: two sentences across four
  rows at body size compete with the food name. Owner decides; product-designer for hierarchy.
- **UX-6 (low), documentation or requirement gap.** Accessible names drift from MM-370; graded badges carry no
  subject. Consider "Lunch: grade C".
- **UX-7 (low), usability problem + undrawn state.** The area screen contradicts the master switch. Note above
  or in the area switch's subtitle; a story.
- **UX-8 (low), improvement.** "insights", "notes" and "tips" name one thing. Pick one word.
- **UX-9 (low), improvement.** The swipe area now includes the line; a sideways drag on it deletes the food.
  Undo and More > Delete reduce the harm. Record; no change required.

## Safety concerns (bounded chair request)
"Large portion" has no `notWithEatingDisorderHistory` and is drawn for that history ("Worth checking the amount
is right"). Is a portion prompt the food-composition content MM-362 excludes, or a restriction cue? Grades shown
with that history are the owner's decision. Not clinical clearance.

## Research
Not performed; WCAG 2.2 thresholds (1.4.3, 1.4.11, 2.5.8) from memory, medium confidence.

## Confidence and limitations
Medium. Static renders and source only.

## Dependencies
react-capacitor (UX-3, focus-return tests); product-designer (UX-5, UX-8); safety (the request); owner ("one
line").

## Verification
Nothing executed.

## GUARD verdict
**BLOCKED: UX-1, UX-4.**
