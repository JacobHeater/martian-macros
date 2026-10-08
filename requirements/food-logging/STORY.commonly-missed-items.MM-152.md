---
id: MM-152
status: proposed
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
