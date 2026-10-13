---
id: MM-227
status: done
component: food-logging
related: [MM-211, MM-220, MM-224]
---

# Bug: Add food reference incorrectly centers Back to search

## Context

The owner reported that the phone shows Back to search at the bottom left.
The Flutter amount step uses a content-width text button; the Current HTML
reference incorrectly sets its block/full-width option in three amount frames.
This is a reference defect, not evidence that the phone is on an older build.

## Description

Draw the amount step's Back to search as a content-width, left-aligned text
button. Preserve the full-width primary Log it action and app behavior.

## Acceptance Criteria

```gherkin
Scenario: Amount-step reference matches the built navigation action
  Given the regular, hand-portion, or cooked-food amount frame
  Then Back to search is a content-width text button aligned at the left
  And Log it remains full width
```

## Notes

Browser regression checks all three frames for exactly one Back to search text
button without the block class, and a full-width Log it. Before the fix, the
regular-frame assertion failed with "MM-227: Back to search is incorrectly
full-width". This checks reference parity, not device usability.

After the correction, all three frame assertions passed in the shared browser.
The Flutter app was not changed; this makes the reference match the source.
