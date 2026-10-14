# Product-designer review — MM-290 / MM-291 / MM-292 (Dashboard weigh-in row, "Split")

Transcribed by the chair from the read-only subagent's hand-back, 2026-10-14: every finding, severity, piece of evidence and fix is kept; some sentences are condensed. The chair arranged it under the findings template's headings afterwards; text under a heading the reviewer did not write says so.

## Scope and traceability
- Role: product-designer (read-only, panel adapter). No commands run, no edits.
- Inputs read: the four panel files; tickets MM-290, MM-291; `design/screen-direction.md` (lines 9–103); `apps/mobile/src/dashboard/{WeighInRow.tsx, DashboardScreen.tsx, dashboard.css, ProcessCard.tsx}`, `apps/mobile/src/ui/{NumberEntry.tsx, MmListRow.tsx}`, relevant `ui.css` rules, `food/CalorieHero.tsx` (grep), `gallery/screens/notWeighedTodayScenario.ts`, `state/AppState.ts` coach cell (436–455); the 5 supplied 412×915 captures (before Martian, before demo, after Martian/Light/Dark).
- Commit: working tree on `fix/dashboard-split-weighin-storybook` (uncommitted changes) over 0076621. Input hashes not computed (no command access).
- Audit mode: `change` (the proposed change and its neighbouring Dashboard tiers).
- Evidence: source inspection + supplied Storybook renders. No running app, no device.
- Not inspected: InsightCard (no capture), Progress hero's NumberEntry, 360×740, MM-292/hierarchy test, Food destination's copy of the hero.

## Existing facts versus proposals
Facts: the captures' positions and the cited source lines in each finding (read from images, not measured). Proposals: every "Fix" and the choice among the alternatives.

## Audit coverage
Inspected and not inspected as listed under Scope and traceability; methods: source inspection and render inspection of the supplied captures.

## Novice mobile experience (when UX/product design is assigned)
Walked against the after captures.
Task: morning, not weighed in, log today's weight.
1. **Sees** arc, macro bars, rhythm strip, then a card whose first row is a scale icon + "Weigh-in", an empty field with "lb", and Save. **Decides**: type the number. The row title labels the field. Pass.
2. **Types**, Save turns Ember, **presses**. **Signal**: field leaves, "184.1 lb · Trend weight" row takes the same slot. Pass (if the swap is immediate — see PD-7).
3. **Light theme, before typing**: field and disabled Save are near-identical grey tiles, so the person must work out which takes input. Weak, not blocking (PD-3).

## Is the row-in-the-card the right design? (alternatives weighed)
- **Row in the group (proposed) — accept.** Asks in the exact slot that later answers. That cures the owner's real complaint (two states of one fact in two places) without a new surface. It keeps the waist/check-in/training rows' icon column (x≈44) and text column (x≈73), so the field aligns with every row title below. Fewest taps for the most frequent daily entry. It matches the direction's empty state ("Weigh-in: the field and its hint", screen-direction.md:80).
- **Card of its own — reject.** A second surface of equal weight beside the group, and on a weighed day the fact moves into the group anyway: the "two places" defect in another shape.
- **In the hero — reject.** The hero is pressable as a whole (`onPress` opens Food, DashboardScreen.tsx:109), so a field inside would nest interactive in interactive. It would also crowd the first viewport rule 7 budgets to arc + macro picture, and rule 6 says a disabled primary is never parked in a hero.
- **"Log weight" row → sheet — reject as default, keep as fallback.** Keeps every row 56 dp and pressable, with no disabled primary on the Dashboard, but adds a tap and a sheet to the single daily entry. It becomes the better answer only if PD-5 shows the field falls below the fold in common states.

## Findings

**PD-1 — blocking. The direction still names the switch "Share".** Classification: documentation or requirement gap. Evidence: `design/screen-direction.md:44-45` "named "Grams" and "Share""; register row line 97 "Grams/Share switch"; `requirements/dashboard/STORY.dashboard-with-tiers.MM-254.md:54` "Grams/Share switch"; `requirements/HANDOFF.md:224`. The code now says "Split" (`CalorieHero.tsx:103`). The canonical direction contradicts the fix, so the next agent "restores" Share. Fix: change the canonical text to "Grams" and "Split" in the same PR, recording the owner's ruling of 2026-10-14. Explanatory prose ("share of calories") may stay.

**PD-2 — blocking. Rule 1 still prescribes the layout the owner rejected.** Classification: documentation or requirement gap. Evidence: rule 1 (`screen-direction.md:19-27`) says secondary facts are "sections and rows on the canvas (`MmSection` … no surface)", which is exactly what the before capture draws. Fix: amend rule 1 with the owner's ruling: "anything holding a field or control sits on a surface (hero, list group, sheet); a bare canvas section carries only read-only rows", and name `hierarchyProblems` as the check. Without this, rule 1 and MM-291 disagree.

