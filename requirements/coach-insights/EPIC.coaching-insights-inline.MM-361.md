---
id: MM-361
status: in-progress
component: coach-insights
related: [MM-137, MM-141, MM-108, MM-144, MM-11, MM-118, MM-148, MM-143, MM-85, MM-250, MM-362, MM-363, MM-364, MM-365, MM-366, MM-367, MM-368, MM-369, MM-370, MM-371, MM-377]
---

# Epic: Coaching insights inline, under the thing they are about

## Context
Today the coach speaks in two places: the Coach tab, and one rationed insight card on the dashboard (MM-141, at most one new
insight a day and three a week). Everything the coach notices about a particular food, set, weigh-in or night has to be said
away from it, if it is said at all.

The product owner (2026-10-17) wants the coach to speak where the person is looking: a short line of advice directly under the
line item it is about, anywhere in the app something is tracked or logged. The owner's example: a logged food that is high in
fat, and so calorie-dense, gets a line under it saying what could be better about that item. The Coach tab stays.

Alongside it, the owner wants every food graded A+ to D- on universal nutrition quality. That overrules a recorded non-goal
(MM-144, "No food scoring, grading, or 'clean' and 'junk' labels") and part of the voice rules (MM-108), as MM-306 overruled the
micronutrient non-goal.

## Narrative
- An inline insight is a one-line coach note under the item it is about, with "The numbers behind this" one tap down. It comes either
  from a pattern the item is part of, or from neutral facts about that one item. Every item that qualifies shows its insight
  (MM-362).
- Every inline insight shown recently is also listed on the Coach tab, with a way back to its item, so nothing is lost when a line
  scrolls away (MM-363).
- Settings gains a Coach page with an on/off switch for all inline insights, one for each area (food, training, body, water,
  sleep), and one for each rule, so Settings needs more hierarchy than its single list (MM-364).
- The first rules, by area: food entries and meals (MM-365), workouts (MM-366), body readings and water (MM-367), and sleep once
  a night of sleep is recorded (MM-368, after MM-250).
- Foods get grades A+ to D-. The method is chosen in a spike first (MM-369). The grade shows on every logged food, in search, and
  rolled up for each meal and day. A food that can't be graded shows a question mark that explains why (MM-370). The non-goal and
  voice rule are marked as overruled, with the reasons kept (MM-371).

Nothing here uses a language model or a server. As in MM-137, every insight is a deterministic rule over local data, worded by
hand, with an entry in the evidence register (MM-143).

## Decisions
The product owner's (2026-10-17):
- **Inline, under the item**, and the Coach tab stays.
- **Two kinds of basis**: a pattern the item is part of, or neutral facts about the single item. The single-item kind overrules
  MM-141's "insights never concern a single day" for inline insights only. The dashboard card keeps MM-141's rules.
- **Every surface that tracks or logs something** can carry one.
- **Every qualifying item shows its insight.** Inline insights are not rationed by MM-141's budget.
- **The Coach tab lists them too.**
- **Quieted in Settings**, under a Coach page: a master switch, a switch for each area and one for each rule.
- **The safeguards that apply today apply here**: under-18s get no coaching (MM-11's policy). With an eating-disorder history,
  insights about weight and about food composition are off, leaving protein, logging, training and sleep. Hiding weight
  (MM-118) suppresses weight insights.
- **One line, expandable** to the evidence, like today's insight card.
- **Food grades A+ to D-**, universal (the same for everyone), on the food per 100 g. They show on every logged food, in food
  search and add, and rolled up for each meal and day. The entry shows the food's grade, and portion is something its insight
  talks about. **Grades are shown with an eating-disorder history**: the owner chose this after being shown that it conflicts
  with the safeguard on food insights. **A food that can't be graded** shows a question mark, and tapping it explains why.
- **No paywall** (settled 2026-10-17). Inline insights, the Coach tab's list, Settings > Coach and food grades are free
  for everyone. None of it is behind the Coach unlock (MM-85).

## Acceptance Criteria (narrative)
The Epic is done when a food, an exercise, a weigh-in, the water section and (once MM-250 exists) a night can each show a coach line
underneath them, written in the product's voice, traceable to a named rule and its evidence. When every logged food and every
food in search shows a grade, or a question mark that says why not. When the Coach tab lists what the coach said inline over the
last fourteen days, and each entry leads back to its item. When a person can turn any rule, any area, or all of it off in
Settings > Coach. And when a test proves that a person with an eating-disorder history sees no inline insight about weight or
food composition.

## Notes
- Order: the spike (MM-369) and the inline framework (MM-362) can start in parallel. Settings (MM-364) and the Coach tab list
  (MM-363) come with the framework's first rules, before any area ships widely. Grades (MM-370) come after the spike. Sleep
  (MM-368) waits for MM-250.
- Every surface gets its stories in every state first (MM-293): with and without an insight, expanded, ungradable, and with an
  eating-disorder history. Then the product-designer and UX-accessibility panel review, before anything is built.
- The rule catalogs in MM-365 to MM-368 are drafts with figures for the panel's coaching, nutrition and training roles to
  check before they are built.

## Progress
- 2026-10-17: the framework is built (MM-362), with Settings > Coach (MM-364) and the Coach tab's list (MM-363). The first
  kind is training's "volume jump" (MM-366), after the panel's training, coaching and safety roles checked the workout
  catalog (`docs/agent-runs/mm366-workout-rules/`). "Holding steady" was dropped and "strength on fat loss" moved to
  MM-377. The food, body, water and sleep catalogs (MM-365, MM-367, MM-368) wait for their domain review; grades wait for
  the spike (MM-369).
- "A set" in the narrative became "an exercise": no line sits under a set (MM-366).
- 2026-10-18: the food set (MM-365: mostly fat, light on protein, the portion check), the waist and water lines (MM-367;
  the weigh-in time line was dropped) and the snooze (MM-378) are built, each after its panel review
  (`docs/agent-runs/mm365-food-rules/`, `mm367-body-water-rules/`). The epic's narrative now holds for a food, an exercise,
  a waist reading and the water section; a weigh-in gets no inline line (MM-142 keeps the weight jump), and a night waits
  for MM-250.
