# Panel decision

The chair's synthesis of two independent grades of the six destinations
against the direction of MM-253, made before the rebuild and folded into
it the same day. The panel advises; the owner decides. Every finding below
has an outcome: built, a ticket, an acceptance with its reason, or an owner
decision still open.

## Facts versus proposals

- **Facts** (the reviewers' render observation of the first viewport and
  source inspection, cited by file and line in their reports): both macro
  pictures on Dashboard and Food; a chip reading only "Good"; "Targets went
  down 100 kcal on Today."; the hero with no heading; a `Notice` inside the
  targets card; the completeness control last on Food; ISO dates in the
  event rows; Illness as the sheet's default; the weigh-in field's unit
  unassociated; two Ember fills on Progress; every Train row ending
  "3 personal records"; `MmListRow` icons at 24 dp; no icon slot in
  `GroupHeader`; the renders showing 915 px, not 2,600.
- **Proposals:** every remediation and every icon in PD-27. The build
  below is the chair's selection; the owner's open decisions are listed.

## Coverage

Two reports under `findings/`, saved unchanged. Both read every destination
screen file, the design documents and the seven tickets; both looked at the
twelve first-viewport renders (Martian and Light) the chair supplied; the
UX role walked Dashboard, Food and Progress as tasks from source. Neither
rendered a story, touched a device, ran a screen reader or a test. Below
the first viewport both worked from source only (PD-1, UX-25): the brief
promised 2,600 px and the frame is fixed at the phone's height, so the tall
captures show the same 915 px. The chair's "after" renders have the same
limit; the tails were walked by the tests, not looked at.

## Findings and where each went

