---
id: MM-73
status: proposed
component: health-sync
related: [MM-66, MM-68, MM-69, MM-17, MM-23]
---

# Story: Start with my existing history

## Context
A new user with a smart scale may have months of weigh-ins in their health store. With them, the trend is settled on day one, and the
expenditure estimate needs only the food log to catch up.

## Decisions (made with the product owner)
- **Request Android's history permission.** By default Health Connect lets an app read only the thirty days before permission was granted;
  reading further back needs a separate permission.

Choices I made without asking (say if any is wrong):
- **Up to a year is imported**, in the background, with the trend filling in as it arrives.
- **Calibration still lasts fourteen days** (MM-24): history gives a trend, but the estimate also needs food logged in this app.
- **If the history permission is refused, the app uses the thirty days it is allowed** and says nothing more about it.

## Description
On first connection the app imports past weigh-ins (and body fat, lean mass and menstruation) as far back as allowed.

## Acceptance Criteria
```gherkin
Scenario: Six months of scale data
  Given a user with six months of weigh-ins in their health store and history permission granted
  When they connect during onboarding
  Then the trend chart shows those six months

Scenario: History refused
  Given the history permission is refused
  Then the last thirty days are imported

Scenario: Onboarding weight
  Given an imported weigh-in for today
  Then onboarding offers it as the current weight instead of asking the user to type one
```
