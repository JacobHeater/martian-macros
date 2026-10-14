---
id: MM-288
component: design-system
status: proposed
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
