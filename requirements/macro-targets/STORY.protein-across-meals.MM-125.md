---
id: MM-125
status: in-progress
component: macro-targets
related: [MM-119, MM-41, MM-121, MM-141, MM-143, MM-144]
---

# Story: See how my protein is spread across the day, without being lectured

## Context
Entries are already grouped by meal with totals (MM-41). The question an informed user asks next is whether the *spread* of protein
matters.

Evidence, which has shifted and should be presented as unsettled:
- **Moderate**: a per-meal dose of about 0.4 g per kg across at least four meals was proposed as the way to maximize the muscle-building
  response (Schoenfeld and Aragon 2018, a review of short-term synthesis studies).
- **Emerging, and pointing the other way**: a single 100 g dose after training produced a larger and much longer response than 25 g, with
  no ceiling found over twelve hours (Trommelen 2023). That undercuts the idea that protein beyond a per-meal cap is "wasted".
- Long-term trials comparing distributions with total protein matched are few and mostly find small or no differences in muscle gained.

Reasonable summary: total daily protein is what matters; an even spread over three or four meals is a sensible default that might help a
little; nobody loses muscle by eating most of their protein at dinner.

## Decisions
Choices I made without asking (say if any is wrong):
- **Each meal's card shows its protein** (it already does) **and, in Full detail only, a quiet marker when a meal has at least 0.3 g per kg
  of reference weight.** No marker is not a failure and has no wording.
- **One insight, at most monthly** (MM-141), and only when all of these hold: the user is missing the protein minimum on most days; on
  those days one or two meals carry almost none (under 10 g). Then: "On days you miss protein, breakfast has almost none. Adding some
  there is usually the easiest way to reach it." It is advice about reaching the total, which is the part with strong evidence.
- **No per-meal targets, no meal schedule, no timing window around training, no "anabolic window".** Listed in the non-goals (MM-144).
- **The explanation, where shown, grades itself**: "Spreading protein over the day may help slightly. Your daily total matters much
  more."

Where the experts disagreed:
- The bodybuilding coach wanted four meals at 0.4 to 0.55 g per kg as explicit per-meal targets. The researcher: the long-term evidence
  does not justify adding four more numbers to hit; the UX strategist: every extra target lowers the chance the important one is met.
  Display and one insight only.
- The nutritionist asked for pre-sleep protein guidance. Same answer: emerging evidence, no requirement.

## Description
A display marker and one rule in the insight catalog.

## Acceptance Criteria
```gherkin
Scenario: The marker
  Given an 80 kg user on Full detail and a lunch with 30 g of protein
  Then lunch carries the marker

Scenario: Not at Standard detail
  Given Standard detail
  Then no marker is shown on any meal

Scenario: The insight
  Given a user below their protein minimum on 10 of the last 14 complete days, with under 10 g at breakfast on most of them
  Then the insight is offered once

Scenario: Meeting protein
  Given a user who meets the minimum on most days by eating 120 g at dinner
  Then no insight about distribution is ever shown

Scenario: No per-meal targets
  Then no screen shows a protein target for a meal
```

## Notes
- Priority: could-have. Low cost, low stakes; do it after MM-121.
- Older adults may need a larger per-meal dose for the same response (**moderate**). Not acted on beyond the higher daily minimum in
  MM-112.

## Progress
Built:
- **At Full detail each meal's header shows its protein** beside its calories, and a quiet check mark when the meal has at least
  0.3 g per kg of trend weight (`mealHasSolidProtein`). A meal without it shows nothing in its place. At Standard and Simple neither
  is shown. (The header showed calories only; the ticket's "it already does" was true of the entries, not the meal.)
- **One insight** (`InsightRule.proteinByMeal`): when the protein minimum was missed on more than half of the fully logged days of
  the last two weeks, and on more than half of those days one main meal had under 10 g. It names the earliest such meal of breakfast,
  lunch and dinner, never snacks, in the ticket's words, and grades itself: "Spreading protein over the day may help slightly; your
  daily total matters much more." It ranks below every other insight and, like all of them, is not repeated for 28 days.
- **No per-meal target** anywhere: a test checks the meal headers for one.
- Thresholds are in `ProteinSpreadRule`. Tests: `protein_across_meals_test.dart` (engine and app), `insight_card_test.dart`.

Not built:
- The insight reads meals from the last 14 days of the food log, so it needs those days logged by meal; a day with no entries is not
  counted as a day with an empty breakfast unless it was a fully logged day under the minimum.
- "Reference weight" is the trend weight; before the first weigh-in there is no marker.
- Not seen on a device: the emulator had no food logged. The header's subtotal shortens with an ellipsis before it can push the
  add button off a narrow screen, which a test found it would otherwise do.