| Finding(s) | Outcome |
|---|---|
| PD-1, UX-25 (renders are one viewport) | Accepted with reason: the first frame is what rule 7 asks; recorded here; the frame's fixed height is the register's and a tall capture needs the body's overflow released (not done). |
| PD-2 (Ember text actions spend the budget) | Owner decision, MM-288. Built as before (Ember text) until decided. |
| PD-3 (row icons 24 dp, no header icon slot) | Built: `MmSection` draws 24 dp beside a `heading`; rows draw their icons at 20 dp where the row adds them (method icons, the record mark); `MmListRow`'s own leading icon stays 24 dp until MM-288's pass, so one change lands with the colour decision. |
| PD-4 (two Ember fills on Progress and Dashboard) | Built: the waist Save is secondary; the Dashboard's weigh-in is a section with the field, its Save the one fill when it shows; `hierarchy.test.tsx` counts primaries. |
| PD-5, UX-2 (a chip reading "Good") | Built: the status row's subtitle "Coach confidence: Good"; the chip is gone. |
| PD-6, UX-3 ("on Today") | MM-283, fixed, regression in `dartMessages.test.ts`. |
| PD-7, UX-12 (two macro pictures; the switch's words) | Built: "Grams" and "Share", default bars, the caption dropped inside the hero and said under "More about today"; the switch is after the figure and never inside a pressable. Legend contrast on the hero: the chair's measurement is still owed. |
| PD-8, UX-17, UX-18 (what MM-254 did not place) | Built: the history and its four charts and the 7/30 switch behind "More about this week"; the insight a section under the strip; the streak a row; the report notice stays a notice; the no-weigh-in field the one in-place exception. Not built: coverage as three rows and recovery as one row (the metrics screen is kept whole one tap down, so nothing is lost). |
| PD-9 (the arc on Coach) | Owner decision, open: MM-187 says Coach shows the arc; built as before, with the next check-in as its status row. |
| PD-10 (a notice inside a card; two caution glyphs) | Built: the target flags are notices on the canvas under the hero; policy cautions use the caution glyph; `hierarchy.test.tsx` fails a notice inside a card, the hero or a list group. |
| PD-11, UX-7 (safety inside the rationing) | Built: the safeguards stay above the hero in full and in order; `OneThingRow` chooses only the recovery check-in or a fresh report; written into the direction. |
| PD-12, UX-23 (confidence in three places; Body rows) | Built: the confidence word is in the hero and the "Coach confidence" section only; the StatRow in the targets is gone. Body stays a section (its rows are facts, not navigation). |
| PD-13 (meal header lighter than its rows) | Built: `MmSection` title is `heading`. |
| PD-14, UX-10 (the completeness mark and control) | Built: a row after the last meal with the mark and its state in words, opening the options dialog; the day header shows the mark only. |
| PD-15 (what "a message for today" means) | Built as defined: alcohol above zero is a visible line; fiber at Full detail is visible (the person asked for the detail); the partial-days explanation is one tap down. |
| PD-16, UX-13 (method icons without words; "scanned") | Built: icon beside the word; scanned excluded. The seed's uniform entries: MM-289. |
| PD-17 (a disabled primary in the hero) | Built: Save appears once the value changes. |
| PD-18 (three figures) | MM-287. |
| PD-19, UX-5 (uncertainty behind a disclosure) | Built: one sentence stays under the chart; the rest opens from "How to read this"; written into the direction as the exception to rule 1. |
| PD-20, UX-22 (strength cards; waist technique inline) | Built in part: the technique line comes first when Waist opens; Strength folds to its line and opens to the cards. Lift rows and one disclaimer: MM-287. |
| PD-21 (no muscle-group glyph) | Chair's decision (a): text marks on the volume section's line until MM-109; written into rule 2. |
| PD-22, UX-15 (the record mark; the seed) | Built: a star with "personal record" in the row's words, never a trophy. The seed: MM-289. |
| PD-23 (a header per row) | Built: this week and last week open, each month folded with its count; the newest month open. |
| PD-24 (the body-fat switch names its off state) | Built: "Body fat estimate", subtitle by state. |
| PD-25, UX-24 (the Settings map; numeric settings) | Built: seven sections in the ticket's order with Coaching merged into Today's setup; the two sliders stay in rows. A sheet with a field for body fat: owner decision, open. |
| PD-26 (two bars titled "Today") | Built as UX-16: the Dashboard is "Dashboard"; Food keeps the day stepper. |
| PD-27 (the icon map) | Built in substance: the meaning names added to `MmIconName`; food-type meal glyphs (owner may change in the Icons story); travel is a plane, not luggage. |
| PD-28 (what the direction does not say) | Built: items 1, 3, 4, 5, 8 and 9 written into `design/screen-direction.md`; 2, 6 and 7 are MM-288, the icon sizes above, and rule 2's text-until-MM-109; 10 is MM-289. |
| UX-1 (the hero has no heading) | Built: a visually hidden "Calories today" heading in the hero. |
| UX-4 (a button containing buttons) | Built: the hero's press stays on the figure; the switch is outside it; `MmSection`'s press wraps only its header. |
| UX-6 (held or settling estimate behind a disclosure) | Built: the folded line says held at a safe limit or waiting to settle. |
| UX-8 (the unit not heard) | MM-284, fixed, regression in `fieldErrors.test.tsx`. |
| UX-9 (destinations unmount) | MM-286. |
| UX-11 (strip targets and names) | Built: a named group, each day a 48 dp button named with its day and state, edge to edge; `section.test.tsx` checks the names and the height. Roving arrow keys: not built (seven tab stops remain). |
| UX-14 (collapsed sections' rules) | Built: a due check-in or a fresh report opens its section; the summary wraps. State across tabs: MM-286. |
| UX-16 (two h1 "Today") | Built. |
| UX-19 (the FAB last in focus order) | MM-286 (the bar's Add food on Food was tried and withdrawn: two buttons of one name). |
| UX-20 (ISO dates) and UX-21 (Illness by default) | MM-285, fixed, regression in `weightEvents.test.tsx`. |

## Owner decisions open after this run

1. **Ember text actions** (PD-2): MM-288 carries the two options and the
   product-designer's recommendation.
2. **The arc on Coach** (PD-9): keep MM-187 or give Coach a hero of its
   targets.
3. **Numeric settings** (UX-24): sliders in rows (built) or a sheet with a
   field.
4. **The meal glyph family** (PD-27): food-type (built) or time of day, to
   be judged in the Icons story.

## The chair's own verification

Source and tests: the suite passes (2,145 tests) with the new
`hierarchy`, `section`, `rhythmDays`, `workoutGroups` and `weightEvents`
tests. Renders: the six destinations at 412 by 915 in Martian, Light and
Dark from the static Storybook, looked at by the chair. Not done: anything
on a device; 200% text; the donut legend's contrast on the hero; the
tails below 915 px as renders. The chair is also the edit owner, so this
view of the result is not independent.
