# Review report — react-capacitor — MM-253 component walk (implementation side)

## Scope and traceability

- Role: `react-capacitor` (agents/roles/react-capacitor.md). Reviewer: Claude Code subagent, read-only; nothing edited, no commands run, no delegation.
- Repository: `C:\Users\jacob\dev\martian-macros`, branch `feature/mm260-own-chevron`, HEAD `1b70959` at start, status clean at start. **The working tree changed during the review**: my first read of `apps/mobile/test/architecture.test.ts` was 184 lines with no MM-261 rule; a later grep and re-read showed the 276-line version with `controlHomes`/`composites` (lines 42-99, 199-220, 256-264). `apps/mobile/src/ui/MmOverlays.tsx` likewise changed at line 6 (`MmIcon` -> `MmOption`) between a read and a grep. Everything below is against the **later** state (MM-261 applied, `MmOption.tsx` present). SHA-256 of inputs not computed (no execution surface); the chair should hash the final tree.
- Requirement files inspected: `requirements/usability/TASK.hierarchy-and-wayfinding-direction.MM-253.md`, `requirements/design-system/BUG.date-dialog-chevron-and-flat-surface.MM-260.md`, `requirements/architecture/BUG.a-raw-control-could-live-outside-its-component-in-the-design-system.MM-261.md`. MM-246 and MM-239/MM-240 referenced via the tests and HANDOFF, not opened.
- Base path for short references below: `C:\Users\jacob\dev\martian-macros\apps\mobile\` (so `src/ui/X.tsx:n`, `test/…`).

## Existing facts versus proposals

### Facts (source inspection)

**(1) Native controls in `src/ui/`, file by file**

| Control | File:line | Home or composite |
|---|---|---|
| `<input type="text">` | `src/ui/MmTextField.tsx:45` | home (`controlHomes.text`) |
| `<input type={kind}>` (date/time) | `src/ui/MmPickerField.tsx:36` | home |
| `<input type="range">` | `src/ui/MmSlider.tsx:19` | home |
| `<input type="checkbox" role="switch">` | `src/ui/MmSwitchRow.tsx:20` | home, but it is a row (title+subtitle+control) |
| `<input type="checkbox">` | `src/ui/MmCheckRow.tsx:13` | home, also a row |
| `<select>`/`<option>` | `src/ui/MmDropdown.tsx:23,34` | home |
| `<label>` | `MmTextField.tsx:40`, `MmDropdown.tsx:19`, `MmSwitchRow.tsx:15`, `MmCheckRow.tsx:12` | not in any map |
| `<button>` (18 sites, 16 files) | `ChoiceCard.tsx:16`, `MmButton.tsx:23`, `MmChoiceChip.tsx:12`, `MmActionChip.tsx:6`, `MmListRow.tsx:58,69`, `MmIconButton.tsx:18`, `MmHeroSurface.tsx:25`, `MmSurface.tsx:21`, `MmSegmented.tsx:25`, `MmFab.tsx:17`, `MmPressable.tsx:22`, `MmOption.tsx:17`, `MmMenuButton.tsx:38,53`, `MmDisclosure.tsx:29`, `MmNavigationBar.tsx:21`, `StatusRow.tsx:17` | homes: MmButton, MmIconButton, MmPressable. Own-shape pressables: Fab, chips, Segmented, NavigationBar, Option, ChoiceCard, Disclosure toggle, ListRow. Composites that nonetheless write a `<button>`: **MmSurface, MmHeroSurface** (a surface that is pressed = MmPressable's job, MmPressable.tsx:14-18 says it is "the one way"), **MmMenuButton** (re-implements MmIconButton's markup and class at :38-49; menu items raw at :53-64), **StatusRow** (a pressable row with icon and chevron = MmListRow+onPress). |
| `<textarea>`, `<dialog>`, `<progress>`, `<meter>`, `<form>`, radio, file | none in `src/ui/` | MmDialog/MmSheet are `div role="dialog"` (`MmDialog.tsx:34-47`, `MmSheet.tsx:29-42`); MmSpinner `span role="progressbar"`; MmProgressBar aria-hidden spans. |

Composites that compose other components and hold no control: MmDateDialog, MmTimeOfDayDialog, MmClockTimeDialog, MmOverlays (but draws the snack and the listbox container inline, `MmOverlays.tsx:98-107,164-180`), MmDialog, MmSheet, NumberEntryCard, StrengthTrendCard, InfoCard, DayStepper, DownloadStatusStrip, MmSliderRow, MacroBar, MmListGroup, MmFooterActions. Screens: grep of `src/**` outside `ui/` for `<label|<form|<a|role="button"|onClick=` found nothing, so nothing dodges the rule with a div.

**(2) What the engine draws that CSS does not control** (all paths `src/ui/ui.css` unless stated)

| Surface | State | Where |
|---|---|---|
| Date/time picker indicator | hidden; `appearance:none` + `-webkit-appearance:none`; value aligned start; `color-scheme` per palette; the popup itself stays native by design | `:294-295`, `:304-307`, `:308-310`, `:299-302` |
| `<select>` arrow + popup | **platform-drawn**: `.mm-select { appearance: auto }` — explicitly native | `:279-282` |
| Range thumb/track | **platform-drawn**, tinted only: `accent-color`, no `appearance` | `:512-517` |
| Checkbox glyph | **platform-drawn**, tinted only: `accent-color`, no `appearance` | `:445-451` |
| Switch | ours: `appearance:none` + `::after` thumb; **no `-webkit-` prefix** (picker has it) | `:407-441` (416) |
| Radio glyph | none exist (MmSegmented is buttons, `MmSegmented.tsx:25-38`) | — |
| Autofill background | **no `:-webkit-autofill` rule anywhere** (grep of all `.css`); `autoComplete="off"` only on MmTextField (`MmTextField.tsx:51`) | — |
| Focus ring | global 2px ring `src/theme/base.css:43-46`; removed on `.mm-field-input` (text, select, picker) `:262-264`, dialog/sheet panels `:928-931`; buttons, switch, checkbox, slider keep the global ring; date-segment highlight on desktop is the browser's (MM-260 ticket, Progress) and Android has no segments | guarded by `test/ui/focusRing.test.ts` |
| Placeholder colour | `.mm-field-input::placeholder` `:265-267` (text + picker); select has none | |
| Scrollbars | unstyled; `color-scheme` on `.theme-*` (`src/theme/tokens.css:35,66,97`) so Chromium draws palette-matched ones; dialog/sheet scroll `:920`, `:1064` | |
| Tap highlight | `-webkit-tap-highlight-color: transparent` on `body` only (`base.css:34`); the property inherits in Blink/WebKit | |
| Text size adjust | unset; viewport `width=device-width` (`index.html:5`, grep); every field font 1rem `:258` so iOS does not zoom on focus | |
| Overscroll | `overscroll-behavior: none` on `body` only (`base.css:35`); inner scrollers unset | |
| touch-action | swipe row only `:1113` | |
| user-select / touch-callout | unset anywhere (grep) | |
| Button UA chrome | every pressable class sets border/background (`:15-20`, `:51-53`, `:86-87`, `:341-342`, `:361-363`, `:457-460`, `:494-495`, `:607-609`, `:634-635`, `:702-705`, `:780-781`, `:971-972`); `base.css:38-41` font/colour inherit | |

**(3) The MM-261 check as written** (`test/architecture.test.ts`): `controlHomes` keys are input `type`s plus `select`/`textarea` (`:49-61`); `composites` is five named files (`:64`); `controlsIn` scans `<(input|select|textarea)\b([^>]*)>` (`:67-80`); a composite is checked with the broad `rawControls` regex (`:85`). `<button>` and `<label>` have no home; the three date/time dialogs and the other composers are not on `composites`; `radio`, `search`, `datetime-local` name homes that do not render them.

**(4) API**: `MmProgressBar` takes `color: string` (CSS colour) and `height: number` (`MmProgressBar.tsx:8-13`); callers `MacroBar.tsx:39` (`var(--${macro})`), `DownloadStatusStrip.tsx:28` (4). `MmIcon` takes `size` in px (`MmIcon.tsx:5`) and screens pass it (`src/food/MealSection.tsx:74,81`). `label` means visible text in MmButton/ChoiceCard/MmChoiceChip/MmTextField, spoken-only in MmPickerField/MmSheet/MmSurface/MmPressable/MmIconButton/MmMenuButton, and `aria-valuetext` in MmSlider/MmSliderRow (`MmSlider.tsx:12-13`, `:23`). Chosen state is `selected`/`chosen`/`current`; selecting is `onPress`/`onSelect`. `onPress` undefined means "off" in MmButton/MmIconButton but "not pressable" in MmSurface/MmHeroSurface/InfoCard/MmListRow. Row markups: `.mm-list-row` (div/button) and `.mm-toggle-row` (label) share one rule (`:333-346`) but two markups; StatusRow is a third pressable row (`:773-797`). Eleven screen sites draw the "opens" chevron themselves via `trailing={<MmIcon name="chevronRight" />}` (e.g. `src/settings/SettingsScreen.tsx:49`, `src/train/TrainScreen.tsx:77`, `src/coach/ReportsCard.tsx:26`, `src/about/HowThisWorksScreen.tsx:32`). Exports: by inspection every ui file exports one declaration (or type+value: `MacroKind.ts`; constants: `mmIcons.tsx`); private helper `two` is duplicated in `MmClockTimeDialog.tsx:17` and `MmTimeOfDayDialog.tsx:14` (also `src/domain/CalendarDate.ts:98`, `src/format/clockTimeText.ts:1`). `ui.css` defines `.mm-button`, `.mm-surface`, `.mm-app-bar-title` twice (`:9-21`/`:133-136`, `:107-112`/`:164-171`, `:66-70`/`:643-645`) under the "carried over" banner (`:114-116`); `test/ui/components.test.tsx:29-34` joins duplicates.

**(5) Stories**: Design-system catalogs (`src/gallery/ComponentsCatalog.tsx`, `FieldsCatalog.tsx`, `SlidersCatalog.tsx`, `BarsCatalog.tsx`, `ChartsCatalog.tsx`, `IconsCatalog.tsx`) cover 40 of the components. No Design-system story for: MmDialog (confirm/choice/options), MmOption, MmClockTimeDialog, MmTimeOfDayDialog, the snack, MmMenuButton (closed or open), MmFab, MmSwipeToRemove, MmFooterActions, StrengthTrendCard, MuscleVolumeRow, DemoNotice. MmDateDialog and MmSheet appear only inside screen stories (`src/gallery/screens/Settings.stories.tsx:33-57`, `Progress.stories.tsx:23`). `test/gallery/stories.test.tsx:56-61` requires a story per `*Screen|Sheet|Step` only; `test/ui/demoAndCatalog.test.tsx:40-53` checks six class names. States the register does not show are listed in RC-15.

### Proposals
Everything under Findings "Remediation" and the stricter-rule text in RC-5 are proposals, not repository behaviour.

## Audit coverage

- `audit_mode`: `domain` (the design-system library and its architecture check), bounded to `apps/mobile/src/ui/**`, `ui.css`, `test/architecture.test.ts`, the catalogs/stories that render them, and the ui tests.
- Walked (every line read): all 68 files of `src/ui/`, `src/ui/ui.css`, `src/theme/base.css`, `test/architecture.test.ts` (both versions), `.storybook/preview.tsx`, the six catalogs, three catalog stories, `Settings.stories.tsx`, `test/ui/{components,dateDialog,demoAndCatalog}.test.tsx`, `test/ui/focusRing.test.ts`, `test/gallery/stories.test.tsx`, the three tickets, HANDOFF.md 1-90 and 190-270, `design/design-system-implementation.md`.
- Surveyed (grep only): screens outside `ui/` for raw elements, `MmIcon size`, chevrons, overlay calls; `index.html`; `tokens.css`; roadmap references to MM-261.
- Not inspected: `src/gallery/screens/*` other than Settings; chart components; Android shell; `tool/`. No render of any story or screen was available to me: every "what the platform draws" statement is from the stylesheet and documented engine behaviour, not from a device. Depth targets: none assigned (component walk, not a task walkthrough).
- Cross-domain referrals: product-designer/UX-accessibility for RC-2/RC-3 (whether OS-drawn glyphs are wanted), RC-11 (label vocabulary), RC-15 (which states the register must show); QA/integrations for RC-18 (device check of `showPicker`).
- Blocked verification: cannot run `npx vitest`, `mm check`, or the Storybook build; cannot confirm the MM-261 test passes on the current tree.

## Novice mobile experience
Not assigned to this role; none recorded.

## Findings

Classification key: RIV = reproducible implementation defect (by source), CRV = confirmed requirement/design-rule violation, DRG = documentation or requirement gap, DUI = design/usability improvement, UH = unverified hypothesis.

**RC-1** `src/ui/ui.css:279-282`, `src/ui/MmDropdown.tsx:23-38` — CRV, **medium**, confidence high. The select's arrow and its colour are the engine's (`appearance: auto`), the same defect class MM-260 fixed for the date field; two fields in one dialog/screen show two chevrons. MDN: `appearance: none` removes the icon and you supply your own (option list stays native). Remediation: `.mm-select { appearance:none; -webkit-appearance:none }` and the `mm-picker-chevron` span inside the box, as `MmPickerField.tsx:47-49`; test as `test/ui/dateDialog.test.tsx:36-49`. Outcome: **bug ticket with a regression test** (device look afterwards; unverified on Android).

**RC-2** `src/ui/ui.css:445-451`, `src/ui/MmCheckRow.tsx:13` — CRV against the standing lesson "the platform draws nothing" (HANDOFF.md:230), **low**, confidence high. The checkbox glyph is OS-drawn and tinted; the switch in the same row family is ours (`:407-441`). Remediation: `appearance:none` + our `check` glyph (MDN's documented route). Outcome: **bug ticket with a regression test** (CSS rule check), unless the owner wants OS glyphs (then accept, in writing).

**RC-3** `src/ui/ui.css:512-517` — DUI, **low**, confidence high (source), medium (owner intent). Range thumb/track are OS-drawn via `accent-color`; a fully custom range needs engine-specific pseudo-elements. Outcome: **accept, because** `accent-color` is documented to keep platform conventions and the owner reviewed sliders on the phone in MM-240 objecting only to insets. Record as an owner decision if "platform draws nothing" is absolute.

**RC-4** `src/ui/ui.css:416` vs `:294-295` — UH, **low**, confidence medium. `.mm-switch` lacks `-webkit-appearance: none`; an un-updated WebView could draw the native checkbox under the switch styling. Outcome: fold into RC-2's ticket (one rule for both toggles).

**RC-5** `test/architecture.test.ts:49-64,85` — CRV against MM-261's own text ("a composite writes no control of its own"), **medium**, confidence high. `<button>` has no home, and `composites` is five named files, so `MmDateDialog`, `MmTimeOfDayDialog`, `MmClockTimeDialog`, `NumberEntryCard`, `StrengthTrendCard`, `InfoCard`, `DayStepper`, `DownloadStatusStrip`, `MmSliderRow`, `MacroBar` may write `<button>` (or `<label>`) and pass. Proposed stricter rule: (a) `controlHomes.button = [MmButton, MmIconButton, MmPressable, MmFab, MmChoiceChip, MmActionChip, MmSegmented, MmNavigationBar, MmOption, ChoiceCard, MmDisclosure, MmListRow, StatusRow]` plus a shrinking baseline `[MmSurface, MmHeroSurface, MmMenuButton]` that fails once clean (as `oneDeclarationBaseline:13-20`); `controlHomes.label = [MmTextField, MmDropdown, MmSwitchRow, MmCheckRow]`; `radio/file/color/textarea/dialog/progress/meter/form: []`. (b) **Composite, derived not listed**: any `ui/*.tsx` whose imports include a value from another `./` component file other than `MmIcon` (type-only and `./*Kind`/`./*Name` imports excluded), or that renders `role="dialog"|"listbox"|"menu"`; a composite may hold no element in the control list. The import scan at `:242-251` already parses imports, so the regex approach is enough for (a) and (b) today. Outcome: **bug ticket with a regression test** (samples: "a dialog that composes MmButton and writes `<button>` is reported"; "a `<button>` in a file not in the map is reported"; "a home with no control left fails").

**RC-6** `test/architecture.test.ts:69-78` — RIV, **low**, confidence high. `[^>]*` stops at the first `>`, so `<input onChange={(e) => …} type="date">` is classed `text`. Not hit today (type precedes any arrow at `MmTextField.tsx:45-48`, `MmPickerField.tsx:36-38`, `MmSlider.tsx:19-20`, `MmSwitchRow.tsx:20-21`, `MmCheckRow.tsx:13`). Remediation: scan the tag with brace-depth awareness, or require `type` first and test for it. Outcome: **bug ticket with a regression test** (one sample case).

**RC-7** `src/ui/MmSurface.tsx:19-23`, `MmHeroSurface.tsx:25`, `InfoCard.tsx:16`, vs `MmPressable.tsx:14-18`; `src/gallery/ComponentsCatalog.tsx:121-126` shows both ways at once — CRV (rule 8 "one way"), **medium**, confidence high. Remediation: surfaces compose MmPressable (the `<button>` leaves two files) or drop `onPress` from surfaces. Outcome: **bug ticket with a regression test** (MmSurface with `onPress` renders `.mm-pressable`; the button map shrinks).

**RC-8** `src/ui/MmMenuButton.tsx:38-49` duplicates `MmIconButton.tsx:18-33` (same classes, raw button); items raw at `:53-64` — RIV/duplication, **medium**, confidence high. Remediation: `MmIconButton` gains `popup?: { expanded, controls }`; MmMenuButton composes it; items become a menu-item row component (role as meaning). Outcome: **bug ticket with a regression test**.

**RC-9** `src/ui/MmProgressBar.tsx:8-13`; callers `MacroBar.tsx:39`, `DownloadStatusStrip.tsx:28` — CRV (rule 8: never a colour), **medium**, confidence high. Remediation: `kind?: 'energy' | MacroKind` -> class (`:830-838` already hold the macro colours), `weight?: 'thin'|'regular'|'emphasized'`; an architecture sample that no ui prop is named `color|className|style`. Outcome: **bug ticket with a regression test**.

**RC-10** `src/ui/MmIcon.tsx:5`; `src/food/MealSection.tsx:74,81` — DUI, **low**, confidence high. Pixel `size` passed by a screen; MM-253 names sizes by place (20 in rows, 24 in headers). Outcome: **accept, because** MM-254..259 rebuild the screens under that direction; revisit then (`size?: 'inline'|'row'|'header'`).

**RC-11** `src/ui/MmPickerField.tsx:8,40` (aria-only label), `MmTextField.tsx:9-11`, `MmSlider.tsx:5,12-13`; `src/gallery/FieldsCatalog.tsx:16-19` — DUI / usability found by inspection (the two picker fields sit with no heading between labelled text fields), **medium**, confidence high. Remediation: one vocabulary (`label` visible, `name` spoken, `valueText`); MmPickerField takes `label`/`name`/`helper` like MmTextField; the dialogs pass `name`. Outcome: **bug ticket with a regression test** (`<label htmlFor>` rendered; `getByLabelText` resolves through it).

**RC-12** `selected`/`chosen`/`current`, `onPress`/`onSelect` (files in Facts 4) — DUI, **low**. Outcome: **accept, because** renaming is churn without behaviour; write the vocabulary into RC-16's document.

**RC-13** `src/ui/ui.css:333-346` (one rule, two markups), `StatusRow.tsx:17-25`, eleven screen chevron sites (Facts 4) — DUI/duplication, **medium**, confidence high. Remediation: `MmListRow opens?: boolean` draws the chevron; `MmListRow control?: ReactNode` renders a `<label>` so MmSwitchRow/MmCheckRow compose it; StatusRow becomes MmListRow with `leadingIcon` and `opens`. Outcome: **bug ticket with a regression test** (architecture sample: a screen passing `chevronRight` as `trailing` is reported).

**RC-14** `two` duplicated (`MmClockTimeDialog.tsx:17`, `MmTimeOfDayDialog.tsx:14`, `CalendarDate.ts:98`, `clockTimeText.ts:1`) — DUI, **low**. Outcome: **accept, because** private one-liners; note `lang/padTwo.ts` for the next touch.

**RC-15** Stories — DRG against MM-253 ("the state set (rest, focus, pressed, disabled, error)") and AGENTS.md:62-69, **medium**, confidence high. (a) No Design-system story: the twelve components in Facts 5. (b) States not shown: MmButton secondary/text disabled, `icon`, `expand`; MmIconButton disabled; MmDropdown disabled (`onChange` undefined, `MmDropdown.tsx:27`), focused; MmPickerField focused, empty, out-of-range alert (tested at `test/ui/dateDialog.test.tsx:27-34`, no story); MmSwitchRow off, `flush`; MmCheckRow unchecked; MmSegmented `compact`, icons, empty; ChoiceCard `dense`; MmListRow `trailing`, `trailingAction`, `dense`; MmDisclosure closed, `header`, `subtitle`; MmSurface `onPress`, `padded=false`; MmHeroSurface `onPress`; DayStepper at today; DownloadStatusStrip past cancel; MmAppBar `leading`/`actions`/`titleContent`; Notice custom icon; NumberEntryCard error snack; pressed/hover anywhere. (c) No test ties a ui component to a story. Remediation: a `Dialogs` catalog (opens confirm, choice, options, time, clock, snack via `useOverlays` over a canvas), a `States` catalog (disabled/error/off variants; focus via `play` as `Fields.stories.tsx:13-17`), and a test that every exported component of `src/ui/*.tsx` is imported by some `src/gallery/**` file. Outcome: **bug ticket with a regression test** (the import-coverage test fails first on the twelve names).

**RC-16** `design/design-system-implementation.md:1-18,93-97` is the Flutter plan (ThemeData, pubspec); nothing documents the React library's control homes, composite definition, prop vocabulary or "the platform draws nothing" (only HANDOFF.md:230) — DRG, **medium**, confidence high. Outcome: documentation ticket (no behaviour): rewrite for React or mark historical and write the new one; the map in RC-5 is its table.

**RC-17** `src/ui/ui.css` duplicate selectors (Facts 4) — DUI, **low**. Outcome: **accept, because** tokens only and tests tolerate it; tidy with RC-16.

**RC-18** `src/ui/MmPickerField.tsx:24-33,45`; `MmDialog.tsx:19-21` focuses the first input on open — UH, **low**, confidence low. MDN documents `NotAllowedError` without activation (caught) and nothing about a second call while a picker is open; whether a tap opens exactly one picker on Android WebView, and whether the `focus()` fallback raises a keyboard on a `time` input, is native behaviour. Outcome: bounded emulator check by the edit owner; ticket only if it fails.

**RC-19** no `:-webkit-autofill` rule; `MmTextField.tsx:51` — UH, **low**, confidence low. Outcome: **accept, because** the fields are nutrition values and no phone review has shown it; add the rule only if seen.

**RC-20** `test/architecture.test.ts:51,55,58` name homes for `search`, `datetime-local`, `radio` that render none — DRG, **low**. Outcome: **accept, because** the map says where a kind would live; say so in RC-16, or add the "a home with no control fails" sample from RC-5.

**RC-21** `src/ui/MmOverlays.tsx:164-180` snack drawn inline in the composite — DUI, **low**. Outcome: **accept, because** spans only, nothing platform-drawn; it gets seen through RC-15's Dialogs story.

## Task walkthrough (UI reviews)
None: no depth targets were assigned; this is a component-by-component walk. Areas: every `src/ui` file and `ui.css` **walked** (source only, no render); screens **surveyed** by grep.

## Research
Status: **performed**, direct, via WebFetch (no web search needed). Trigger: two material platform claims that change recommendations (RC-1, RC-2, RC-3, RC-18). Pages fetched: MDN `HTMLInputElement.showPicker`, MDN `appearance`, MDN "Advanced form styling", caniuse `mdn-api_htmlinputelement_showpicker`. Compat tables were not present in the fetched MDN text; caniuse supplied them. The owner's Android observations (MM-260, Progress and "Seen again") are the device evidence; I have none of my own.

## Sources and evidence
- MDN, "HTMLInputElement: showPicker() method", modified 2026-03-13, accessed 2026-10-13. Supports: transient user activation required; `NotAllowedError` without it; `InvalidStateError` if not mutable; nothing on a second call while open. Baseline widely available since 2022-09.
- MDN, "appearance", modified 2026-10-07, accessed 2026-10-13. Supports: `none` makes a widget stylable while keeping function; unprefixed is the standard keyword.
- MDN, "Advanced form styling", modified 2026-10-02, accessed 2026-10-13. Supports RC-1 (`appearance:none` removes the select icon; supply your own via a wrapper since `::after` does not work on `<select>`; the option box is not stylable), RC-2 (`appearance:none` + own glyph is the route for checkboxes; `accent-color` keeps OS styling), RC-3 (range handle needs non-standard pseudo-elements), and that date/time internals (popup) cannot be removed with `appearance:none`.
- caniuse, "showPicker", accessed 2026-10-13: supported in current Chrome for Android and Android WebView (table shows 154; whether that is first or current version is not stated), Safari iOS 16.0, desktop Chrome 99, Safari 16.0; no partial-support notes.
- No health claims; `docs/evidence.md` not applicable.

### Source URLs (added by the chair, as the reviewer named them)
- https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement/showPicker (MDN, HTMLInputElement: showPicker(), modified 2026-03-13, accessed 2026-10-13)
- https://developer.mozilla.org/en-US/docs/Web/CSS/appearance (MDN, appearance, modified 2026-10-07, accessed 2026-10-13)
- https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Advanced_form_styling (MDN, Advanced form styling, modified 2026-10-02, accessed 2026-10-13)
- https://caniuse.com/mdn-api_htmlinputelement_showpicker (caniuse, showPicker, accessed 2026-10-13)

## Confidence and limitations
High for every file:line fact (read directly) and for the test's logic (read twice, final version). Medium for engine-rendering claims (documented, not observed by me). Low for RC-18/RC-19. Limitations: the tree changed under review (recorded above); no render, no device, no test run; the MM-261 test's current pass/fail on the tree is unverified; the catalogue of "states not shown" is from source, so a state a screen story happens to reach is not credited.

## Acceptance criteria and edge cases
MM-261 scenarios 1, 2 (for the three named files) and 3 trace to `test/architecture.test.ts:199-220,256-264`; scenario 2 does not hold for the composites not on the list (RC-5). MM-260 scenarios trace to `test/ui/dateDialog.test.tsx`. MM-253 "Every component was looked at" and "the state set" are not yet traceable to any story or test (RC-15). Proposed criteria (labelled proposals): "Given any `src/ui` file that imports another component and writes `<button>`, the architecture test names it"; "Given `MmDropdown`, the stylesheet sets `appearance: none` and the box holds `.mm-picker-chevron`"; "Given every exported component of `src/ui`, some gallery file imports it". Edge cases: an `<input>` whose first attribute is an arrow function (RC-6); a `type` computed in a non-home file (covered at `:89-92`); a dynamic `type` in MmTextField (passes today; intended?).

## Dependencies
product-designer / ux-accessibility: challenge RC-2, RC-3, RC-11, RC-15 (which states and glyphs the owner wants). architecture: RC-5's composite definition and the shrinking baseline. QA/integrations: RC-18 device check. Edit owner: run `npx vitest run test/architecture.test.ts test/ui test/gallery` on the final tree and a static Storybook look at Fields in Martian, Dark, Light.

## Safety concerns
None found in this scope (no health data handling in `src/ui`); not a clinical clearance.

## Unresolved product decisions
1. Is "the platform draws nothing" absolute (RC-2, RC-3 become tickets) or limited to indicators that misplace (accept)? Owner.
2. Which pressable shapes are legitimately separate components versus wrappers of MmPressable (RC-5 list vs RC-7/RC-8)? Owner with architecture.
3. Whether the Flutter-era design doc is rewritten or retired (RC-16). Owner.

## Verification
Nothing executed (read-only). Tests inspected: `test/architecture.test.ts`, `test/ui/dateDialog.test.tsx`, `test/ui/components.test.tsx`, `test/ui/focusRing.test.ts`, `test/ui/demoAndCatalog.test.tsx`, `test/gallery/stories.test.tsx`. Recommended for the edit owner: the vitest run above; `mm check`; Storybook static build of Design system/Fields and Components in three palettes at 412 px; an emulator tap on the date and time fields (RC-18).

## Files opened (absolute)
`C:\Users\jacob\dev\martian-macros\AGENTS.md`; `…\agents\roles\react-capacitor.md`; `…\agents\panel-protocol.md`; `…\agents\review-contract.md`; `…\design\design-system-implementation.md`; `…\requirements\HANDOFF.md` (1-90, 190-270); `…\requirements\architecture\BUG.a-raw-control-could-live-outside-its-component-in-the-design-system.MM-261.md`; `…\requirements\usability\TASK.hierarchy-and-wayfinding-direction.MM-253.md`; `…\requirements\design-system\BUG.date-dialog-chevron-and-flat-surface.MM-260.md`; `…\apps\mobile\test\architecture.test.ts` (twice); `…\apps\mobile\test\ui\components.test.tsx`, `dateDialog.test.tsx`, `demoAndCatalog.test.tsx`, `focusRing.test.ts`; `…\apps\mobile\test\gallery\stories.test.tsx`; `…\apps\mobile\.storybook\preview.tsx`; `…\apps\mobile\src\theme\base.css`; `…\apps\mobile\src\gallery\ComponentsCatalog.tsx`, `FieldsCatalog.tsx`, `BarsCatalog.tsx`, `SlidersCatalog.tsx`, `ChartsCatalog.tsx`, `IconsCatalog.tsx`, `Components.stories.tsx`, `Fields.stories.tsx`, `Bars.stories.tsx`, `screens\Settings.stories.tsx`; and under `…\apps\mobile\src\ui\`: `ui.css`, `ChoiceCard.tsx`, `DayStepper.tsx`, `DemoNotice.tsx`, `DownloadStatusStrip.tsx`, `GroupHeader.tsx`, `HorizonArc.tsx`, `InfoCard.tsx`, `MacroBar.tsx`, `MacroFigure.tsx`, `MacroKind.ts`, `MetricFacts.tsx`, `MmActionChip.tsx`, `MmAppBar.tsx`, `MmButton.tsx`, `MmButtonKind.ts`, `MmCheckRow.tsx`, `MmChoiceChip.tsx`, `MmClockTimeDialog.tsx`, `MmDateDialog.tsx`, `MmDialog.tsx`, `MmDisclosure.tsx`, `MmDropdown.tsx`, `MmFab.tsx`, `MmFooterActions.tsx`, `MmHeroSurface.tsx`, `MmIcon.tsx`, `MmIconButton.tsx`, `MmIconButtonKind.ts`, `MmIconName.ts`, `MmListGroup.tsx`, `MmListRow.tsx`, `MmMenuButton.tsx`, `MmMenuItem.ts`, `MmNavDestination.ts`, `MmNavigationBar.tsx`, `MmOption.tsx`, `MmOverlays.tsx` (twice), `MmPickerField.tsx`, `MmPressable.tsx`, `MmProgressBar.tsx`, `MmSegment.ts`, `MmSegmented.tsx`, `MmSheet.tsx`, `MmSlider.tsx`, `MmSliderRow.tsx`, `MmSpinner.tsx`, `MmStatusChip.tsx`, `MmSurface.tsx`, `MmSurfaceKind.ts`, `MmSwipeToRemove.tsx`, `MmSwitchRow.tsx`, `MmTextField.tsx`, `MmTextFieldKind.ts`, `MmTimeOfDayDialog.tsx`, `MuscleVolumeRow.tsx`, `Notice.tsx`, `NoticeKind.ts`, `NumberEntryCard.tsx`, `Overlays.ts`, `OverlaysContext.ts`, `SectionLabel.tsx`, `StatRow.tsx`, `StatusRow.tsx`, `StepProgress.tsx`, `StrengthTrendCard.tsx`, `mmIcons.tsx`, `useOverlays.ts`. Grep-only (not opened): `apps\mobile\index.html`, `src\theme\tokens.css`, the screen files cited in Facts 4, `roadmap\*`.

## Novice mobile experience (when UX/product design is assigned)
Not assigned to this role; none recorded (the report says so under its own heading). Added by the chair for the template.


## Targeted challenges
None were put to this reviewer in a second round. Added by the chair.

