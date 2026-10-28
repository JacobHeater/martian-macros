---
id: MM-688
status: in-progress
component: coach-insights
related: [MM-616, MM-682, MM-684, MM-685]
---

# Bug: the coach added a beaver beside the biscuit

## Context
The owner's Executive summary, 2026-10-28, on a build of main with PR #361 (MM-682 to MM-687): "The drag is the
buttermilk biscuit at lunch: 254 calories for 5 grams of protein. Adding a beaver beside it would bring that meal to 96
grams of protein for 284 more calories, so that is the move to make." The engine's add move (`addProteinOf`,
`leanProteinOf`) takes, from the catalog's protein groups, the lean food with the most protein inside 300 kcal at its
default serving. In the owner's pack the meat group's first 500 foods as stored run from "Armadillo" to "Beef, heart",
and "Beaver" at 135 g is 284 kcal for 47 g: it wins. Chicken breast stands past a thousand beef cuts and is never read
(`CatalogTradeCatalog.load` lists `perGroup` foods a group, in the pack's order). Fish would have given yellowtail, whelk
or a can of clams.

## Decisions
- The coach names a lean protein a person would buy and cook, from a short ordered list (`everydayProteins`): chicken
  breast, turkey breast, egg whites, Greek yogurt, cottage cheese, tuna, shrimp, cod, tilapia, salmon, pork tenderloin,
  sirloin, ground turkey. Chicken breast first, as the owner's approved line A says. Breaded, fried, sauced, raw, dried
  and powdered forms, and dishes made of them, are not everyday (`everydayProteinRankOf`). Chosen without asking; the
  owner adds or strikes names.
- The first everyday food the catalog holds a fitting serving of wins; among that food's forms, the most protein, then
  the fewer calories. The person's own foods at the slot stay second, as MM-684 has them.
- The catalog adapter searches each everyday protein by name across its whole group, on top of the group's listing, so
  chicken breast is a candidate however deep the pack stores it.
- The lean rule (half the calories from protein) stays; a food on the list that is not lean in the pack's figures is
  passed over.

## Description
On the owner's lunch, the add move names chicken breast, 39 g at its serving, never the beaver, the armadillo or the
yellowtail with more protein in the cap. On a breakfast with 60 kcal left, the closest lean protein the next-meal order
names is egg whites, not a can of clams.

## Acceptance Criteria
```gherkin
Scenario: The everyday list, not the most protein
  Given a catalog whose meat group holds Beaver at 284 kcal for 47 g and chicken breast at 209 kcal for 39 g
  When lunch's moves are computed
  Then the add move names the chicken breast and no move names the beaver

Scenario: Chicken breast past the group's first foods
  Given a pack whose meat group stores beef heart and beaver before chicken breast, read two foods a group
  When the trade catalog is loaded
  Then chicken breast is a candidate in the meat group and the breaded tenders are not

Scenario: Breaded, raw and game are not everyday
  Given the names "Chicken breast tenders, breaded", "Chicken breast, raw" and "Game meat, beaver, cooked, roasted"
  Then none ranks on the everyday list, and "Chicken breast, baked, broiled, or roasted, skin not eaten, from raw" ranks first
```

## Notes
- Tests: `test/engine/mealMovesEveryday.test.ts`, `test/state/catalogTradeCatalog.test.ts` (MM-688 case). Not run
  locally; CI validates.
- The owner's call-out from the phone: no panel. Done once the owner reads the coach's add on the phone (MM-682).
