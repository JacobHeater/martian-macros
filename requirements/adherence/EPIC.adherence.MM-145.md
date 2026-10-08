---
id: MM-145
status: proposed
component: adherence
related: [MM-146, MM-147, MM-148, MM-149, MM-27, MM-40, MM-92, MM-108, MM-123, MM-124, MM-138, MM-150, MM-152]
---

# Epic: Staying with it

## Context
The best-supported finding in weight management is not about any diet. It is that people who keep monitoring keep their results, and
most people stop. Evidence: consistent self-monitoring of intake and weight is associated with greater loss and better maintenance
(**strong**, largely observational: Burke 2011 systematic review; many since). Logging frequency falls steeply within weeks in every
study of tracking apps. The typical end is not a decision to stop; it is a missed weekend that becomes a missed month, with the app
itself now a reminder of having failed.

The requirements so far treat adherence defensively: the estimator is protected from bad logging (MM-27), and rewards are forbidden from
doing harm (MM-92). Nothing actively helps a user keep going, and nothing meets them when they come back.

What the behavior-change literature supports, and the grades the panel gave it:
- **Prompts at the right moment help** (**moderate**), and prompts that nag are switched off within days.
- **Lapses are normal; what matters is the response to the first one.** The belief that one slip has ruined everything (the
  "abstinence violation effect") predicts full relapse (**moderate**, from addiction and dieting research).
- **Flexible control beats rigid control** (**moderate**; MM-123, MM-124).
- **Autonomy and competence support adherence** (**moderate**; MM-138).
- **Reducing the effort of logging increases how long people log** (**moderate**), which is why estimated entries matter (MM-150).

## Narrative
- Reminders the user chooses, sent locally, that stop when they are being ignored (MM-146).
- A way back after a gap that asks for one weigh-in and never mentions the gap as a failure (MM-147).
- A pause for travel, illness and holidays, so that a planned break is not recorded as a collapse (MM-148).
- A weekly adherence summary that describes what happened without scoring it, and that the coach can use to tell an adherence problem
  from a model problem (MM-149).

## Acceptance Criteria (narrative)
The Epic is done when a user who disappears for three weeks and returns is back to a working coach within one screen and one weigh-in;
when a holiday can be declared in advance and leaves no mark on the user's record or the engine's estimate; when no notification the app
sends could be read as guilt; and when the weekly summary treats 200 kcal over and 200 kcal under as the same distance from target.

## Notes
- Priority: MM-147 and MM-149 are must-haves for a product that expects month-two retention. MM-146 and MM-148 are should-haves.
- The process rewards in MM-92 belong to the same family and should be built with MM-149, which supplies their counts.
