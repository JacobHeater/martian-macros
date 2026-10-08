---
id: MM-130
status: proposed
component: macro-targets
related: [MM-119, MM-24, MM-25, MM-31, MM-36, MM-113, MM-131, MM-135, MM-138, MM-142, MM-144, MM-158]
---

# Story: Define maintenance, and make the end of a cut uneventful

## Context
Maintenance is "pace zero" (MM-25). Two things are missing.

**What counts as maintaining.** With a target of exactly zero change, the weekly loop will chase every half-kilogram of drift with a
calorie change, forever. A maintaining user should see stable targets.

**The transition out of a deficit.** It is the most fragile week in the whole journey. The user raises calories to maintenance and the
scale goes *up*, typically 0.5 to 2 kg within one or two weeks, as glycogen, its bound water and gut contents return. Nothing in the app
warns them. Many conclude that maintenance "makes them gain" and go straight back to dieting, or give up.

Evidence:
- **Strong**: glycogen is stored with roughly three to four times its weight in water, and stores fall within days of restriction and
  refill within days of ending it.
- **Strong**: expenditure after weight loss is lower than before, mostly because the body is smaller, with a further adaptive component
  that is real but modest on average and variable between people.
- **None**: "reverse dieting" (raising calories by small weekly steps to rebuild metabolism) has no trial support for any advantage over
  going to maintenance directly. It prolongs the deficit.

## Decisions
Choices I made without asking (say if any is wrong):
- **A maintenance band**: trend weight within 1.5% of the weight at which maintenance began. Inside it, targets change only when the
  *expenditure estimate* changes by more than its own uncertainty, not because of drift.
- **Outside the band for 14 consecutive days**, the coach says so and asks what the user wants: correct back toward the anchor (a
  temporary pace of 0.25% a week in the needed direction, then maintenance again), or accept the new weight as the anchor. No judgement
  in either wording.
- **Leaving a deficit goes straight to maintenance at the measured expenditure**, in one step (already true of a goal change, MM-24). No
  reverse diet. Listed in the non-goals (MM-144).
- **The user is told what the scale will do, before it does it**: at the moment of the change, and again on the weight card for the next
  14 days: "Expect the scale to rise 1 to 4 lb over the next week or two. That is stored carbohydrate and water returning, not fat. Your
  trend will settle."
- **The band's anchor is set after that settling**: the trend weight 14 days after maintenance began, not the weight on the day.
- **The engine does not read the rebound as a surplus** (MM-131).
- **Maintenance after a cut is a recommended phase with a length**: at least 2 weeks, and the coach suggests about 1 week per 4 weeks of
  deficit just completed, before another cut. A suggestion; the unbroken-deficit rule (MM-31) is the hard part.

Where the experts disagreed:
- The bodybuilding coach argued for a brief reverse (two or three steps) on adherence grounds: a sudden 500 kcal rise feels like loss of
  control to someone fresh off a long diet. The researcher: then offer it as a comfort option and do not claim a metabolic reason. Agreed
  as an optional two-step transition over 14 days, off by default, described as "ease into it" and nothing more.
- The adherence expert wanted the band at 2%. The physique expert at 1%. 1.5% is a compromise between a meaningful anchor and the trend's
  own uncertainty.

## Description
A maintenance anchor and band in the coach; transition messaging; an optional two-step transition.

## Acceptance Criteria
```gherkin
Scenario: Stable targets
  Given a user on maintenance whose trend weight wanders within 1% of the anchor for eight weeks, with an unchanged expenditure estimate
  Then the calorie target does not change in that time

Scenario: Drifting out
  Given trend weight more than 1.5% above the anchor for 14 days
  Then the coach asks whether to correct back or accept the new weight, and changes nothing until answered

Scenario: The end of a cut
  Given a user on fat loss at 1,900 kcal with a measured expenditure of 2,450 kcal
  When they switch to maintenance
  Then the target is about 2,450 kcal at once
  And they are told to expect the scale to rise, by how much, and why

Scenario: The rebound is not a surplus
  Given a simulated user who ends a 12-week cut and gains 1.5 kg of glycogen and water in ten days while eating at true maintenance
  Then the expenditure estimate does not fall by more than 100 kcal because of it
  And the target is not lowered in the following three check-ins

Scenario: The anchor
  Given maintenance began on the 1st
  Then the band is centered on the trend weight of the 15th

Scenario: Easing in
  Given the two-step option is on
  Then the target reaches maintenance in two equal steps over 14 days, and no text claims a metabolic benefit
```

## Notes
- Priority: should-have, and before any user finishes a first cut (about twelve weeks after launch).
- The same wording, mirrored, applies at the *start* of a deficit, where the early drop is water (MM-158).
- A user stopping weight-loss medication is in a similar position with a different cause (MM-113).
