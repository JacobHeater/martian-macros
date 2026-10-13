# UX & accessibility review — MM-253 component walk (design system, dialogs, sheets)

## Scope and traceability
- Role: ux-accessibility (read-only lens, not a credential). Reviewer: Claude subagent, this session. Audit mode: `domain` (every component in `apps/mobile/src/ui/`, the overlay host, dialogs and sheets), plus one bounded novice walkthrough.
- Requirement files inspected: `C:\Users\jacob\dev\martian-macros\requirements\usability\TASK.hierarchy-and-wayfinding-direction.MM-253.md` (seven rules, "The panel"), `C:\Users\jacob\dev\martian-macros\requirements\design-system\BUG.date-dialog-chevron-and-flat-surface.MM-260.md`.
- Design/guide inputs: `design/voice-and-wording.md`, `design/interaction-and-motion.md`, `AGENTS.md` (rule 8), `agents/roles/ux-accessibility.md`, `agents/panel-protocol.md`, `agents/review-contract.md`.
- Inspected commit: `1b70959` on `feature/mm260-own-chevron`, working tree clean at session start. Input SHA-256: not computed (no shell in this role); the chair should hash the files listed under "Files opened" when persisting.
- No commands run, no edits, no delegation.

## Existing facts versus proposals
Facts are source citations (file:line). Proposals are marked "Proposal". Nothing below was rendered or run; see Verification.

## Audit coverage
**Walked** (step record below): Settings > Reminders > change weigh-in time, through refusal and recovery (MmSwitchRow, MmListRow, MmTimeOfDayDialog, MmPickerField, MmDialog, MmOverlays snack).
**Surveyed** (read, per-component record below): every other file under `apps/mobile/src/ui/`.
**Uninspected:** `ChartsCatalog.tsx`, `IconsCatalog.tsx`, `TokensCatalog.tsx`, `.storybook/preview` (so whether component stories render in all three palettes is unverified); `mmIcons.tsx` beyond line 60; screen folders except the lines cited; `charts/`. No runtime, no TalkBack/switch-access, no 200% text or device check: every text-scaling and target-size statement is from the stylesheet, not a render.
**Cross-domain referrals:** React-Capacitor (focus containment, `<button>` with block content), product-designer (pressed state, sheet motion, chevron glyph consistency), coaching (the "typical 10 to 20" reference in `MuscleVolumeRow.tsx:34`).

