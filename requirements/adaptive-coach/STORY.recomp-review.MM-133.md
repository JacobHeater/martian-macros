---
id: MM-133
status: proposed
component: adaptive-coach
related: [MM-12, MM-21, MM-22, MM-25, MM-26, MM-32, MM-36, MM-77, MM-132, MM-134, MM-140, MM-155]
---

# Story: Review a recomp honestly at eight and twelve weeks

## Context
Recomp is the product's hook and its hardest goal to coach. By design the scale barely moves, so the usual feedback is absent. MM-32 gives
the good news when it exists (weight flat, waist down, strength up). Nothing gives the other news: that after three months none of the
three has moved, and the user is running a small deficit for no result.

Evidence:
- **Moderate**: simultaneous fat loss and muscle gain is well documented in novices, returning lifters, people with more body fat, and
  those who had been training or eating poorly (Barakat 2020 review). In lean, well-trained people it is slow and often not detectable.
- **Strong, as a matter of measurement**: over twelve weeks an intermediate lifter might add 0.5 to 1.5 kg of muscle. A tape, a scale and
  a strength log cannot separate that from noise for a single person. The app can see *direction* over months and should not claim more.

## Decisions
Choices I made without asking (say if any is wrong):
- **Two reviews, at 8 and 12 weeks on recomp**, then every 8 weeks. Each reads three signals over the period, each judged against its own
  measurement noise:
  - **waist**: down by more than the noise threshold (MM-155), up by more than it, or no clear change;
  - **strength**: e1RM trend up on at least two lifts, down on at least two, or mixed (MM-77);
  - **trend weight**: change over the period.
- **The verdict is one of four, with the evidence listed**:

| what was seen | verdict | what the coach says |
|---|---|---|
| waist down, strength up or held | working | carry on; this is what recomp looks like (MM-32) |
| weight down more than 2%, strength held | a slow cut | you are losing weight, which is fine; call it what it is, and consider fat loss at Gentle pace (MM-128) |
| no clear change in waist, strength up | probably working, slowly | strength is the earliest signal; keep going and measure waist weekly |
| no clear change in waist, no rise in strength | not working | recommend a cut or a gain according to body fat (MM-12), or fixing training first (MM-134) |

- **A verdict needs data**: at least four waist measurements across the period and at least two lifts trained in six of the weeks.
  Without them the review says exactly what is missing and gives no verdict.
- **At eight weeks "not working" is worded as "too early to tell"** unless the user is lean and trained, where the odds were poor from the
  start (MM-12) and saying so early is the kinder thing.
- **Nothing changes automatically.** The review recommends; the user decides.
- **The review is honest about its limits**: "A tape and a scale cannot measure a pound of muscle. This is the direction of travel, not a
  measurement of it."

Where the experts disagreed:
- The recomposition expert wanted a fat-and-lean-mass estimate at each review ("you lost 1.8 kg of fat and gained 0.9 kg of muscle"). The
  researcher and the engineer: with the uncertainty documented in MM-26 (100 to 200 kcal a day of ambiguity) and MM-132, any such split
  is invention. Direction only, until MM-34 and MM-35 can put an honest range on it.
- The product strategist worried that "not working" loses the user. The behavior-change expert: three more months of nothing loses them
  later and angrier. Kept, with a concrete next step attached.

## Description
An engine function from the period's waist, strength and weight series to a verdict with reasons, or to a list of missing data; a review
card on the Coach screen and in the monthly report (MM-33).

## Acceptance Criteria
```gherkin
Scenario: Working
  Given twelve weeks on recomp with trend weight down 0.5%, waist down 3 cm over eight measurements, and two lifts up 6%
  Then the verdict is working, and the three facts are shown

Scenario: A slow cut
  Given trend weight down 3%, waist down 3 cm and strength held
  Then the verdict is a slow cut and fat loss at Gentle pace is suggested

Scenario: Not working
  Given twelve weeks with waist within 1 cm, no lift higher, and weight flat
  Then the verdict is not working, with a recommended next goal and its reason

Scenario: Too early
  Given the same at eight weeks for a novice
  Then the review says it is too early to tell

Scenario: Missing data
  Given twelve weeks with two waist measurements
  Then no verdict is given and the review asks for weekly waist measurements

Scenario: No automatic change
  Given any verdict
  Then the goal and targets are unchanged until the user chooses
```

## Notes
- Priority: should-have; needed by about week eight after launch for the users the product is aimed at.
- Until the training log exists (MM-75) the strength signal is absent and the table reduces to waist and weight. The review must say that
  strength is the missing piece.
- Shares its definition of "no clear change" with the stall diagnosis (MM-140), which covers fat loss.
