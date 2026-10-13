---
id: MM-252
component: sleep
status: proposed
related: [MM-249, MM-250, MM-116, MM-117, MM-138, MM-140, MM-141, MM-143, MM-128]
---

# Story: the coach reads sleep

## What is built

- **The check-in pre-fill** MM-116 promised: the fourteen-day average fills
  "typical hours of sleep", editable.
- **A signal of its own in the relief rule** (MM-117): an average under six
  hours over fourteen nights is a recovery signal beside hunger, energy and
  sleep quality, not a line appended to their trigger. The threshold and
  the window get rows in the evidence register (MM-143), sourced to
  Nedeltcheva 2010 and Tasali 2022 (MM-249).
- **Named in explanations**: the check-in explanation (MM-138) and the stall
  diagnosis (MM-140) say when sleep averaged short over the window, as a
  cause the person can act on, before anything about food accuracy.
- **An offer, not a change**: when the average is under six hours, the Coach
  says what the evidence says in one sentence ("With short sleep, more of
  what you lose appears to be lean tissue and hunger runs higher") and
  offers the gentler pace (MM-128) with one press. Nothing changes until the
  person chooses. Whether short sleep should ever change the target on its
  own is the owner's decision after the panel pass (MM-249).
- **A sleep line on the Coach screen**: the fourteen-day average in hours
  and minutes, and the number of nights recorded; no score, no colour.
- **An insight** in the catalog (MM-141), rationed like the others: "Your
  sleep averaged 5 h 40 m this fortnight" with the sentence above, shown at
  most once a fortnight.

## Acceptance criteria

```gherkin
Scenario: Pre-filled
  Given fourteen nights recorded averaging 6 h 50 m
  When the recovery check-in opens
  Then typical hours shows 6 h 50 m and can be changed

Scenario: A signal of its own
  Given hunger and energy are fine and sleep averages 5 h 30 m over fourteen nights
  Then the relief rule reports short sleep as a signal
  And the offer shows the sentence and the gentler pace

Scenario: Named
  Given a target reduction in a window where sleep averaged under six hours
  Then the explanation names short sleep before any line about logging

Scenario: Never silent
  Then no target changes because of sleep without the person choosing

Scenario: No score
  Then the Coach screen shows hours and nights only; the voice test finds no sleep score, grade or percentage

Scenario: Registered
  Then the six-hour threshold and the fourteen-night window have evidence rows with sources
```
