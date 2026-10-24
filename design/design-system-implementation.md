# Design system implementation (the React library)

How the design system is built in `apps/mobile/src/ui/`, for whoever adds
to it. Requirements decide **what**; the roadmap decides **when** (WS-03).
This replaces the Flutter plan this file held until 2026-10-13; the
Flutter app is gone (MM-232) and nothing here describes it.

## The rule: nothing native shows

The owner's rule (2026-10-13, MM-262): no native date or time picker, no
native select list, no engine-drawn checkbox, slider thumb, tap highlight or
focus ring. The design system draws every control and every state of it,
in every palette, and it is judged in the register (Storybook, MM-237)
before it ships. A native element may exist underneath only for the
keyboard and assistive technology, invisible or wholly restyled:

| Looks like | Underneath | Why |
|---|---|---|
| The switch, the check box, the slider | `<input type="checkbox">`, `<input type="range">` with `appearance: none` | Keyboard, drag and screen reader for free; nothing of the engine's is visible |
| A text field | `<input type="text">` in our box; `<textarea>` for several lines (`lines`, MM-603), grown by the component, with no drag handle | The keyboard is the phone's; the box, ring and error are ours |
| The calendar (`MmDatePicker`) | Nothing native. A `role="grid"` of `MmCalendarDay` buttons | A native date popup cannot be styled |
| The drums (`MmTimePicker`) | Nothing native. Each drum is a `role="spinbutton"` | A native time popup cannot be styled |
| A select (`MmDropdown`) | Nothing native. A field button that opens `overlays.options` | A native list cannot be styled |
| A menu (`MmMenuButton`) | Nothing native. The overlay host draws `MmMenu` at the trigger's anchor | Nothing can clip it |

`test/architecture.test.ts` enforces the rule: a native date, time or
select control has no home and fails wherever it is; each other control
kind lives in exactly one component (`controlHomes`, MM-261); a `<button>`
is written only by the components in `buttonHomes` (MM-278); a composite
writes no control; a component never takes a prop named `color`,
`className` or `style`.

## Where it lives

```
src/theme/tokens.css     every colour, radius, spacing, type role and motion duration
src/theme/base.css       fonts, box-sizing, the app-wide focus ring
src/ui/ui.css            every component's rules; nothing in it is a literal
src/ui/*.tsx             one component per file, named for it (rule 5)
src/gallery/*            the register: tokens, icons, components, fields, states, overlays, and every screen
```

A component imports `./ui.css` and the icons it draws; it imports nothing
from `domain/`, `engine/` or `state/` except a value type it displays
(`CalendarDate`, `MuscleVolume`, `StrengthTrend`).

## The control map

The one home of each native control kind, and the component a screen uses
instead of writing one:

| A screen wants | It uses | Native kind underneath (home) |
|---|---|---|
| A button | `MmButton` (`kind`: primary, secondary, text, destructive), `MmIconButton`, `MmFab` | `<button>` |
| Content pressed as a whole | `MmPressable` | `<button>` |
| A row | `MmListRow` (`opens` draws the chevron; `trailingAction` sits beside the pressed part) | `<button>` when it presses |
| Text or a number | `MmTextField` (`kind`, `error`, `helper`, `name`; `lines` for longer text) | `<input type="text">`, `<textarea>` (MmTextField) |
| On or off | `MmSwitchRow` | `<input type="checkbox" role="switch">` (MmSwitchRow) |
| Tick what applies | `MmCheckRow` | `<input type="checkbox">` (MmCheckRow) |
| A value on a range | `MmSlider`, `MmSliderRow` in a group | `<input type="range">` (MmSlider) |
| One of a few, visible | `MmSegmented`, `MmChoiceChip`, `ChoiceCard` | `<button>` |
| One of a list | `MmDropdown`, or `overlays.options` from a row | none |
| A day | `MmPickerField` opening `overlays.date` (`MmDateDialog` over `MmDatePicker`) | none |
| A time | `MmPickerField` opening `overlays.timeOfDay` or `overlays.clockTime` (`MmTimePicker`) | none |
| A short menu of actions | `MmMenuButton` (`overlays.menu`, drawn as `MmMenu` of `MmMenuItemRow`) | `<button role="menuitem">` (MmMenuItemRow) |
| A question | `overlays.confirm`, `overlays.choice` (`MmDialog`) | none |
| A panel from the bottom | `overlays.sheet` (`MmSheet`) | none |
| A short message | `overlays.snack` | none |

## Composites

A composite composes components and writes no control of its own. The
checker derives it: a `src/ui` file that imports another component's
value (an icon is a drawing, not a component), or renders a `dialog`,
`listbox` or `menu` role, is a composite. `MmOverlays`, `MmDialog`,
`MmSheet`, `MmMenu`, `MmDatePicker`, `MmTimePicker`, `MmDropdown`,
`MmMenuButton`, `MmSurface`, `MmHeroSurface`, `InfoCard`, `DayStepper`,
`NumberEntryCard` and `DownloadStatusStrip` are composites. When a
composite needs a pressable part it composes `MmButton`, `MmIconButton`,
`MmPressable`, `MmOption`, `MmCalendarDay` or `MmMenuItemRow`.

