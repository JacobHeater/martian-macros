# Panel decision

The chair's synthesis of three independent walks of the design-system
component register (MM-253). The panel advises; the owner decides. Every
finding below has an outcome: a ticket, an acceptance with its reason, or
a verification the chair still owes.

## Facts versus proposals

- **Facts** (source inspection by the reviewers, cited by file and line in
  their reports): one `:active` rule in the stylesheet and the platform tap
  highlight removed; `<select>` with `appearance: auto`; checkbox and range
  styled only by `accent-color`; overflow menus positioned inside
  `overflow: hidden` ancestors; no focus containment in dialogs or sheets;
  the options dialog with no Cancel; the sheet's radius token unused; no
  motion tokens; undefined `--space-1/2/3` in the icon catalog; twelve
  components with no design-system story; composites writing their own
  buttons; `MmProgressBar` taking a colour; `MetricFacts` with `dd` before
  `dt`.
- **Proposals:** every remediation. The tickets hold the chair's selection.

## Coverage

Three reports under `findings/`, each listing every file opened. All of it
is source inspection; no reviewer rendered a story or touched a device. The
chair had looked at the date dialog in two palettes the same day and the
Food screen earlier. The three agreed on the top items independently,
which is the strongest evidence in this run.

## The owner's rulings (2026-10-13)

1. **Nothing native shows.** "Make everything custom and beautiful for
   Martian Macros. I want to own the full visual experience. Native controls
   aren't even remotely sexy." The chair's question (how far "the platform
   draws nothing" extends) was itself a deflection; the answer sets the
   epic MM-262 and makes the native date and time pickers, which MM-260
   had accepted, into tickets (MM-263, MM-264).
2. **A quiet destructive kind; Cancel the stronger button** (MM-280).
3. **The Ember switch stays**; the theme docs get the exception.
4. **48 dp for everything pressable** (MM-281).
5. Not put to the owner, decided from the interaction doc: a snack with an
   action does not expire (MM-272).

## Findings and where each went

| Finding(s) | Where |
|---|---|
| PD-1, RC-1, UX-9 (select platform-drawn) | MM-265, a select of our own |
| PD-4, PD-5, RC-2, RC-3, RC-4, UX-10, UX-11 (checkbox, slider, switch prefix) | MM-266 |
| PD-3, UX-14 (no pressed state, tap highlight) | MM-267 |
| PD-2, PD-12, UX-18 (menus clipped, current value unmarked, menu focus) | MM-268 |
| UX-1, UX-2, UX-17 (time dialog read-back, range, names) | MM-264 |
| UX-3, UX-4, RC-11 (picker chevron dead, visible label) | MM-263 and MM-264 (the field is replaced) |
| UX-5, UX-6, UX-7 (focus containment, options Cancel, sheet close and height helper) | MM-271 |
| UX-8 (snack with Undo expires) | MM-272 |
| PD-18, RC-15, UX-26 (stories for overlays and states; coverage test) | MM-273 |
| PD-14, PD-15, PD-16, PD-17 (literal radii, gaps, durations; undefined tokens; fixed grey) | MM-274 |
| PD-6 (focus ring clipped) | MM-275 |
| PD-7, PD-8 (Ember tint; font glyph) | MM-276 |
| PD-10, PD-11 (sheet and card spec) | MM-277 |
| RC-5, RC-6, RC-7, RC-8, RC-9, RC-13 (composites, colour prop, chevrons, checker) | MM-278 |
| UX-15, UX-16, UX-19 (field error state, card error, dt/dd) | MM-279 |
| PD-13 (destructive emphasis) | MM-280 |
| PD-9, UX-12 (48 dp) | MM-281 |
| RC-16, PD-23 (the written system; the filled-icon sentence) | MM-282 |
| PD-19, RC-18 (native picker on dialog focus) | Goes away with MM-263 and MM-264; no device check needed |
| PD-20, PD-21, PD-22, PD-27, UX-24, RC-10 (row icon size, header icon slot, volume bar grammar, a tier-2 strip primitive, inline captions, px icon sizes) | MM-254 to MM-259, the destination rebuilds, where they land once |
| UX-13 (200% clipping in segmented and menus), UX-25 (light field-border contrast) | Chair verification pending: render the Components and Fields stories at 200% and measure the border; ticket if confirmed |
| UX-20 (button wrapping block content) | MM-278's `MmPressable` consolidation; `aria-describedby` to the content when a label is set |
| UX-21, UX-22, UX-23 | Accepted: the spinner is allowed under reduced motion by the doc; the download strip's cadence waits for a device; the day label's name is wording for the rebuild |
| RC-12, RC-14, RC-17, RC-19, RC-20, RC-21, PD-24, PD-25, PD-26 | Accepted with the reviewers' reasons: vocabulary churn, private one-liners, duplicate selectors, autofill unseen, homes for kinds not yet rendered, a snack of spans, deliberate weights, disabled states no screen passes, a catalog not a screen |

## Conflicts between reviewers, and the chair's call

- **The slider.** React-Capacitor accepted the native thumb (the owner had
  reviewed sliders on the phone); product-designer wanted it drawn. The
  owner's ruling settles it: drawn (MM-266).
- **The checkbox.** UX left it to the owner; the other two wanted it drawn.
  Same ruling (MM-266).
- **The date and time pickers.** MM-260 had accepted the native popups as
  "the owner's choice"; the owner's ruling overturns that (MM-263, MM-264).
- **Where PD-20/21/27 land.** Product-designer proposed them as
  requirements under MM-253; the chair put them in the destination
  rebuilds so each is built once.

## Edit owner and paths

The parent session, on `feature/mm262-own-every-control`: `requirements/`,
`roadmap/`, `AGENTS.md`, this folder. No source changed in this run; the
tickets are the deliverable.

## Verification, actual results and limits

- `mm req` on the branch: every ticket placed; `mm panel` on this folder.
- Not done: any render by a reviewer; the 200% and contrast checks above;
  anything on the phone, which has been disconnected since the afternoon.
- The process lesson, for the panel protocol and `AGENTS.md`: a component
  is not reviewed because its screen was; the register is walked component
  by component, every state, every palette, and the checker treats the
  design system as strictly as the screens (MM-261, MM-278).
