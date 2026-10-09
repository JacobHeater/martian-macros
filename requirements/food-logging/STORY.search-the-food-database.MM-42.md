---
id: MM-42
status: in-progress
component: food-logging
related: [MM-37, MM-38, MM-45, MM-50, MM-55]
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
- **Results appear as the user types**, within 150 ms of a keystroke on a mid-range phone.
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

Not done: offering "scan its label" when nothing is found (MM-44 unbuilt); the user's saved foods and recipes (MM-45) ranking
first, only recents do; collapsing branded variants under a generic one (results are a flat list, tier first); tuning ranking
against the hundred most common US foods; the 150 ms bound measured on a phone (the pack-level search is timed in the
food_catalog tests, the UI is not); search results are not paged. Reference-first ordering holds across packs, not within one
pack's top 20.
