---
id: MM-410
status: done
component: food-logging
related: [MM-42, MM-408, MM-383, MM-409]
---

# Story: See more than the first twenty results

## Context
Search listed its first twenty results and no more (MM-42's open item). With
the 2026-10-19 packs (MM-409) a common word has far more matches than that:
FNDDS alone has 140 rice dishes and 113 fish ones, and "yogurt" or "chicken"
in the barcode pack runs to hundreds. The owner asked for the search's scope
to be widened (2026-10-19); the data is there, and the list must reach it.

## Decisions (made with the product owner)
- **The first twenty come first**, ranked as today (reliability, then match);
  a "More results" control at the end of the list asks for the next twenty,
  while there are more: the packs are asked for one more than the page, so
  the offer is never empty and exactly a page never offers more (the UX
  guard's F2, the designer's PD-3).
- **The list never empties** while the next page loads (MM-408's rule); the
  rows already shown stay and the new ones join them.
- **The first new row takes focus and a status says how many joined** ("7
  more results, every match listed."), so a screen reader goes on from where
  the list grew rather than from the vanished button or the top (the guard's
  F1, WCAG 2.2 SC 4.1.3 and 2.4.3). The control is never disabled while a
  page is pending, which would throw focus away too.
- Built like its sibling: the control is an `MmButton`, as "Enter manually"
  under the same list, in the text kind. The Ember word marks the
  continuation of the list and the outline marks the exit to a hand entry
  (the designer's PD-1); a list row would read as a food, and two stacked
  secondaries would give two unequal choices one loudness.
- **No busy indicator** for the next page: the read is local and the first
  measurement is 16 ms for a two-prefix search on a laptop (MM-51); the
  direction shows nothing for a local read under about 150 ms. The owner
  measures a second page on the phone with the 2026-10-19 packs; a spinner
  in the slot (the designer's PD-2) is built only if it is perceptible.
- "More results" stays the label; "More foods" is the designer's alternative
  (PD-4), the owner's call.

## Description
Typing a word lists the first twenty matching foods. When there may be more,
"More results" ends the list; pressing it lengthens the list by twenty. A new
query starts again at one page.

## Acceptance Criteria
```gherkin
Scenario: A second page
  Given twenty-seven foods match "yogurt"
  When "yogurt" is searched
  Then twenty are listed and "More results" ends the list
  When "More results" is pressed
  Then all twenty-seven are listed and the control is gone

Scenario: One page or less
  Given four foods match "chicken"
  When "chicken" is searched
  Then the four are listed and nothing offers more

Scenario: A new query starts over
  Given "More results" was pressed for "yogurt"
  When the query changes
  Then the new query lists its first twenty, and offers more if there are more

Scenario: Exactly a page
  Given exactly twenty foods match
  When they are searched
  Then the twenty are listed and nothing offers more

Scenario: A reader goes on from the new rows
  When "More results" is pressed and the next page arrives
  Then a status says how many rows joined and whether every match is listed
  And focus is on the first new row
```

## UI/UX
Stories `AddFoodMoreResults` and `AddFoodMoreResultsShown` in
`apps/mobile/src/gallery/screens/Food.stories.tsx` (MM-237, MM-293); the
panel's review in `docs/agent-runs/mm410-more-results`.

## Not done
A failed read of the next page shows nothing (the rows stay, the offer
stays): MM-411, proposed. The owner's look at the two stories in the three
palettes, and the phone measurement above.

## Regression test
`apps/mobile/test/food/searchMoreResults.test.tsx`: twenty rows and the
control, then twenty-seven with the status text and focus on the twenty-first
and no control; exactly twenty never offers more; a new query starts over
with the offer back; a one-page search never offers more.
