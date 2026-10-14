---
id: MM-276
component: design-system
status: done
related: [MM-262, MM-236, MM-102]
---

# Bug: the add button tints Ember as a background and the chip's check is a font glyph

## What the walk found

The add icon button's plate is Ember at 15% as a background (PD-7);
`anti-cruft-and-anti-slop.md` says Ember is never tinted or used as a
background, and one Ember element per screen, while Food draws one plate
per meal. The selected choice chip's check is `content: '✓'`, a font glyph
that falls back to whatever font the phone has, while the segmented
control already uses `MmIcon` check (PD-8); the icon rule is one family.

## The fix

- The plate in `--selected` with the plus in Ember (pressed: Ember fill),
  or a plain Ember plus with no plate; the owner judges in the register.
- `MmChoiceChip` renders `MmIcon` check when selected; the `::before` goes.

## Regression test

`test/ui/emberAndGlyphs.test.ts`: no `background` in any stylesheet mixes
`var(--ember)`; no `content: '✓'`; a selected chip renders an svg.

## Acceptance criteria

```gherkin
Scenario: Ember is never a tint
  Then no stylesheet rule uses a color-mix of --ember as a background

Scenario: One icon family
  Then the selected chip's check is MmIcon, and no stylesheet draws a check as text
```

## Progress

Built 2026-10-13: the add plate is `--selected` with the plus in Ember, filling Ember when pressed, hovered or focused; `MmChoiceChip` renders `MmIcon` check when selected and the `::before` glyph is gone. Tests: `test/ui/emberAndGlyphs.test.tsx` (no background mixes Ember; no text check anywhere; a chosen chip renders an svg).
