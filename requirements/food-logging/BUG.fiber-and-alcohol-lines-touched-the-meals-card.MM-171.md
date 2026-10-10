---
id: MM-171
status: done
component: food-logging
related: [MM-126, MM-127, MM-41, MM-104]
---

# Bug: The fiber and alcohol lines sat against the meals card

## Context
The "Fiber: …" line (MM-126) and the "Alcohol: … kcal" line (MM-127) on the Food screen had space above them and none below, so each sat
directly on top of the meals card with no gap. Seen on the Android emulator at Full detail.

It was fixed in a pull request of its own, with no ticket and no test.

## Decisions
- **Both lines have the same space below as above** (8 logical pixels each side).

## Description
The two lines' padding changed from top-only to symmetric vertical.

## Acceptance Criteria
```gherkin
Scenario: Room under the lines
  Given a day that shows the fiber line or the alcohol line
  Then each line has at least 8 logical pixels of space beneath it
```

## Notes
- Regression tests: `apps/mobile/test/detail_level_test.dart` ("Full shows fiber against the guide") and
  `apps/mobile/test/alcohol_test.dart` ("a logged drink shows its own line") assert the space beneath each line. They check the padding
  the widgets declare, not a rendered image; the Food screen's golden images do not show either line.
