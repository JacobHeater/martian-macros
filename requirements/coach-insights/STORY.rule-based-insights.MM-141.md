---
id: MM-141
status: proposed
component: coach-insights
related: [MM-137, MM-11, MM-92, MM-98, MM-108, MM-114, MM-117, MM-118, MM-125, MM-126, MM-139, MM-140, MM-142, MM-143, MM-149]
---

# Story: Insights from a fixed catalog of rules, rationed

## Context
Several tickets produce "an insight": the stall diagnosis (MM-140), the recovery offer (MM-117), the protein-distribution note (MM-125),
the fiber note (MM-126). Without a shared framework each will invent its own card, its own frequency and its own tone, and the dashboard
will fill with advice until the user stops reading any of it.

The panel's view of insight features in competing apps: most are noise ("You logged 5 days this week! 🎉"), some are harmful ("You're
under your goal, great job!"), and a few are what a good coach would say. The difference is that the good ones point at something specific
in the user's own data that the user had not noticed and can act on.

## Decisions
Choices I made without asking (say if any is wrong):
- **An insight is a record with fixed parts**: what was observed, in the user's numbers; the data it rests on (viewable); how sure the app
  is; optionally one action; and the rule that produced it.
- **Every insight comes from a named rule in a catalog in the engine.** No free text generated at run time, no language model, no server.
  Each rule is a pure function with tests, and each has an entry in the evidence register (MM-143) stating its basis.
- **Rationing**: at most one new insight a day and three a week on the dashboard. Excess candidates wait or expire.
- **Priority, highest first**: safety (MM-114, MM-115); data quality; coaching decisions (MM-117, MM-133, MM-140); patterns; education.
- **No repeats**: a dismissed insight from a given rule does not return for 28 days. Safety insights follow their own ticket's rules.
- **Insights never concern a single day**, and never a single weigh-in. The minimum basis is seven days. (The weight-jump explanation,
  MM-142, is not an insight; it is shown only when the user looks at that reading.)
- **Forbidden subjects**, enforced by test: praise for eating under target, for a low weight, or for a large deficit (MM-92); any moral
  word about food or the user (MM-108); comparison with other people; predictions of an outcome by a date.
- **For a user with an eating-disorder history**, insights about weight are suppressed entirely, and pattern insights about intake are
  limited to protein and logging (MM-11).
- **For a user hiding weight** (MM-118), insights obey the setting.
- **The first catalog** (each a pattern over at least 14 days unless noted):

| rule | what it says | basis |
|---|---|---|
| protein short | minimum met on fewer than half of complete days, with the average shortfall | MM-121 |
| weekday and weekend | weekend average exceeds weekday average by 20% or more of target; offers shaping the week (MM-124) | adherence |
| weigh-in timing | fewer than 4 weigh-ins a week; says what it costs in confidence (MM-139) | MM-23 |
| partial days | more than a third of logged days marked or classed partial | MM-27 |
| estimates rising | share of calories from estimated entries (MM-150) above half | data quality |
| strength holding on a cut | e1RM held or up over 6 weeks of deficit: the plain statement that this is what success looks like | MM-79 |
| waist against weight | waist down beyond noise while weight is flat (the recomp signal's cousin, in any goal) | MM-32 |
| meals without protein | see MM-125 | MM-125 |
| fiber and hunger | see MM-126 | MM-126 |
| consistent day | one weekday is repeatedly the highest or the unlogged day; states it, no action | pattern |

Where the experts disagreed:
- The product strategist wanted a larger catalog at launch for perceived intelligence. The UX strategist and behavior-change expert:
  three good insights a week is the ceiling of what gets read; quality of the first ten decides whether the eleventh is opened. Ten.
- Whether "strength holding on a cut" is praise for an outcome. It is an outcome the user earned by training, like a personal record
  (MM-92 allows those); kept.

## Description
An insight type and catalog in the engine, a store of shown and dismissed insights, a scheduler applying the rationing, and one card
component.

## Acceptance Criteria
```gherkin
Scenario: A pattern
  Given 14 complete days of which 5 met the protein minimum, averaging 28 g short
  Then a protein insight is produced stating both figures

Scenario: Rationing
  Given five rules are satisfied on the same day
  Then one insight is shown that day, the highest priority, and at most three that week

Scenario: Dismissed
  Given the protein insight was dismissed 10 days ago and the pattern continues
  Then it is not shown again until 28 days have passed

Scenario: Not about one day
  Given a single day 900 kcal over target
  Then no insight is produced about it

Scenario: Forbidden subjects
  Given every rule in the catalog run against every simulated user
  Then no insight text contains a banned word, praises intake below target, or mentions a new lowest weight

Scenario: Eating-disorder history
  Given that screening answer is ticked
  Then no insight mentions weight

Scenario: The evidence is viewable
  When an insight is opened
  Then the days and figures it was computed from are shown
```

## Notes
- Priority: should-have. Build the framework with the first rule that needs it (MM-140), not before.
- Part of the paid Coach unlock, except safety insights, which are never behind a paywall (MM-85).
