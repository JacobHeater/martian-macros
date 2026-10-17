# Review: ux-accessibility (UX guard), run `mm375-warm-martian`

Saved by the chair, as returned by the read-only reviewer (Claude Opus 5.5 subagent, 2026-10-17). First pass; the second
pass and the outcomes are in `decision.md`.

## Scope
Change audit of MM-375 as drawn: tokens, `coach.css` (insight in ion), `MmGradeBadge` and the grade rules in `ui.css`,
`tokens.test.ts`; 12 of 24 frames in `shots5/` and the old Martian in `shots2/`. Ratios marked computed are the reviewer's
own WCAG arithmetic. No device, screen reader or simulator.

## Facts
Ion as caption text: Martian 13.6 on canvas, 8.8 on overlay; light 4.70 on canvas, 5.12 on surface (4.3 on sunken, where
no insight sits). Grade letters as in §1. Light fills need the edge (sunflower on white 1.49; edge 3.3-3.6). Martian
surface against canvas 1.15:1, 6.7 L*. Colour never carries a grade alone. Macros lettered or labelled.

## Findings
- **UX-1 (high, defect, BLOCKING).** `.mm-grade-button:active { background: var(--selected) }` outranks the band fill while
  the letter keeps `--on-grade`: 1.84:1 in Martian, about 1.3:1 in Dark, for as long as the badge is held. Own pressed
  state; BUG ticket and regression test.
- **UX-2 (medium, usability by inspection).** Fill colours run against the letters' order: A sunflower in the caution-gold
  family, B a "good" green. Owner's call; swap the families or use a single-hue ramp.
- **UX-3 (medium).** MM-375 asked for a warm element on every screen; Workout and Coach settings show none in normal use.
  Restate the criterion or add warmth by role, never decoration.
- **UX-4 (medium).** On the Dashboard ion carries the logged-day dots, three insight lines and the protein bar (same hex).
  Not blocking; keep as an owner question.
- **UX-5 (low).** `text2` almost as bright as `text` (1.18:1, about 6 L*); move toward L* 85.
- **UX-6 (low, hypothesis).** Figure and ground better but by a thin margin (1.15:1); check on a phone at low brightness.
- **UX-7 (low).** Light ion caption has a thin margin; add a token test that ion holds 4.5 on all four levels.
- **UX-8 (low).** Close fills: B against positive in dark, B and C share a lightness, sunflower against the lime action;
  run Machado for fills and record it.

## Walkthrough (Martian food log)
Header, grades, insight and macros told apart: pass, except reading what a fill's colour means (UX-2) and the letter
vanishing while pressed (UX-1). Navigation labels collide at large text (already MM-373).

## Chair request
Coaching/safety: does a categorical fill with A in the caution-gold family and B in "good" green break MM-108 more than a
single-hue ramp?

## GUARD verdict
**BLOCKED: UX-1.**
