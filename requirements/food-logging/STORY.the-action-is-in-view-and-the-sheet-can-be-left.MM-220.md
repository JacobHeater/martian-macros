---
id: MM-220
status: done
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
- **Delivery reconciliation, 2026-10-12:** discovery/manual separation reduces
  the opening screen, but does not close this story. Visible dismissal,
  disabled-action explanations, small-screen/keyboard/large-text action
  visibility, and the pre-maintenance estimate path remain open. MM-227 fixes
  the HTML amount-step Back to search alignment only; it does not move the
  app button or establish that its bottom placement is usable.
- Evidence: step records 1.9, 1B.3, 3.2a, 3.5, 4.4 and 4.5; screenshot tests
  `add_food_estimate_dark`, `add_food_form_end_dark`, `add_food_edit_dark`.
- Not checked: the keyboard open, larger text, other screen heights, system
  bars, and how the sheet answers a drag or the back gesture.

## Decisions and build (2026-10-19)
- **An action that is off says what is still needed**: "Still needed: a name, calories above zero, typed or from the macros." under the typed form's totals, and the same under "Save food" for a saved food (a name, what one serving is, its weight in grams, calories, a valid barcode or none).
- **Every state of the sheet has a visible way out**: `MmSheet`'s Close (MM-271), checked by test.
- **Nothing to estimate from yet**: the estimate step shows only the notice, "Enter manually" and Back; the size and kind choices and the disabled action are not drawn.
- **The finishing action on a 360 by 800 screen** cannot be measured in the test's document; the sheet scrolls and content past the edge is cut by it, not ended in blank space, since MM-271's sheet. The owner's look at `AddFoodManually` and `AddFoodEstimate` on a small viewport story is the check (MM-91).
- The direction's "Food logging flows" (a focused search, segmented routes, an Add bar) versus the built sheet: the built sheet stands (MM-223 settled discovery against entry); the direction document is the owner's to amend.
- Regression test: `apps/mobile/test/food/addFoodSays.test.tsx` (MM-220).

## After the panel (2026-10-19)
- The "Still needed" caption sits after the gap, beside the action, in both forms (PD-6), is the action's description for a reader (F3), reads "calories above zero (typed, or from the macros)" (PD-7, F9), and the empty name field says "A name is needed." (PD-6).
- With nothing to estimate from, the notice names the route: choose "Estimated totals" and type the calories you think it had (F7, PD-11).
- Focus after an in-sheet step swap (F5) is the owner's device check.
