---
id: MM-119
status: proposed
component: macro-targets
related: [MM-120, MM-121, MM-122, MM-123, MM-124, MM-125, MM-126, MM-127, MM-128, MM-129, MM-130, MM-22, MM-24, MM-25, MM-28, MM-41]
---

# Epic: Macro targets an expert would sign

## Context
The adaptive coach (MM-22) decides how many calories. This component is about everything else in the daily numbers: how protein is chosen,
how the remaining calories are split, how exactly a target is meant to be hit, how it varies across a week, and how fast a goal is
pursued.

What exists is sound and thin. Protein is the midpoint of a range (MM-24, MM-28); fat is the larger of a minimum and 25% of calories;
carbohydrate is whatever is left; every day has the same target, shown to the calorie; fat-loss pace is fixed at 0.75% a week with no
control (MM-25). An experienced lifter or a dietitian reading that would ask a dozen questions the app cannot answer.

The panel's ordering of what matters for body composition, which this component follows and the app should teach:
1. energy balance over weeks (**strong**);
2. total daily protein (**strong**);
3. resistance training (**strong**; MM-74, MM-134);
4. adherence, which decides whether 1 to 3 happen (**strong**);
5. the carbohydrate-to-fat split, above the fat minimum (**moderate** evidence that it matters *little* for fat loss or muscle when
   calories and protein are matched);
6. distribution of protein across meals (**moderate**, small effect);
7. timing around training, and day-to-day cycling (**emerging** to **judgement**; small or unproven).

Features lower on the list are offered as preferences and never presented as necessary.

## Narrative
- Fix a defect: the protein target drops about 30 g when a user crosses BMI 30 (MM-120).
- Protein becomes a minimum plus a target chosen by goal, age and training, not a midpoint (MM-121).
- The user sets their own carbohydrate and fat balance within the floors (MM-122).
- Targets are shown and judged with a tolerance that matches how well food can be measured (MM-123).
- A week can be shaped, with higher days, without the weekly total changing and without the app ever "taking back" calories (MM-124).
- Light guidance on protein per meal (MM-125), fiber (MM-126) and alcohol (MM-127).
- The user chooses a fat-loss pace and sees what it costs (MM-128); lean gain has guardrails against simply getting fat (MM-129);
  maintenance has a definition, and leaving a deficit has a plan (MM-130).

## Acceptance Criteria (narrative)
The Epic is done when every number on the daily target card can be traced to a stated rule with a stated evidence grade (MM-143); when no
target is displayed or judged more precisely than food can be measured; when a user can shape their week and their macro split without
being able to go below a floor; and when nothing in the component claims that timing, cycling or meal frequency is required for results.

## Notes
- Priority within the Epic: MM-120, MM-121, MM-123 and MM-128 first. MM-122, MM-124 and MM-130 next. MM-125, MM-126, MM-127 and MM-129 after.
- All of this is part of the paid Coach unlock except what a free user needs to set targets by hand (MM-85).
