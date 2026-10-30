---
id: MM-706
status: in-progress
component: food-logging
related: [MM-44, MM-45, MM-76, MM-153, MM-167, MM-286, MM-370, MM-564, MM-639, MM-645, MM-703, MM-704, MM-707, MM-708, MM-710]
---

# Story: The Library: everything you made, in folds

## Context
The person's saved foods, recipes and saved meals live only inside the add-food sheet's Saved step, which exists to
log. Custom exercises have a form and no list. The owner (MM-703): managing foods from a logging sheet is
counterintuitive; the Library is a place of its own, reached from the drawer (MM-704) and from the Saved step
(MM-707).

## Decisions
The owner's (MM-703): a pushed screen that opens straight into its sections, collapsed by default, in the order Foods,
Recipes, Meals, Usual foods, Exercises; New food at the top offering With my AI, Scan a label, Type it in and New
recipe; usual foods from the log with "Save as a food"; rows with name, serving, calories and macros, trust mark, last
logged and times logged, and the grade letter; sorted by times logged, never logged last.

Choices made without asking (say if any is wrong):
- **`LibraryScreen`** in `apps/mobile/src/library/`, a `Screen` titled "Library". The folds are `MmSection`s
  (`collapsible`, closed at first, `maintainState`), the sibling of Settings' folds, each title carrying its count
  ("Foods · 12"). The screen keeps its folds and scroll across visits in a session (`remember`, MM-286).
- **New food** is a secondary button at the top; it opens a chooser (an `MmSheet` of four `MmListRow`s with an icon each,
  the sibling of the add-food sheet's ways in): **With my AI** (MM-708), **Scan a label** (MM-44's reader, which today
  starts from the add-food sheet; it is reached here too and comes back to the Library with the food saved), **Type it in**
  (`CustomFoodForm`), **New recipe** (`RecipeForm`). The forms show inside the Library as pages, as `MyFoodsStep` shows
  them today.
- **A row** is an `MmListRow`: title the name; subtitle `serving · kcal · P C F` as MM-564 writes a food row; the trust
  mark (MM-153, MM-710) and the grade letter (MM-370) as the row's leading and trailing marks, as logged entries show
  them; a second line "Last logged 3 days ago · 12 times", or "Never logged". The row's menu ("More actions for X"):
  Edit, Delete (with MM-45's confirmation that logged entries stay). A recipe's row says its servings; a meal's row says
  its foods and calories as the Saved step does; an exercise's row says its muscle groups.
- **Usage** comes from the food log: entries whose portion reference is this saved food (MM-167), counted and dated by
  the food repository (`usageOfSavedFoods()` on the food reader, SQL and in-memory, in the contract suite). A meal's
  usage counts its relogs (MM-645). An exercise's usage counts workouts with a set of it.
- **Usual foods** are the names MM-639 ranks as usual, each with its most recent entry's numbers; "Save as a food" opens
  `CustomFoodForm` on a draft from that entry (as "Fix this food" does, MM-153), evidence "yours". A usual food that is
  already a saved food is not listed twice.
- **Exercises** lists the custom exercises (`CustomExerciseReader`), Edit opening `CustomExerciseScreen` on it, Delete
  through `CustomExerciseWriter` with a confirmation that logged sets stay.
- **Empty folds say so** in one line ("Nothing saved yet. New food makes one." / "Log a few days and your usual foods
  show here." / "Add an exercise from a workout.").
- **After a save** from any route the Foods (or Recipes, Exercises) fold is open with the new row in view and a snack
  says "Saved X" (or "Saved 3 foods", MM-708).

## Description
The Library lists, in closed folds with counts, the person's foods, recipes, meals, usual foods and exercises, with New
food at the top. Each row says what the food is, how trusted its numbers are, its grade, and how often it is logged.

## Acceptance Criteria
```gherkin
Scenario: Closed folds with counts
  Given 3 saved foods, 1 recipe, 2 saved meals and 1 custom exercise
  When the Library is open
  Then it shows "Foods · 3", "Recipes · 1", "Meals · 2", "Usual foods", "Exercises · 1", all closed
  And "New food" is above them

Scenario: A food's row
  Given a saved food "Buttermilk biscuit", 1 biscuit (60 g), 220 kcal, logged 12 times, last 3 days ago, estimated
  When Foods is opened
  Then its row says "Buttermilk biscuit", "1 biscuit (60 g) · 220 kcal · P 4 C 28 F 10", "Last logged 3 days ago · 12 times", its trust mark and its grade

Scenario: Sorted by use
  Given foods logged 12, 0 and 4 times
  Then Foods lists them 12, 4, then the never logged one

Scenario: Edit and delete
  When "More actions for Buttermilk biscuit" offers "Edit" and "Delete"
  Then Edit opens the food's form and Delete asks first and says logged entries stay

Scenario: New food's chooser
  When "New food" is pressed
  Then "With my AI", "Scan a label", "Type it in" and "New recipe" are offered

Scenario: A usual food saved
  Given "Greek yogurt" from the packs is usual and not saved
  When Usual foods is opened and "Save as a food" is pressed on it
  Then the food form opens filled from its latest entry, and saving lists it under Foods

Scenario: Empty
  Given nothing saved and nothing logged
  Then each fold, opened, says in one line what fills it
```

## UI/UX
- The Library — apps/mobile/src/gallery/screens/Library.stories.tsx (Stories: Library, LibraryEmpty, LibraryFoodsOpen,
  LibraryNewFood, LibraryUsualFoods, LibraryExercises). The owner dictated the feature, so the panel pass is skipped;
  siblings followed: Settings' folds, the Saved step's rows and menus, MM-564's food row.
- At phone width — the same file (Story: LibraryFoodsOpenSmallPhone, `viewport: 'smallPhone'`), with the longest food
  names in the demo seed, every mark on the row and a "Last logged" line.

## Notes
- Tests: `test/library/library.test.tsx` (every scenario above), the food repository contract (usage), the custom
  exercise repository contract (delete).
- Where: `apps/mobile/src/library/LibraryScreen.tsx` and its rows; the chooser beside it; `library.css` only if
  `food.css` has nothing to reuse.
- The "With my AI" route opens MM-708's screen; if it is not yet on `main` when this merges, the route is added in the
  PR that brings it. Nothing is stubbed.