### Files opened (all absolute, root `C:\Users\jacob\dev\martian-macros\`)
AGENTS.md; agents\roles\ux-accessibility.md; agents\panel-protocol.md; agents\review-contract.md; design\voice-and-wording.md; design\interaction-and-motion.md; requirements\usability\TASK.hierarchy-and-wayfinding-direction.MM-253.md; requirements\design-system\BUG.date-dialog-chevron-and-flat-surface.MM-260.md; apps\mobile\src\ui\ui.css; apps\mobile\src\ui\{ChoiceCard, DayStepper, DemoNotice, DownloadStatusStrip, GroupHeader, HorizonArc, InfoCard, MacroBar, MacroFigure, MetricFacts, MmActionChip, MmAppBar, MmButton, MmCheckRow, MmChoiceChip, MmClockTimeDialog, MmDateDialog, MmDialog, MmDisclosure, MmDropdown, MmFab, MmFooterActions, MmHeroSurface, MmIcon, MmIconButton, MmListGroup, MmListRow, MmMenuButton, MmNavigationBar, MmOption, MmOverlays, MmPickerField, MmPressable, MmProgressBar, MmSegmented, MmSheet, MmSlider, MmSliderRow, MmSpinner, MmStatusChip, MmSurface, MmSwipeToRemove, MmSwitchRow, MmTextField, MmTimeOfDayDialog, MuscleVolumeRow, Notice, NumberEntryCard, SectionLabel, StatRow, StatusRow, StepProgress, StrengthTrendCard}.tsx; apps\mobile\src\ui\mmIcons.tsx (lines 1-60); apps\mobile\src\ui\{MacroKind, MmButtonKind, MmIconButtonKind, MmIconName, MmMenuItem, MmNavDestination, MmSegment, MmSurfaceKind, MmTextFieldKind, NoticeKind, Overlays, OverlaysContext, useOverlays}.ts; apps\mobile\src\theme\tokens.css; apps\mobile\src\theme\base.css; apps\mobile\src\gallery\{Fields.stories, Components.stories, Bars.stories, FieldsCatalog, ComponentsCatalog, BarsCatalog, SlidersCatalog}.tsx; apps\mobile\src\gallery\gallery.css; apps\mobile\src\gallery\screens\Settings.stories.tsx; apps\mobile\src\gallery\screens\FirstRun.stories.tsx (55-84); apps\mobile\test\ui\{components.test, dateDialog.test, demoAndCatalog.test, mmIcon.test}.tsx; apps\mobile\test\ui\{focusRing.test, flatFab.test}.ts; apps\mobile\test\gallery\stories.test.tsx; apps\mobile\src\settings\RemindersSection.tsx; apps\mobile\src\settings\EditHeightSheet.tsx; apps\mobile\src\onboarding\BirthDateStep.tsx; apps\mobile\src\onboarding\OnboardingScreen.tsx (90-134); apps\mobile\src\train\WorkoutTimesScreen.tsx (40-84); apps\mobile\src\train\SetEditor.tsx (100-129); apps\mobile\src\food\MealSection.tsx (96-121); apps\mobile\src\app\HardwareBack.tsx; apps\mobile\src\format\clockTimeText.ts; apps\mobile\src\format\Fmt.ts (100-113). Greps across `apps/mobile/src` for overlay calls, `:active/:hover`, live regions, `inert`, component usages.

## Novice mobile experience — task walkthrough (walked)
**Person and goal:** someone on their first week, Settings, wants the weigh-in reminder at 6:30 AM; then tries 10:30 PM (recovery path). Inputs: source only; the Settings stories exist (`Settings.stories.tsx:19-31`) but none opens the time dialog, so no render of the dialog was available. Entry count from source: switch (1), row (1), native picker hour/minute/AM-PM (3), OK/Cancel (1) = 6 decisions.

1. Sees "Weigh-in" switch with subtitle (`RemindersSection.tsx:69-74`). Must know the time row appears only after turning it on (`:75-83`). Sign it worked: the "At 7:00 AM" row appears. Passes. (Permission denied → snack `:35`, no retry affordance; surveyed.)
2. Presses "At 7:00 AM" (dense row, timer icon, chevron). Dialog titled "Weigh-in reminder" (`:53`), a field box with the phone's time control and our chevron, Cancel/OK. Focus lands on the input (`MmDialog.tsx:20-21`). Passes.
3. Taps the field; Android draws its own clock picker (platform-drawn by design, MM-260). Picks 6:30. Back in the dialog the field shows the engine's own rendering of the value ("06:30" or "6:30 AM" by device 24-hour setting — hypothesis, not rendered). Nothing else in the dialog says the value back (`MmTimeOfDayDialog.tsx:36-37`: the picker field is the only child; contrast `MmDateDialog.tsx:54-62`). **Marginal:** which value will be kept is readable only from the native text; interpretation burden depends on device locale.
4. Presses OK → dialog closes, row reads "At 6:30 AM" (`:79`). Passes.
5. **Recovery:** picks 10:30 PM, OK. The dialog closes first (`onDone` → `finish`), then a 4-second snack "Reminders are not sent between 9 pm and 7 am." (`RemindersSection.tsx:56-58`, `MmOverlays.tsx:14,152-156`). The row still says 6:30 AM; the chosen value is gone; to retry they reopen the dialog, which starts again from the saved value (`MmTimeOfDayDialog.tsx:18`). Nothing in the dialog stated the allowed hours beforehand. A person who looked at the phone a moment later sees the old time and no reason. **Fails** (no adjacent sign of the result, entered value not preserved, rule not stated up front — `interaction-and-motion.md:56` "Error copy says what failed and what to do; preserve entered values"). → UX-1.
6. Cancel, Escape, scrim tap and hardware back all return unchanged (`MmDialog.tsx:30-32,41-46`, `HardwareBack.tsx:18`). Passes.
7. Edge: if the value is cleared (desktop keyboard), OK does nothing and says nothing (`MmTimeOfDayDialog.tsx:22`). Fails: inert action unexplained. → UX-2.

