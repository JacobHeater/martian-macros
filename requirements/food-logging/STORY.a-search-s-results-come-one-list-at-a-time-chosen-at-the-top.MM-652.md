---
id: MM-652
status: done
component: food-logging
related: [MM-58, MM-330, MM-596, MM-627, MM-637, MM-645]
---

# Story: a search's results come one list at a time, chosen at the top

## Context
With a search typed, the Add food sheet listed the person's own foods and meals, then the food database's
results, then what was found online, one long scrolling list with a heading over each part (MM-637, MM-58).
The owner, 2026-10-27, from the phone: "this long ass scrolling list? what the fuck? switch this to a toggle
chooser at the top and switch between those methods."

## Decisions
From the owner (2026-10-27): a chooser at the top of the results switches between the person's own foods, the
food database and online; one list shows at a time.

Choices made without asking (say if any is wrong):
- **The chooser is the app's segmented control** (`MmSegmented`, as "Weighed as" on the amount step and the
  chart ranges), across the sheet under the search field and the meal's "In this meal" line, named "Results
  from", with "Yours", "Database" and "Online". Online is a choice only where it is offered: a source exists
  and the person has not said never (MM-58's rule for the Search online action).
- **What starts chosen**: the person's own when anything of theirs matched (their saved foods and meals and
  their log, MM-596, MM-645), else the food database; MM-330's rule, that their own match is never followed by
  "Nothing found", holds through the choice. A choice made stays for that search and is cleared with it.
- **Each list is as it was**, without its heading: the chooser says where the rows came from. A row found
  online still says so (MM-58). "Yours" with nothing of theirs says "Nothing of yours matches "x"."; the
  database's and online's empty states are theirs as before (MM-330, MM-58).
- **Switching away from Online forgets its search**; choosing it again offers Search online again.

## Description
A search's results are one list, from the source chosen at the top; the chooser names the three sources and
shows which is chosen; the recent foods with an empty search are unchanged.

## Acceptance Criteria
```gherkin
Scenario: Their own first
  Given "Banana" was logged before and the food database holds bananas
  When the person searches "banana"
  Then "Yours" is chosen and lists the logged banana, and the database's bananas are not listed

Scenario: The database on request
  Given "Yours" is chosen with the logged banana
  When the person chooses "Database"
  Then the database's bananas are listed, alone

Scenario: Nothing of their own
  Given nothing logged or saved matches
  When the person searches "banana"
  Then "Database" is chosen, and choosing "Yours" says nothing of theirs matches "banana"

Scenario: Online where offered
  Given an online source and the person has not said never
  When the person chooses "Online"
  Then the Search online action is there, and what it finds is listed under the chooser
```

## UI/UX
- `Screens/Food`, `SearchResultsYours`: a logged banana under "Yours", chosen for them.
- `Screens/Food`, `SearchResultsDatabase`: the database's bananas after "Database" is chosen.
- `Screens/Food`, `SearchResultsYoursNothing`: "Yours" chosen with nothing of theirs.
- `Screens/Food`, `SearchOnlineOffered`, `SearchOnlineAsks`, `SearchOnlineFound`: the online choice (MM-58).

The owner dictated the change, so the panel was skipped (`apps/mobile/AGENTS.md`, "The panel pass is
proportional").

## Notes
- Built in `AddFoodSheet` (the chooser and the one list), `FoodSearchResults` and `OnlineSearchResults` (their
  headings removed; `alsoFound` gone). Tests: `test/food/resultsBySource.test.tsx` (MM-637's test rewritten),
  `test/food/searchOnline.test.tsx`.
- MM-637's two headings are gone; its intent, their own apart from the database's, is kept by the chooser.
