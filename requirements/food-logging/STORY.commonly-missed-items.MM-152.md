---
id: MM-152
status: done
component: food-logging
related: [MM-37, MM-23, MM-27, MM-39, MM-40, MM-108, MM-114, MM-127, MM-140, MM-151]
---

# Story: A light check for the things everyone forgets to log

## Context
People under-report what they eat. Measured against doubly-labeled water, self-reported intake runs 10 to 30% low on average and far
lower in some groups; in one classic study of people who believed they could not lose weight, intake was under-reported by 47% (Lichtman
1992). Evidence: **strong**, replicated for decades, in trained dietitians as well as the public.

The adaptive estimate is built to absorb a *consistent* shortfall (MM-23), which is the design's central strength. Two things it cannot
absorb: omissions that come and go (some days the oil is logged, some days not), and the user's own confusion when an estimate comes out
implausibly low (MM-140 raises this at diagnosis time, late).

Where the missing calories are is well known from dietary-assessment research and coaching practice (**moderate**): cooking fats and
oils; drinks, including milk in coffee, juice and alcohol; sauces, dressings and spreads; tastes while cooking and bites of other people's
food; snacks eaten standing up.

## Decisions
Choices I made without asking (say if any is wrong):
- **When a day is marked complete, one line appears beneath the control**: "Easy to miss: cooking oil · drinks · sauces · bites and
  tastes." Each word is a button that opens add-food pre-filtered to that kind of item (oils and fats; drinks; sauces and dressings),
  with the user's own recent ones first (MM-39). "Bites and tastes" opens the estimate sheet at Light (MM-150).
- **It is a prompt, not a gate.** Marking complete has already succeeded. The line can be ignored.
- **It is shown for the first 14 days of use, and after that once a week**, on the first day marked complete in a week. A setting turns it
  off.
- **"Cooked with oil?" on the amount step**: when a food commonly pan-fried or roasted (meats, eggs, potatoes, vegetables) is logged from a
  generic entry, a small optional control adds a teaspoon or tablespoon of the user's usual cooking fat as a separate entry. Off by
  default per food once dismissed.
- **Never worded as distrust.** Nothing says "be honest", "accurate" or "everything" (MM-108). The line names items; it makes no
  statement about the user.
- **Not shown to a user with the under-eating notice active** (MM-114) or an eating-disorder history: for them, a prompt to find more
  calories to record is the wrong emphasis.

Where the experts disagreed:
- The adherence expert and the UX strategist disliked any friction at the moment of success (marking a day complete is a small win).
  The nutritionist and the engineer: it is the only moment the user is thinking about whether the day is whole. One line, no dialog, and
  it fades to weekly.
- The bodybuilding coach wanted this stronger and permanent. The decay stays: a line seen daily is not read by week three.

## Description
A hint line on the completeness control with deep links into add-food; an optional cooking-fat control on the amount step.

## Acceptance Criteria
```gherkin
Scenario: The line appears
  Given day 3 of use
  When the day is marked complete
  Then the easy-to-miss line is shown under the control, and the day is already stored as complete

Scenario: Following a prompt
  When "cooking oil" is tapped
  Then add-food opens on oils and fats, the user's recent ones first

Scenario: Fading
  Given day 30 of use and the line was shown yesterday
  When today is marked complete
  Then the line is not shown

Scenario: Weekly afterwards
  Given day 30 of use and the line has not been shown for 7 days
  When the day is marked complete
  Then it is shown

Scenario: Cooking fat
  Given a generic "Chicken thigh, cooked" is being logged
  When "cooked with oil: 1 tsp" is chosen
  Then a second entry of about 40 kcal of the user's usual oil is added to the same meal

Scenario: Suppressed
  Given the under-eating notice is active
  Then the line is not shown

Scenario: Turned off
  Given the setting is off
  Then the line is never shown
```

## Notes
- Priority: could-have. Small, and likely to improve data quality more than its size suggests; hard to prove without analytics the app
  will not have.
- A teaspoon of oil is about 4.5 g and 40 kcal; a tablespoon about 13.5 g and 120 kcal.

## Progress
Built: under a day marked complete, one line "Easy to miss" with four buttons: cooking oil, drinks, sauces (each opens add-food with that
word already searched) and bites and tastes (opens the estimate sheet at Light). It is a prompt: the day is already stored as complete.
The rule (`easyToMissVisible`, tested): shown every time in the first 14 days of use, afterwards on the first completed day in a week
(not again for 7 days), and for the rest of the day it first appeared on; never when turned off or for someone with an eating-disorder
history. A setting in Settings turns it off. The setting and the last day shown are stored with the display preferences (schema 13,
migration 12 to 13, contract tests for both stores). Widget tests cover each scenario except the cooking-fat control.

Not built: "Cooked with oil?" on the amount step and the user's usual cooking fat; add-food filtered to a kind of item (the pack has
no categories, so the buttons search a word, and the user's own recent items are not yet ranked first for it); suppression while the
under-eating notice is active (that notice, MM-114, is not built); the fade is by calendar days since onboarding, not days with a log.
Not seen on the emulator.

Done since: "Cooked with oil?" on the amount step. A cooked generic food (not a packaged, saved or raw one) offers No, 1 tsp or 1 tbsp;
choosing one logs a second entry, "Cooking oil" (4.5 g or 13.5 g of fat, about 40 or 120 kcal), in the same meal. Tested in
`raw_or_cooked_test.dart`. Still not built: the user's own usual cooking fat (it is a generic oil), "off for this food once
dismissed" (the control is optional and defaults to No each time, so there is nothing to dismiss), and "cooked" is judged from the
pack's preparation state because the pack has no category for pan-fried or roasted foods, so rice, which is not usually cooked in
oil, is offered it too.

## Progress (2026-10-20, feat/m2)
Built: **the user's usual cooking fat.** Once a spoon is chosen under "Cooked with oil?", the amount step shows which fat, as choice
chips like the "Amount in" chips above: Oil, Butter, Ghee, Coconut oil (`CookingFatKind`, each with its USDA numbers per 100 g and
its spoon weights), the person's usual one preselected, with a caption saying what it adds ("Adds butter as its own entry: about
34 kcal · 4 g fat"). The fat chosen is logged under its own name ("Butter", "Cooking oil") and becomes the usual
(`usual_cooking_fat` on the preferences, schema 15, `CookingFatReader`/`Writer`, oil until chosen), so the next time it is one tap.
Tests: `test/domain/cookingFat.test.ts`, the preferences contract, `test/food/rawOrCooked.test.tsx` ("butter chosen as the fat is
logged as butter and remembered as the usual"). Story: `AddFoodAmountCookedWithOil`.

Already true, recorded here: the line is suppressed while the under-eating notice is active (MM-114 is built; tested in
`easyToMiss.test.tsx`), and a word searched from the line lists the person's own recent foods above the pack's results, so "the
user's own recent ones first" holds.

Decided here (say if wrong): the usual fat is learned where it is used, on the amount step, with no Settings control (Settings is
another lane's this round, and a control there would be a second home for one choice); "off for this food once dismissed" is not
built, because the control defaults to No and asks nothing, so there is nothing to dismiss; add-food filtered to a *kind* of item
stays a word searched, since the pack has no categories (the food-database lane); "cooked" is still judged from the pack's state,
so rice is offered oil too; the fade stays by calendar days since onboarding, the simplest reading of "days of use".

