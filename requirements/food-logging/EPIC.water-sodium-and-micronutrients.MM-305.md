---
id: MM-305
status: in-progress
component: food-logging
related: [MM-37, MM-49, MM-126, MM-144, MM-306, MM-307, MM-308, MM-309, MM-310, MM-311, MM-312, MM-313, MM-314]
---

# Epic: Water, sodium and micronutrients

## Context
The product owner's new food tracker requirements (2026-10-14):

- Must track water intake.
- Must track micronutrients.
- Must allow the user to configure sodium goals.
- Must display micronutrients as part of the nutrition card where the macros are displayed, as an additional
  choice beside Grams and Split.

Until now the app kept fiber, sodium and alcohol when a source stated them (MM-49) and showed them at Full
detail, and "no micronutrient targets" was a recorded non-goal (MM-144) because the sources carry them
patchily. The owner overruled that non-goal the same day (MM-306), with the answers below.

## Decisions
The product owner's answers (2026-10-14, asked in the interactive session):

- **The non-goal is overruled now**, not after a coverage spike. MM-144 and `docs/non-goals.md` record it.
- **Which nutrients**: minerals and key vitamins, the label's set plus a few. Sodium, potassium, calcium,
  iron, magnesium, zinc; vitamins A, C, D, B12 and folate; and the label's "also" lines: total sugars,
  saturated fat and cholesterol.
- **Totals with a reference marker**: each vitamin and mineral is shown against the reference amount for the
  user's sex and age (RDA or AI), as a neutral marker, not a goal the user sets. Sodium has the only goal.
- **Missing data**: the known total with its coverage ("from 4 of 7 foods"), never a total that treats a
  missing value as zero.
- **Where the data comes from**: the food pack carries the nutrients (MM-307), and label scanning and custom
  foods capture them (MM-309).
- **On the card**: a third segment, Grams | Split | Micros, at Full detail only.
- **Sodium**: a daily limit, off by default, 2,300 mg suggested; over the limit the number says so plainly
  and the coach has a line about it (MM-312). Set in Settings only.
- **Water**: one-tap glass and bottle plus a typed amount, in the units setting; an optional goal the user
  types, off by default; plain water only (drinks logged as food do not count); on the Food screen and the
  Dashboard, with a one-tap add from the Dashboard; written to the phone's health platform (MM-314).
- **Delivery**: one epic, on one branch, designed in Storybook, reviewed by the panel, then built.

## Narrative
The data first: the pack (MM-307), the log (MM-308) and the user's own foods and labels (MM-309) keep the
nutrients when a source states them, and never invent one. Then the picture: the Micros segment on the
nutrition card (MM-310), with each nutrient's known total, how many of the day's foods it came from, and
the reference amount; and the sodium limit the user can switch on (MM-311), with the coach noticing a
pattern of days over it (MM-312). Water is its own small log (MM-313): a row on the Dashboard that adds a
glass in one tap, a section on the Food screen, and a goal if the user wants one. Writing water to the
health platform (MM-314) waits for the app's write path (MM-70).

## Acceptance Criteria (narrative)
The epic is done when a user at Full detail can switch the nutrition card to Micros and see, for every
nutrient listed above, what today's foods say and how much of the day that covers; when a user who wants a
sodium limit can set one and see the day against it; when water can be logged in one tap from the
Dashboard and read back on the Food screen; and when none of it shows a number the data does not support.
