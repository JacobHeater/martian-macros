---
id: MM-333
status: done
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
Guarded by "MM-333" in `apps/mobile/test/gallery/registerDefects.test.tsx`, which failed before the fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16) with MM-334 and MM-340. Their changes were built: one pattern for a failed read, `ReadFailedNotice`, as screen-direction's Error state (a neutral notice headed with what failed, "Nothing you logged has been changed.", Try again, announced as an alert); the theme and terms failures moved onto it; pauses are named by what they decide ("Could not check whether today is paused"). Waiting is `ScreenLoading`, the app's spinner. The database failing to open, before any theme (`main.tsx`), says the same in plain text, with the error to the console.
