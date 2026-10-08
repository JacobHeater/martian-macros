---
id: MM-86
status: proposed
component: monetization
related: [MM-84, MM-85, MM-87, MM-88, MM-24, MM-33]
---

# Story: Try the Coach for 21 days

## Context
See MM-84.

## Decisions (made with the product owner)
- **The trial is 21 days**, chosen so the user sees the first adaptive update before being asked to pay.

Choices I made without asking (say if any is wrong):
- **The trial starts when onboarding finishes**, with no payment details and nothing to cancel.
- **The app says how long is left**, quietly, on the Coach screen; and once, three days before the end.
- **When the trial ends, the paywall shows what the coach measured**: their expenditure estimate with its uncertainty, how it differs from
  the formula estimate, and what changed in their targets. That is the pitch.
- **A user who logged too little for a measurement in 21 days is told so**, and the trial is extended once by seven days if they have at
  least started logging. A trial that ends before the product could work sells nothing.
- **On iOS the trial is a store transaction** (MM-88), so it survives a reinstall. **On Android the trial clock is kept on the device**,
  and reinstalling resets it. That leak is accepted: without a server, determined people can avoid paying either way, and the effort is
  better spent elsewhere.

## Description
Trial state, its display, the end-of-trial screen, and the switch to free behavior (MM-85).

## Acceptance Criteria
```gherkin
Scenario: During the trial
  Given day 10 of the trial
  Then every Coach feature works and the Coach screen says 11 days remain

Scenario: The trial ends
  Given day 22 without a purchase
  Then the paywall shows the user's measured expenditure and target changes
  And the app continues as the free logger

Scenario: Too little data
  Given a user who logged four days in three weeks
  Then the trial is extended once by seven days and the app says what it needs

Scenario: Reinstall on iOS
  Given a trial started twelve days ago on an iPhone
  When the app is deleted and reinstalled
  Then nine days remain
```
