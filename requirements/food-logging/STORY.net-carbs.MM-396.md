---
id: MM-396
status: done
component: food-logging
related: [MM-397, MM-255, MM-290, MM-49, MM-31]
---

# Story: Net carbs, on by default

## Context
The owner (2026-10-18): "Presently split tracks carbs as total carbs. Add a setting in the settings menu to
net carbs and default it to on." Then: "Not just fiber, you have to consider sugar alcohols too." Asked
through the question tool, the owner chose net carbs everywhere carbs show (not the Split alone) and all
sugar alcohols subtracted, as US labels do (not half).

## Decisions
The product owner's (2026-10-18): a setting in Settings, on by default; net = total carbohydrate − fiber −
sugar alcohols; counted everywhere carbs show.

Choices I made without asking (say if any is wrong):
- **The carb target keeps its grams, read as net.** A carb target is the calories left after protein and
  fat, at 4 kcal a gram (`computeTargetsTraced`), which net carbohydrate approximately supplies; calories
  remain the governing figure (the nutrition role's NU-3). It does not move during the day as fiber is eaten.
- **What is not stated is not subtracted, and nothing goes below zero.** A food with no fiber or
  sugar-alcohol value counts its total carbohydrate; labels round each line on its own, so each food's net
  is held at zero before the day is added up (NU-2). Sugar alcohols are subtracted as stated: allulose and
  other carbohydrates a label treats specially are not (NU-6).
- **A switch under Nutrition detail** in Settings > Today's setup, as the easy-to-miss reminder is, its
  subtitle following it (the designer's PD-2): on, "Carbs less fiber and sugar alcohols, against the same
  carb target. Changes what is shown, never what is stored."; off, "Total carbs, as on the label."; at
  Simple detail it adds "Shown at Standard or Full nutrition detail."
- **Words follow the switch** (PD-4): the bars' label, the Split's list, its spoken label and its caption
  ("protein/net carbs 4 kcal/g … Alcohol, fiber, sugar alcohols and other calorie differences are not part
  of this split", NU-4), an entry's C figure, and the amount step ("5 g net carbs (24 g total)"). At Full
  detail the extras line under an entry gives the other figure, "Total carbs" while carbs are net, so no
  entry shows net twice (PD-1). Fields where carbs are typed stay "Carbs g": they take a label's total. The bare "C" of an
  entry's "P · C · F" at Standard detail follows the switch without its own word, for room (the UX guard's N5).
- **What it does not change:** calories, the coach's estimate and targets, the grade, the insights and the
  energy check of a food's macros all keep using total carbohydrate, which is what a label's calories rest
  on. Stored values never change.

## Description
A switch "Net carbs" in Settings, on unless turned off. While on, every carbohydrate figure the app shows
for logged food, foods about to be logged, meals and days is total carbohydrate less the fiber and sugar
alcohols stated for it, and the carb target is read as net. The Split counts net carbs at 4 kcal a gram.

## Acceptance Criteria
```gherkin
Scenario: On by default
  Given a person who has never changed the setting
  Then Settings shows Net carbs switched on

Scenario: A food with fiber and sugar alcohols
  Given a bar of 24 g carbohydrate, 9 g fiber and 10 g sugar alcohols is logged
  When the Food screen shows the day
  Then its net carbs are 5 g, in the bars and in the Split
  And the bar is labelled "Net carbs" against the same carb target

Scenario: Switched off
  When Net carbs is switched off
  Then the same day shows 24 g of carbs, labelled "Carbs"

Scenario: Nothing stated
  Given a food with no fiber or sugar-alcohol value
  Then its net carbs are its total carbohydrate

Scenario: Lines rounded past zero
  Given a food with 1 g carbohydrate, 1 g fiber and 1 g sugar alcohol
  Then its net carbs are 0 g

Scenario: What it never changes
  When the switch changes
  Then calories, the day the coach reads and the targets are unchanged
```

## Notes
Reviewed in `docs/agent-runs/mm396-net-carbs/` (nutrition, integrations, product designer, UX). Tests:
`test/food/netCarbs.test.tsx`, the extras line in `test/format/templates.test.ts`. Declined: an explain
button beside the bar's label (the switch's subtitle says it, and the extras line gives the total).