## The prop vocabulary

- `label`: visible words. `name`: what a person hears when the visible
  words are not enough; with a label the two compose, never replace.
- `valueText`: a value in words ("January 1, 1996").
- `selected` (a segment, a chip, a card), `chosen` (an option), `current`
  (a destination), `expanded` (what opens and closes).
- `onPress` (a button, a row, a surface), `onSelect` (an option, an item, a
  chip), `onChange` (a value). An absent `onPress` or `onChange` draws the
  control as off; nothing is `disabled` by a separate flag.
- `kind`: the meaning of a button, a surface, a notice, a text field, a
  bar. Never a colour, a radius, a size or a class.
- `helper` and `error`: words under a field; an error is also `aria-invalid`
  and `role="alert"`.
- `opens`: a row or an icon button that opens something, and what kind.

## The state set every control draws

Rest, hover (where there is a pointer), focus, pressed, disabled, selected
or chosen, error. In `ui.css`:

- **Pressed** (MM-267): one family at the foot of the sheet. Every
  selector with `cursor: pointer` has an `:active` rule and a
  `.mm-pressed` twin, so the register can show the state. The primary
  button and the floating action depress to 98% in `--motion-fast`; every
  other pressable fills `--selected`; under reduced motion the scale goes
  and a non-moving change stays.
- **Focus**: the app-wide ring (2 px `--text`, 2 px outside). Inside a
  container that clips its overflow (a list group, the segmented control,
  a flush surface, the hero, a swipe row, the options list, the year list,
  a drum) the ring is drawn inset, so no part is hidden (MM-275). A text
  field marks focus on its box and draws nothing inside it (MM-239).
- **Disabled**: `--selected` on `--text3` for a button; quiet border and
  `--text2` for a picker field, its value still readable.
- **Selected**: `--selected` fill with Ember text or an Ember check;
  Ember is never a tint (MM-276).
- **Error**: `--danger` border and a caption under the field (MM-279).

## Tokens

Every value in `ui.css` and every screen sheet is a token (MM-274):
radii from `--radius-*` (or `999px` for full-round, `50%` for a circle,
`2px` for a hairline bar), gaps from `--space-*`, durations from
`--motion-fast` (100 ms), `--motion-base` (180), `--motion-slow` (280),
`--motion-reveal` (600) and `--motion-fade` (100), with `--motion-turn`
for the spinner's one perpetual turn. Reduced motion zeroes the four
movement tokens in `tokens.css` and leaves the fade. No hex colour appears
outside `tokens.css`. `test/ui/stylesheetTokens.test.ts` reads every
sheet and fails a literal.

Two values sit off the scale, each with its written reason in
`tokens.css`: `--space-20`, a text button's horizontal padding, and
`--radius-check`, the check box's corner.

## Elevation

Light: cards, list groups and the hero carry a hairline and
`0 1px 2px rgb(12 18 32 / 6%)`; the sheet `0 8px 24px rgb(12 18 32 / 12%)`.
Dark palettes: no shadow on cards; a 1 dp inner top highlight (`--text` at
6%). The dialog floats on its scrim with `0 16px 40px`. The floating
action has no shadow in any palette (MM-181).

## Overlays

`MmOverlays` is the one host. While a question is up the app beneath it
is `inert`; focus stays inside the panel (`trapFocus`) and Escape closes
it from anywhere (MM-271). Every dialog and sheet has a visible way out:
the options dialog a Cancel, the sheet a Close and a handle that drags it
away. A confirmation draws the destructive action quiet and Cancel as the
stronger button (MM-280). A snack with an action waits for it, a
replacement, a Dismiss or the back button; one without goes after four
seconds unless it is focused or pointed at (MM-272).

## How a component gets its story and its tests

- Every component of `src/ui` is imported by a file under `src/gallery`,
  or `test/gallery/stories.test.tsx` fails. The Components, Fields and
  Charts catalogs show it in use; the States catalog shows each of its
  states (rest, pressed through `.mm-pressed`, disabled, selected, error);
  the Overlays catalog opens each overlay on its own.
- Every story is drawn and walked by the stories test; a screen story
  (`screenStory`) is the whole app opened at that screen.
- A behaviour has a component test in `test/ui/` that renders it and
  reads what a person sees, hears and does; a rule of the stylesheet has a
  test that reads the stylesheet (`test/support/stylesheetRules.ts`),
  because nothing lays out in the test browser.
- A change to how a component looks is not done until it has been looked
  at in a browser, in Martian, Dark and Light.

## Icons

Material's Outlined set behind the app's names, through `MmIcon`
(MM-236): one family, selected or not. No hand-drawn glyph, no font
character (MM-276). Custom art waits for the app mark (MM-109).
