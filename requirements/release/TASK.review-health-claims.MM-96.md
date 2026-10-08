---
id: MM-96
status: proposed
component: release
related: [MM-94, MM-15, MM-23, MM-29, MM-34]
---

# Task: Check every claim the app and its listing make

## Context
The original pitch included "ditch the bathroom scale for body fat percentage". Planning dropped it because the product depends on a
bathroom scale and because consumer body-fat readings are not accurate enough to promise anything on. The suggested replacement was "Your
scale is noisy. Your trend isn't."

Health apps are held to what they claim, by the stores (which reject medical claims from apps that are not medical devices) and by
consumer-protection law.

## Description
Review the store listing, screenshots, onboarding copy, and every explanatory sentence in the app, and for each claim record whether it is
true, whether the app can back it up, and whether it reads as medical advice. In particular:
- the app is not medical advice and does not diagnose or treat anything, and says so where a user would look;
- the expenditure estimate is described with its uncertainty, never as exact;
- body fat is described as an estimate and a range;
- nothing promises a rate of fat loss or muscle gain;
- "recomp" is described as realistic for some people, with who;
- no before-and-after imagery implying typical results.

## Acceptance Criteria
```gherkin
Scenario: A claims list
  Then this ticket lists every claim in the listing and the app, each marked supported or changed

Scenario: The disclaimer is findable
  Then "not medical advice" appears in onboarding, in Settings and in the store listing

Scenario: No precise promises
  Then no text states an expected amount of weight, fat or muscle change over a period
```

## Notes
- Best done by, or with, the professional doing MM-29.
