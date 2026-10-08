---
id: MM-20
status: proposed
component: weight-trend
related: [MM-15, MM-19, MM-68]
---

# Story: Record period days, so the trend expects the water

## Context
See MM-19. The engine can use cycle data but has none.

## Description
- A female profile can mark days with menstrual flow, from the Progress screen.
- Days imported from a health platform (MM-68) appear the same way and can be corrected.
- Flow days are stored and passed to the trend filter.
- The trend chart marks the widened window, so the user can see why the band is wider there.
- Male profiles never see any of this.

## Acceptance Criteria
```gherkin
Scenario: Marking a period
  Given a female profile
  When five consecutive days are marked as flow days
  Then the trend's band is wider from five days before the first through two days after it

Scenario: Not offered to male profiles
  Given a male profile
  Then there is no control for period days

Scenario: A premenstrual spike
  Given a marked period and a 1.2 kg jump in readings three days before it
  Then the trend rises less than it would for the same jump mid-cycle
```

## Notes
- Open question: whether to predict the next window from past cycle length, so the band widens before the user marks anything. Useful, but
  irregular cycles make a wrong prediction worse than none. Start with marked days only.
- Hormonal contraception and menopause change or remove the pattern; with no marked days nothing is widened, which is the right default.
