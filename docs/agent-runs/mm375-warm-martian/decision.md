# Panel decision

The chair's outcomes for the warmer Martian palette (MM-375), the coach insight in ion (MM-362) and the grade fills
(MM-370), the product owner's requests of 2026-10-17. The product role and the product designer researched and proposed
in parallel; the chair drew the result; the owner judged it in Storybook; **the UX guard passed on its second pass**
(first pass BLOCKED on UX-1).

## The owner's calls
- Insight text in ion; grade fills with the colours left to the chair.
- After the plum was drawn: "the shade of purple has turned maroon … that's not a 90's purple". The neutrals became a
  royal 90s violet, bluer than the old grape. Approved ("Yes, that's it").
- Lime stays the action colour (asked; "Keep lime").

## Research reports
| Report | Outcome |
|---|---|
| Product: washout in product terms; 90s references (Nickelodeon orange, ACG, Memphis hues without patterns); where warmth enters; acceptance criteria | Adopted as MM-375's criteria, edited (the warm-on-every-screen criterion restated at UX-3). P-1 (MM-184 superseded) done; P-2 (MM-370 revised) done; P-3 (ion equals protein) left for the owner; P-4 (§1.3 restated for Martian) done. |
| Product designer: LCh measurement (12 of 21 values in one 8° violet band); plum neutrals; tangerine carbs; magenta fat; categorical grade fills | Measurement and numbers verified by computer. Plum rejected by the owner; replaced by a royal violet. Tangerine, magenta (the designer's `#E84FAE`, after a brighter one failed the 10 L* rule) and the categorical fills built. Secondary text made near-neutral rather than the proposed pink-lilac. |

## UX guard findings
| Finding | Outcome |
|---|---|
| UX-1 (pressed badge loses its letter) | Fixed: own pressed ring in `--text`, out of the shared background rule. Bug MM-376 with `test/ui/gradePressed.test.ts` (failed before the fix). |
| UX-2 (A in caution gold, B in "good" green) | A and B swapped in every palette: A mint, B sunflower. |
| UX-3 (warm on every screen) | Criterion restated in MM-375: warm hues wherever their roles appear, never as decoration. |
| UX-4 (ion carries dots, insights and protein) | Owner question, with the product role's P-3; in the handoff. |
| UX-5 (`text2` nearly as bright as `text`) | `text2` toned to `#DDD4CC`, L* 85.4. |
| UX-6 (figure and ground by a thin margin) | On the owner's phone checklist: Martian at low brightness. |
| UX-7 (ion margin in light) | Token test: ion 4.5:1 on all four levels in every palette. |
| UX-8 (close fill pairs) | Machado figures recorded in the colour doc; they rest on form (lettered pills). |
| UX-9 (green then yellow starts a traffic light) | Doc wording softened. The coaching/safety question on grade fills and MM-108 stays open in MM-370. |

## Also found and fixed
The colour doc said contrast and macro L* gaps were held by tests; those were the Flutter app's and had not been carried
over. `apps/mobile/test/tokens.test.ts` now holds, in every palette: text roles 4.5:1 on all four levels, ion 4.5:1 on all
four levels, macros at least 10 L* apart, and every grade letter 4.5:1 on its fill.

## Also asked during the run
"What this rests on" was ambiguous to the owner; asked, they chose "The numbers behind this", now used in all four places
(inline insights, the dashboard insight card, the stall card, coach confidence) and in the tickets that quote it.

## Verification
Token, theme and UI suites pass after the last change; renders re-captured in three palettes after every change. Not
looked at: the phone, a screen reader, a colour-blind simulator beyond the computed Machado figures.
