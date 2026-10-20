# Review: product-designer

Run `mm142-weight-jump`, one round, the design parts of MM-142 and MM-155's remaining items. **Reviewer:** Claude Code read-only subagent of the parent session, 2026-10-20; nothing edited, executed or delegated. **Render:** none; every statement about what is seen is source inspection plus arithmetic from the tokens. Hashes: none computed by the reviewer (no shell); the chair records them in `state.json`. The four required documents were read in full; the report follows `agents/templates/findings/role.md`.

## Scope and traceability
Requirements: MM-142, MM-155. Implementation: `dashboard/DashboardScreen.tsx`, `dashboard/WaistRow.tsx`, `dashboard/DashboardMetrics.tsx`, `progress/ProgressScreen.tsx`, `progress/WeighInNote.tsx`, `progress/WaistEntryCard.tsx`, `progress/weightJumpContent.ts`, `progress/useWeightJump.ts`, `progress/progress.css`, `charts/TrendChart.tsx`, `charts/WaistChart.tsx`, `charts/TrendStats.tsx`, `charts/charts.css`, `ui/WaistProtocolFigure.tsx`, `ui/ui.css`, `ui/MmDisclosure.tsx`, `ui/MmSection.tsx`, `ui/StatRow.tsx`, `ui/ShakerBottleOutlined.tsx`, `ui/HorizonArc.tsx`, `ui/MmButton.tsx`, `ui/MmTextField.tsx`, `coach/InlineInsight.tsx`, `coach/RowWithInsight.tsx`, `coach/coach.css`, `coach/MonthlyReportScreen.tsx`, `format/weightJumpText.ts`, `format/weightJumpCauseText.ts`, `format/reboundText.ts`, `format/waistSummary.ts`, `format/MonthlyReportText.ts`, `format/Fmt.ts`, `engine/WaistRule.ts`, `theme/tokens.css`, `app/app.css`; the stories (`Today.stories.tsx`, `Progress.stories.tsx`) and scenarios; the catalogs; tests `weightJump.test.tsx`, `weightJumpChart.test.tsx`, `waistProtocol.test.tsx`, `waistChart.test.tsx`, `hierarchy.test.tsx`, `hierarchyProblems.ts`. Direction: `design/screen-direction.md`, `design/anti-cruft-and-anti-slop.md`, `design/color-and-theme-system.md`, `design/visual-language.md`.

## Existing facts versus proposals
Facts: the Dashboard explanation and the rebound note are drawn by one `RowWithInsight` → `InlineInsight layout="row"` in one array (the sibling match holds); the closed line is `insight.line` in caption type in Ion; `weightJumpText` composed head + causes + a low-reading sentence + the arithmetic, and the arithmetic was also a figures row; `WeighInNote` drew a caption and then the line, between the chart and the band sentence; the `plain` layout indents 16 px; the picked dot was Ion; the waist chart shares `TrendChart`'s constants and the 14% band, in the `--carbs` measurement colour already used on the Dashboard; the Dashboard draws no waist history under two entries while the chart drew a line from one; the waist block's head reused the hero's heading class; the figure's tape was Ion, its navel r 1.6 at 0.75 px per unit; the steps were a bulleted `<ul>`; the report's waist value was a sentence in a bold right-aligned `StatRow` value although `StatRow` has `detail`; `hierarchyProblems` flags bare fields and the Waist section's fields are in an `MmSection` (pre-existing, MM-257). Proposals are the findings.

## Audit coverage
Mode `change`; the two features end to end across format, screen, chart, ui and story layers, each new part against its named sibling. Not inspected: the engine thresholds, `weightJumpWithheld`, MM-118, the tool, `screenStory`/`unseen` mechanics, MM-367's waist and water lines. Methods: source and token arithmetic only. Blocked: palette renders, wrap counts, the figure's legibility at 72 px.

## Novice mobile experience (when UX/product design is assigned)
**Goal A (walked):** forty days in, 83.3 kg saved after a 340 g carbohydrate day and a workout. Step 1, the row and under it an Ion caption of about 230 characters, about five lines (~80 px) under a 56 px row; the nothing-in-log variant about seven lines; passes for comprehension, the burden is the reading (PD-1). Step 2, the figures: eight rows, five of which repeat the closed line (PD-1). **Goal B (walked):** two measurements, opening Waist. Steps 1-3 pass (the figure beside four wrapped steps; the fields). Step 4, the chart: two dots bunched at the right, a flat line at their mean through neither dot, a band, and a caption describing three — **fails** (PD-8). What earns prominence: the row's two figures and one sentence of why; the fields and the protocol; the chart once there are three entries. Surveyed (no step record): the other stories and the catalogs.