Evidenced burdens: steps 5 and 7 (source). Hypotheses: step 3 value format. No cross-domain consultation was needed for this trace.

## Findings
Classification key: RID = reproducible implementation defect (by source), UPI = usability problem found by inspection, DRV = design-rule violation (repository design doc), GAP = documentation/requirement gap, HYP = unverified hypothesis. Outcome: "ticket" = bug ticket with a regression test; "accept" with reason.

**UX-1** `MmTimeOfDayDialog.tsx:17-38`, `RemindersSection.tsx:56-58` — UPI, **high**, confidence high. The time dialog has no read-back of the value, no range, no inline refusal; the refusal arrives as a 4 s snack after the dialog closed and the value is lost. Rules: `interaction-and-motion.md:56`; WCAG 3.3.1, 3.3.3; MM-260's own fix for the sibling dialog. Remediation (proposal): give `MmTimeOfDayDialog` optional `first`/`last` minutes and say the time back in words via `clockTimeText` ("6:30 AM") under the field, as `MmDateDialog` does; when outside the range, say the range as `role="alert"` and leave OK inert; the screen then no longer needs the snack. Outcome: **ticket** (test: time said back; out-of-range alert and inert OK; value preserved).

**UX-2** `MmTimeOfDayDialog.tsx:20-24` — UPI, medium, high. Empty/unparseable value: OK silently does nothing. Rule: inert action explains itself (MM-260 pattern). Remediation: "Enter a time." alert as the date dialog's "Enter a full date." Outcome: **ticket** (fold into UX-1's test).

**UX-3** `MmPickerField.tsx:35,45-49`, `ui.css:287-290` — RID, medium, high. The doc comment says "pressing anywhere in the field opens the native picker", but `onClick={open}` is on the `<input>` only; the box (`cursor: pointer`) and the chevron span (20 px icon + 8 px gap + 12 px inset ≈ 40 px at the end of the field) have no handler. The chevron that was drawn to signal "press here" is dead. Rule: WCAG 2.5.8 spacing is met, but the visible affordance does not act. Remediation: move `onClick` to the box (or make the chevron forward to `open`). Outcome: **ticket** (test: click on `.mm-picker-chevron` calls `showPicker`/focus).

**UX-4** `MmPickerField.tsx:34-50` — UPI, low, high. No visible label of its own (only `aria-label`); inside a dialog the title stands in, but in `FieldsCatalog.tsx:17-18` the two pickers sit unlabeled beside labeled text fields. Rule: WCAG 3.3.2. Remediation: optional visible `.mm-field-label` wired by `htmlFor`, as `MmTextField`. Outcome: **accept** for dialog use (title labels it), **ticket** if the field is ever placed on a screen.

**UX-5** `MmDialog.tsx:18-25,41-46`, `MmSheet.tsx:15-21,36-41` — RID, medium, high (source), medium (impact). No focus containment: Tab/Shift+Tab leave the dialog into the screen beneath, and the Escape handler is on the panel, so once focus has left, Escape no longer closes it. `aria-modal` hides the background from screen readers but not from keyboard/switch access (`inert` is used nowhere: grep). Rule: WAI-ARIA APG modal dialog ("Tab and Shift+Tab do not move focus outside the dialog"); WCAG 2.4.3. Remediation: set `inert` on the sibling app root while an overlay is up (React-Capacitor to confirm), or wrap focus. Outcome: **ticket** (test: Tab from the last control returns to the first; Escape closes with focus anywhere inside).

