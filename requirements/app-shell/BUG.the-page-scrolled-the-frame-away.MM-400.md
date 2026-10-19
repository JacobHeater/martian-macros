---
id: MM-400
status: done
component: app-shell
related: [MM-90, MM-99]
---

# Bug: the whole frame scrolled, the navigation bar halfway up the screen

## Context
The owner, on a phone (2026-10-18), at the end of the Dashboard: the app bar had gone under the status
bar, the navigation bar sat halfway up the screen with empty canvas below. Measured in the Dashboard's
history story at 412 × 915: the page was 2,500 px tall. Visually hidden words deep in the Dashboard
("Opens Food", "Opens Progress") are positioned absolutely, and with no positioned ancestor inside the
scrolling body they were placed against the screen's layer, lengthening the page; the page then
scrolled, frame and all.

## Description
A screen's body holds what is positioned inside it, and the page itself never scrolls: only a screen's
body does, inside a frame that stays put.

## Acceptance Criteria
```gherkin
Scenario: The end of a long screen
  When the Dashboard is scrolled to its end
  Then the page is the height of the screen
  And the app bar and the navigation bar stay where they are
```

## Notes
`apps/mobile/test/app/pageNeverScrolls.test.ts` holds the two rules (`.app-body` positioned;
`html, body` not scrolling). Measured after the fix in the same story: the page is 915 px. On the phone
checklist: scroll every tab to its end.
