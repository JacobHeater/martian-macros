---
id: MM-118
status: proposed
component: safeguards
related: [MM-110, MM-11, MM-16, MM-17, MM-68, MM-92, MM-98, MM-107, MM-146]
---

# Story: Be coached by my weight without having to look at it

## Context
The engine needs weigh-ins. Some users are harmed by seeing them: a morning number sets their mood, drives compensating behavior, or
restarts old patterns. Today the only option for them is not to weigh, which removes the trend and the measured expenditure, or not to use
the app.

Evidence:
- **Strong** for adults with overweight in weight-management programs: regular self-weighing improves weight outcomes without adverse
  psychological effects on average (Zheng 2015; Madigan 2015; Pacanowski 2015 reviews).
- **Moderate** in the other direction for young women and people with eating-disorder vulnerability: self-weighing is associated with
  worse body satisfaction and mood, and a randomized trial in emerging-adult women found daily weighing increased swings in negative mood.
- So the average effect is good and the effect is not the same for everyone. That is a case for a setting, not a single policy.

## Decisions
Choices I made without asking (say if any is wrong):
- **A "Weight display" setting with three values**:
  - **Everything** (default): as today.
  - **Trend only**: raw readings are not shown anywhere. The chart draws the trend line and band without dots (MM-107); the dashboard shows
    trend weight and its change; a weigh-in typed by hand is confirmed with "Saved" and no echo of comparisons.
  - **Hidden**: no weight figure appears anywhere. Progress is described in words against the goal's intended pace ("on pace", "slower
    than planned", "faster than planned", "steady"), with the same confidence wording as everywhere else. Waist and strength are shown
    normally.
- **Hidden works best with a connected scale** (MM-68), since the phone then never shows the number; with manual entry the user sees what
  they type and nothing after.
- **The default for a user with an eating-disorder history is Trend only**, shown and explained at onboarding, and changeable.
- **The setting is offered, once, when a pattern suggests it would help**: more than one weigh-in a day on five or more days in two weeks.
  Offered as a choice with no comment on the behavior.
- **Every notification obeys the setting** (MM-146): no weight figure on a lock screen in any mode.
- **The coach is unaffected.** The engine uses every reading in every mode.

Where the experts disagreed:
- The progress-tracking expert: hiding the trend removes the product's central teaching tool, the visible band that shows a spike is
  noise. True, and the reason "Everything" stays the default and "Trend only" is the recommended alternative.
- The adherence expert suggested weekly instead of daily weighing as a milder option. The engineer's answer: a trend from one reading a
  week is far less certain and the expenditure estimate needs eight readings in its window (MM-23). Weighing can be daily and unseen.

## Description
A display setting read by every component that shows weight; wording rules for the Hidden mode's pace descriptions.

## Acceptance Criteria
```gherkin
Scenario: Trend only
  Given the setting is Trend only and three weeks of weigh-ins
  Then the chart shows a line and band with no dots
  And no raw reading appears on any screen

Scenario: Hidden
  Given the setting is Hidden
  Then no screen, summary, report or notification shows a weight in any unit
  And the dashboard describes pace in words

Scenario: The coach still works
  Given the setting is Hidden and two weeks of synced weigh-ins and logged food
  Then the first adaptive check-in happens exactly as it would with the setting on Everything

Scenario: Words follow the data
  Given the setting is Hidden and trend loss of 0.2% a week against an intended 0.75%
  Then the pace is described as slower than planned

Scenario: Default for eating-disorder history
  Given that screening answer is ticked at onboarding
  Then the setting starts at Trend only and the user is told and can change it

Scenario: Switching back
  When the setting is changed to Everything
  Then the full history of readings is shown
```

## Notes
- Priority: should-have.
- The unit and backup exports still contain the numbers; say so in the setting's description.
- Calories have the same problem for some users. A "macros without calories" display was discussed and not specified; note it if asked.
