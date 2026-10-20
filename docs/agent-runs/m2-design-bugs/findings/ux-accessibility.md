# UX-accessibility review: M2 design bugs

**Role:** ux-accessibility (UX guard), read-only. **Mode:** change; `feat/m2` working tree, 2026-10-19. **Render:** none; stories read from source; layout and contrast hand-computed from the stylesheet and tokens; no device or assistive technology.

## Verdict
**Pass, no blocking finding.** One high finding (F1) leaves MM-351's criterion unverified until a device check; it does not block the batch.

## Walkthrough A: Food, a glass of wine logged, Full detail, screen reader, 200%
Heading, figure and caption, the picture switch and bars, then the new lines "Fiber: 20 g · guide 30 g" and "Alcohol: 109 kcal": order sensible, under the Calories heading; block text wraps, nothing cut. The alcohol line names no relation, so the person must decide whether 109 kcal is inside the figure; it is (`intakeDayFrom.ts:22`, `FoodEntry.ts:82-84`), said only one tap down and about the Split picture. Fails on meaning (F9). Food passes no status row to the hero, so the brief's count of one is off by that row.

## Walkthrough B: Coach, stalled over target, screen reader, 200%
Heading; rows "Days logged / 7, all complete", "Weigh-ins / 7", "Average intake / 2,350 kcal / against 2,100: 250 over", "Protein minimum met"; the detail comes third in the markup so pairing holds whether read as one stop or three (F4). "against 2,100" carries no noun (F10). At 200% the row with a detail wraps its value under the label, sitting at the left (F3). Nothing overlaps.

## Findings
**F1 (high, confidence medium).** MM-351's status region is inserted together with its text (`BarcodeScanStep.tsx:113-116`, `Notice.tsx:35`), which assistive technology does not reliably announce (MDN: establish the region before updating it; the injected exception is `alert`). `status` is the right role against MM-334's `alert` (ARIA 1.2: advisory versus important and time-sensitive). Recommend a `role="status"` container from first paint with the notice placed inside; device check on TalkBack and VoiceOver.
**F2 (medium).** The scan step's other recovery path, a camera that cannot be used, replaces the pressed button with a non-live notice: focus falls to the body and nothing is announced. A new bug ticket and test, not a silent addition.
**F3 (low).** At 200% the stat row with a detail loses its figure column. Recommend `margin-left: auto` on the value and a `CoachLargeText` story.
**F4 (low, unverified).** Whether label, figure and detail are one stop or three; order is right either way. Device check only.
**F5 (low).** `design/screen-direction.md:296` says an Info notice has no border; the fix gives it one. One of them changes.
**F6 (informational).** The hairline's contrast by token is 1.3 to 2.4:1 in the three palettes; WCAG 1.4.11 does not require 3:1 of a decorative boundary on a non-control, and the kind is carried by icon and word. No change.
**F7 (low).** The app bar title breaks inside a word without hyphenation, unlike the navigation labels; `hyphens: auto` (the page is `lang="en"`).
**F8 (low).** The row-action rule lets the button take its full width before the words; on a 320 px phone the text column shrinks to a few characters. Recommend bounding the action (for example `max-width: 50%`).
**F9 (low).** "Alcohol: 109 kcal" does not say how it is counted; the relation in the domain's words, decided through the chair.
**F10 (low).** "against 2,100" names no noun; whether "target" is true to MM-149's facts-only rule is coaching's call.

## Chair request
Coaching: is the alcohol line part of the day's figure (F9); may the detail say "target" (F10)? QA: device checks for F1 and F4. Product-designer: F5, F7, F8.

## Audit coverage
Source inspection of the components, CSS, tokens, stories, tests and tickets in the brief, plus `HomeShell`, `FoodDayHeader`, `intakeDayFrom`, `FoodEntry`; hand computation of contrast and of flex layout at 200% on 412 px. Not inspected: the engine's numbers; search ranking; `MicrosPanel`, `MacroSplitChart`; Settings' icon-button rows at 200%; Train and Progress. Limitations: no render, device or AT; every layout statement is arithmetic on the stylesheet.

## Research
Performed: WAI-ARIA 1.2 (https://www.w3.org/TR/wai-aria-1.2/, 2023-06-06, accessed 2026-10-19) for `status` against `alert`; MDN "ARIA live regions" (https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions, modified 2026-09-11, accessed 2026-10-19) for regions inserted with their content; WCAG 2.2 Understanding SC 1.4.11 (https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html, updated 2026-09-06, accessed 2026-10-19) for the hairline. Unnecessary for the layout arithmetic and the direction mismatch.

## Safety, verification
None found; the Coach summary keeps MM-149's facts-only wording. Nothing executed.
