# Product designer review: MM-253 component walk (Design system stories, `apps/mobile/src/ui/`, dialogs and sheets)

## Scope and traceability

- **Role:** product-designer (read-only review lens, `agents/roles/product-designer.md`). Reviewer identity: Claude Code subagent, this session; no edits, no commands, no delegation.
- **Requirement files inspected:** `C:\Users\jacob\dev\martian-macros\requirements\usability\TASK.hierarchy-and-wayfinding-direction.MM-253.md` (section "The panel", the seven rules); `C:\Users\jacob\dev\martian-macros\requirements\design-system\BUG.date-dialog-chevron-and-flat-surface.MM-260.md` (what is already fixed/accepted so it is not re-raised).
- **Design inputs:** `design/visual-language.md`, `design/design-principles.md`, `design/anti-cruft-and-anti-slop.md`, `design/interaction-and-motion.md`, `design/color-and-theme-system.md` (lines 196-233 only), `design/screen-direction.md` (grep-only: sheet spec line 129, notice family 172-183). `AGENTS.md` rule 8 (lines 189-191). `apps/mobile/src/theme/tokens.css`, `apps/mobile/src/theme/base.css`, `.storybook/preview.tsx`, `.storybook/preview.css`.
- **Inspected commit:** `1b70959` on `feature/mm260-own-chevron`, working tree clean per the git status snapshot at start. **Input SHA-256: not computed** (no shell in this role); the chair should hash the files listed under Audit coverage when persisting.
- **Audit mode:** `domain` (the design-system component library and its register stories, one by one), bounded by the brief to `src/ui/**` and the Design-system catalogs under `src/gallery/`.
- Behavior tickets: this is review output; every finding below names its proposed outcome (bug ticket with regression test, requirement/owner decision, or accept with reason).

## Existing facts versus proposals

**Facts (repository behavior, cited):**
- The stylesheet comment claims "Every value is a token" (`ui.css:1`); it contains literal px for padding, radii, gaps and durations (listed in PD-14/PD-15).
- Pressed state exists only for the add icon button (`ui.css:157-162`); no other `:active` rule exists in `src` (grep over `*.css`). `base.css:34` sets `-webkit-tap-highlight-color: transparent`, so Android shows no platform tap feedback either.
- Native-drawn parts remain in three components: `<select>` with `appearance: auto` (`MmDropdown.tsx:23-38`, `ui.css:279-282`); `<input type="checkbox">` styled only by `accent-color` (`MmCheckRow.tsx:13`, `ui.css:445-451`); `<input type="range">` styled only by `accent-color` (`MmSlider.tsx:19-30`, `ui.css:512-517`).
- The app-wide focus ring is `2px solid var(--text)`, offset 2px (`base.css:43-46`), matching `interaction-and-motion.md:53`.
- `--radius-sheet-top: 24px` is declared (`tokens.css:104`) and used nowhere (grep); `.mm-sheet` uses `--radius-group` (`ui.css:1065`).
- No Design-system story renders `MmDialog`, `MmSheet`, `MmTimeOfDayDialog`, `MmClockTimeDialog`, the options list, the snack, an open `MmMenuButton`, `MmFab`, `MmSwipeToRemove`, `MuscleVolumeRow`, `StrengthTrendCard`, `MmFooterActions` or `DemoNotice` (catalog imports: `ComponentsCatalog.tsx:1-35`, `FieldsCatalog.tsx:1-5`, `BarsCatalog.tsx:1-4`, `ChartsCatalog.tsx:1-14`, `SlidersCatalog.tsx:1-9`). Only `MmDateDialog` has a story (Settings/DateOfBirth, per MM-260).
- `stories.test.tsx:34-61` enforces a story per `*Screen|*Sheet|*Step` file; it does not enforce one per `ui/` component.

**Proposals** are marked as such in each finding's remediation; nothing below is an approved change.

## Audit coverage

