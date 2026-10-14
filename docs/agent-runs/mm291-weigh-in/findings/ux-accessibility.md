# UX & accessibility review (UX guard) — MM-290 / MM-291 / MM-292

Transcribed by the chair from the read-only subagent's hand-back, 2026-10-14: every finding, severity, piece of evidence and fix is kept; some sentences are condensed. The chair arranged it under the findings template's headings afterwards; text under a heading the reviewer did not write says so.

## Scope and traceability
- Role: ux-accessibility (UX guard), read-only subagent. Config read in full: `AGENTS.md`, `agents/roles/ux-accessibility.md`, `agents/panel-protocol.md`, `agents/review-contract.md`.
- Requirements: MM-290 `requirements/dashboard/BUG.macro-switch-says-share.MM-290.md`, MM-291 `requirements/dashboard/BUG.weigh-in-floats-on-the-canvas.MM-291.md`. MM-292/MM-293 not opened.
- Inputs: uncommitted working tree on `fix/dashboard-split-weighin-storybook` (base 0076621). SHA-256 hashes not computed (no command execution available); the chair records them.
- Audit mode: `change`: the proposed row plus the shared components it depends on (`NumberEntry`, `MmTextField`, `MmListRow`, `MmButton`, `MmSegmented`), the Dashboard's weigh-in→trend transition, and the `state.coach` derivation.

## Audit coverage
- Inspected: `apps/mobile/src/dashboard/WeighInRow.tsx`, `DashboardScreen.tsx`, `dashboard.css:14-23`; `apps/mobile/src/ui/NumberEntry.tsx`, `MmTextField.tsx`, `MmListRow.tsx`, `MmButton.tsx`, `MmListGroup.tsx`, `MmSegmented.tsx`; `ui.css` button/field/row/segment rules; `apps/mobile/src/food/CalorieHero.tsx`; `AppState.ts:436-455`; `Today.stories.tsx`, `notWeighedTodayScenario.ts`; `test/dashboard/dashboard.test.tsx:84-96`; `design/screen-direction.md:1-60`; all 5 captures.
- Not inspected: `hierarchyProblems` rule and test, `parseNumber`, MM-292/MM-293, `WelcomeBackScreen`/`ProgressScreen` (also use `NumberEntry`), `docs/agent-runs/mm291-weigh-in/`.
- Evidence methods: source inspection + supplied static Storybook captures. No runtime interaction, no TalkBack, no text scaling, no measured contrast, no 360×740 render.
- Could not verify: focus/announcement behaviour on device (TalkBack in the Capacitor WebView), keyboard covering the row, 200% font scale.

## Existing facts versus proposals
Facts: the cited source lines and the captures; the WCAG readings under Research. Proposals: every "Fix". UX-9 is an unverified hypothesis.

## Novice mobile experience (when UX/product design is assigned)
Walked from source and the after1 capture at 412×915; not observed on a device.
Persona: novice, morning, no weigh-in yet. Task: log the morning weight.
1. **Open Dashboard.** Sees hero, strip, then a card whose first row reads "Weigh-in" with scale icon, empty field "lb", grey Save, hint. The row sits at y≈660–780, inside the first viewport at 412×915. **Pass**: clear what's asked; the hint gives the method.
2. **Tap field.** Decimal keypad (`MmTextField.tsx:66`). Accessible name "Today’s weigh-in" contains the visible "weigh-in" (label-in-name OK). The hint is not exposed to AT (UX-2). **Pass visually / gap for SR.**
3. **Type 184.2.** Save turns Ember. Invalid input says "Enter a number above zero." under the field, `role="alert"`, linked via `aria-describedby` (`MmTextField.tsx:47-51,82-86`). **Pass.**
4. **Press keypad Done/Enter.** Nothing happens; the user must find Save (UX-3). **Mild fail.**
5. **Tap Save.** Focus is blurred deliberately (`NumberEntry.tsx:34`), the row unmounts, and the trend row appears in the same slot, but showing the **trend** figure, not 184.2, and nothing is announced (UX-1, UX-4). **Fail on result signal** (SR users and interpretation).
6. **Recovery if refused.** "That value looks off. Check it." under the field, focus stays. **Pass** (source).

