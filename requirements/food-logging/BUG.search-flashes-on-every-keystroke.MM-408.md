---
id: MM-408
status: done
component: food-logging
related: [MM-42, MM-330, MM-55]
---

# Bug: The search results flash on every keystroke

## Context
Searching the food packs (MM-42) runs on the phone, so it was asked on every
keystroke. The results list was keyed on the raw query: each key change
emptied the list until the next answer arrived, so the panel under the
search field flashed blank and back with every letter. The owner saw it on
the phone (2026-10-19) and asked for the search to wait for the typing to
pause.

## Decisions (made with the product owner)
- **The search waits for the typing to pause**: 150 ms after the last
  keystroke, with the first keystroke searched at once. MM-42's "within
  150 ms of a keystroke" is read as 150 ms after the last one.
- **The last answer stays on screen** until the next arrives, so the list
  never empties between keystrokes. "Nothing found" names the query that
  was searched, not the one being typed.

## Description
Typing in the search field keeps the current results on screen; the packs
are searched once the person pauses, and the list changes to the new
answer when it arrives.

## Acceptance Criteria
```gherkin
Scenario: No flash between keystrokes
  Given "chicken" was searched and its results are on screen
  When " b" is typed and the next search has not yet answered
  Then the results for "chicken" are still on screen

Scenario: One search per pause
  When "chicken" is typed without a pause
  Then the packs are searched fewer times than there are letters
  And the last search is for "chicken"
```

## Regression test
`apps/mobile/test/food/searchSettles.test.tsx` types into the add-food
sheet over a catalog whose searches are counted and can be held back: the
results stay while a search is pending, and fewer searches run than
letters typed. It fails without the fix (the list empties on each key).
`test/app/useDebounced.test.tsx` and `test/app/useAsync.test.tsx` cover the
two hooks (`useDebounced`, and `useAsync`'s `keep`).
