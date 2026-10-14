---
id: MM-289
component: developer-tooling
status: proposed
related: [MM-253, MM-255, MM-258, MM-237]
---

# Task: the demo seed shows every mark the direction adds

## What the panel found (product-designer PD-16, PD-22; UX-accessibility UX-15, 2026-10-13)

The register judges design on the demo scenario, and the seed is uniform:
every food entry is "Weighed · amount not recorded", so the method icons
of MM-255 show one glyph; every workout is the same lifts, so every Train
row carries "3 personal records" and the record mark of MM-258 cannot be
judged against an unmarked row.

## What is built

- Demo food entries carry portions across the methods (weighed, a label
  serving, a cup, a palm, an estimate), so the Food story shows at least
  three method icons.
- Demo workouts vary (one record in three, differing sets and lengths), so
  the Train story shows a marked row beside unmarked ones.
- The seed's tests and the stories that read it still pass.

## Acceptance criteria

```gherkin
Scenario: Methods in the register
  Then the Food story shows at least three different method icons

Scenario: A record earns its mark
  Then the Train story shows a row with the record mark and a row without
```

## UI/UX

`Screens/Food` (Food) and `Screens/Train` (Train).
