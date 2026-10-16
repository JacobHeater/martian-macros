---
id: MM-304
component: dashboard
status: proposed
related: [MM-301, MM-155, MM-272]
---

# Task: what the MM-301 panel left for later

The panel on the Dashboard's waist entry (`docs/agent-runs/mm301-waist-in-place/`)
raised these as non-blocking. Each is drawn in a story and passed by the
panel before it is built (MM-293).

## To build

- **Focus after an in-place save (UX-5).** After the weigh-in or the waist
  is saved on the Dashboard, focus moves to the row that replaces the
  entry, not to the document.
- **"Open Progress" shows the waist (UX-6, PD-6).** From the waist's
  confirmation, Progress opens at its Waist section, unfolded and in view;
  from the weigh-in's, at the top.
- **Correcting a waist (ME-6, UX-8).** Progress says when today's waist is
  recorded and that saving again replaces it.
- **What one reading costs, said once on the Dashboard (ME-3).** The owner
  chooses: once on the first Dashboard save, a quiet "Three readings in
  Progress" route, or Progress alone.

## For the owner

- **The morning with both asking (PD-3).** Both fields stacked, as built,
  or the waist folded to one line while the weigh-in asks.
- **How long a confirmation waits (UX-1 option B).** A snack whose action
  only repeats a destination in the bar could leave after a longer time,
  holding while pressed or focused; MM-272 keeps every action snack until
  dismissed.
- **One wording before the first waist (PD-4)** on the Dashboard and in
  Progress.

## Acceptance criteria

```gherkin
Scenario: Focus after a save on the Dashboard
  When the waist is saved on the Dashboard
  Then focus is on the waist row that replaces the field

Scenario: The waist in view from its confirmation
  When "Open Progress" is pressed on the waist's confirmation
  Then Progress shows its Waist section, with today's value, in view

Scenario: Saying how to correct today's waist
  Given today's waist is recorded
  Then Progress' waist section says that saving again replaces it
```
