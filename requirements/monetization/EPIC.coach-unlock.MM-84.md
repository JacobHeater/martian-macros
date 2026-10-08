---
id: MM-84
status: proposed
component: monetization
related: [MM-85, MM-86, MM-87, MM-88, MM-22, MM-37, MM-59, MM-94]
---

# Epic: The Coach unlock

## Context
The product owner's starting point was a one-week trial followed by a required one-time purchase, and openness to other ideas. Planning
found a clash: the first week is calibration, with targets held, the first adaptive update around day 15 and the first report on day 28. A
seven-day trial would put the paywall at the moment the user has done the most work and seen the least payoff.

## Decisions (made with the product owner)
- **Logging is free forever; the coach is a one-time purchase, with a 21-day trial of the coach.** Accepted in place of the one-week trial.
- **Gate the coaching, never the user's own data.** Nobody is locked out of what they logged.
- **No subscription.** The app has no server costs, which is what makes a one-time price workable.

| | free forever | Coach (one-time) |
|---|---|---|
| food logging, barcode, label scan | yes | yes |
| training log and strength trend | yes | yes |
| trend weight, waist, health sync | yes | yes |
| encrypted backup | yes | yes |
| adaptive expenditure and weekly target changes | trial | yes |
| body-fat range, recomp signal, monthly reports | trial | yes |
| phase planning | trial | yes |

## Narrative
A new user gets everything for 21 days (MM-86), which covers the first adaptive update, so the paywall shows them their own measured
expenditure and trend. If they do not buy (MM-87), the app remains a complete free logger (MM-85) and they can buy later. How each store
supports a trial before a one-time purchase needs confirming (MM-88).

## Acceptance Criteria (narrative)
The Epic is done when a user can try the coach for three weeks, buy it once on either store, keep it across reinstalls and new phones on
the same store account, and, if they never buy, keep logging with all their data intact.

## Notes
- **Price**, discussed and not settled: a one-time $49.99 to $59.99 ("less than a year of a competitor"), perhaps $39.99 at launch. Check
  competitors' current prices before deciding.
- **The weakness of a one-time price** is that it does not fund years of maintenance and data updates. The usual answers are a tip jar or
  a paid major version every few years. Neither is being built; the marketing must simply not promise "lifetime updates".