Competing actions in view: Add food (header text action), Grams/Split switch, coach line, strip, waist row, tab bar. Save, when enabled, is the only Ember fill: consistent with direction rule 6.

## Findings

**UX-1 — should (high impact, daily recurrence). Usability problem found by inspection; ux-accessibility / react-capacitor.** `NumberEntry.tsx:33-34` blurs the active element after `onSave`; then `DashboardScreen.tsx:129-139` swaps `WeighInRow` for the trend `MmListRow`. The removed field took focus with it, and there is no `role="status"`/live region. WCAG 2.2 SC 4.1.3: a success result shown without moving focus is a status message and must be programmatically determinable (Understanding doc suggests `role="status"`, G199). Observed: SR user hears nothing; focus falls to the document. Expected: confirmation and a kept focus point. Not a regression (the old section also unmounted on save), but the new same-slot design makes the fix trivial. Fix: after a successful save on the Dashboard, move focus to the trend row (a `<button>` in the same slot), or have `NumberEntry` announce "Saved, 184.2 lb" through a polite status region that outlives the row. The welcome-back and Progress hero uses share the issue. BUG ticket + regression test asserting `document.activeElement` is the trend row or the status text is present after Save.

**UX-2 — should. Usability problem found by inspection.** The hint is a plain `<p>` (`NumberEntry.tsx:62`) with no id. `MmTextField` gets no `helper`, so `aria-describedby` carries only error/suffix (`MmTextField.tsx:47-51`). A SR user focusing the field hears "Today’s weigh-in, lb" but never "First thing in the morning, after the bathroom", which is the measurement method and matters for trend quality. Fix: give the hint an id and include it in the input's `aria-describedby` (either `MmTextField` accepts extra describedby ids, or `NumberEntry` passes the hint as `helper` and keeps the current placement). Test: `toHaveAccessibleDescription(/First thing in the morning/)`.

**UX-3 — should. Usability problem found by inspection.** `MmTextField.tsx:62-75` has no `enterKeyHint` and no Enter handling; `NumberEntry` has no form/submit path. The novice types the weight and presses the keypad action key: nothing. This is the most common single-field entry gesture and it is met every morning. Fix: in `NumberEntry`, Enter with a valid value calls `save`; set `enterKeyHint="done"` on the input (via the design-system field, not raw markup). Test: type 181.4, `{Enter}`, weight saved.

**UX-4 — should (needs chair consultation). Usability problem found by inspection.** After saving, the row title is `fmt.weight(last.levelKg)` (the trend) and the subtitle "Trend weight · Last 7 days ±x" (`DashboardScreen.tsx:130-133`). The user typed 184.2 and sees a different number in the slot where they just typed it. A novice cannot tell whether the entry was kept. That is a failing step per the contract ("cannot tell which value will be kept"). Fix depends on the consultation: subtitle naming today's entry ("Today 184.2 lb · Trend weight · …"), or a one-time "Saved 184.2 lb" status pairing with UX-1.

**UX-5 — should. Documentation or requirement gap.** `design/screen-direction.md:44-45` still says the macro picture is 'named "Grams" and "Share"'. `CalorieHero.tsx:44-45,77` comments say "share of calories". The canonical direction now contradicts MM-290; a future agent following it could revert. Fix: amend rule 4 to "Grams" and "Split" (split of calories), citing MM-290, in the same PR.

**UX-6 — could. Design/usability improvement.** "Split" is the established term and is visually self-explaining once chosen (it draws the donut). The switch already has a group name, `role="group" aria-label="Macro picture"` (`MmSegmented.tsx:21`, `CalorieHero.tsx:99`), with `aria-pressed` toggle buttons. But the heard string "Macro picture, Split, toggle button, not pressed" doesn't say what is split, and "Macro picture" is internal wording. Fix: group name "Show macros as" (or similar user wording); optionally have "Split" announce as "Split of calories". Keep visible "Grams | Split". Targets OK: segments are 48px min-height (`ui.css:697,710`).

