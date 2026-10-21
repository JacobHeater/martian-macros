---
id: MM-471
status: done
component: food-database
related: [MM-56, MM-384, MM-387]
---

# Bug: Cancelling a pack download on the phone never settles it

## Context
`NativePackHttp`'s `abort` marks the response closed, so the chunks the plugin sends after it are dropped, including the
error the plugin sends when its connection is cut. A reader waiting on the next chunk was never woken: `PackDownload.done`
never settled after Cancel, and the card would have stayed "downloading" until the app restarted. Found by inspection while
building MM-387, not reproduced on a phone. Since MM-387 pack files no longer go through `NativePackHttp`'s body, but the
same shape was in its new twin, `NativePackFetch`.

## Description
Aborting a native transfer wakes whoever waits on it, which then ends with an error; `PackDownload` reads that as cancelled.

## Acceptance Criteria
```gherkin
Scenario: Cancel ends the wait
  Given a native transfer whose reader waits for more
  When it is aborted
  Then the reader is woken and ends
  And the plugin is told which transfer to stop
```

## Notes
- Built 2026-10-21 in `NativePackHttp` and `NativePackFetch` (`src/foodCatalog/download/native/`).
- Guarding tests: `test/foodCatalog/nativePackHttp.test.ts`, "MM-471: abort wakes a reader waiting on the next chunk";
  `test/foodCatalog/nativePackFetch.test.ts`, "MM-471: abort wakes a reader waiting on the next count, and tells the plugin
  which transfer to stop".
- Not run locally; CI validates. A cancel on the phone is on MM-387's device check.
