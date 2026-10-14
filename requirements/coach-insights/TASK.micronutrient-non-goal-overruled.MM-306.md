---
id: MM-306
status: in-progress
component: coach-insights
related: [MM-144, MM-49, MM-126, MM-305]
---

# Task: The micronutrient non-goal, overruled by the owner

## Context
MM-144 listed "No micronutrient targets for now: the data is too patchy to be right (MM-49). Reopen if the
food sources' coverage is measured and found adequate." `AGENTS.md` says a change that proposes a non-goal
needs its reopen condition met.

On 2026-10-14 the product owner asked for micronutrient tracking (MM-305). Asked whether to measure
coverage first or overrule the non-goal, the owner chose to overrule it now.

## Decisions
- **Overruled by the product owner, 2026-10-14**, without the coverage measurement. The concern behind the
  non-goal is carried into the design instead: every total says how much of the day it covers, a missing
  value is never counted as zero (MM-310), and the reference amounts are markers, not goals the app pushes.
- Supplements stay a non-goal (MM-144): nothing in MM-305 recommends one.

## Description
MM-144 and `docs/non-goals.md` say the item was overruled, by whom, when and why, and point to MM-305. The
item is not deleted, so the reasoning stays on record.

## Acceptance Criteria
```gherkin
Scenario: The non-goal says it was overruled
  When docs/non-goals.md is read
  Then the micronutrient item says it was overruled by the product owner on 2026-10-14 and names MM-305 and MM-306

Scenario: The ticket agrees
  When MM-144 is read
  Then its micronutrient line says the same
```

## Notes
- The coverage the sources actually have is still unmeasured. The first real pack built with MM-307's
  columns will report it (the build report counts foods carrying each nutrient).
