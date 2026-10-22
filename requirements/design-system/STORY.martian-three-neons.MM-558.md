---
id: MM-558
status: done
component: design-system
related: [MM-556, MM-555, MM-554, MM-253, MM-402, MM-181, MM-106]
---

# Story: Martian with intent: three neons, sheen and texture

## Context
After MM-554 to MM-556 the owner, 2026-10-22, judged the Martian theme "unintentional. It lacks cohesion": about twelve
saturated hues had been added a round at a time. The owner then tuned it on the iPhone with live reload (MM-557), one
change at a time, on the `martian-tuning` branch, with the product-designer and UX-accessibility roles consulted on the
palette system and on texture. Each decision below is the owner's, given while looking at the phone.

## Decisions
- **Three neons, one meaning each** (the product designer's system). Lime-yellow `#E8FF1A` is the action; hot pink
  `#FF40A0` (`chosen`) is chosen: a chosen segment, chip and card, the current tab's plate (its label in the text
  colour); neon orange `#FF7420` (`flare`, `arc`) is food going in: a meal's add plate and the calorie arc. Violet
  `#8A5CFF` (`accent-line`) is the frame: the hero's edge, the navigation bar's stripes, the arc's track. Removed: the
  gradient titles, the glowing card edges, lime as chosen, the `pop` and `title-*` tokens.
- **No macro collides with a neon**: carbs amber `#FFA024`, fat violet `#9A6BFF`, protein the cyan stars.
- **Brighter neons, richer violets** (owner: "purples look a little washed out. Neons look a little dark"): the levels
  `#150F30` / `#1F1548` / `#2A1D5C`, the track `#2A1F58`, the field edge `#B762FF`.
- **The section marks are hot pink** (owner, on Settings).
- **The calorie arc's dot glows on the iPhone.** The glow was a CSS blur on an SVG circle, which WebKit draws as a hard
  ring; it is an SVG `feGaussianBlur` now, in every palette. In Martian the arc's track is the frame violet at 60%, so
  the arc reads before anything is eaten.
- **Spacing the owner asked for**: no rule between the hero's bars and the coach's line (it read as one more empty bar),
  space instead; the week's strip 16 / 20 dp from the cards around it; folded sections 12 dp apart (MM-402 had 4), and a
  header that opens a screen stacks with them; the weight events' empty line is a caption; History on the Dashboard is
  a section with its mark, not a bare disclosure.
- **The Coach's sections are cards** (`MmSection framed`, owner: "wall-of-text syndrome"): header and rows on one card,
  12 dp apart, anything that was a card inside lying flat; text buttons' padding hangs out so their labels line up with
  the words beside them. This amends MM-253's "a section is never drawn on a surface" for the Coach.
- **A hint of sheen, never gloss** (owner: "it needs some sheen", then "looks forced"): a card is 3% lighter at its
  top, with a 9% highlight on its top edge and a small shadow; a neon fill has a faint top edge. The floating action
  stays flat (MM-181).
- **Texture in the landscape, not on the content** (the product designer's placements within the UX guardrails; the
  owner: "a bit of texture thoughtfully sprinkled"): the welcome's starfield, the stripe set on the navigation bar, and
  a ridge after the last of each page's content with a green alien peeking over its tallest peak, rising, looking about
  and blinking every 9 s (`--motion-idle`, still under reduced motion). All of it goes under `prefers-contrast: more` and
  `forced-colors`, the hero's rings too; `design/visual-language.md` records the alien as the one allowed mascot.
- Dark and Light keep their look; the new tokens map to their existing values there. The arc glow, the spacing and the
  History section change every palette.

## Acceptance Criteria
- [x] The Martian tokens are as `design/color-and-theme-system.md` tables them, the record (`test/support/flutterTheme.json`) equals them, and every contrast rule in `test/tokens.test.ts` holds.
- [x] A chosen segment, chip and card, and the current tab, wear `chosen`; the add plate and the arc wear neon orange.
- [x] The floating action has no shadow (`test/ui/flatFab.test.ts`); the alien's loop is a motion token zeroed under reduced motion.
- [x] Texture sits behind no text, number or control, and goes under more contrast and forced colours.

## UI/UX
Checked by the owner on their iPhone through `mm run --ios --phone --live`; every Storybook story draws the change.
