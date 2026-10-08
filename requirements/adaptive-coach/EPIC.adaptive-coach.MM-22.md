---
id: MM-22
status: in-progress
component: adaptive-coach
related: [MM-23, MM-24, MM-25, MM-26, MM-27, MM-28, MM-29, MM-30, MM-31, MM-32, MM-33, MM-34, MM-35, MM-36, MM-15, MM-37, MM-84]
---

# Epic: The adaptive coach

## Context
Calorie calculators give everyone of the same height, weight, age and sex the same number, and individual energy expenditure varies around
that number by several hundred calories. The product's core claim is that it measures the user's own expenditure from what they eat and how
their weight moves, and sets targets from that.

## Narrative
The coach is a loop:

1. **Start** from a formula estimate, deliberately conservative, with wide uncertainty.
2. **Calibrate** for two weeks: the user logs food and weighs in, and targets do not move.
3. **Measure** expenditure from logged intake and the weight trend (MM-23), valuing weight change by a model of how much is fat and how much
   lean (MM-26), and leaving out days that were only partly logged (MM-27).
4. **Adjust** targets once a week, by a small step (MM-24), toward the pace the chosen goal calls for (MM-25).
5. **Stay inside hard limits** whatever the data says (MM-28), and take a break after sixteen weeks of deficit (MM-31).

Everything is a pure function of stored history, so it can be recomputed and tested against simulated people whose true physiology is known
(MM-30).

Not yet built: the recomp signal that rewards a flat scale (MM-32), monthly reports (MM-33), a body-fat estimate from measurements (MM-34)
and the joint model that would produce it (MM-35), and planning phases ahead (MM-36). The limits themselves need professional review
before anyone outside the project uses them (MM-29).

## Acceptance Criteria (narrative)
The Epic is done when a user who logs honestly-but-imperfectly for a month sees an expenditure estimate with an honest uncertainty, gets
weekly target changes they can follow, loses or gains at about the intended pace, is never given a target below the safety floor, and can
see on the Coach screen what the app believes and why.