**Files opened (every one), `C:\Users\jacob\dev\martian-macros\apps\mobile\src\`:**
`ui/ui.css`, `ui/MmPickerField.tsx`, `ui/MmDateDialog.tsx`, `ui/MmTimeOfDayDialog.tsx`, `ui/MmClockTimeDialog.tsx`, `ui/MmDialog.tsx`, `ui/MmSheet.tsx`, `ui/MmOverlays.tsx`, `ui/Overlays.ts`, `ui/OverlaysContext.ts`, `ui/useOverlays.ts`, `ui/MmButton.tsx`, `ui/MmButtonKind.ts`, `ui/MmIconButton.tsx`, `ui/MmIconButtonKind.ts`, `ui/MmTextField.tsx`, `ui/MmTextFieldKind.ts`, `ui/MmDropdown.tsx`, `ui/MmCheckRow.tsx`, `ui/MmSwitchRow.tsx`, `ui/MmSlider.tsx`, `ui/MmSliderRow.tsx`, `ui/MmSegmented.tsx`, `ui/MmSegment.ts`, `ui/MmChoiceChip.tsx`, `ui/MmActionChip.tsx`, `ui/MmStatusChip.tsx`, `ui/MmOption.tsx`, `ui/MmMenuButton.tsx`, `ui/MmMenuItem.ts`, `ui/ChoiceCard.tsx`, `ui/DayStepper.tsx`, `ui/DemoNotice.tsx`, `ui/DownloadStatusStrip.tsx`, `ui/GroupHeader.tsx`, `ui/HorizonArc.tsx`, `ui/InfoCard.tsx`, `ui/MacroBar.tsx`, `ui/MacroFigure.tsx`, `ui/MacroKind.ts`, `ui/MetricFacts.tsx`, `ui/MmAppBar.tsx`, `ui/MmDisclosure.tsx`, `ui/MmFab.tsx`, `ui/MmHeroSurface.tsx`, `ui/MmIconName.ts`, `ui/MmIcon.tsx`, `ui/mmIcons.tsx` (lines 1-40 only; the rest is the icon map), `ui/MmListGroup.tsx`, `ui/MmListRow.tsx`, `ui/MmNavDestination.ts`, `ui/MmNavigationBar.tsx`, `ui/MmProgressBar.tsx`, `ui/MmSpinner.tsx`, `ui/MmSurface.tsx`, `ui/MmSurfaceKind.ts`, `ui/MmSwipeToRemove.tsx`, `ui/MuscleVolumeRow.tsx`, `ui/Notice.tsx`, `ui/NoticeKind.ts`, `ui/NumberEntryCard.tsx`, `ui/SectionLabel.tsx`, `ui/StatRow.tsx`, `ui/StatusRow.tsx`, `ui/StepProgress.tsx`, `ui/StrengthTrendCard.tsx`, `ui/MmFooterActions.tsx`, `ui/MmPressable.tsx`;
`gallery/Bars.stories.tsx`, `gallery/BarsCatalog.tsx`, `gallery/Charts.stories.tsx`, `gallery/ChartsCatalog.tsx`, `gallery/Components.stories.tsx`, `gallery/ComponentsCatalog.tsx`, `gallery/Fields.stories.tsx`, `gallery/FieldsCatalog.tsx`, `gallery/Icons.stories.tsx`, `gallery/IconsCatalog.tsx`, `gallery/SlidersCatalog.tsx`, `gallery/Tokens.stories.tsx`, `gallery/TokensCatalog.tsx`, `gallery/gallery.css`;
`theme/tokens.css`, `theme/base.css`; `..\.storybook\preview.tsx`, `..\.storybook\preview.css`;
tests: `..\test\ui\dateDialog.test.tsx`, `..\test\ui\focusRing.test.ts`, `..\test\gallery\stories.test.tsx`;
usage spot-checks (partial reads): `settings/SettingsScreen.tsx:48-63, 76-123`, `train/WorkoutScreen.tsx:46-57`, `food/MealSection.tsx:92-123`.

**Not inspected:** `src/charts/*` (TrendChart, HistoryChart, MacroSplitChart, MiniTrend, TrendSparkline, TrendStats: drawn by the Charts story but outside `ui/`; surveyed only through `ChartsCatalog.tsx`); the screen stories under `gallery/screens/`; the remainder of `mmIcons.tsx`; every screen that consumes these components beyond the spot-checks above.

**Evidence method:** source and stylesheet inspection only. **No render** of any story was available to this role (no browser, no screenshot); every "what the platform draws" claim is from the CSS and the element type, not from a frame. Palette claims are from `tokens.css` values and `color-scheme` declarations. Clipping (PD-2, PD-6) is from the CSS containment rules, not from a rendered frame.

**Walked vs surveyed:** every file above was **read** and recorded in the component table below. Three bounded tasks were **walked** step by step (Task walkthrough). Everything else is **surveyed**: no finding in a surveyed area says nothing about its usability.

**Cross-domain referrals:** ux-accessibility (PD-2, PD-6, PD-9, PD-13, PD-19, PD-25 keyboard/switch/TalkBack behavior; `MmOption` listbox-of-buttons semantics); react-capacitor (PD-2 portal/overlay host; PD-19 Android focus behavior); product/owner (PD-13, PD-14 button padding, PD-4/PD-5 switch Ember budget).

### Component walk record (one line per component: 1 spacing/sizing · 2 states drawn/missing · 3 platform-drawn · 4 raw control in a composite · 5 MM-253 rules · 6 story)

| Component | 1 Spacing/sizing | 2 States | 3 Platform-drawn | 4 Composite | 5 Rules | 6 Story |
|---|---|---|---|---|---|---|
| MmButton (`ui.css:9-43,133-139`) | min-h 48 ✓; **padding 0 20px literal**; text kind 12 ✓ | rest, disabled ✓; **no pressed, no hover, no 98% press** | focus ring (base.css) ✓ | n/a | one primary ✓ | primary+off+secondary+text; no disabled secondary/text |
| MmIconButton (`45-56,141-162`) | 48×48 ✓; plate 28/8px literal | add kind: hover/focus/active ✓; standard: **no pressed**; disabled ✓ | ✓ | n/a | **plate = Ember tint (PD-7)** | standard + add shown |
| MmTextField (`222-278`) | box 56/48 ✓, pad 12 ✓ | rest, focus (box) ✓, caution helper ✓; **no error/danger, no disabled** | placeholder text3 ✓; autofill n/a (`autoComplete=off`) | n/a | – | rest, focused, warning helper ✓ |
| MmPickerField (`287-316`) | 54 in 56 box ✓, own chevron 20 ✓ | rest, focus (box); **no disabled** | indicator hidden ✓; color-scheme per palette ✓; the native picker dialog itself is platform-drawn (accepted, MM-260) | – | – | Fields story (date, time) ✓; no focused/open story |
| **MmDropdown** (`279-282`) | 46 in 56 box | focus (box); **disabled is engine-drawn** | **`appearance: auto`: arrow, open list, disabled grey all platform-drawn (PD-1)** | used in `WeightEventEntrySheet.tsx:46` (a sheet) and `CustomExerciseScreen.tsx:59,66` | – | shown closed only |
| **MmCheckRow** (`442-451`) | row 48 ✓; glyph 20 | checked; **no pressed/disabled** | **box, tick, ripple engine-drawn (PD-4)** | onboarding `HealthStep.tsx:45` | – | one state (shares `on` with switch) |
| MmSwitchRow (`407-441`) | 52×32 geometry literal (accepted) | on/off ✓, thumb motion; **no pressed/disabled** | none (`appearance:none`) ✓ | – | on-state = Ember fill (see Unresolved) | one state |
| **MmSlider / MmSliderRow** (`512-522`) | min-h 48 ✓ | **no pressed/disabled/focus of our own** | **track, thumb, focus engine-drawn; track not `--track` (PD-5)** | Settings, Pause, TrainingStep | – | Sliders story ✓ (3 placements) |
| MmSegmented (`479-510`) | 48 ✓; **compact 40 (PD-9)**; pill 999px (off the 12 radius rule) | selected ✓; **no pressed/disabled** | – | – | – | one shown (non-compact) |
| MmChoiceChip / MmActionChip / MmStatusChip (`453-477`) | choice 48 ✓; **action 32 (PD-9)**; status 32 fine | selected ✓ (**text glyph ✓, PD-8**); no pressed | – | – | chips for choices ✓ | all three ✓ |
| MmOption (`959-982`) | 56, bleeds to dialog edge ✓ | chosen (icon + "Chosen") ✓; **no pressed** | – | inside `MmDialog` ✓ | – | **no story (PD-18)** |
| **MmMenuButton** (`615-641`) | item 48 ✓; width 180 literal; shadow literal | **no hover/focus/pressed/current (PD-12)** | – | **list clipped inside `MmListGroup` / `MmSwipeToRemove` (PD-2)** | second list-choice beside MmOption (MM-261 says one) | **no story** |
| MmDialog (`904-954`) | pad 24, gap 16 ✓ | shadow+outline ✓ (MM-260) | scrollbar engine-drawn (accepted) | actions: Cancel text + OK Ember | one primary ✓; **destructive = Ember (PD-13)** | DateOfBirth only; confirm/choice/options **none** |
| MmSheet (`1054-1077`) | **top radius `--radius-group` not 24 (PD-10)**; handle 32×4 | **no shadow (Light spec), bg `overlay` not `raised`** | scrollbar (accepted) | – | – | **no Design-system story** |
| MmOverlays snack (`984-1008`) | 48 ✓ | – | – | – | – | **no story** |
| MmSurface / InfoCard (`107-112,164-181,684-694`) | pad 16 ✓, radius group ✓; compact radius 12px literal | pressed kind: **no pressed state** | – | – | every card identical → "tiers not cards" is hard (PD-27) | ✓ |
| MmHeroSurface (`183-220`) | pad 24 ✓; limb 12/8%, orbit 6/5% ✓ | light shadow ✓; pressable: no pressed | – | – | one hero ✓ | ✓ |
| MmListGroup / MmListRow (`323-395,1091-1107`) | 56/48, pad 8/16 ✓ | pressable rows: **no pressed**; **focus ring clipped (PD-6)** | – | `overflow:hidden` clips children (PD-2) | leading icon 24 vs rule 2's 20 (PD-20); chevron supplied per screen | ✓ |
| GroupHeader / SectionLabel (`396-405`) | 24/16/8 ✓ | – | – | – | **no icon slot (PD-21)** | ✓ |
| MmDisclosure (`569-596`) | 56 ✓ | hover ✓ (desktop only); no pressed; chevron 16 | – | – | progressive disclosure ✓ (this is the "one tap down" primitive) | ✓ expanded only |
| MmNavigationBar (`72-105`) | 72, indicator 56×30 literal | current ✓ (pill+Ember+700) ; no pressed | – | – | icons ✓; **doc says filled variant (PD-23)** | Bars ✓ |
| MmAppBar (`58-70,643-645`) | 56, safe-area ✓ | – | – | – | – | Bars ✓ |
| MmFab (`598-613`) | 56, pad 20 literal, radius group (12 Martian /16 others) | **no pressed (spec: 98% scale)** | – | – | one Ember ✓ | **no story** |
| Notice (`647-682`) | 12 pad, radius control | 3 kinds match `screen-direction.md:176-180` ✓ | – | – | icon+word ✓ | all three ✓ |
| ChoiceCard (`696-742`) | radius 12px literal; badge 2px/8px literal | selected ✓; no pressed | – | – | – | both states ✓ |
| StatusRow (`773-797`) | 48 ✓, icon 20 ✓ | no pressed | – | – | icon as wayfinding ✓ | ✓ |
| StatRow / MetricFacts / MacroFigure / MacroBar (`758-857`) | 6px literal head gap | – | – | – | **catalog shows bars + figures together (PD-26)** | ✓ |
| MmProgressBar / StepProgress (`549-567,744-756`) | 6px gap literal | – | – | – | ✓ | ✓ |
| HorizonArc (`1021-1051`) | stroke 8, dot 6r, glow hidden in light ✓ | over-target hollow ✓ | – | – | signature ✓ | Charts ✓ (two states) |
| MuscleVolumeRow (`1153-1191`) | 16px bar, 5px inset literal | – | – | – | **off chart grammar (PD-22)** | **no story** |
| StrengthTrendCard | InfoCard + chart + 3 captions | – | – | – | inline explanation (rule 1 says disclosure) | **no story** |
| MmSwipeToRemove (`1109-1128`) | – | drag offset only | – | `overflow:hidden` (PD-2) | accelerator ✓ | **no story** |
| MmFooterActions / DemoNotice / DownloadStatusStrip | pad 12/24 ✓; strip gap 6px literal | – | – | – | – | strip ✓; footer, demo **none** |
| MmPressable | draws nothing ✓ | **no pressed** | – | – | – | ✓ |
| MmSpinner (`524-547`) | 36/4 literal | reduce-motion slows to 4 s (accepted) | – | – | – | ✓ |
| MmIcon / mmIcons / IconsCatalog | 24 default, 20 in rows by caller | – | – | – | Material Outlined (MM-236) | ✓ but **gap tokens undefined (PD-16)** |
| TokensCatalog / gallery.css | – | – | – | – | – | **fixed light bg behind swatches (PD-17)** |

## Novice mobile experience

- **Bounded goal walked:** a first-week person (a) changes "Daily activity" in Settings, (b) logs a weight event with a type and date from Progress, (c) deletes a food entry from a meal. Screens/states: Settings list group → menu; `WeightEventEntrySheet` (sheet with `MmDropdown` + date dialog); Food meal section → entry's more menu / swipe. Decision count from source: (a) 1 choice of 4-5; (b) 1 dropdown choice + 1 date + save; (c) 1 menu + 1 item.
- **What novices must notice/decide:** that the pencil icon opens a menu (a); which event type is current (b: the select shows it; a: the menu does not); that a tap registered (every control; nothing visibly presses).
- **Competing actions:** in every `confirm` dialog the loud Ember button is the destructive one (PD-13); in Train the two full-width buttons MM-253 already names (not re-reviewed here).
- **Routine vs safety/uncertainty:** notices keep icon+word+border by kind (good); the dialog says the date back in words (good, MM-260).
- **Recovery and route to detail:** menus close on outside press/Escape; date range errors are explained; no pressed feedback means a double tap is the likely recovery on a slow save (hypothesis).
- **Source vs observation:** all of the above is source inspection. Evidenced burdens: PD-2, PD-3, PD-12 from the step records. Hypotheses: PD-19, the double-tap behavior. Card count was not used as evidence anywhere.
- **Cross-domain consultation:** none requested yet; bounded requests are listed under Dependencies/Unresolved.

## Findings

Classification key: RIV = reproducible implementation defect; CDR = confirmed design-rule violation (the design docs are the repository's rules for this library); UPI = usability problem found by inspection; GAP = documentation/requirement gap; IMP = design/usability improvement; HYP = unverified hypothesis.

**PD-1 — MmDropdown is a platform-drawn select (RIV/CDR, high, confidence high).** `apps/mobile/src/ui/MmDropdown.tsx:23-38`, `ui.css:279-282` (`appearance: auto`, `min-height: 46px`). The engine draws the arrow at its own inset, the open list, and the disabled grey; Android draws its own arrow inside the box exactly as the date input did (MM-260 "Seen again on the phone"). Used inside a sheet (`progress/WeightEventEntrySheet.tsx:46`) and a screen (`train/CustomExerciseScreen.tsx:59,66`). Impact: the same defect the owner found, two more places, every palette. Remediation (proposal): give `.mm-select` `appearance: none`, width 100%, `color-scheme` per palette (as `.mm-picker-input`), and draw `MmIcon chevronDown` 20 dp in the box at the field's inset as `MmPickerField` does; style `:disabled` with `--text3`. Acceptance: Fields story shows the dropdown with our chevron in Martian/Dark/Light; the native list follows the palette. Regression test: as `test/ui/dateDialog.test.tsx:36-49` (box contains `.mm-select` with `appearance: none` and a chevron svg). **Outcome: bug ticket with a regression test.**

**PD-2 — MmMenuButton's list is clipped by `overflow: hidden` ancestors (RIV, high, confidence medium-high; source-derived, not rendered).** `ui.css:615-630` positions `.mm-menu-list` absolute under a `position: relative` `.mm-menu`. In Settings it sits in a row of `MmListGroup` (`settings/SettingsScreen.tsx:82-106`; `.mm-list-group { overflow: hidden }` `ui.css:325`): the 4-5 item list from "Experience" (row 2 of 3) extends past the group's bottom and is cut. In Food it sits inside `MmSwipeToRemove` (`food/MealSection.tsx:102-118`; `.mm-swipe { overflow: hidden }` `ui.css:1112`), a one-row container: the "Delete" item opens below the row and is clipped by it. No test or story opens either menu (grep "More actions|Change daily activity|menuitem" over `test/` and `src/gallery/`: no match). Impact: a person cannot see or reach the item. Remediation (proposal): render the list through the overlay host (`MmOverlays`) or `overlays.options`, which is MM-261's "one way a dialog offers a choice". Acceptance: a Food story with a play step that opens the entry menu shows "Delete" fully; same for Settings "Experience". Regression test: story play + an assertion that the menu list's bounding box lies inside the viewport and not inside an `overflow:hidden` ancestor (jsdom cannot lay out; a Storybook browser test or a stylesheet rule check that `.mm-menu-list` is portaled). **Outcome: bug ticket with a regression test; chair to confirm in a browser first.**

**PD-3 — No control has a pressed state; platform tap highlight is removed (CDR, high, confidence high).** `interaction-and-motion.md:53` "Immediate pressed state on every control"; `:40` "Primary press: Ember button depresses to 98% scale in fast". `ui.css` has `:active` only at `157-162` (add plate). `base.css:34` `-webkit-tap-highlight-color: transparent`. Affected: `.mm-button`, `.mm-fab`, `.mm-icon-button` (standard), `.mm-chip`, `.mm-segment`, `.mm-list-row-button`, `.mm-list-row-main`, `.mm-option`, `.mm-menu-item`, `.mm-nav-destination`, `.mm-choice-card`, `.mm-pressable`, `.mm-surface-button`, `.mm-hero.mm-surface-button`, `.mm-status-row`, `.mm-disclosure-toggle`, `.mm-toggle-row`. Impact: every tap on every screen gives no sign it landed until state changes; the one signature press is absent. Remediation (proposal): one `:active` rule family in `ui.css` (primary: `transform: scale(.98)` 100 ms; others: `background: var(--selected)` or `color-mix(text 8%)`), none under reduce-motion except the fill. Regression test: stylesheet test like `focusRing.test.ts`: every rule with `cursor: pointer` has a sibling `:active` rule. **Outcome: bug ticket with a regression test.**

**PD-4 — MmCheckRow's box and tick are engine-drawn (CDR/RIV, medium, confidence high).** `ui/MmCheckRow.tsx:13`, `ui.css:445-451` (`accent-color` only). The box shape, tick glyph, size (20 px), focus and ripple are the engine's; the tick colour is the engine's pick, not `--on-ember`. Used in onboarding `HealthStep.tsx:45`. Remediation (proposal): `appearance: none`, a 20 dp box in `--outline-strong` on `--sunken`, checked = `--ember` fill with `MmIcon check` in `--on-ember` (as `MmSwitchRow` already does for the switch). Regression test: checked row renders our svg; stylesheet rule `.mm-checkbox { appearance: none }`. **Outcome: bug ticket with a regression test.**

**PD-5 — MmSlider's track and thumb are engine-drawn (CDR/RIV, medium, confidence high).** `ui/MmSlider.tsx:19-30`, `ui.css:512-517`. The track colour is not `--track`, the thumb size is the engine's (Android Chrome's is small), focus is the engine's. Used in Settings, Pause, TrainingStep, three placements in the Sliders story. Remediation (proposal): `appearance: none` with `::-webkit-slider-runnable-track` (4 dp, `--track`, filled part `--ember`) and `::-webkit-slider-thumb` (20 dp, `--ember`, 48 dp hit area), `:focus-visible` ring on the thumb. Regression test: stylesheet rules present. **Outcome: bug ticket with a regression test.**

**PD-6 — The focus ring is clipped inside `overflow: hidden` groups (CDR, medium, confidence medium; not rendered).** `base.css:43-46` ring is 2 px outside the element. Rows fill `MmListGroup` (`ui.css:325` overflow hidden), segments fill `.mm-segmented` (`482`), content fills `.mm-surface-flush` (`176`), `.mm-hero` (`189`), `.mm-swipe` (`1112`): the ring's left/right sides, and the first/last row's top/bottom, fall outside the clip. `interaction-and-motion.md:53`: "never removed". Impact: keyboard/switch-access users lose part or most of the focus mark in lists and segmented controls. Remediation (proposal): inset ring (`outline-offset: -2px`) for focusables inside clipped groups, or stop clipping (use `border-radius` on children instead). Regression test: stylesheet test that every `overflow: hidden` container rule has an inset focus rule for its interactive children. **Outcome: bug ticket with a regression test; ux-accessibility to challenge.**

**PD-7 — The add icon button tints Ember as a background (CDR, medium, confidence high).** `ui.css:145-156`: `.mm-icon-button-plate { background: color-mix(in srgb, var(--ember) 15%, transparent) }`. `anti-cruft-and-anti-slop.md:66` "Ember is never tinted … used as a background"; `:45-47` one Ember element per screen, while Food draws one plate per meal (`food/MealSection.tsx:93-98`). Remediation (proposal): plate in `--selected` with the plus in `--ember`, or a plain 24 dp `--ember` plus with no plate; pressed state = `--ember` fill (keep `157-162`). Regression test: stylesheet test that no `color-mix(... var(--ember) ...)` appears as a `background`. **Outcome: bug ticket with a regression test.**

**PD-8 — The selected chip's check is a font glyph (CDR, low, confidence high that it is text; medium that it falls back to a system font).** `ui.css:471-474` `content: '✓'`. `visual-language.md:83-86` one icon family; `MmSegmented.tsx:35` already uses `MmIcon check`. Remediation (proposal): `MmChoiceChip` renders `<MmIcon name="check" size={16} />` when selected; delete the `::before`. Regression test: selected chip contains an svg; `ui.css` has no `content: '✓'`. **Outcome: bug ticket with a regression test.**

**PD-9 — Two pressable controls are under 48 dp (CDR, medium, confidence high).** `.mm-segmented-compact .mm-segment { min-height: 40px }` (`ui.css:503-506`) and `MmActionChip` on `.mm-chip { min-height: 32px }` (`456`; only the choice chip gets 48 at `465-467`). `interaction-and-motion.md:83` "48 × 48 dp minimum". Action chips are in the most frequent task (`food/AddFoodSheet.tsx:678` recents refill; `food/EasyToMissLine.tsx:49-52`). Remediation (proposal): action chip min-height 48 (or 40 visual with 48 hit area via padding/`::before`); compact segments 48 with smaller padding. Regression test: stylesheet test that no rule with `cursor: pointer` sets `min-height` under 48px. **Outcome: bug ticket with a regression test.**

**PD-10 — MmSheet does not match its spec: radius token unused, no lift, wrong surface level (CDR, medium-low, confidence high).** `ui.css:1058-1067`: radius `var(--radius-group)` (12 in Martian, 16 elsewhere) though `--radius-sheet-top: 24px` exists (`tokens.css:104`) and `visual-language.md:40` / `screen-direction.md:129` say 24; background `--overlay` though both docs say sheets are `raised`; no shadow though `visual-language.md:42-43` gives Light sheets `0 8 24 rgba(12,18,32,0.12)`. The dialog was lifted in MM-260; the sheet still floats on the scrim alone ("modal looks dull" applies). Remediation (proposal): `border-radius: var(--radius-sheet-top) var(--radius-sheet-top) 0 0; background: var(--raised)`; `.theme-light .mm-sheet { box-shadow: … }`. Regression test: stylesheet assertions as in `dateDialog.test.tsx:48`. **Outcome: bug ticket with a regression test.**

**PD-11 — Cards lack the per-theme elevation the docs specify (CDR, low, confidence high).** `visual-language.md:41-45` and `color-and-theme-system.md:206-210`: Light cards hairline + soft shadow; Dark cards a 1 dp top highlight (`text` 6%). Only `.mm-hero` has the Light shadow (`ui.css:197-199`); `.mm-surface` (`107-112`) and `.mm-list-group` (`323-329`) have the hairline only, no highlight in Dark/Martian. Remediation (proposal): apply the hero's rules to surface and list group. **Outcome: bug ticket with a regression test (stylesheet), to ride with the MM-254+ re-tiering so it is not done twice.**

**PD-12 — MmMenuButton gives no sign of the current value and is a second list-choice implementation (UPI, medium, confidence high).** `ui/MmMenuButton.tsx:7-13` has no `selected`; `ui.css:631-641` has no current/hover/focus/pressed style. In Settings (`SettingsScreen.tsx:83-106`) the person opens "Change daily activity" and sees five labels with no mark on the one in force, while `MmOption` (`MmOption.tsx:13`, MM-261 "the one way a dialog offers a choice from a list") marks "Chosen". Step record: see Task walkthrough (a). Remediation (proposal): replace both Settings menus with `overlays.options` (already marks the chosen one), keep `MmMenuButton` for actions only (Food's "Delete"), and give it a pressed/focus style. **Outcome: bug ticket with a regression test (Settings story play opens the menu and finds the current value marked).**

**PD-13 — Destructive confirmations draw the destructive action as the Ember primary (CDR vs doc; code says deliberate; owner decision, medium, confidence high on the facts).** `ui/MmOverlays.tsx:60-76`: `confirmLabel` is `MmButton` primary, cancel is `text`. `interaction-and-motion.md:67-71`: "the safe exit first and the destructive action visually quieter than the cancel". `Overlays.ts:11-15` documents the opposite ("the safe choice is the quieter-looking cancel"). MM-102 line 29 reserves `danger` for destructive actions. Callers: "Erase" (`SettingsScreen.tsx:52-59`, irreversible), "Delete" (`WorkoutScreen.tsx:48-57`), plus TermsGuard, MyFoodsStep, FoodDatabase, ProfileSection. Impact: Ember means "the action to take"; here it means "erase everything". Remediation (proposal): a `kind="destructive"` `MmButtonKind` (outline/text in `--danger`), cancel as the stronger button; or the owner amends the doc. **Outcome: unresolved product decision (below); then a bug ticket with a regression test (confirm dialog renders the destructive button without `mm-button-primary`).**

**PD-14 — Literal px off the scale and radii bypassing their tokens (CDR, low, confidence high).** Radii: `.mm-surface-compact` 12px (`ui.css:173`), `.mm-choice-card` 12px (`704`), `.mm-icon-button-plate` 8px (`150`), `.mm-badge` 8px (`738`); tokens exist (`--radius-control`, `--radius-chip`). Spacing: `.mm-button` and `.mm-fab` padding `0 20px` (`14`, `605`; scale is 16/24), 6 px gaps (`746`, `845`, `898`; scale is 4/8), `.mm-badge` 2 px (`737`), `.mm-menu-list` 180 px (`625`), `.mm-select` 46 (`280`). Geometry not on the spacing scale is accepted: switch (`407-441`), handle (`1071-1072`), spinner (`526-528`), steps/rules 4/2, marker 2, nav indicator 56×30, dialog 420, snack 560. Remediation (proposal): radii to tokens; 6 → 8 (or 4) with a look; 20 → owner's call (16 or 24, or a declared `--space-20` with the written reason `anti-cruft §5` asks for). Regression test: stylesheet test that `border-radius` in `ui.css` is a `var(--radius-*)`, `50%`, `999px` or `2px`. **Outcome: bug ticket with a regression test for the radii; owner decision for the 20 px button padding; accept the geometry list, because those values are the control's shape, not the layout scale.**

**PD-15 — Motion durations are literal and there are no motion tokens (GAP/CDR, low, confidence high).** `interaction-and-motion.md:19-24` names fast 100 / base 180 / slow 280 / reveal 600; `tokens.css` declares none. `ui.css` uses 150 ms (`153-155`, `428`), 200 ms (`589`), 1 s (`531`). Remediation (proposal): `--motion-fast/base/slow/reveal` in `tokens.css`, used in `ui.css`; reduce-motion sets them to 0 (fades 100). Spinner slowing to 4 s under reduce-motion (`540-541`) is accepted: a loading indicator has to indicate. **Outcome: bug ticket with a regression test (stylesheet: every `transition`/`animation` duration is a token).**

**PD-16 — The icon catalog uses tokens that do not exist (RIV, low, confidence high).** `gallery/gallery.css:56` `--space-3`, `:63` `--space-1`, `:64` `--space-2`; `tokens.css:107-112` declares only 4/8/12/16/24/32. The declarations are invalid at computed-value time, so the Icons story draws with no gap and no padding. Remediation: `--space-4`, `--space-8`. Regression test: stylesheet test that every `var(--name)` in `src/**/*.css` is declared in `tokens.css` (also guards `ui.css`). **Outcome: bug ticket with a regression test.**

**PD-17 — Bars and Tokens catalogs sit on a fixed light grey (`#e7e9ef`) in every palette (RIV, low, confidence high).** `gallery.css:7`. In Martian/Dark the swatches and bars are seen against a colour no screen has; `.gallery-palette` (`9-18`, 360 px, 20 px radius) appears unused. Remediation: `background: var(--canvas)` or drop the rule (the preview already paints `story-canvas` in `--canvas`, `preview.css:5-10`). **Outcome: bug ticket with a regression test (no hex colour in `src/**/*.css` outside `tokens.css`).**

