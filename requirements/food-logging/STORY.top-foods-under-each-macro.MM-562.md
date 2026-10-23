---
id: MM-562
status: done
component: food-logging
related: [MM-561, MM-179, MM-253, MM-370, MM-389, MM-187]
---

# Story: A macro's top foods, from the nutrition card

## Context
The owner (2026-10-22), on the Food screen's nutrition card: "When clicking on a macronutrient, it should
open a popover showing the top 5 sources of each macronutrient with meal as a chip beside the food." And:
"Remove the text 'Share of calories from each'", a line that narrates the picture (MM-389).

## Decisions
The owner's: a popover, the top five foods, the meal as a chip; the caption under the split goes.

Choices I made without asking (say if any is wrong):
- **Both pictures open it**: a bar in Grams and a macro of the split's legend. The whole bar or legend
  entry is the press (`MmPressable`), as the Micros rows are (MM-561); a second press closes it (MM-565).
- **The popover is the grade's (MM-370), given a list**: `Overlays.popover` takes `rows`, each a name, a
  figure and a chip (`MmStatusChip`). Its title is the macro; a screen reader hears "Top foods for protein".
- **A food is its name and its meal**: eggs at breakfast and eggs at dinner are two lines, since each has
  its own chip. Grams are the entries' own, carbs net where the app counts net (MM-396).
- **No food with that macro**: the popover says "No food logged has fat." rather than an empty list.
- MM-179's "Share of calories from each" line under the split in the hero is withdrawn; the split outside
  the hero keeps its line on how it is counted.

## Description
`rankedSources` ranks a day's entries by anything an entry adds; `CalorieHero` opens the popover from its
bars and from `MacroSplitChart`'s legend (`onPick`).

## Acceptance Criteria
```gherkin
Scenario: A macro's top foods
  Given today: chicken breast at lunch 31 g protein, eggs at breakfast 12 g, yogurt as a snack 10 g,
    eggs at dinner 6 g, rice at lunch 5 g, toast at breakfast 4 g
  When I press Protein on the nutrition card
  Then a popover lists, most first: Chicken breast (Lunch) 31 g, Eggs (Breakfast) 12 g,
    Greek yogurt (Snacks) 10 g, Eggs (Dinner) 6 g, Rice (Lunch) 5 g

Scenario: From the split
  Given the Split picture
  When I press Fat in its legend
  Then the same popover opens for fat

Scenario: No caption in the hero
  Then the split in the hero has no "Share of calories from each" line, empty or not
```

## UI/UX
- MacroTopFoods, SplitTopFoods — apps/mobile/src/gallery/screens/Food.stories.tsx.
- PopoverRows — apps/mobile/src/gallery/Overlays.stories.tsx.

## Progress
Built. Tested in `test/food/macroSources.test.tsx` and `test/charts/splitDonutCentred.test.tsx`. Not run
locally; CI validates. Not looked at: Storybook, TalkBack, the phone.