**UX-7 — could. Usability problem found by inspection (heuristic; contrast not measured).** In the light capture, the empty field's fill (`--sunken`, `ui.css:299`) is nearly the same tone as the disabled Save (`--selected`, `ui.css:57`), so the field can read as disabled too. Disabled Save text (`--text3`) is exempt from SC 1.4.3 (inactive components). Its "not ready yet" meaning is conveyed by the fill change plus the field error text, not by colour alone. Fix: product-designer to confirm the light-palette field/disabled fills are visibly distinct; then measure the field border against the surface for SC 1.4.11 (3:1).

**UX-8 — could. Documentation or requirement gap (stories).** `Today.stories.tsx:24-29` shows only the empty state. No story for the row with a valid value typed (Save enabled), with "Enter a number above zero.", or with a refused save. The only catalog entry (`ComponentsCatalog.tsx:157`) has an initial value and sits outside a row. Fix: add state stories for the row's validation/error states, per the role's MM-237 duty.

**UX-9 — could. Unverified hypothesis requiring investigation.** (a) At 360×740 (direction rule 7's size), the hero plus strip likely push the weigh-in row under the tab bar. Estimated from 412×915 geometry: row top ≈ y660 vs nav ≈ 668, which would hide the morning's main task. Capture Not Weighed Today at 360×740. (b) `DashboardScreen.tsx:129` requires both `weighedToday` and `last !== undefined`. If `analyze` yielded an empty trend after a save, the empty weigh-in row would reappear and invite a duplicate entry. Appears unlikely from `AppState.ts:436-455` but unverified.

**Checked and passing (inspection):** the row is non-pressable while holding controls (`MmListRow` without `onPress` renders a `<div>`, `MmListRow.tsx:81-82`), so there are no nested interactives. Focus order is field → Save (skipped while disabled) → waist row, matching visual order. Target sizes: field 48px dense (`ui.css:308-309`), Save 48px (`ui.css:19`). No disabled primary in a hero (rule 6 holds). The error is spoken and linked.

## Dependencies
To coaching/measurement: right after a morning weigh-in, should the Dashboard row confirm today's raw entry (e.g. "Today 184.2 lb") alongside the trend, or must it show only the trend to avoid daily-fluctuation focus? This decides whether UX-4 is fixed in the row's text or only by a transient "Saved 184.2 lb" status (UX-1). Format: yes/no with rationale and any evidence. Product-designer: confirm light-palette fills (UX-7).

## Research
Status: performed (WCAG claims), direct WebFetch; no repository data sent. Accessed 2026-10-14:
- W3C, *Understanding SC 4.1.3 Status Messages* (WCAG 2.2), https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html: success results presented without focus change are status messages; suggests `role="status"`. When focus moves, the SC does not apply. Supports UX-1.
- W3C, *Understanding SC 1.4.3 Contrast (Minimum)*, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html: text in inactive components has no contrast requirement. Supports UX-7's context.
- W3C, *Understanding SC 2.4.3 Focus Order*, https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html: does not address removal of the focused element. The recommendation to move focus to the replacing row is interpretation, not quoted requirement.
Not researched: the 48dp target is the repo's own rule (no source retrieved). The novice reading of "Split" is analytical, not user research.

## Confidence and limitations
High on source-level semantics (UX-1/2/3/5); medium on UX-4/6/7; low on UX-9. No device/AT/scale testing; single-reviewer self-assessment.
QA note: MM-291 names `test/dashboard/weighInRow.test.tsx`, which does not exist in the working tree; coverage today is `test/dashboard/dashboard.test.tsx:84-96`.

## Safety concerns
None found within scope. UX-4 touches weight presentation; routed to coaching/measurement rather than decided here.

## Verification
Source inspection and static captures only; no tests run (outside role permissions).

**GUARD PASS** — no blocking findings. UX-1, UX-2, UX-3, UX-5 are "should" and should be ticketed before release (UX-1 and UX-3 as BUG tickets with regression tests; UX-5 fixed in this PR).

## Sources and evidence
The cited source lines, the five captures, and the three W3C pages under Research.

## Acceptance criteria and edge cases
From the findings: the hint is in the field's accessible description (UX-2); Enter with a valid value saves (UX-3); after a save a status names the number or focus lands on the trend row (UX-1); a refused save keeps focus in the field (walkthrough step 6).

## Unresolved product decisions
Raw entry versus trend after the save (UX-4, see Dependencies).

## Targeted challenges
None in this run.
