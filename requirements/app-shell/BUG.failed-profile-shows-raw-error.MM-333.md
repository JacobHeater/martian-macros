---
id: MM-333
status: proposed
component: app-shell
related: [MM-321, MM-108]
---

# Bug: a profile that cannot be read shows the raw storage error, bare on the canvas

## Context
Found drawing the states no story drew, for MM-321 (story "Profile Failed"). When the profile cannot be read, the app shows "Could not open your data." and, under it, the error's own text as plain lines halfway down an empty screen.

## Description
The app says in its own words that the data could not be opened and what to do, on a surface like its other notices, with no technical text.

## Acceptance Criteria
```gherkin
Scenario: The profile cannot be read
  When the app opens and the profile cannot be read
  Then it says the data could not be opened and what to do, in a notice
  And no error text from storage is shown
```

## Notes
Guarded by "MM-333" in `apps/mobile/test/gallery/registerDefects.test.tsx`, skipped with this ID until the fix lands. A design fix: drawn in Storybook, reviewed by the panel's designer and UX guard, then built (AGENTS.md).
