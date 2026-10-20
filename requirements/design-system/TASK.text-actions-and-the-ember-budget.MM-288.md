---
id: MM-288
component: design-system
status: done
related: [MM-253, MM-262, MM-276, MM-104]
---

# Task: text actions and the Ember budget, an owner decision

## What the panel found (product-designer PD-2, 2026-10-13)

Rule 6 of the direction makes every non-primary action a text action, and
`MmButton` draws text actions in Ember; `design/anti-cruft-and-anti-slop.md`
allows one Ember element per screen. So Coach shows "History", "See why",
"Change", "Answer again" and "Dismiss" in Ember on one screen, and Train
puts Ember "Repeat last workout" under the Ember "Start workout". The
emphasis ladder's top rung is spent on secondary actions.

## The decision to make

Either (a) text actions become `--text` at weight 600 (the heading rung)
and Ember text is reserved for a screen whose primary is not a fill (the
Dashboard's bar), or (b) the budget is rewritten to "one Ember fill plus
Ember text actions". The product-designer recommends (a): one rule in
`ui.css`, shown in the States story. The owner decides.

## Acceptance criteria

```gherkin
Scenario: The budget is written
  Then design/anti-cruft-and-anti-slop.md says which of (a) and (b) holds

Scenario: The register shows it
  Then the States story shows a text action in the chosen colour in three palettes

Scenario: The rule is checked (under a)
  Then test/gallery/hierarchy.test.tsx fails a destination story with more than one element in Ember
```

## UI/UX

`Design system/States` and every destination story.

## Progress (2026-10-20, feat/m2)
Decided and built, closing the ticket. **Option (a)**, chosen under the owner's blanket delegation for this branch (say if wrong),
written in `design/anti-cruft-and-anti-slop.md` ("Hard limits") and `design/screen-direction.md` rule 6:
- The one Ember element is the screen's primary action: a fill, or the `lead` Ember text where the primary stands in the app bar
  (the Dashboard's Add food once the day is weighed). Every other action is a text action in `--text` at the heading weight,
  **underlined**, so it is told from a value or a title beside it without colour (the panel's PD2 and F7: "Change pace" beside
  its value read as a second value).
- The add plate's plus rests in the text colour and fills Ember only pressed, hovered or focused (bug MM-436: at rest it was a
  second Ember action on Food and Progress).
- While the relief offer shows its own primary on the Dashboard, Add food is a text action (the panel's PD3).
- The navigation's current place, a selection's check and a switch's on-state are the Ember of state, outside the count.
- Checked: `textActions.test.tsx` (colour, underline, plate), `hierarchy.test.tsx` (one Ember action per destination story).
  The States story shows Text, Text disabled and Lead in the three palettes.
Option (b), "one Ember fill plus Ember text actions", was not taken: it spends the top rung of the ladder on secondary actions
(Coach showed five in Ember at once).
