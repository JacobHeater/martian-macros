---
id: MM-223
status: done
component: food-logging
related: [MM-38, MM-39, MM-42, MM-212, MM-219, MM-224]
---

# Bug: Add food search and manual entry compete on the opening screen

## Context
The opening Add food sheet shows the search field, scan/saved/estimate routes,
recent foods, and the full manual-entry form together. The search field and
the generic "Food" name field look like competing ways to enter the same
thing. The walkthrough review recorded this exact collision in MM-219, but
bundled it with separate product questions about search results and recent
foods. The collision itself needs no user study or decision about those
questions.

## Description
Make the opening sheet a food-discovery screen. Manual entry is an explicit
route to a separate form, whose name field is labeled "Food name" and which
does not also show search, discovery routes, or recent foods. Preserve the
existing behavior when a recent food is selected; do not change whether it
uses the typed form or a found-food amount step.

## Acceptance Criteria
```gherkin
Scenario: Opening food discovery
  Given the Add food sheet is opened for a new entry
  Then it shows food search, the other entry routes, and recent foods when available
  And it does not show the manual food-name field or nutrition form
  And it offers a visible "Enter manually" action

Scenario: Entering a food by hand
  Given the food-discovery screen
  When "Enter manually" is selected
  Then a separate manual-entry form is shown
  And the name field is labeled "Food name"
  And search, discovery routes, and recent foods are not shown

Scenario: Starting manual entry from a search
  Given a search query has been entered
  When "Enter manually" is selected
  Then the query is used as the food name
  And the manual-entry form is shown without the search field

Scenario: Selecting a recent food
  Given a recent food is available
  When it is selected
  Then the existing recent-food editing behavior is preserved
```

## UI/UX Assets
- [Add food sheet](../ui-ux-assets/views/add-food.html#add-food-default) — Current. Shows discovery, a blank manual form, and manual entry from a search query; the regression widget test verifies the transition and query carry. Linux discovery and manual-form screenshots were inspected and imported from run 38199739648. It does not decide the open behavior of found or recent foods in MM-219.

## Notes
- Regression coverage: `apps/mobile/test/add_food_discovery_test.dart`.
- `mm check` and Linux Update goldens run 38199739648 passed. No emulator
  was available; screenshots and widget tests are not a live-device review.
- This fixes only the search/name collision and first-screen hierarchy.
  The other proposed MM-219 behaviors remain open.
