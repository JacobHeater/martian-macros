# Product-designer review: M2 design bugs (MM-336, MM-342, MM-351, MM-352, MM-373, MM-374, MM-324)

**Role:** product-designer, read-only. **Reviewer:** Claude Code subagent of the parent session, 2026-10-19. **Mode:** change; baseline `main` 39f315c, the working tree of `feat/m2`. **Render:** none; every story read from source, so every visual claim is a prediction from CSS and tokens.

## Walkthrough (two depth targets, source only)
**(a) Food, a glass of wine logged, Full detail.** Hero figure and caption; the picture switch and bars; under the bars two muted left-aligned lines, "Fiber: 22 g · guide 30 g" and "Alcohol: 109 kcal" (`FoodScreen.tsx:75-81`, `FiberLine.tsx:31-32`, `food.css:44-54`); whether the alcohol's kcal is already in the figure is unstated (chair request); the status row with its hairline, pressed, lands on the targets history. 1 press, 2 lines. The named story draws only one of the two lines (PD-4).
**(b) Coach, stalled over target.** Safeguards, hero, Goal, "Your targets" with a right-aligned caption under "Intended pace" (`CoachScreen.tsx:206-217`), the stall section, then "Your last 7 days": "Average intake / 2,350 kcal" with "against 2,100: 250 over" under it. The words are the voice guide's own. 4 rows, one with a detail. The scenario has 6 complete days, so "rests on" and "mostly estimated" are not drawn (PD-6).

## Findings
**PD-1. The hairline on every notice: right for info on the canvas, undocumented, and wrong inside a sheet well.** (a) documentation gap, low; (b) design improvement, medium; confidence high for the cascade. Caution and safeguard keep their own `border` (`ui.css:1088-1093`), so only the info kind gains the `--outline` edge, the hairline `.mm-list-group`, `.mm-surface` and `.mm-hero` carry: the sibling pattern on the canvas (rule 9; `design/color-and-theme-system.md:141-143`). (a) `design/screen-direction.md:296` still says Info has "no border". (b) On a sheet or dialog the notice is drawn on `--sunken` as a well (`ui.css:1084-1087`); a sunken well with a light rim reads as a raised card in Martian and Dark. Affected: `BarcodeScanStep.tsx:81,116` (`ScanUnknownCode`, `ScanNoCamera`), `FoodAmountStep.tsx:307`, `AddFoodSheet.tsx:465`, `EstimateMealStep.tsx:81`, `CustomFoodForm.tsx:176`. Recommend: keep the hairline on the canvas, drop it for the info kind on a sheet or dialog, update the direction, extend the guard.
**PD-2. Corner radius differs from the siblings the hairline was meant to match.** Low, medium confidence. `.mm-notice` uses `--radius-control` (12 px); groups and surfaces `--radius-group` (16 px in Light and Dark). `.mm-surface-compact` is a 12 px precedent. Owner's one-line decision: notice as a compact surface (keep) or a group peer.
**PD-3. The hero lines are a new pattern beside two existing ones, with no named sibling or written reason.** Medium (rule 9). The lines are bare muted paragraphs; their nearest siblings inside the hero are the macro rows (name left, `--text2` figures right; `MacroBar.tsx:27-40`, `ui.css:1252-1264`) and the status row. "Fiber: 22 g · guide 30 g" has the shape of a macro head. Recommend: ask whether each line should be a macro-head row without a bar; if the muted sentence stays, write the reason into MM-336.
**PD-4. The two-line hero state is drawn by no story.** Medium (MM-292). `FoodWithAlcohol` seeds no detail level, so it shows the alcohol line alone; `FoodFullDetail` does not exist by that name. Recommend: `detail: 'full'` on `FoodWithAlcohol`, or a second story; also the lines under the Micros panel.
**PD-5. Coach now has two patterns for "what the figure rests on".** Medium (rule 9). "Your targets" uses `app-caption coach-pace-detail` (0.75 rem, right-aligned); "Your last 7 days" the new `.mm-stat-detail` (0.875 rem, left, no type role). Recommend: `StatRow detail` as the one home, the pace caption moved onto it, and `.mm-stat-detail` in `var(--type-caption)`.
**PD-6. The detail the ticket describes is not the one its story draws.** Low. The three-part detail is undrawn; "No complete days" (16 characters), "7, 6 complete" and "5 of 6 days" keep words in the value column. Recommend: a story with 3 complete, mostly estimated days; consider "7" with detail "6 complete".
**PD-7. Two empty rows on the food database screen carry icons by different logic.** Low. "Nothing downloaded yet" carries `download` (a non-pressable row above the real download button); the other empty row carries `info`. Recommend `info` for both, or a written reason. `document` for an installed pack is right.
**PD-8. Mid-word breaks in the navigation labels at 200% are accepted by the ticket but unseen here.** Low, confidence low. The edit owner renders `FoodLargeText` and `DashboardLargeText` in the three palettes before closing.
**PD-9. A sibling announces the same way by a different means.** Low (MM-261). `PackDownloadCard.tsx:65,78` wrap notices in `div role="status"`; use `live`.

## Audit coverage
Source inspection of the components, CSS, tokens, stories, tests and tickets named in the brief, every `<Notice` and `<StatRow` call site, the three direction documents. Not inspected: any render; the in-memory preferences' default detail level (bears on PD-4); `WaterRow` beyond its action; the engine's numbers. Referrals: UX-accessibility (MM-351 semantics, the hyphenated labels); nutrition/coaching (the chair request). Blocked: all visual claims.

## Research
Unnecessary: every finding rests on the repository's own rules and tokens.

## Chair request
Does `intake.kcal` in the hero include the day's alcohol kcal, and does the Split picture exclude it (`FoodScreen.tsx:110-111`)? It decides whether the alcohol line needs "in the total", the donut a note, or neither.

## Safety, verification
None found; not clinical clearance. Tests read, not run; the edit owner runs `mm check` and the renders.
