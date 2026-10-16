---
id: MM-343
status: done
component: weight-trend
related: [MM-321, MM-136]
---

# Bug: Progress asked for a weigh-in while the trend was still being worked out

## Context
Found drawing the Progress screen's undrawn states for MM-321 (story "Progress Weight Events Loading"). The
trend is worked out once the weight events are read; until then there was no trend, and the card said "Log a
weigh-in to start your trend." under today's weigh-in.

## Description
Weighed, with the trend not worked out yet, the card shows the design system's spinner, as the strength
trends below it do while they load; "Log a weigh-in" is said only with no weigh-in.

## Acceptance Criteria
```gherkin
Scenario: Weighed, the trend still being worked out
  Given weigh-ins stored and the weight events still being read
  Then the weight trend card shows that it is loading and does not ask for a weigh-in
```

## Notes
Guarded by `apps/mobile/test/progress/trendWhileLoading.test.tsx`, which failed before the fix.
