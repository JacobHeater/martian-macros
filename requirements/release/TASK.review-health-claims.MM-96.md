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

**Note (2026-10-12, MM-242).** From the MM-242 panel run (`docs/agent-runs/mm242-eula/`): Settings, About now says "Not medical advice" in a line of its own, which is this ticket's Settings clause; the terms of use alone are not "where a user would look". The safety reviewer flagged wording the terms would sit against, to be judged here: "will not prescribe a deficit" (`format/cautionMessage.ts`, `format/modeReasonExplanation.ts`); "safe" as an assurance (`app/HealthRecheckScreen.tsx`, `onboarding/SexStep.tsx`, `coach/MetabolismSummary.tsx`) and "healthy range" (`format/cautionMessage.ts`); "keep your treatment stable where you can" for thyroid conditions; and the welcome screen's "not a formula" beside a formula-based starting estimate. The claims list should include the terms' own statements. Google Play's health policy also requires the "not a medical device" sentence in the store description.