**PD-18 — The register has no story for most overlays and no states story (GAP, medium, confidence high).** No Design-system story draws `MmDialog` confirm/choice/options, `MmSheet`, `MmTimeOfDayDialog`, `MmClockTimeDialog`, snack, open `MmMenuButton`, `MmFab`, `MmSwipeToRemove` (dragged), `MuscleVolumeRow`, `StrengthTrendCard`, `MmFooterActions`, `DemoNotice`. States shown: focus only for the text field (`Fields.stories.tsx:13-17`), disabled only for the primary button (`ComponentsCatalog.tsx:48`), no error state anywhere, switch and check share one `on` value (`ComponentsCatalog.tsx:113,117`). This is exactly how MM-260 slipped. MM-253 "Every component was looked at" requires each dialog and sheet in three palettes. Remediation (proposal): `Design system/Overlays` story (each `overlays.*` kind opened by a play step, plus the snack and an open menu) and `Design system/States` story (each control at rest, focused, pressed-simulated via a class, disabled, error, selected). Regression test: extend `stories.test.tsx` with a `covers` check that every `src/ui/Mm*.tsx` and the other `ui/*.tsx` components are imported by a catalog. **Outcome: bug ticket with a regression test.**

**PD-19 — Opening the date/time dialog may open Android's native picker at once (HYP, medium if true, confidence low).** `MmDialog.tsx:18-25` focuses the first `input`; `MmPickerField.tsx:28` notes "Android … opens its own on focus". If so, the dialog's title, words and range message are never seen before the picker, and dismissing the picker lands on an already-focused field. Verification requested: open Settings → Date of birth on an Android build. **Outcome: verification by the edit owner on device; ticket only if reproduced.**

