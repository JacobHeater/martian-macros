---
id: MM-221
status: proposed
component: food-logging
related: [MM-48, MM-167, MM-212]
---

# Story: Editing an entry shows what was typed, and says what its day control does

## Context
Proposed by the walkthrough review of the Add food sheet (MM-212, run
`docs/agent-runs/mm212-add-food-walkthrough/`). **Nothing here is decided.**

What the built sheet does today (source and screenshot tests):
- **An entry typed "for one serving" reopens without its numbers.** The
  screenshot `add_food_edit_per_serving_dark` shows it: the name, one chip
  "Servings", "How many", a link "Enter the totals myself", the meal, and
  "Logs 199 kcal …". The protein, carbohydrate, fat and calories that were
  typed are not on screen. The link turns them into totals for everything
  eaten and cannot be undone. MM-48's own scenario, a protein figure typed
  wrongly, cannot be corrected where it was typed. MM-167 says editing "shows
  the same controls as when the entry was logged" (F-06, PD-08).
- **The day control.** "‹ Today ›" sits under "Edit food" in title size with
  no label, and is the same control as the Food screen's day header. There it
  shows another day; here it moves the entry to another day, and after saving
  the entry leaves today's list with no message (F-10, PD-07).
- **An entry logged without an amount.** A method is shown selected, and a
  notice under it says "Choose how it was measured to add one." Adding an
  amount for that method means tapping the chip that already looks chosen.
  MM-167 says such entries are "left exactly as they are" and "the editor
  offers the method and totals only" (F-11, PD-13; low, since nothing the
  current sheet logs is in this state).

## Description
An entry reopens showing the numbers the person typed, in the terms they
typed them; the control that moves an entry to another day says so; and what
an old entry's notice asks for matches what the person must do.

Open to the owner: whether the first point is a defect against MM-167 ("the
same controls") and MM-48, to be fixed as a bug, or a change to what MM-167
asks for. It is recorded here and not as a bug because the stored entry is
correct and the requirement's wording can be read either way.

## Acceptance Criteria
```gherkin
Scenario: Correcting a per-serving number
  Given an entry typed with its numbers for one serving
  When it is opened for editing
  Then the per-serving numbers that were typed are shown and can be changed

Scenario: Moving an entry
  Given the edit sheet
  Then the day control says it is the entry's day
  And saving an entry to another day says where it went

Scenario: An entry without an amount
  Given an entry logged before amounts were recorded
  Then the notice's instruction matches what the person must do, or no amount is asked for
```

## Notes
- **Delivery reconciliation, 2026-10-12:** MM-226 changes the serving edit
  action to Edit nutrition per serving and preserves per-serving semantics;
  it no longer irreversibly converts that entry to typed totals. MM-202 fixes
  fractional quantity/nutrition edit precision. Still open: showing the typed
  per-serving fields immediately on opening, labeling/confirming day movement,
  and resolving the legacy-entry notice. The historical action name and
  conversion description above are superseded, not current evidence.
- Evidence: step records 4.2, 4.3b and 4.3d; screenshot tests
  `add_food_edit_per_serving_dark` (added at the reviewers' request) and
  `add_food_edit_dark`.
