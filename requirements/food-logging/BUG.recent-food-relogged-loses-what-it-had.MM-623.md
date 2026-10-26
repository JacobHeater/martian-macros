---
id: MM-623
status: done
component: food-logging
related: [MM-39, MM-167, MM-308, MM-309, MM-396, MM-595, MM-596]
---

# Bug: a recent food logged again loses its nutrients, the food it came from, and its link to the amount

## Context
Found on 2026-10-26 by source inspection in the food-logging review (`docs/food-logging-plan.md`, F-01),
by the chair and, independently, by the nutrition and UX reviewers. Not reproduced at runtime; the
regression tests below are written to fail on main at f5a08b4.

A recent food, or one found in the whole log (MM-596), fills the form in `AddFoodSheet.fill` →
`filledFrom`. The sheet's `entry` prop stays undefined, because a new log is not an edit. `save` then
reads the extras from `entry`:

- `sugarAlcoholsG: scaledExtra(entry?.sugarAlcoholsG)` and `scaledMicros` (`Micronutrients.none` when
  `entry` is undefined) are always lost: sugar alcohols, potassium, calcium, iron and every other
  micronutrient beyond sugars and saturated fat.
- When `filledFrom` builds a per-serving `calcRef` (a label serving, or a food of an analysed meal),
  `fiberG` and `sodiumMg` also come from `scaledExtra(entry?…)` and are lost, although the form was
  refilled with them; sugars and saturated fat are lost with `scaledMicros`.
- A calculated food logged by weight or household measure (a pack food) comes back as typed totals:
  `basis: 'enteredTotals'`, no reference, no `origin`. A changed amount changes nothing that is
  logged, against MM-39's reason for filling instead of logging ("so the amount can be changed"), and
  the new entry no longer says which food it came from (MM-167, MM-169).
- "Edit nutrition per serving" on a refilled food blanks the refilled extras for the same reason.

Example: "Greek yogurt", one label serving with sodium 60 mg, fiber 2 g, sugar alcohols 0 g and
calcium 190 mg, logged again as two servings, is saved with 200 kcal and no sodium, fiber, sugar
alcohols or calcium.

## Description
Logging a food again from Recent foods or from the log keeps everything the earlier entry knew,
scaled once by the new amount: the macros, fiber, sugar alcohols, sodium and every micronutrient,
with unknown kept unknown and a known zero kept zero. A food calculated from a reference stays
calculated from that reference, keeps the food it came from, and its totals follow the amount.

## Acceptance Criteria
```gherkin
Scenario: A recent label serving keeps its extras
  Given "Greek yogurt" was logged as 1 serving with sodium 60 mg, fiber 2 g, sugar alcohols 0 g and calcium 190 mg
  When it is logged again from Recent foods as 2 servings
  Then the new entry has 200 kcal, sodium 120 mg, fiber 4 g, sugar alcohols 0 g and calcium 380 mg

Scenario: A recent weighed food follows its new weight
  Given 180 g of a pack's cooked rice was logged, calculated from its per-100 g numbers
  When it is logged again from Recent foods as 200 g
  Then its totals are those of 200 g, it is still calculated, and it names the same pack food

Scenario: A food of an analysed meal keeps its extras
  Given a food of an analysed meal is found in the log
  When it is logged again as one usual portion
  Then its fiber, sodium and micronutrients are those of that portion
```

## Decisions
Choices made without asking (say if any is wrong):
- The refilled entry is the template for the new one; the sheet's `entry` stays the entry being edited.
  The fix keeps the two apart rather than treating a re-log as an edit.
- Whether a re-logged food of an analysed meal keeps `photoEstimate` and its evidence, or becomes a
  label serving as `filledFrom` makes it today (MM-596), is left to the owner; this bug does not change it.

## Notes
- Fixed 2026-10-26: `AddFoodSheet` keeps the food being logged again as a template (`template`), apart
  from the entry being edited; extras, micronutrients, alcohol, origin and preparation scale from
  whichever of the two there is. `filledFrom` brings a calculated food back on its own reference, as
  `editing` does. Going back to the choices, or entering a food by hand, lets the template go.
- Regression tests: `apps/mobile/test/food/relogKeepsWhatItReuses.test.tsx` (label serving, weighed pack
  food, a food of an analysed meal).
- Not covered by `recentFoodsAreRows.test.tsx` (name only) or `searchTheLog.test.tsx` (kcal and serving only).
