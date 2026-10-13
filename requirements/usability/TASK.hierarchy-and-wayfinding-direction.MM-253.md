---
id: MM-253
component: usability
status: proposed
related: [MM-224, MM-109, MM-179, MM-236, MM-237, MM-101, MM-106, MM-108]
---

# Task: hierarchy and wayfinding, the direction

## The decision

The owner's call (2026-10-13): the app suffers from a lack of iconography
and segmenting; its views are monolithic and the person carries the load.
It needs more graphics to make the experience fun, more natural segmenting,
and view hierarchies that make the flow less fatalistic. Decided with it:
Material icons everywhere now and custom art after the app mark exists
(MM-109); both macro pictures kept behind a switcher; all five destinations
and Settings under one direction, built in stages.

## What the register shows (2026-10-13, the static Storybook build)

- Every screen is a column of same-weight cards: same radius, fill and
  heading whether the card is the day's hero or a four-line explanation.
- Information repeats: the hero's macro bars and the macronutrient donut
  carry the same three numbers on Dashboard and Food.
- Explanations sit inline: a four-line caption under the trend chart, a
  four-line paragraph above the weight events.
- Lists have no shape: Train is thirteen identical rows with no week or
  month and no mark on a record day.
- Icons appear only in the navigation bar.
- Primary actions compete: Train opens with two full-width buttons.

The quiet came from rules that worked (`design/anti-cruft-and-anti-slop.md`,
"no custom icon set until MM-109") and then kept going.

## The direction, to be written into `design/screen-direction.md`

1. **Tiers, not cards.** Each screen has one hero. Secondary facts are rows
   and strips on the canvas, not cards. Tertiary content (how to read a
   chart, what an event means) is a disclosure, one tap down, never inline.
2. **Icons as wayfinding.** Every section header, list row, caution,
   notice and empty state carries a leading icon from the Material set the
   app ships (`MmIcon`), 20 dp in rows, 24 dp in headers, always with a
   label. The set may grow; no custom glyph until MM-109.
3. **Lists with shape.** Entries group by week (this week, last week, then
   months); a day row shows its rhythm (a seven-dot strip for the week);
   notable rows (a personal record, a complete day) carry a mark.
4. **One picture per fact**, with the owner's one exception: the macro
   picture is a switch between the bars (grams against target) and the
   donut (share of calories), remembered per person; never both at once.
5. **Graphics that carry information.** The horizon arc stays the signature
   and reappears in empty states; a weekly rhythm strip on Dashboard; meal
   icons in Food; muscle-group marks in Train; motion on the arc and the
   strips within `interaction-and-motion.md`. No decorative color.
6. **One primary action per screen.** The rest become text actions, a menu
   or rows. Train keeps "Start workout"; "Repeat last workout" is a text
   action.
7. **Progressive disclosure is the default** (`anti-cruft` section 7): a
   screen answers today's question in the first viewport.

## The panel

Run the product-designer and UX-accessibility roles on the built stories
of every destination against this direction, in the register, before the
screens are built: findings with outcomes, as MM-212 requires. Scope and
direction are decided; the panel grades execution and names what the
direction misses.

## Acceptance criteria

```gherkin
Scenario: The direction is written
  Then design/screen-direction.md carries the seven rules above, with a before and after of each destination in the register

Scenario: The panel has graded it
  Then docs/agent-runs/ holds a run with product-designer and ux-accessibility findings on every destination, each with an outcome

Scenario: The rules are checkable
  Then a test fails a screen that nests a card in a card, or shows two macro pictures at once
```

## UI/UX

Before: every destination's story as of 2026-10-13. After: each story's
screen rebuilt under MM-254 to MM-259, linked from those tickets.
