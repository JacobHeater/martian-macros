---
id: MM-219
status: proposed
component: food-logging
related: [MM-38, MM-39, MM-42, MM-150, MM-167, MM-212, MM-213]
---

# Story: Finding a food and typing one are told apart, and every way in stays in reach

## Context
Proposed by the walkthrough review of the Add food sheet (MM-212, run
`docs/agent-runs/mm212-add-food-walkthrough/`). **Nothing here is decided.**
The earlier panel audit had noticed the first point and left it as an
unverified hypothesis.

What the built sheet does today (source and screenshot tests):
- **One long first screen.** Search, three other ways in, recent foods, a
  "Food" name field, seven ways of measuring, an amount, what the numbers are
  for, macros, alcohol, calories, the meal and the action, in one scroll with
  no named groups. "Search foods" and "Food" are the same component, one
  above the other (PD-02).
- **Typing in search removes everything else.** Scan, Saved, Estimate, the
  recents and the whole typed form are replaced by results. With results
  there is no "Enter manually"; the way back is to delete the search text,
  and nothing says so (F-02).
- **Two controls called "Estimate".** The button opens the size-and-kind
  step. The chip under "How was it measured?" asks for calories and macros,
  which a person estimating does not have (F-03, PD-05).
- **A recent food and a found food behave oppositely.** They are drawn as the
  same row. A found food opens the amount step, where numbers follow the
  amount. A recent food fills the typed form with entered totals, where they
  do not (PD-06). A recent food's row shows the calories logged that time; a
  found food's shows calories per 100 g. Both say so in words.
- **Words a newcomer must guess.** "Reference" on every found food is not
  explained; "Saved" opens "My foods"; "Everything I ate" and "Everything you
  ate" name the same thing (F-14, low).

## Description
The first screen of the sheet reads as a small number of named groups; the
search field cannot be taken for the name field; from search results the
typed form and the estimate can be reached by something visible; each word
names one thing; and a result row lets a person tell what kind of step
follows it.

Open to the owner: whether a recent food should open the amount step when it
has a stored reference (MM-167 says search, barcode and manual entry "behave
the same way" and does not mention recents).

## Acceptance Criteria
```gherkin
Scenario: Starting by typing a name
  Given the sheet as it opens
  Then it is plain which field searches and which names a food typed by hand

Scenario: Not finding it
  Given search results that do not include the food
  Then the typed form and the estimate are each reachable by a visible control

Scenario: One word, one thing
  Then no two controls on a screen share a name while doing different things

Scenario: A recent food beside a found one
  Given both in the results
  Then a person can tell from each row what step follows it
```

## Notes
- Evidence: step records 1.2, 2.2, 2.3 and 3.1; screenshot tests
  `add_food_opened_dark`, `add_food_search_dark`.
- `design/screen-direction.md` (Food logging flows) describes a different
  sheet from the one built; see MM-220.