**UX-6** `MmOverlays.tsx:97-108` — UPI, medium, high. The `options` dialog has no actions at all: no Cancel/close. Leaving without choosing requires knowing to tap the scrim, press Escape or hardware back. Rule: APG recommends a visible close; `interaction-and-motion.md:48` requires a visible close on sheets. Remediation: a text "Cancel" action. Outcome: **ticket** (test: Cancel present, resolves undefined).

**UX-7** `MmSheet.tsx:43`, `ui.css:1068-1077`; `EditHeightSheet.tsx:35-48` — DRV, medium, high. The sheet draws a drag handle but handles no pointer events (no drag-to-dismiss), no rise motion, and guarantees no visible close action: `EditHeightSheet` has only "Save" (inert until 100-250 cm, with no helper saying so). Rule: `interaction-and-motion.md:48` ("dismissible by drag, back, and a visible close action"), 56 (inert action explained). Remediation: `MmSheet` renders its own close (icon button "Close" or text Cancel) or requires one; the handle either drags or goes; `EditHeightSheet` gains a helper ("Between 100 and 250 cm") and Cancel. Outcome: **ticket** for the close action and the height helper; motion → product-designer (surveyed).

**UX-8** `MmOverlays.tsx:14,152-156,168-177` — DRV, medium, medium. Snack auto-dismisses in 4 s even when it carries the only Undo for a delete; no way to extend or dismiss by hand. Rules: `interaction-and-motion.md:87` "Nothing is time-limited"; WCAG 2.2.1 Timing Adjustable (a content-set limit with no turn-off/adjust/extend). TalkBack users need longer to reach "Undo". Remediation: no timeout while an action is present (dismiss on action, on next snack, or on a close), or ≥ 10 s plus pause on focus/hover. Outcome: **ticket** (test: a snack with an action is still present after 4 s).