**PD-20 — MmListRow's leading icon is 24 dp and navigation chevrons are supplied per screen (GAP vs MM-253 rule 2, low, confidence high).** `MmListRow.tsx:39-43` uses `MmIcon` default 24 (`MmIcon.tsx:5`); MM-253 rule 2 says 20 dp in rows, 24 in headers (`MM-253.md:42-45`); `StatusRow.tsx:19` and `Notice.tsx:35` already use 20. Settings passes `<MmIcon name="chevronRight" />` as `trailing` (`SettingsScreen.tsx:49`), a per-screen decision rule 10 of `design-principles.md` forbids. Remediation (proposal): row icon 20; a `navigates` prop (or `onPress` implying it) draws the chevron. **Outcome: accept for now, because rule 2 is not yet in `screen-direction.md`; fold into the MM-254+ rebuild with a test (row icon svg is 20 px).**

**PD-21 — GroupHeader, SectionLabel and InfoCard's title have no icon slot (GAP vs MM-253 rule 2, low, confidence high).** `GroupHeader.tsx:4-6`, `SectionLabel.tsx:4-6`, `InfoCard.tsx:14-24`. Every section header is to carry a 24 dp leading icon with a label; the components make that impossible without a raw `<MmIcon>` in the screen. Remediation (proposal): `icon?: MmIconName` on all three, drawn at 24 in `--text2`. **Outcome: accept, because the direction is still "to be written"; make it a requirement under MM-254+ (Material names from `MmIconName` only; no custom glyphs, MM-109).**

