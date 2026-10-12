---
id: MM-219
status: proposed
component: food-logging
related: [MM-38, MM-39, MM-42, MM-150, MM-167, MM-212, MM-213, MM-223, MM-224]
---

# Story: Finding a food and typing one are told apart, and every way in stays in reach

## Context
Proposed by the walkthrough review of the Add food sheet (MM-212, run
`docs/agent-runs/mm212-add-food-walkthrough/`). **Nothing here is decided.**
The earlier panel audit had noticed the first point and left it as an
unverified hypothesis.

What the built sheet did when this was recorded (source and screenshot tests):
- **One long first screen.** Search, three other ways in, recent foods, a
  "Food" name field, seven ways of measuring, an amount, what the numbers are
  for, macros, alcohol, calories, the meal and the action, in one scroll with
  no named groups. "Search foods" and "Food" are the same component, one
  above the other (PD-02). MM-223 separates discovery from manual entry and
  labels the latter field "Food name"; the remaining stories below are still
  proposed.
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
The remaining work is that from search results the estimate is reachable by
something visible; each word names one thing; and a result row lets a person
tell what kind of step follows it. The initial search/name collision is
tracked and fixed under MM-223, not silently treated as approval of the rest
of this story.

Open to the owner: whether a recent food should open the amount step when it
has a stored reference (MM-167 says search, barcode and manual entry "behave
the same way" and does not mention recents).

## Acceptance Criteria
```gherkin
Scenario: Discovery and manual entry are distinct
  Given the Add food sheet is open for a new entry
  Then the discovery screen has a field labeled "Search foods"
  And it has a visible "Enter manually" action
  And it does not show the manual food-name field
  When "Enter manually" is selected
  Then a separate form shows a field labeled "Food name"
  And the search field is not shown

Scenario: Not finding it
  Given a search with no matching foods
  Then a visible "Enter manually" action opens the manual-entry form
  And a visible "Estimate" action opens the estimate flow

Scenario: Distinct actions have distinct names
  Given two visible controls on the same screen lead to different actions
  Then their visible and accessible names distinguish those actions

Scenario: A recent food beside a found one
  Given both in the results
  Then the recent-food row identifies the prior logged entry and its logged calories
  And the found-food row identifies the food source and its reference calories
  When the recent-food row is selected
  Then it opens the existing recent-food editing form
  When the found-food row is selected
  Then it opens the amount step
```

## Notes
- **Delivery reconciliation, 2026-10-12:** MM-223 shipped separate discovery
  and manual-entry states, including manual entry from results and carried
  query text. MM-226 removed the ambiguous nutrition-basis vocabulary.
  Serving recents now restore a calculated serving reference rather than
  multiplying prior totals again; other recent methods retain their existing
  total-entry behavior. Still open: visible Estimate access from results,
  distinct estimate-method wording, source vocabulary, and explicit next-step
  cues. The older description of all recents as unscaled typed totals is no
  longer true. A full result-row/route walkthrough remains unverified.
- Evidence: step records 1.2, 2.2, 2.3 and 3.1; screenshot tests
  `add_food_opened_dark`, `add_food_search_dark`.
- `design/screen-direction.md` (Food logging flows) describes a different
  sheet from the one built; see MM-220.
