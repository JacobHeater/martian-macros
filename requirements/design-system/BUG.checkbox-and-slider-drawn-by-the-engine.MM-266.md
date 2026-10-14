---
id: MM-266
component: design-system
status: done
related: [MM-262, MM-240, MM-104]
---

# Bug: the checkbox and the slider are drawn by the engine

## What the walk found

`MmCheckRow` is a native `<input type="checkbox">` tinted with
`accent-color`: the box, the tick, its size and its focus are the engine's
(product-designer PD-4, React-Capacitor RC-2, UX-10). `MmSlider` is a native
`<input type="range">` tinted the same way: track, thumb and focus are the
engine's, the track is not `--track`, and the thumb is the engine's size
(PD-5, RC-3, UX-11). The switch beside them is already ours. The owner's
rule (MM-262): nothing native shows.

## The fix

- **Checkbox:** `appearance: none`; a 20 dp box in `--outline-strong` on
  `--sunken`; checked is an Ember fill with `MmIcon` check in `--on-ember`;
  focus-visible ring; pressed state; disabled quiet. The row stays the 48 dp
  target.
- **Slider:** `appearance: none`; the track 4 dp in `--track` with the
  filled part in Ember; the thumb 20 dp in Ember with a 48 dp hit area and
  our focus ring; pressed grows the thumb within the motion budget;
  `label` required so every slider speaks its value (`aria-valuetext`).
- Both in the Fields and Sliders stories in three palettes with every
  state.

## Regression test

`test/ui/nativeControls.test.ts` reads the stylesheet: `.mm-checkbox` and
`.mm-slider` set `appearance: none`, the slider's track and thumb
pseudo-elements are styled, and no rule uses `accent-color`. The component
tests render our check glyph.

## Acceptance criteria

```gherkin
Scenario: Checked
  Given a checked row
  Then the box is Ember with our check glyph, and the engine's tick is not drawn

Scenario: Slider
  Then the track is --track with the filled part Ember, the thumb is 20 dp with a 48 dp hit area, and focus shows our ring

Scenario: No accent-color
  Then the stylesheet has no accent-color rule
```

## Progress

Built 2026-10-13: `.mm-checkbox` and `.mm-slider` have `appearance: none`; the box is 20 dp in `--outline-strong` on `--sunken`, Ember with `MmIcon` check when checked; the slider's track is 4 dp `--track` with the filled part Ember (a share carried as `--mm-slider-fill`), the thumb a 20 dp Ember disc in a 48 dp row with our focus ring, grown while pressed; `label` is required on `MmSlider` and `MmSliderRow` so every slider speaks its value (Settings and Pause gained theirs). No `accent-color` anywhere. Tests: `test/ui/nativeControls.test.tsx`. Looked at in States and Fields/Sliders in three palettes.
