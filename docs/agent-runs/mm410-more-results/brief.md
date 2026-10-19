# Brief: "More results" at the end of a food search (MM-410)

## Question
The 2026-10-19 food packs (MM-409) give a common word hundreds of matches
("yogurt", "chicken", 140 FNDDS rice dishes), and the search listed only its
first twenty with no way on (MM-42's open item). The change, drawn in
Storybook first (MM-293) for this review:

1. **A page of twenty, then "More results"** (`AddFoodMoreResults`): the
   list ends in an `MmButton` of the text kind, full width, labelled
   "More results", while the last page came back full. Pressing it asks the
   packs for twenty more; the rows already shown stay (MM-408's rule, the
   list never empties) and the new ones join them.
2. **Every match listed** (`AddFoodMoreResultsShown`): after the press the
   control is gone, because the page came back short. A new query starts
   again at one page.

Its sibling is "Enter manually" (`MmButton`, secondary kind, full width)
under the same list, with an `app-gap-small` between. Is a text-kind button
the right weight beside it, or should "More results" be a row of the list,
or the same secondary kind? Does a novice understand that the list went on
and where the new rows begin? Is "More results" the domain's word? Is any
state missing (loading the next page; the end reached; a new query)?
Anything a screen reader hears wrongly (focus after the press, the button
vanishing under the finger)?

## Inputs
- Stories (the renders): `apps/mobile/src/gallery/screens/Food.stories.tsx`
  (sha256 cd8e0a7385302d94…), `apps/mobile/src/gallery/screens/storyFoods.ts`
  (0dac29fa7712d977…).
- Component: `apps/mobile/src/food/FoodSearchResults.tsx` (352de704e3eed8e5…);
  its host `apps/mobile/src/food/AddFoodSheet.tsx` (c4a2497183f90a98…), lines 640-725;
  `apps/mobile/src/ui/MmButton.tsx`, `apps/mobile/src/ui/MmListRow.tsx`.
- Tests that say what is meant: `apps/mobile/test/food/searchMoreResults.test.tsx`,
  `apps/mobile/test/food/searchSettles.test.tsx`.
- Requirements: `requirements/food-logging/STORY.see-more-than-the-first-twenty-results.MM-410.md`,
  `requirements/food-logging/STORY.search-the-food-database.MM-42.md`,
  `requirements/food-logging/BUG.search-flashes-on-every-keystroke.MM-408.md`.
- Direction: `design/screen-direction.md` (rule 9: build like its sibling),
  `design/anti-cruft-and-anti-slop.md`.

## Audit mode, coverage, renders
- Mode: change. Baseline `main` at ce672d6; the working tree of
  `feat/more-results`, uncommitted at review time (hashes above).
- **Depth target**, counted from the source: the Add food sheet, a person
  typing "yogurt", reading twenty rows, pressing "More results", reading
  seven more, choosing one (one field, twenty-seven rows each pressable, one
  "More results", one "Enter manually"). Count: 1 + 27 + 2.
- **Render supplied**: the two stories, read from source, each drawing the
  real sheet over the fixture pack with twenty-five story yogurts (MM-237).
  **No browser capture**: this session has no browser automation on the
  owner's Mac. Say so in the walkthrough.
- Surveyed only: the other Add food stories (`AddFoodSearching`,
  `AddFoodOwnAndRecent`, `AddFoodNothingFound`), unchanged.
- Not reviewed: the ranking of results (MM-42), the packs' data (MM-409),
  the debounce (MM-408, reviewed by its tests).

## Existing facts, non-goals, owner decisions
- Owner (2026-10-19): widen the search's scope, "whatever it takes". The
  page size of twenty is the existing limit, kept; not up for review.
- Non-goals: infinite scroll (a sheet that grows without a press was not
  asked for); collapsing branded variants under a generic food (MM-42's
  other open item, not this change); a count of total matches (the packs'
  search does not count).

## Acceptance criteria
- MM-410: "A second page", "One page or less", "A new query starts over".
