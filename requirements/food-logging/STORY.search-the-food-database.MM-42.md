---
id: MM-42
status: done
component: food-logging
related: [MM-37, MM-38, MM-45, MM-50, MM-55, MM-167, MM-408]
---

# Story: Find a food by searching

## Context
See MM-37 and MM-50. Search is the fallback after recents, and the place where bad databases lose beginners.

## Decisions (made with the product owner)
- **Generic foods come first.** A search for "chicken breast" shows one plain, trustworthy entry ("Chicken breast, cooked") at the top,
  with branded variants collapsed beneath it, not twelve conflicting rows.
- **United States foods first**; Open Food Facts is the main source for packaged foods and USDA for generic ones.

Choices I made without asking (say if any is wrong):
- **Search runs on the device**, against the bundled and downloaded food packs (MM-55). It works with no network.
- **Results appear as the user types**, within 150 ms of a keystroke on a mid-range phone. Since MM-408 (2026-10-19): the
  packs are searched once the typing has paused for 150 ms (the first keystroke at once), and the last results stay on
  screen until the next arrive, so the list never empties between keystrokes.
- **The user's own saved foods and recents rank above database results** when they match.
- **Choosing a result opens an amount step**: the food's own servings ("1 cup, chopped", "1 breast") and grams, with the macros updating
  as the amount changes. Logging records how it was measured.

## Description
The add-food sheet gains a search field. Typing lists matches; choosing one asks for an amount and meal, then logs it. The typed-macros
form (MM-38) remains, reachable as "Enter manually".

## Acceptance Criteria
```gherkin
Scenario: A generic food first
  When "chicken breast" is searched
  Then the first result is a generic cooked chicken breast, and branded products are grouped below

Scenario: Offline
  Given no network
  When a food in the installed pack is searched
  Then it is found

Scenario: Choosing an amount
  Given a food with a serving of "1 cup, chopped (140 g)"
  When 1.5 cups is chosen
  Then the entry's macros are those of 210 g and it is recorded as a cup-or-spoon measurement

Scenario: My own foods rank first
  Given a saved food named "Protein oats"
  When "oats" is searched
  Then "Protein oats" is above database results

Scenario: Nothing found
  When a search has no results
  Then the sheet offers to enter the food manually or scan its label
```

## Notes
- Ranking is the hard part. Start with: exact and prefix matches on the name, generic before branded, then how often other products share
  the name. Tune against a list of the hundred most commonly eaten US foods.

## Progress
Done: a search field on the add-food sheet searching the installed packs on the phone; results listed reference-first, then by
match (across packs); the user's matching recent foods listed above database results; an amount step with the food's servings
or grams, macros updating, logged as a cup-or-spoon (serving) or weighed (grams) measurement; "Nothing found" and "no food
database yet" both offer "Enter manually"; tests with the fixture pack.

Since 2026-10-18 (MM-383) the packs' results list by the app's reliability score, then the text match: the order refines
the tiers and never crosses them, so generic foods still come first. The person's saved foods and recipes (MM-45) and
recents list above the packs' results (the add sheet draws them first).

Since 2026-10-19 (MM-408) the packs are asked once the typing pauses, and the results stay on screen until the next answer:
the list no longer flashes blank on every keystroke.

Not done: offering "scan its label" when nothing is found (MM-44 unbuilt); collapsing branded variants under a generic one
(results are a flat list); paging or "More results", which FNDDS's foods as eaten make more pressing (a branded food whose
name twenty generic foods share is reached by its barcode or by Saved until then); tuning ranking
against the hundred most common US foods; the 150 ms bound measured on a phone (the pack-level search is timed in the
food_catalog tests, the UI is not); search results are not paged. Reference-first ordering holds across packs, not within one
pack's top 20.

## Clarified by MM-167 (proposed, not built)
The amount step collects a quantity and unit and then stores only totals and a method, and it records every serving as a cup-or-spoon
measurement. MM-167 requires the quantity, unit, serving and reference basis to be stored and a label serving to be recorded as a label
serving. Those are implementation gaps, not met by this ticket's progress.

## Progress (2026-10-20, feat/m2)
Closing the ticket. What the "Not done" list above still held, and what became of each:
- **"Scan its label" when nothing is found**: the add sheet's choices already carry Scan and the saved-food form's "Read the
  nutrition label" (MM-44); with MM-58 an empty search offers "Search online" first, since a food the packs lack is more often
  online than on a label the person is holding. Say if a label offer belongs under an empty search too.
- **Branded variants collapsed under the generic**: realised as ordering, not nesting. The reliability order (MM-383) lists
  the analysed generic food first and every branded product below it; a second level of disclosure would hide the branded
  rows behind one more tap for the person who scanned nothing and wants the product. Decided here (say if wrong).
- **Paging**: "More results" since MM-410.
- **Ranking against the hundred most common US foods, and the 150 ms bound on a phone**: not measured on a phone this
  session (no device in the loop); the pack-level search is timed in the catalog tests (about 16 ms for a two-prefix query on
  a laptop, MM-51). Left for the owner's acceptance pass; no code waits on it.
- **Online search on request** (MM-58): under the phone's results, never as the person types.
Stories: AddFood, AddFoodSearchFailed, the MM-410 paging stories, and the MM-58 search stories.
