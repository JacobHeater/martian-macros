---
id: MM-274
component: design-system
status: done
related: [MM-262, MM-102, MM-103]
---

# Bug: tokens are bypassed by literal radii, gaps, durations and colours

## What the walk found

`ui.css` opens with "Every value is a token" and then uses literal radii
(12px on the compact surface and choice card, 8px on the add plate and
badge), 6 px gaps off the 4/8 scale, 20 px button and FAB padding, 180 px
menu width, and literal durations (150, 200 and 1000 ms) with no motion
tokens declared, though the interaction doc names fast 100, base 180, slow
280 and reveal 600 (product-designer PD-14, PD-15). The icon catalog uses
`--space-1`, `--space-2` and `--space-3`, which do not exist, so it draws
with no gap (PD-16). The Bars and Tokens catalogs sit on a fixed light grey
in every palette (PD-17).

## The fix

- Radii to `--radius-*` tokens; 6 px gaps to 8 (or 4) with a look; the
  20 px button padding declared as `--space-20` with its written reason,
  as `anti-cruft-and-anti-slop.md` section 5 asks.
- `--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-reveal` in
  `tokens.css`, used by every transition and animation; reduced motion sets
  them to zero (fades to 100 ms). The spinner's slow turn is the one
  exception, written down.
- The gallery's undefined tokens corrected; its fixed grey replaced by
  `--canvas`.

## Regression test

`test/ui/tokens.test.ts` reads every stylesheet under `src/`: every
`border-radius` is a `var(--radius-*)`, `50%`, `999px` or `2px`; every
`transition` and `animation` duration is a `var(--motion-*)`; every
`var(--name)` used is declared in `tokens.css`; no hex colour appears
outside `tokens.css`.

## Acceptance criteria

```gherkin
Scenario: Radii, durations and tokens
  Then the stylesheet test finds no literal radius, no literal duration and no undeclared token

Scenario: The catalogs sit on the canvas
  Then the Icons story has its gaps and the Bars and Tokens stories sit on --canvas in every palette
```

## Progress

Built 2026-10-13: `tokens.css` declares `--motion-fast`, `--motion-base`, `--motion-slow`, `--motion-reveal`, `--motion-fade` and `--motion-turn`, zeroing the movement tokens under reduced motion; `--space-20` and `--radius-check` are declared with their reasons. Every radius in every sheet is a `--radius-*` token (or 999px, 50%, 2px), every duration a motion token, every gap a `--space-*` token, every custom property declared, and no hex colour sits outside `tokens.css`; the icon catalog's gaps exist and the catalogs sit on `--canvas`. Tests: `test/ui/stylesheetTokens.test.ts`.
