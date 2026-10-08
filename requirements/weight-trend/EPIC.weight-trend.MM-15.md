---
id: MM-15
status: in-progress
component: weight-trend
related: [MM-16, MM-17, MM-18, MM-19, MM-20, MM-21, MM-22, MM-68]
---

# Epic: Weight trend

## Context
A bathroom scale reading moves by a kilogram or more from one morning to the next for reasons that have nothing to do with fat: salt,
carbohydrate and the water stored with it, a hard training session, what is still in the gut. Someone losing fat at a healthy pace loses
about 0.1 kg of it a day, so on any given morning the noise is many times larger than the signal. People who watch the raw number get
discouraged by spikes and falsely encouraged by dips.

The original pitch was "ditch the bathroom scale for body fat percentage". Planning rejected that: consumer body-fat scales measure body
water, and are noisier and more biased than weight. The product owner agreed to make trend weight a headline number instead, with waist and
strength, and to show body fat only as a slowly updated range.

## Narrative
The user weighs in each morning (MM-16). The app separates the reading into tissue weight and passing water (MM-18) and shows the trend
with a band for its own uncertainty, so a spike visibly lands inside "normal" (MM-17). The same trend, not the raw readings, is what the
coach uses to measure energy expenditure (MM-23).

Waist is tracked alongside (MM-21) because a tape measure is more precise than any consumer body-fat reading and moves when weight does not.

For women, water retention around menstruation is large and predictable. The engine can already widen its noise on those days (MM-19);
what is missing is a way to tell it when they are (MM-20, MM-68).

## Acceptance Criteria (narrative)
The Epic is done when a user who weighs in most mornings sees a trend line they can trust more than any single reading, with an honest
uncertainty band, and a user who menstruates does not see a monthly false gain in the trend.
