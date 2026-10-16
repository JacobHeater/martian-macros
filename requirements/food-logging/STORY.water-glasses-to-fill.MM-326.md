---
id: MM-326
status: done
component: food-logging
related: [MM-318, MM-313, MM-305, MM-278, MM-327, MM-328]
---

# Story: Water poured into a bar on the water section

## Context
The Food screen's Water section (MM-318) says the day's water in words: "24 fl oz of 128 fl oz". A goal of
a gallon is hard to picture, and words alone give nothing to chase. The owner (2026-10-14): add a visual to
gamify the water and make the goal easier to reach.

The first design was glasses to fill: a row of dots, one per glass of the goal, reviewed by the panel
(`docs/agent-runs/mm326-water-glasses/`). Looking at it, the owner (2026-10-15) took the design a new
direction: a bar across the screen, with fluid animation of water filling.

## Decisions
The product owner's:
- **A bar across the screen** (2026-10-15), replacing the glasses of the first design: "a bar that
  stretches the span of the screen width with fluid animation to indicate water filling."
- **It animates** (2026-10-15) when water is added or removed, and when the section is opened.
- **Always shown** (2026-10-14): it sits under the header, so a folded section still shows how far the
  day is.
- **A quiet mark at the goal** (2026-10-14): the bar full, and the summary gets the check mark a meal
  shows for a solid serving of protein (MM-125). No celebration and no extra message.

Choices I made without asking:
- **The sibling it is** (rule 9): `MmProgressBar`, the bar of the hero's macros (MM-278), with a new kind,
  `water`, at the emphasized macro's weight (`regular`, 8 px): the owner asked for the screen's width, not
  more weight (the panel's PD-1; a first draw at 14 px outweighed the hero). It is decoration, as every
  bar: the summary says the figures exactly and the bar draws them. The header is still `MmSection` and
  the check mark `MealSection`'s `food-meal-marker`. **Differences, with their reasons**: the bar spans the
  section, under its icon too, where a section's rows are indented (the owner asked for the width of the
  screen); its front end is rounded where the hero's is square, as the nutrient bars' are, since a liquid's
  edge is round (PD-7).
- **The motion** (a new signature moment, "Water pour", in `design/interaction-and-motion.md`): the fill
  moves in `--motion-pour` (1,200 ms, ease-out cubic, so the travel itself reads as filling, PD-4); while
  it moves, its surface ripples and flattens to still by the end. A first draw also bulged the front edge
  back and forth; that reversed direction, which the motion rules forbid as overshoot, and was removed
  (PD-2). It fills from empty each time it is drawn (whether coming back to Food draws it again is not checked), and `MmSection`
  draws its meter anew each time the section opens, so opening it pours again. A new day's bar is drawn
  anew, never moved from the last day's level (MM-328). Nothing moves once it settles: the motion rules
  forbid perpetual animation, and the owner asked for motion at each change, not all the time. Under
  reduced motion the bar takes its level at once (MM-327).
- **Its colour** is a new token, `--water`, one solid hue per palette at least 10 L* from protein and
  ion, with its figures in `design/color-and-theme-system.md` (PD-3); the first design borrowed Ion, which
  means "estimated" and is protein's colour in Martian. Light's track is faint against the canvas for
  every bar; the summary carries the goal, and the track is not changed for water alone (UX-3).
- **The glasses stay in words** (the panel's PD-2 and UX-1 on the first design): the summary says the goal
  in glasses of the Add water sheet (8 fl oz, 250 ml): "24 fl oz of 128 fl oz · 3 of 16 glasses",
  "Goal 2 L · 8 glasses", halves as "1½", so a glass from "+" is a step anyone can count.
- **No goal, no bar**: with nothing to fill, the section is as MM-318 drew it.

## Description
`WaterSection` passes a `meter` to its `MmSection`: an `MmProgressBar` of kind `water` of the day's total
over the goal. `waterGlasses` and `glassesLabel` give the glasses in the summary.

## Acceptance Criteria
```gherkin
Scenario: The bar
  Given an imperial goal of 128 fl oz and 24 fl oz logged today
  Then the Water summary reads "24 fl oz of 128 fl oz · 3 of 16 glasses"
  And a water bar across the section is filled 18.75% of the way

Scenario: A goal and nothing yet
  Given a metric goal of 2 L and nothing logged
  Then the Water summary reads "Goal 2 L · 8 glasses" over an empty bar

Scenario: Adding water pours
  Given a metric goal of 2 L and nothing logged
  When "+" on Water is pressed and Glass is chosen
  Then the summary ends "1 of 8 glasses" and the bar rises to 12.5%, its surface rippling as it moves

Scenario: Opening pours again
  Given the Water section folded
  When its header is pressed to open it
  Then the bar is drawn anew and fills from empty to its level

Scenario: Half a glass
  Given a metric goal of 2 L and 375 ml logged
  Then the summary ends "1½ of 8 glasses"

Scenario: The goal reached
  Given a metric goal of 1.5 L and 2.25 L logged
  Then the bar is full and the summary reads "2.25 L · Goal reached" with the check mark

Scenario: Another day
  Given today's water at half its goal and yesterday's at the goal
  When the previous day is shown
  Then the bar is drawn anew and fills to full, never moving from half

Scenario: Reduced motion
  Given the phone asks for reduced motion
  When the water bar appears
  Then it is at its level on its first paint and nothing moves

Scenario: Folded
  When the Water header is pressed to fold it
  Then the drinks are hidden and the bar still shows

Scenario: No goal
  Given no water goal
  Then the Water section shows no bar and says no glasses
```

## UI/UX
- Food — apps/mobile/src/gallery/screens/Food.stories.tsx (Stories: Water Bar, Water Bar Folded, Water
  Bar Nearly There, Water Goal Set None, Water Goal Partway, Water Goal Reached, Water Section), each
  looked at on the whole screen beside the meal sections, in three palettes, and the pour frame by frame;
  reviewed in `docs/agent-runs/mm326-water-glasses/` (the glasses) and `docs/agent-runs/mm326-water-bar/`
  (the bar), the pour frame by frame in all three palettes.
- Components — the water bar beside the other progress bar in the components gallery.

## Progress
Built: `MmProgressBar`'s `water` kind, `usePoured`, the `--water` and
`--motion-pour` tokens, `MmSection`'s `meter` (drawn anew on opening), `waterGlasses`, `glassesLabel`, and
`WaterSection` passing the bar. The first design's `MmTally` is removed. The panel's designer and UX guard reviewed the bar (UX guard:
pass); PD-1 to PD-5, UX-1 and UX-2 (the bugs MM-327 and MM-328) were built and looked at again. Tested in
`test/food/waterAndMicros.test.tsx` and `test/domain/waterGlasses.test.ts`. Not verified: the phone,
TalkBack, 200% text.
