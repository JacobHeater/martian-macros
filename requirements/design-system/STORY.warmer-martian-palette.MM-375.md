---
id: MM-375
status: done
component: design-system
related: [MM-184, MM-102, MM-103, MM-106, MM-108, MM-362, MM-370, MM-237, MM-293, MM-554]
---

# Story: A warmer Martian, without the purple washout

## Context
Martian (MM-184) is the new-install default, approved by the owner as "retro '90s": deep grape surfaces, cream text,
acid-lime actions, cyan, pink and violet macros. On 2026-10-17 the owner said it "suffers from purple washout" and asked
the product designer and the product role to research 90s colour schemes and add what the owner sees as a deficit of
warm colours.

The panel's research (`docs/agent-runs/mm375-warm-martian/`) found the washout in the roles, not in one colour: every
neutral, the secondary text, the tracks, the selected state and the fat macro sit in one violet hue band, so cards, the
navigation bar and the canvas separate only by hairlines, and detail text reads as part of the ground. The only colour
that stands out is the lime action. Martian's ion and protein are also the same colour, which matters now that the coach's
insight lines are drawn in ion (MM-362).

## Decisions
The product owner's (2026-10-17): research 90s schemes; add warm colours; the insight lines in ion; food grades with colour
fills.

From the research (the product role's report): the 90s warmth that fits a novice health app is a dark ground with one or
two flat, saturated warm accents (the Nickelodeon orange and 90s Nike ACG model), not the patterned rainbow side (Memphis,
Lisa Frank), whose patterns, glitter and neon read as parody.

The product owner's, after seeing them drawn (2026-10-17):
- **A royal 90s violet, not plum.** The panel's first proposal moved the neutrals to plum (CIE hue about 329°); the owner:
  "the shade of purple has turned maroon … that's not a 90's purple". The approved neutrals are bluer than the old grape,
  with larger steps between canvas, surface, raised and overlay.
- **Lime stays the action.** Tangerine comes in as carbs (lime and orange, the Nickelodeon-era pair).

Built from the panel's proposal: secondary text near-neutral instead of lilac (an exception, for Martian text roles only,
to the colour doc's ban on desaturated warm neutrals); fat moved from violet to hot magenta, kept 14.8 L* from carbs (a
brighter magenta was tried and failed the 10 L* rule); grade fills categorical (sunflower, mint, periwinkle, orchid), not
a ramp. Ion and protein stay the same aqua, as before: the insight is a sentence with its own icon, protein a bar and a
"P" figure (the product role's P-3, for the owner to revisit if it reads wrong). Values, contrast and colour-blind figures
are in `design/color-and-theme-system.md` §1.

This supersedes MM-184's "Readable retro colors" scenario where it names "deep grape surfaces" and "violet" fat.

## Description
Revised Martian tokens in `tokens.css`, the colour doc and the token tests, drawn in Storybook on every screen and reviewed
by the UX guard before they ship. This supersedes MM-184's "Readable retro colors" scenario where its named colours change.

## Acceptance Criteria
```gherkin
Scenario: The washout is gone
  Given the Food, Dashboard, Workout, Coach and Settings stories in Martian
  Then cards, the navigation bar and the canvas are told apart at a glance without their outlines
  And secondary and caption text do not share the hue of the surfaces they sit on
  And warm hues appear wherever their roles do (carbs, fat, grades, caution), and nowhere as decoration
  And the owner, shown before and after side by side, says the washout is fixed

Scenario: Still Martian
  Then the palette keeps a dark, purple-family canvas, cream primary text and a flat solid primary action with no glow
  And it uses no pattern, no gradient between two hues, no glitter and no neon glow

Scenario: Contrast
  Then every text role is at least 4.5:1 on canvas, surface, raised and overlay
  And every fill, bar, icon and control boundary is at least 3:1 against its background or its track
  And text on each filled control, grade fills included, is at least 4.5:1

Scenario: Macros
  Then protein, carbs and fat each differ by at least 10 L*
  And no macro colour equals water or a grade fill
  And macro labels remain beside every macro colour

Scenario: Ion as the coach's voice
  Given an inline insight at caption size
  Then its ion text is at least 4.5:1 on every surface it sits on

Scenario: Grade fills
  Then grades A to D each have a solid fill, none red, peach or salmon, none the action colour
  And the letter is always printed, so the colour never carries the grade alone

Scenario: The tests hold the values
  Then the token tests name the new values and the contrast tests pass
```

## UI/UX
- `Design system/Tokens` in Martian, and every screen story in the Martian palette (the tokens change every screen at once).
  Before and after renders in the panel run `docs/agent-runs/mm375-warm-martian/`.

## Notes
- The colour doc said automated tests held text contrast on all four levels and the macro L* gaps; those were the Flutter
  app's and were not carried over. They are now in `apps/mobile/test/tokens.test.ts` for every palette.

## Progress
Built (2026-10-17, MM-375's panel run): the revised Martian tokens in `tokens.css`, the colour doc §1, and the token
tests; drawn in every screen story; the owner approved the royal violet ("Yes, that's it") and kept lime; the UX guard
passed on its second pass (`docs/agent-runs/mm375-warm-martian/decision.md`).

Added (2026-10-21): the token tests now also hold the criteria they did not: every grade badge has a 3:1 boundary on
canvas, surface and raised (its fill, or in light its edge), no macro colour is water or a grade fill, and no grade fill
is the action colour (`test/tokens.test.ts`). Not run locally; CI validates.

**Ion and protein (P-3, UX-4), settled by default.** Built as the Decisions above state: Martian's ion and protein stay
the same aqua, told apart by form (the insight is a sentence with its own icon, protein a bar beside its "P" label), and
never on the same chart. The product designer's way out was to part the two hues; a search of the colour space found no
free one: every colour that holds 4.5:1 as caption text on overlay lies within about 37 ΔE of a role Martian already
uses, and the farthest are lime-greens beside the action or violets in the canvas's own band, which would bring back the
washout. Parting them would mean moving protein or another role, which is the owner's call. Say if it reads wrong.

Superseded in its values (2026-10-22): MM-554 re-derives every Martian token from the brand art, at the owner's word;
the decisions above stand, ion equal to protein included (`STORY.martian-from-the-brand-art.MM-554.md`).

## Owed on a phone
- Martian at low screen brightness: cards, the navigation bar and the canvas still told apart (UX-6).
- The Food, Dashboard, Workout, Coach and Settings stories looked at in the three palettes and through a colour-blind
  simulator, beyond the computed Machado figures.