**UX-9** `MmDropdown.tsx:23-38`, `ui.css:279-282` — DRV (owner's rule from MM-260: "the platform draws nothing"), medium, high. Raw `<select>` with `appearance: auto`: the engine draws its own indicator in the field box, and Android WebView opens its own list. Also no `:disabled` rule for `.mm-select`/`.mm-field-input` (grep), so the "off" state is the browser's grey. Remediation: `appearance: none` plus our chevron, as `MmPickerField`; keep the native list (it is accessible); or route to the `options` dialog (MM-261 says that is "the one way a dialog offers a choice from a list"). Outcome: **ticket** (test mirrors `dateDialog.test.tsx:36-49`).

**UX-10** `MmCheckRow.tsx:13`, `ui.css:445-451` — DRV, low, high. Native checkbox (20 px, `accent-color` only) drawn by the engine, in the health-conditions list. The row is the 48 px target (label wraps it), so operability is fine. Outcome: **owner decision**: ticket under the "platform draws nothing" rule (draw it like `.mm-switch`), or accept because the row is the target and the native box follows `color-scheme`.

**UX-11** `MmSlider.tsx:18-30`, `ui.css:512-517` — DRV, low, high. Native `<input type="range">`: track and thumb are the engine's; the thumb's size is below 48 dp (user-agent exception of WCAG 2.5.8 is lost once `accent-color`/`min-height` modify it — interpretation). `aria-valuetext` is optional and absent at `SettingsScreen.tsx:110-118` (value is in the row title, visible). Outcome: **accept** for operability (keyboard arrows native, 48 px tall hit area), **owner decision** on drawing it; propose making `label` required so every slider speaks its value.

**UX-12** `ui.css:503-506` (compact segments 40 px), `ui.css:453-457` (`.mm-chip` 32 px, used by `MmActionChip` on `AddFoodSheet.tsx:678`, `EasyToMissLine.tsx:49-52`) — DRV, low, high. Under the repo's 48 dp rule (`interaction-and-motion.md:84`); meets WCAG 2.5.8 (24 px). Outcome: **ticket** or written accept per the owner; propose 48 px min-height for action chips, keep compact segments only beside headings with spacing ≥ 8 px.

**UX-13** `ui.css:479-506` — HYP (clipping at 200%), low, medium. `.mm-segmented` is `inline-flex; overflow: hidden` with non-wrapping segments; long labels ("Kilograms") at 200% text are likely clipped. WCAG 1.4.4. Also `.mm-menu-item` `white-space: nowrap` in a right-anchored 180 px list (`ui.css:615-641`). Outcome: chair to render the Components story at 200% zoom; ticket if clipped.

**UX-14** `base.css:34` (`-webkit-tap-highlight-color: transparent`) plus only one `:active` rule in `ui.css:157-162` — DRV, medium, high. With the platform's tap highlight removed and no pressed state on `.mm-button`, `.mm-chip`, `.mm-list-row-button`, `.mm-option`, `.mm-pressable`, `.mm-segment`, `.mm-nav-destination`, a tap on Android gives no visual feedback at all. Rules: `interaction-and-motion.md:40` ("Ember button depresses to 98% in fast"), `:53` ("Immediate pressed state on every control"). Outcome: **ticket** (stylesheet test: every pressable class has an `:active` rule; reduced-motion keeps a non-moving change).

**UX-15** `MmTextField.tsx:52`; `ui.css:222-275` — GAP, low, high. `aria-label={name}` replaces the visible label when both are given (WCAG 2.5.3 risk; no current caller passes both — grep). The field has no error state and no disabled rule; MM-253 asks for "rest, focus, pressed, disabled, error" per component. The warning helper is not `aria-invalid`/live. Outcome: **ticket** (add `error` prop with `aria-invalid` + `aria-describedby`; compose `name` as "label, name" rather than replace).

**UX-16** `NumberEntryCard.tsx:28-35,43` — UPI, medium, high. Validation failure goes to a 4 s snack, not adjacent to the field; the field is not marked invalid; `blur()` sends focus to body before the snack. Save is inert for `≤ 0`/non-number with no explanation beside it. Rules: `interaction-and-motion.md:56`; WCAG 3.3.1, 2.4.3. Remediation: use `MmTextField` `helper`/`helperIsWarning` (and UX-15's error) for the message; do not blur. Outcome: **ticket** (test: message rendered in the card and described to the field).

**UX-17** `MmClockTimeDialog.tsx:55-57` — UPI, low, high. Accessible names "Min" and "Sec" are abbreviations (TalkBack says "min", ambiguous with minimum). `MmTextField` already supports `name`. Remediation: `name="Minute"`, `name="Second"` with the short visible label — note this conflicts with UX-15's "label in name" unless composed. Also the alert after OK does not point focus or `aria-describedby` at the field in error (`:68-72`). Outcome: **ticket**, small.

**UX-18** `MmMenuButton.tsx:21-34,50-66` — UPI, low, high. On open, focus stays on the trigger; no arrow-key movement; Escape after tabbing into an item unmounts the focused element (focus falls to body). Tab reaches items, so operable. Rule: APG menu button. Outcome: **accept now** (operable by Tab; test covers Escape), propose focus-first-item and return-to-trigger as a design improvement ticket.

**UX-19** `MetricFacts.tsx:8-11` — RID, low, high. `<dd>` precedes `<dt>` inside `<dl>`; invalid grouping, screen readers may not pair value with label. WCAG 1.3.1. Remediation: `dt` first with CSS order, or `dl` → labeled spans. Outcome: **ticket**.

**UX-20** `MmSurface.tsx:21`, `MmHeroSurface.tsx:25`, `MmPressable.tsx:22-29`, `InfoCard.tsx:16-19` — HYP/GAP, low, medium. A `<button>` wrapping headings and paragraphs: with `label` unset the accessible name is the whole content (a hero reads as one long name); with `label` set the content is not read at all. Block content in `<button>` is also invalid HTML. Outcome: React-Capacitor consultation; propose `aria-describedby` to the content when `label` is set.

**UX-21** `MmSpinner.tsx:5`, `ui.css:524-541` — DRV, low, high. Perpetual rotation; under reduced motion it still rotates (4 s). `interaction-and-motion.md:11,15`. Outcome: **accept** if the owner keeps a spinner for backup/restore only (allowed at `:65`); propose static under reduced motion.

**UX-22** `DownloadStatusStrip.tsx:22-24` — HYP, low, medium. `role="status"` text re-announces every percent change; chatty under TalkBack. Outcome: chair to verify on device; propose announcing at 25% steps.

**UX-23** `DayStepper.tsx:18-22` — UPI, low, high. The day label becomes a button whose name is "Yesterday"; nothing says pressing it returns to today. Outcome: **accept** as discoverable only by trying; propose name "Yesterday, back to today" — wording to product-designer.

**UX-24** `StrengthTrendCard.tsx:34-37,41,80-83` — UPI (voice rule 1, MM-253 rule 1), low, high. "e1RM", "RIR 5+", "Smoothed e1RM" unexplained inline for novices; four-line captions inline rather than one tap down. Outcome: proposed requirement ticket under MM-254..259 rebuild; out of this component pass otherwise.

**UX-25** `tokens.css:69-98` — computed non-text contrast, low, medium. Light palette `--outline-strong` #7c88a3 on `--sunken` #e8ecf5 (field border) computes to about 3.0:1 — on the WCAG 1.4.11 line; on `--track` #ebeff7 (switch off border) about the same. Computed from hex, not measured on a render. Outcome: chair to measure in the Tokens story; ticket if below 3:1.

**UX-26** Story coverage — GAP, low, high. No story opens `MmTimeOfDayDialog`, `MmClockTimeDialog`, `confirm`, `choice`, `options` or the snack (grep of `overlays.*(` in `gallery/`: only `date` and `sheet`); `MmMenuButton`, `MmFab`, `MmSwipeToRemove`, `MmFooterActions`, `MmPickerField` disabled/empty state and `MmTextField` error/disabled are absent from `ComponentsCatalog.tsx`. MM-253 says no component is fine because it was not looked at. Outcome: **ticket** (stories; `stories.test.tsx` already fails a story that does not draw).

### Components with no finding (surveyed; says nothing beyond this method)
MmButton (48 px, disabled when inert, label always), MmIconButton (48 px, aria-label), MmFab (visible label), MmSwitchRow (own drawing, `role=switch`, row is target, reduced motion handled; name includes subtitle — verbose, accept), MmChoiceChip (48 px, `aria-pressed`, check glyph is CSS text not `MmIcon` — product-designer), MmStatusChip (inert span), MmSegmented non-compact (group + pressed + check icon), MmOption (`role=option`, "Chosen" said), MmDisclosure (expanded/controls/hidden), MmListRow/MmListGroup (no nested buttons in `MealSection.tsx:102-118`; `trailingAction` kept outside the button), MmNavigationBar (`aria-current`, ≥ 72 px, five across 360 px ≥ 48 px each), MmAppBar (h1), GroupHeader/SectionLabel (h2/h3), ChoiceCard (pressed + icon + border), HorizonArc/StepProgress/MuscleVolumeRow (`role=img` with text), MacroBar/MacroFigure/StatRow/StatusRow (text beside color), MmProgressBar (hidden, text by caller), Notice (word + icon), DemoNotice, MmSwipeToRemove (accelerator with visible menu alternative at `MealSection.tsx:109-116`; WCAG 2.5.1 met), MmDateDialog (MM-260 fix holds in source; proposal: `aria-describedby` from the input to the detail/alert line, `aria-invalid` when out of range), MmFooterActions. Text sizing: all type tokens are rem (`tokens.css:114-125`); fixed-px values are containers with `min-height`, which grow.

## Research
Status: **performed** (known-URL retrieval via WebFetch; no web search needed). Triggers: target-size threshold (disputed 24 vs 44/48), modal-dialog focus containment, `showPicker` behaviour, 1.4.4 failure conditions. Direct path, this session.

## Sources and evidence (accessed 2026-10-13)
- W3C, Understanding SC 2.5.8 Target Size (Minimum), updated 11 May 2026 — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — 24×24 CSS px, Level AA; spacing and user-agent exceptions. Supports UX-10/11/12 classification (repo rule stricter than WCAG).
- MDN, HTMLInputElement.showPicker(), modified 13 Mar 2026 — https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker — requires transient activation, throws NotAllowedError otherwise; date/time supported; per-browser table not in the fetched text, so Android WebView version unconfirmed. Supports UX-3 (a click handler is the right trigger).
- W3C WAI-ARIA APG, Modal Dialog pattern (page dated © 2026) — https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/ — Tab/Shift+Tab contained, Escape closes, focus returns to opener, visible close recommended. Supports UX-5, UX-6, UX-7.
- W3C, Understanding SC 1.4.4 Resize Text, updated 06 Sep 2026 — https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html — clipping/truncation at 200% is failure F69. Supports UX-13 framing.
No empirical user studies consulted; no claim here rests on one. `docs/evidence.md` not consulted (no health claim made).

## Confidence and limitations
High on source facts (lines cited); medium on impact of UX-5/8/13/25 without a render or assistive technology; low on UX-22. Self-review only; no rendered screen, no device, no TalkBack, no 200% check, no contrast measured on pixels (UX-25 is arithmetic from tokens). Three-palette verification of component stories not performed (preview not read).

## Acceptance criteria and edge cases
Existing: MM-260's four scenarios trace to `dateDialog.test.tsx` (holds). MM-253 "Every component was looked at": this report is the UX half for the listed files; palettes remain for the chair. Proposed (labelled): time dialog says the time back and refuses out-of-range inline (UX-1/2); picker chevron opens the picker (UX-3); Tab stays inside an overlay (UX-5); every pressable has a pressed state (UX-14); snack with action does not expire (UX-8). Edge cases: empty picker value; device 24-hour setting; 200% text in segmented/menu; delete-then-Undo with TalkBack; disabled `select`.

## Dependencies
react-capacitor (UX-5 `inert`, UX-20 button content), product-designer (UX-7 motion, UX-12 sizes, UX-14 pressed look, chip glyph), qa (render at 200%, contrast measurement), coaching (MuscleVolumeRow reference range wording — bounded question below).

## Safety concerns
None found in these components; not clinical clearance. UX-10 touches the health-conditions checklist (`HealthStep`) — any redraw must keep its checked state obvious without color alone.

## Unresolved product decisions
1. Does "the platform draws nothing" (MM-260) extend to `<select>`, checkbox and range (UX-9/10/11)? Owner.
2. Is 48 dp the floor for action chips and compact segments, or is WCAG's 24 px with spacing accepted (UX-12)? Owner.
3. Snack timing with an action (UX-8): no timeout vs ≥ 10 s. Owner.

## Bounded chair requests
- coaching: "Is 'Typical reference 10 to 20' hard sets (`MuscleVolumeRow.tsx:9-11,34`) a required, uncertain or actionable figure for a novice, and should the bar say 'typical' in words?" Affects whether that caption becomes a disclosure under MM-253 rule 1.
- qa/edit owner: render Components, Fields and Settings/DateOfBirth stories at 200% zoom in Martian, Dark, Light; measure UX-25; try UX-3 on an Android build.

## Verification
Tests inspected (not run): `components.test.tsx`, `dateDialog.test.tsx`, `focusRing.test.ts`, `flatFab.test.ts`, `demoAndCatalog.test.tsx`, `mmIcon.test.tsx`, `stories.test.tsx`. No test covers focus containment, pressed states, snack timing, time read-back, picker-chevron press or `MetricFacts` order. Nothing executed; read-only role. Recommendations above are proposals, not executions.

## Novice mobile experience (when UX/product design is assigned)
Covered above under "## Novice mobile experience — task walkthrough (walked)". Heading added by the chair for the template.


## Sources and evidence
Listed above under "## Sources and evidence (accessed 2026-10-13)": W3C SC 2.5.8, MDN showPicker, WAI-ARIA APG modal dialog, W3C SC 1.4.4, each with its URL. Heading added by the chair for the template.


## Targeted challenges
None were put to this reviewer in a second round. Added by the chair.