## Findings
- **PD-1. The closed inline line is a paragraph, not a line; the layer below repeats it.** Usability problem by inspection with a design-rule conflict; **high**; confidence medium. Rules: screen-direction rule 1 (tertiary content one tap down; one sentence of uncertainty stays with its chart), rule 7, anti-cruft "one direct sentence beats three", `InlineInsight`'s own contract "one line from the coach", `coach.css` "quieter than the row it qualifies"; MM-142 "carries the arithmetic line once". Observed: three to five sentences joined into `line`; the arithmetic said twice. Proposal: line = head + likely cause(s) (or head + "nothing in your log"), the low reading keeps "will probably come back"; the arithmetic and the event offer one tap down. Acceptance: no variant's closed line over two sentences; the arithmetic exactly once; the stories re-read in three palettes. Recorded in MM-142's Decisions since it changes what the ticket decided.
- **PD-2. On Progress a picked and explained reading is said twice.** Improvement; medium; confidence high. Proposal: the caption carries the reading only when the line is beneath it.
- **PD-3. The `plain` layout's line is indented against its siblings in the hero.** Improvement; low-medium; confidence medium. `--note-start: 16px` puts the icon 16 px and the text 48 px in from the hero's captions and "How to read this". Proposal: `--note-start: 0`, `--note-end: 0` there.
- **PD-4. The chart's uncertainty sentence is separated from the chart by the note.** Improvement; low. Proposal: chart, band sentence, note, disclosure.
- **PD-5. The picked dot takes the engine's colour.** Design-rule conflict; medium-low. Ion means "inferred by the engine"; a raw reading changing to Ion sits on an Ion line. Proposal: `--text` at the larger radius with the canvas ring.
- **PD-6. The protocol figure's tape is Ion.** Design-rule conflict; medium. A third Ion group on Progress; the tape is already the heaviest stroke; siblings (`ShakerBottleOutlined`, `HorizonArc`) are single-hue. Proposal: tape `--text`, body `--text2`, guides `--outline`.
- **PD-7. The navel is probably too small to see.** Unverified hypothesis, medium if confirmed. r 1.6 units at 0.75 px/unit is about 1.2 px; the tape's ends are one continuous arc. Request: a render; raise the navel to about r 3, let the tape's ends show.
- **PD-8. With one or two entries the chart draws a construction its caption does not describe.** Usability problem by inspection; medium; confidence high. The mean of two as a flat line through neither dot; one dot and no band under a caption that names both. Proposal: dots only until three, a caption that matches; or no chart under two as the Dashboard does.
- **PD-9. "Waist over time" has the section title's type role.** Improvement; low. Proposal: a sub-head in `--type-label`, `--text2`.
- **PD-10. The waist block's control sits on the bare canvas, unlike its sibling.** Design-rule conflict, partly pre-existing (MM-257's fields); medium. MM-291: "anything that holds a control sits on a surface"; the section "is never drawn on a surface". Proposal: the body as a surface or list group; the chair decides scope.
- **PD-11. The steps' shape and words differ from the app's.** Improvement; low. Default disc markers where the app removes them; a sequence deserves numerals; the Dashboard hint says the protocol in other words. Proposal: `<ol>` in `--text2`; one shared wording.
- **PD-12. The report's waist line is a sentence in a bold right-aligned value column.** Improvement; medium. `StatRow` has `detail` for what a figure rests on (MM-342). Proposal: value "Down 2.5 cm" / "No clear change", detail the ends and the threshold.
- **PD-13. The measurement colour is a macro hue (`--carbs`).** Pre-existing documentation gap; low. Owner question on where the exception is recorded.
- **PD-14. Nothing says a dot can be tapped.** Improvement; low. Proposal: one sentence in "How to read this".
- What matches its siblings and needs no change: the Dashboard explanation reuses the rebound note's component, layout and figures exactly; the waist chart reuses the trend chart's dimensions, grid, axis type and 14% band; "How to measure" folds with the same `MmDisclosure` as "How to read this"; the empty state is one sentence in the chart's slot; no Ember, no new tokens, no gradient; the figure is palette-safe by construction; the words never say a cause did it.

## Sources and evidence
None external; the repository's own direction, tickets, code, stories and tests. `docs/evidence.md` not read (out of remit).

## Research
Unnecessary: every finding rests on the repository's own direction and on step records. A bounded question is stated for PD-1 (comprehension of multi-line 12 px secondary text under a primary row on a 412 px phone) should the chair want it; the claim stands as design judgement until then.

## Confidence and limitations
Medium overall: no render; PD-3 and PD-7 may look different on screen; MM-367's lines not read; `screenStory` not read (PD-10's test behaviour unverified); self-review only.

## Acceptance criteria and edge cases
Existing criteria traced to `weightJump.test.tsx`, `weightJumpChart.test.tsx`, `waistProtocol.test.tsx`, `waistChart.test.tsx`. Proposed: PD-1 at most two sentences, arithmetic once; PD-2 distance once; PD-8 caption names only what is drawn, a two-entry case; PD-10 the opened section passes `hierarchyProblems`; PD-12 the value column holds figures or three words. Edge cases: a jump before the trend has two points (no note; fine); a picked dot at the 90-day left edge; two entries five days apart at the right edge; imperial axis rounding (fine); 200% in the dense fields (UX guard).

## Dependencies
Chair requests: (1) coaching-safety/product: must the arithmetic sentence be in the closed line (PD-1)? (2) measurement: is a middle of fewer than three meaningful to draw (PD-8)? (3) ux-accessibility: does a size-plus-neutral-ring pick survive greyscale and colour-vision deficiencies (PD-5); does the pick need a visible cue (PD-14)? Challengers: ux-accessibility on PD-1 and PD-3; react-capacitor on the `plain` padding's reason; product on PD-10's scope.

## Safety concerns
None within this remit; the low-reading and overshoot wording keep both directions honest; the explanation is withheld as MM-142 asks. PD-1's move of the arithmetic is for the coaching-safety role to confirm. Not clinical clearance.

## Unresolved product decisions
1. The app's first drawing of a person: an instructional diagram, not a mascot in the reviewer's reading; the owner should see it. 2. The measurement colour on screens without macros (PD-13). 3. Where the arithmetic lives (PD-1). 4. Whether the pre-existing bare fields are fixed with this change (PD-10).

## Verification
Nothing run; tests read. Recommended: the four suites after any change from PD-1, PD-2, PD-8; `mm check`; renders of `WeighInJump`, `WeighInJumpNothingInLog`, `ProgressWeightJump`, `ProgressPickedJump`, `ProgressWaistFirstMeasurements`, `ProgressWaistChart` in the three palettes, recording PD-3 and PD-7.

## Targeted challenges
None; initial independent report.
