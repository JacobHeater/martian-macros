---
id: MM-249
component: sleep
status: proposed
related: [MM-66, MM-68, MM-110, MM-112, MM-116, MM-117, MM-138, MM-141, MM-143, MM-29]
---

# Epic: Sleep is a first-class signal

## The decision

The owner's call (2026-10-13): sleep is a first-class citizen of fat loss in
this app, tracked nightly from a wearable or health platform or typed by
hand, and used by the coach. Sleep disorders, sleep apnea first among them,
are asked about and acted on. This overrules the earlier placement of sleep
as one weekly question (MM-116) and "a line, not a trigger" (MM-117).

## Why the earlier grading was wrong

MM-116 graded the effect of short sleep on fat loss as "emerging" on one
trial. The trial it cited is the one that matters, and it was not alone:

| Finding | Source | Read |
| --- | --- | --- |
| Fourteen days of caloric restriction with 5.5 instead of 8.5 hours of sleep opportunity cut the share of weight lost as fat by 55% (0.6 against 1.4 kg), raised the loss of fat-free mass by 60% (2.4 against 1.5 kg), increased hunger, and shifted substrate use "toward oxidation of less fat". Randomized crossover, ten adults. | Nedeltcheva, Kilkus, Imperial, Schoeller, Penev. *Annals of Internal Medicine* 2010;153(7):435–441. | 2026-10-13, abstract via Europe PMC |
| Extending sleep by 1.2 hours a night in adults who slept under 6.5 hours cut energy intake by about 270 kcal a day, measured by doubly labelled water, with no diet or exercise prescribed. Randomized, eighty adults, BMI 25 to 29.9. | Tasali, Wroblewski, Kahn, Kilkus, Schoeller. *JAMA Internal Medicine* 2022. | 2026-10-13 |
| Obstructive sleep apnea carries abnormally high leptin and ghrelin, which "may encourage excess" intake; resting metabolic rate appears elevated; people with OSA and visceral obesity "had a smaller decrease in BMI and fat mass in response to a lifestyle intervention"; a meta-analysis of randomized trials finds CPAP treatment promotes weight gain. Measures of actual intake are lacking. | Shechter. *Sleep Medicine Reviews* 2016;34:59–69, systematic review. | 2026-10-13 |
| Intermittent hypoxia drives visceral adipose tissue toward an inflammatory state with impaired insulin signalling (mostly animal work). | Review, *The Journal of Physiology* 2017 (PMC5390885). | 2026-10-13 |

What the evidence does not yet show, and the app must not claim: that OSA
by itself slows fat oxidation in humans (the mechanism is plausible, the
human substrate data were not found today), or that treating a sleep
disorder makes a deficit work better (CPAP's own effect on weight is, if
anything, the other way). Those are the clinician's and the panel's to
grade properly; see "The panel".

## What first class means here

1. **A nightly record** (MM-250): hours asleep per night, from Health
   Connect and HealthKit sleep sessions when connected, or typed by hand;
   one row per night, kept with the person's other records, never sent.
2. **Sleep disorders in the health check** (MM-251): a diagnosed sleep
   disorder (sleep apnea, insomnia, a circadian or shift-work disorder) is
   asked at setup and at the re-check (MM-112), with a refer-only response
   today: the caution, the clinician pointer, and nothing in the numbers
   until MM-29's reviewer and the panel say what, if anything, should
   change.
3. **The coach uses it** (MM-252): the fourteen-day average replaces the
   typed "typical hours" of the recovery check-in; short sleep becomes a
   signal the relief rule reads directly (not a line added to someone
   else's trigger); the check-in explanation and the stall diagnosis say
   when sleep was short; and when the average sits under six hours the
   coach says what the evidence says and offers the gentler pace. Whether
   it ever changes a target on its own is the owner's decision after the
   panel pass, not something built here.

## What it is not

- No sleep score, stages, or "sleep quality" number from a device. Hours,
  and the person's own 1-to-5 word, as today.
- No diagnosis. The app asks whether a clinician has diagnosed a disorder;
  it runs no screening questionnaire for apnea.
- No claim that sleep "resets", "boosts" or "fixes" anything. The wording
  rule (MM-108) and the claims review (MM-96) apply.

## The panel

Run the panel on this epic before MM-252 is built, in grading mode: the
sources above are the starting list, the brief asks for anything that
contradicts or strengthens them, and the chair records where the earlier
"emerging" grade came from and what the gate should have required. Safety
and the clinician reviewer (MM-29) grade the sleep-disorder handling. The
panel advises on evidence and wording; whether sleep is first class is
decided.

## Acceptance criteria

```gherkin
Scenario: The signal exists end to end
  Given a connected health platform with sleep sessions, or nights typed by hand
  Then every night since connection has one record with its source
  And the Coach screen shows the fourteen-day average without a score

Scenario: A disorder is asked about
  Given the health check
  Then a diagnosed sleep disorder can be given, at setup and at the re-check
  And the response is a caution and a clinician pointer, not a changed number

Scenario: The coach reads it
  Given an average under six hours over fourteen days
  Then the relief rule treats short sleep as a signal of its own
  And the explanation of the next target change names it

Scenario: The evidence is registered
  Then every threshold has a row in docs/evidence.md with its source
```