**PD-22 — MuscleVolumeRow's bar is off the chart grammar (CDR, low, confidence high).** `ui.css:1169-1191`: square ends (bars are full-round, `visual-language.md:39`), background `--outline` not `--track`, reference band `ion` 20% (grammar 14%/12%, `:97-99`), 16 px / 5 px literal. Remediation: `border-radius: 999px; background: var(--track)`; band 14/12 per theme. **Outcome: bug ticket with a regression test (stylesheet), to ride with the Train rebuild.**

**PD-23 — `visual-language.md:85-86` says selected nav destinations use the filled variant; MM-236 chose the Outlined set only (GAP, low, confidence high).** `mmIcons.tsx:1-33`; `MmNavigationBar` marks current by pill, Ember and weight (`ui.css:99-105`), which is sufficient. **Outcome: accept, because MM-236 decided it; a documentation ticket to amend the sentence.**

**PD-24 — Weight 700 off the type ladder (IMP, low, confidence high).** `.mm-nav-destination-current { font-weight: 700 }` (`ui.css:101`) and `.mm-notice-title` 700 (`678`); the ladder has 400/600 only (`visual-language.md:64-72`). **Outcome: accept, because both are deliberate emphasis and small; note for the type pass if one comes.**

**PD-25 — Disabled and error states are not in most controls' state sets (GAP, low, confidence high).** No disabled prop/style for `MmSwitchRow`, `MmCheckRow`, `MmSegmented`, `MmChoiceChip`, `MmActionChip`, `MmSlider`, `MmPickerField`; `MmTextField` has a caution helper (`ui.css:276-278`) but no error border or `--danger` presentation, while dialogs use `--danger` caption text (`951-954`): two error presentations. **Outcome: accept for disabled, because no screen read passes a disabled state to those controls (unverified beyond the spot-checks); the field error presentation is a question for the chair (below), not a ticket yet.**

