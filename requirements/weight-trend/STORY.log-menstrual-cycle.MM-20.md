---
id: MM-20
status: done
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

## Progress (2026-10-19, feat/m2)
Built, closing the ticket:
- **Marking**: Progress has a "Period days" section for a female profile (not after menopause): the last two weeks as chips, each
  marked or unmarked in one tap. Male profiles never see it. Stored in `menstruation_days` (schema 11), one row per day, through
  `MenstruationRepository` (SQL and in memory, under one contract); erased and backed up with the rest.
- **The trend expects the water**: the coach's analysis reads the marked days (`analyze({ flowDays })`), which MM-19's
  `cycleNoiseMultiplier` turns into wider reading noise from five days before each start through two after (`CycleRule`,
  `cycleWindows`). A 1.2 kg spike three days before a marked period moves the trend less than the same spike mid-cycle (tested).
- **The chart marks the window**: a quiet shade over those days on the trend chart, and the "How to read this" note says why the
  band is wider there.
- **The stall** (MM-140) is judged over 21 days rather than 28 once period days are marked.
- Tests: `cycleWindows.test.ts`, `periodDays.test.tsx`, the repository contract. Story: `PeriodDays` (Progress).

Not built: days imported from a health platform (MM-68 does not read cycle data yet; marked days are the only source), and the
open question of predicting the next window from past cycle length, left as the ticket suggests.
