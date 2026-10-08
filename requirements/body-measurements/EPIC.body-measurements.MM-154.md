---
id: MM-154
status: proposed
component: body-measurements
related: [MM-155, MM-156, MM-157, MM-15, MM-21, MM-32, MM-33, MM-34, MM-107, MM-129, MM-133, MM-140]
---

# Epic: Body measurements that can carry the weight put on them

## Context
Waist is one of the product's three headline measures (MM-21) and an increasing amount now rests on it: the recomp signal (MM-32), the
recomp review (MM-133), the "masked" stall diagnosis (MM-140), the fat-heavy-gain notice (MM-129), and eventually the body-fat estimate
(MM-34). Each of those asks whether waist has changed "by more than its noise".

What exists is a number field and "change since the first entry". There is no measurement protocol beyond a sentence, no treatment of
measurement error, no chart, no other sites, and no photos. MM-32 already warns that its thresholds "need checking against the
measurement noise of a tape, or the card will flicker".

The physique-assessment view of the panel:
- **A tape is the best tool a home user has**, better than any consumer body-fat device, *if* it is used the same way every time.
- **Self-measured circumference is noisier than people think.** Technical error for trained measurers is around a centimeter at the waist;
  self-measurement, at varying times of day and states of digestion, is worse. Site matters too: "waist" measured at the navel, at the
  narrowest point, and at the midpoint between rib and hip differ by several centimeters and respond differently to fat loss.
- **Change is only real when it exceeds that error.** An app that reports "−0.4 cm" as progress is reporting noise.
- **One site is a thin basis.** Fat is lost and gained in different places by different people, and by sex.
- **Photos show what numbers do not**, and are the measure most open to self-deception and distress.

## Narrative
- A protocol that makes waist repeatable, an honest noise figure, and a rule that the app speaks of change only when it exceeds that
  noise (MM-155).
- More sites, optional, for those who want them, with the same treatment (MM-156).
- Progress photos kept on the device, standardized, compared side by side, and never analyzed (MM-157; future phase).

## Acceptance Criteria (narrative)
The Epic is done when every feature that asks "has waist changed?" gets its answer from one function that knows the measurement's noise;
when no screen reports a change in a circumference smaller than that noise as a change; and when a user can follow one protocol and see
their measurements over time on a chart drawn in the same visual language as weight (MM-107).

## Notes
- Priority: MM-155 is a must-have before any of the features listed in the Context ship. MM-156 is a could-have. MM-157 is a future phase.
- Waist-to-height ratio is a well-supported screening measure for health risk (a ratio under 0.5 is the usual guidance, adopted by NICE
  in 2022). It was considered as a displayed metric and left out: it is a health-risk indicator, and showing it moves the app toward
  health claims (MM-96). Reconsider with MM-29.