**PD-26 — The register models "two macro pictures at once" (IMP, low, confidence high).** `ComponentsCatalog.tsx:58-67` puts three `MacroBar`s and three `MacroFigure`s in one `InfoCard`, the pattern MM-253 rule 4 forbids and wants a test to fail. **Outcome: accept, because it is a catalog not a screen; split them when the rule's test lands so the register does not contradict the rule.**

**PD-27 — There is no tier-2 primitive (IMP, proposal, medium for the direction's success).** The library offers a card (`MmSurface`/`InfoCard`, always bordered and filled), a hero, and rows inside a bordered group; there is no "row or strip on the canvas" without a surface, so every screen built from these parts becomes a column of same-weight cards, which is MM-253's diagnosis. Remediation (proposal, for the chair/owner): a `MmStrip`/`MmSurface kind="plain"` (no border, no fill, hairline dividers, `--space-12` rhythm) and a `MmSectionHeader` with icon, so screens can state hero → strips → disclosure without inventing it per screen. **Outcome: proposed requirement under MM-253/MM-254; not a bug.**

**Accepted without a finding (looked at):** `HorizonArc` (matches the signature spec; glow hidden in Light), `MmHeroSurface` (limb/orbit percentages match), `Notice` (matches the notice family table), `MmProgressBar`/`StepProgress`, `MmAppBar`, `MmNavigationBar` geometry, `MmTextField` placeholder/autofill (`autoComplete=off`), `MmPickerField` (MM-260 holds; the native picker dialog is the owner's choice), native scrollbars in dialog/sheet (overlay scrollbars on Android follow `color-scheme`), `MmSpinner` reduce-motion, `MmSwitchRow` geometry, `MmFab` radius differing by palette (follows `--radius-group`, which is itself per palette by design).

## Task walkthrough (source only; no render was available)

**(a) Change "Daily activity" (Settings).** Person: first-week user. Sees: a row "Daily activity / Moderately active" with a pencil icon at the end (`SettingsScreen.tsx:83-94`). Must know: the pencil opens a menu (icon alone; label is aria only). Action: tap. Result: a list of five labels appears under the button (`MmMenuButton.tsx:50-66`), **no mark on the current one (PD-12)**, and for the second row the list runs past the group's clipped bottom (**PD-2**). Tap registers with **no pressed feedback (PD-3)**; the subtitle changes after save (that is the only confirmation). Steps failing: the choice step (cannot tell which value is kept) and, for row 2, the find-the-control step.

**(b) Log a weight event (Progress → sheet).** Sees: a sheet rising from the bottom with no lift (PD-10), a "Type" field whose arrow is the engine's at the engine's inset (**PD-1**), a date row that opens the (now fixed) date dialog. On Android the date dialog's first field is focused on open (**PD-19**, unverified). Save confirms by the sheet closing. Steps failing: the type field is not the design system's; possibly the dialog opening straight into the picker.

**(c) Delete a food entry.** Sees: an entry tile with a "more" icon. Taps it: the "Delete" menu item opens below the row and is **clipped by the swipe container (PD-2)**; the alternative, swiping left, shows a delete icon behind (`MmSwipeToRemove.tsx:55-57`) with no threshold cue, and nothing in the UI says the swipe exists. The undo snack (`MealSection.tsx:55`) confirms. Step failing: the visible route to delete.

## Research

Status: **unnecessary**. Every claim rests on the repository's own design documents and source; no platform-API or empirical claim was needed. Web tools were available to this role but not used. A query the chair may want before PD-5/PD-4 land: current Chromium support for `appearance: none` on `input[type=range]` thumbs in the Android WebView version the shell targets (react-capacitor domain).

## Sources and evidence

Repository files only, cited by path and line above. No external sources consulted; none invented.

## Confidence and limitations

- High: every "platform-drawn", "no rule exists", token and literal-value claim (read directly from CSS/TSX).
- Medium: PD-2 and PD-6 (clipping follows from the CSS containment rules, but no frame was rendered); PD-8's fallback font.
- Low: PD-19 (device behavior).
- Limits: no browser, no screenshot, no device; `src/charts/*` not read; screens read only at the cited spots; SHA-256 of inputs not computed; this is a single reviewer's pass, not independent evidence.

## Acceptance criteria and edge cases

Existing criteria traced: MM-260's "the platform draws nothing" is met for the date/time field (`dateDialog.test.tsx:36-49`) and not for the select, checkbox and range (PD-1/4/5). MM-253 "Every component was looked at … with a finding or an accepted outcome for each": this report supplies the outcome column; the three-palette look still needs a render by the chair. Proposed criteria per finding are in each item. Edge cases to carry into tickets: Small-phone viewport (360 px) for the dialog's 312 px content width and the 180 px menu; largest text size for 48 dp rows with two lines; reduce-motion for PD-3's press scale; Light palette for every shadow rule; disabled select on an engine that ignores `color-scheme`.

## Dependencies

- ux-accessibility: challenge PD-6 (ring clipping), PD-9 (targets), PD-13 (destructive emphasis), PD-19, and `MmOption`'s `role="option"` buttons inside a `div role="listbox"` (`MmOverlays.tsx:98-107`), which I did not assess.
- react-capacitor: PD-2 (overlay-host/portal for menus), PD-4/PD-5 (WebView support for `appearance: none` on checkbox/range), PD-19.
- product/owner: PD-13, PD-14's 20 px padding, the switch's Ember fill (below), PD-27.
- MM-254 to MM-259 rebuilds: PD-11, PD-20, PD-21, PD-22, PD-27 should land there rather than twice.

## Safety concerns

None found within the visual remit. PD-13 touches harm indirectly: the irreversible "Erase" is the loudest control in its dialog; that is an emphasis question, not clinical. No health data appears in any catalog story (invented figures only). This is not clinical clearance.

## Unresolved product decisions

1. **Destructive confirmations (PD-13):** keep Ember on the destructive action (amend `interaction-and-motion.md:67-71` and MM-102's `danger` rule) or add a quiet `destructive` button kind and make the safe exit the stronger button. Authority: owner. Impact: every confirm dialog.
2. **Switch on-state in Ember (`ui.css:430-433`):** a Settings group with several switches on carries several Ember fills against "one Ember-filled element per screen" (`color-and-theme-system.md:230-232`, `anti-cruft §3`) and Settings' "Energy: none" (`visual-language.md:144`). Alternatives: keep (conventional), or on-state in `--outline-strong`/`--text` with Ember reserved for actions. Authority: owner.
3. **Button padding 20 px (PD-14):** 16, 24, or a declared exception with its written reason.
4. **Field error presentation (PD-25):** caution helper (field) vs danger caption (dialog): one or two presentations?

## Bounded chair requests (out of visual remit)

- To ux-accessibility: "Does the 2 px outside focus ring being clipped at the edges of `MmListGroup` rows and `.mm-segmented` segments fail the app's focus-visibility rule for keyboard and switch access, and is an inset ring an acceptable fix?" Changes PD-6's remediation.
- To react-capacitor: "In the shell's Android WebView, does focusing an `<input type=date>` programmatically on dialog open show the native picker immediately (PD-19), and is `appearance: none` on `input[type=range]`/`checkbox` honored with `::-webkit-slider-thumb`?" Changes PD-19's existence and PD-4/PD-5's remediation.
- To the chair (owner-facing): decisions 1-4 above.
- Observation outside my remit, passed on without a finding: `MmTextFieldKind` promises a slash keyboard for `quantity` (`MmTextFieldKind.ts:5-6`) but `MmTextField.tsx:49` maps every non-number kind to `inputMode="text"`.

## Verification

- Source inspection only; no command run, no test run, no story rendered, no device.
- Tests inspected (not run): `test/ui/dateDialog.test.tsx`, `test/ui/focusRing.test.ts`, `test/gallery/stories.test.tsx`. The stylesheet-reading pattern in the first two is the model proposed for most regression tests above.
- Requested of the edit owner: a browser look at the Settings "Experience" menu and a Food entry's "more" menu (PD-2); an Android check for PD-19; then `mm check` after any fix.

## Novice mobile experience (when UX/product design is assigned)
Covered above under "## Novice mobile experience" and "## Task walkthrough" (three bounded tasks from source). Heading added by the chair for the template.


## Targeted challenges
None were put to this reviewer in a second round; the conflicts it raised (slider, checkbox, native pickers) were settled by the owner's ruling. Added by the chair.

