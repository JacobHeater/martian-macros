---
id: MM-385
status: done
component: food-database
related: [MM-384, MM-56, MM-346]
---

# Bug: A finished download's notice outlived the pack it announced

## Context
After a pack downloaded, its card said "Barcode foods, United States is on your phone." Removing the pack (Settings, Food
database, Remove) emptied the "On this phone" list but left that notice standing, so the screen said "Nothing downloaded yet"
above "… is on your phone." A paused download of a pack that was then removed likewise kept offering to resume a partial file
the store had deleted. Found by the panel's React role by inspection (`docs/agent-runs/mm383-sources-and-downloads/`, F6), with
two packs downloading together (MM-384) able to leave two stale notices.

## Description
Removing a pack forgets its finished, paused or failed download, so nothing about it is left on the screen.

## Acceptance Criteria
```gherkin
Scenario: Removed
  Given a pack that downloaded and installed
  When it is removed and the removal confirmed
  Then its "is on your phone" notice is gone with it

Scenario: A running download is not forgotten
  Given a pack whose download is running
  Then forgetting it does nothing
```

## Notes
Guarded by `apps/mobile/test/settings/foodDatabase.test.tsx` ("MM-385: removing a pack takes its finished notice with it"),
which failed before the fix. Fixed in `PackDownloadsController.forget(id)` and the screen's Remove.