**PD-3 — should. In Light, the disabled Save reads as a second field.** Classification: usability problem found by inspection. Evidence: after-Light capture: field = pale grey fill + border; disabled Save = pale grey fill + grey text; equal weight and colour. In Martian, disabled Save is a solid muted-lavender pill, the heaviest object in the row while it does nothing. Fix (design system, not screen): make the disabled primary quieter than the field, either no fill (outline/ghost of the primary's shape, label `--text2`) or a fill clearly lighter than the field in every palette; or give the field a surface/white fill in Light so the field reads as the input. Verify NumberEntry in all 3 palettes, in the Dashboard row and the Progress hero. Contrast referral to UX-accessibility.

**PD-4 — should. The row's padding is a screen-local override of a component.** Classification: design-system consistency. Evidence: `dashboard.css:16-19` reaches into `.mm-list-row:has(.dashboard-weigh-in)` to set `align-items` and `padding-block`. AGENTS.md principle 8 says components take meaning, never padding, and this creates a local style variant of the row. The Settings slider rows are the other inline-control row and are styled separately (`ui.css:650-653`). Fix: give `MmListRow` the variant (a row whose `detail` is a control top-aligns and takes 12/16 padding, or a meaning prop such as `entry`), so slider rows and this row share one rule. Minor: `WeighInRow` wraps a `<div>` (NumberEntry) in a `<span>` inside `mm-list-row-text` (a `<span>`), which is invalid nesting; a `div` would be cleaner.

**PD-5 — should (needs a render). The weigh-in can fall below the fold.** Classification: unverified hypothesis requiring investigation. Evidence: after capture at 412×915: Save row ends y≈750, nav starts y≈843. In the demo state the streak row (≈45 px) sits between the strip and the group, and so may the InsightCard and any safety notice (DashboardScreen.tsx:92-127). At 360×740 (rule 7's second reference viewport) with a streak and an insight, the field is very likely below the fold on exactly the mornings the person is engaged. Fix: request renders of Not Weighed Today with a streak and an insight at 360×740. If it falls off, move ProcessCard and InsightCard below the list group, so the morning's action precedes praise and commentary. Safety notices stay on top.

**PD-6 — should. The streak row floats bare on the canvas.** Classification: usability problem found by inspection (visual consistency). Evidence: demo capture: "60 whole days logged in a row" is an `MmListRow` with no surface (`ProcessCard.tsx:16`), sitting about 17 px above the card. It is the same bare-on-canvas pattern the owner just rejected and reads as a row that escaped the card below. No chevron, opens nothing. Fix: make it the last non-opening row of the list group (icon + "Your logging"), or, since it describes the strip, the strip's one-line caption. Don't leave a lone canvas row; the owner will call it out next.

**PD-7 — could (routing). Two loose states of the weigh-in row.** Classification: unverified defect hypothesis outside remit. Evidence: `DashboardScreen.tsx:129` shows the trend row only if `weighedToday && last !== undefined`. The `coach` cell is `undefined` until 6 sources load (`AppState.ts:444-453`), so on a weighed day with no trend yet, the empty "Weigh-in" field re-appears and invites a duplicate. Fix: branch on `weighedToday` alone, showing the day's weight when the trend is missing. React-Capacitor/QA to verify.

**PD-8 — could. Uneven vertical rhythm around the strip.** Classification: design improvement. Evidence: after capture: hero→strip gap ≈26 px, strip labels→group ≈13 px, so the strip visually binds to the weigh-in card rather than standing as its own tier. Strip width: dots run to the column edges (≈20→395 vs card 16→396), acceptable for canvas content, but the ringed today dot overhangs about 4 px further than the first dot. Fix: same section gap token above and below the strip; inset the strip so the ring's outer edge sits on the column.

**PD-9 — could. The switch's two segments are unequal.** Classification: design improvement. Evidence: after capture: "Grams" ≈65 px vs "Split" ≈53 px. Segments size to their words, so the switch now looks lopsided (before, "Share" made them roughly equal). Fix: equal segments for a 2-option segmented control, as a design-system rule.

## Dependencies
To coaching/safety (with measurement): on a no-weigh-in morning the Dashboard hides the trend weight entirely. Should the Weigh-in row's subtitle show the last trend ("Trend 184.1 lb"), or does showing a weight before weighing prime/compulsive-check? It decides whether the row reads "Weigh-in" alone or "Weigh-in · Trend …", which affects the row's hierarchy and trust. Return yes/no with reason.

## Research
Status: unnecessary. This is visual judgment against the repository's own direction; no empirical claim made.

## Confidence and limitations
Medium-high. Pixel positions are read from images, not measured. Light and Dark exist only for the after state. No 360×740 render, and none with a streak or insight in the not-weighed state. Self-review only, not independent evidence.

## Verification
Required of the edit owner:
- Not Weighed Today in 3 palettes after PD-3/PD-4.
- A 360×740 render with a streak and an insight (PD-5).
- A demo Dashboard after PD-6.
- A grep showing no "Share" remaining as the switch name in `design/`, `requirements/`, `HANDOFF.md`.

**Verdict: APPROVE WITH CHANGES.**

## Sources and evidence
The five captures and the source lines cited in each finding.

## Acceptance criteria and edge cases
From the required verification: Not Weighed Today in three palettes; 360 by 740 with a streak and an insight; the demo Dashboard with the streak in the group; no "Share" as the switch's name in `design/`, `requirements/`.

## Safety concerns
Not addressed by the reviewer in this run (the chair's prompt did not ask for the template's sections; noted in `decision.md`).

## Unresolved product decisions
Whether the Weigh-in row shows the last trend before the weigh-in (see Dependencies).

## Targeted challenges
None in this run.
