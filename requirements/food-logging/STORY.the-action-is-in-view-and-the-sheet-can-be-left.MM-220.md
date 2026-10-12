---
id: MM-220
status: proposed
component: food-logging
related: [MM-38, MM-45, MM-150, MM-212]
---

# Story: The action that finishes a step is in view, says what it is waiting for, and the sheet can be left

## Context
Proposed by the walkthrough review of the Add food sheet (MM-212, run
`docs/agent-runs/mm212-add-food-walkthrough/`). **Nothing here is decided.**

What the built sheet does today, on a 360 by 800 screen (screenshot tests):
- **Estimate a meal.** "Log the estimate" and "Back" are below the bottom
  edge, and the screen ends in blank space with nothing cut off, so it looks
  complete with no action on it (F-04, PD-04).
- **The typed form and editing.** "Log it" and "Save changes" are a scroll
  away; when the button is in view the name field has scrolled off
  (F-04, PD-03).
- **A disabled action gives no reason.** "Log it" needs a name, a valid
  amount and calories above zero; only the amount says so. "Save food" also
  needs a serving weight, unmarked, so a drink labelled only by volume cannot
  be saved and nothing says why (F-08).
- **No visible way out.** The main sheet and the edit sheet have a drag
  handle and no Close, Cancel or Back; the sheet fills the screen, leaving
  nothing behind it to tap. `design/interaction-and-motion.md` asks that
  sheets have "a visible close action" (F-05, PD-14). How the sheet is
  dismissed was not run.
- **Estimate before the app has a maintenance figure.** A notice says to
  "enter the food by hand", which needs the numbers this person lacks; the
  other controls stay live above a disabled button (F-09, PD-15; source only).

## Description
On a 360 by 800 screen at the default text size, each step's finishing action
is on screen, or something visibly continues past the edge; a disabled action
is accompanied by what is still needed; and every state of the sheet has a
visible control that leaves it without saving.

Open to the owner:
- whether `design/screen-direction.md`'s "Food logging flows" is still the
  target (it describes a focused search, a segmented set of routes and an
  "Add" bar that the built sheet does not have), or the built sheet replaces
  it;
- what Estimate should offer before a maintenance figure exists.

## Acceptance Criteria
```gherkin
Scenario: Opening a step on a small phone
  Given a 360 by 800 screen at the default text size
  When any step of the sheet opens
  Then its finishing action is visible, or content is visibly cut at the bottom edge

Scenario: An action that is off
  Given a finishing action that is disabled
  Then the screen says what is still needed

Scenario: Leaving without saving
  Given any state of the sheet
  Then a visible control closes it without logging or saving

Scenario: Nothing to estimate from yet
  Given no maintenance figure
  Then the estimate step offers only what can be acted on
```

## Notes
- Evidence: step records 1.9, 1B.3, 3.2a, 3.5, 4.4 and 4.5; screenshot tests
  `add_food_estimate_dark`, `add_food_form_end_dark`, `add_food_edit_dark`.
- Not checked: the keyboard open, larger text, other screen heights, system
  bars, and how the sheet answers a drag or the back gesture.
