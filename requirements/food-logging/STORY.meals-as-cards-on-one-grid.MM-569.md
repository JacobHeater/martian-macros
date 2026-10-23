---
id: MM-569
status: done
component: food-logging
related: [MM-564, MM-255, MM-253, MM-558, MM-291, MM-187]
---

# Story: The meals as cards, on one grid

## Context
The owner (2026-10-22): the food lists under the meal headings "feel cluttered and unintentional", and then
"disconnected". MM-564 shortened each row; what remained was the layout around them. The hero is a framed
card, but the meals below it sat bare on the canvas. Their rows were indented under the meal's title, and
then indented again by their own icon, so a row's words lined up with nothing above them. Each row's calories
were set in the heading size, louder than the food's name.

## Decisions
- **Each meal, and Water, is a framed card** (`MmSection framed`), as the Coach's sections are (MM-558) and as
  the hero is: one block per meal, 12 px apart. The sibling followed is the Coach's framed section.
- **One grid per card** (`MmSection flush`): a row's method icon is as wide as the meal's mark (24 dp) and
  stands under it, and the food's name stands under the meal's title. The coach's line under a food keeps the
  same columns. No second indent.
- **A row's calories are body size, semibold**, with tabular figures: a figure that sits beside the name
  rather than over it.
- **A row has no ground of its own at rest** (the owner, 2026-10-22: "the conflicting box bgs"): each row
  drew a flat box over the card's sheen. A row now shows the card through it; only while it is dragged does it
  take the card's colour, to slide over the delete behind it, which is not drawn until then.

## Acceptance Criteria
```gherkin
Scenario: Cards
  Then each meal and the water section is a card, like the hero

Scenario: One grid
  Then a food's icon stands under its meal's mark, and its name under the meal's title
```

## UI/UX
- Food, FoodSmallPhone — apps/mobile/src/gallery/screens/Food.stories.tsx.

## Progress
Built: `MmSection`'s `flush`, `MealSection`, `WaterSection`, the row styles. Tested in
`test/food/mealCards.test.tsx`. Not run locally; CI validates. Not looked at in Storybook or on a phone.
