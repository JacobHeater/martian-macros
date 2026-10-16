---
id: MM-346
status: done
component: food-database
related: [MM-56, MM-321]
---

# Bug: an installed, up-to-date pack is offered for download again

## Context
Found drawing the food database's undrawn states for MM-321 (story "Food Database Installed"). Once the
pack is installed, the screen lists it under "On this phone", says "Barcode foods, United States is on your
phone." and then draws the whole available card again below: its size to download, what downloading
contacts and costs, and a disabled "Up to date" button.

## Description
A pack that is installed and up to date is said once; the download card appears for a pack that is not on
the phone or has a newer version.

## Acceptance Criteria
```gherkin
Scenario: Installed and up to date
  Given the pack is installed and the host offers the same version
  Then it is listed on this phone, and no download card or "Up to date" button is drawn for it
```

## Notes
Guarded by the three "MM-346" tests in `apps/mobile/test/settings/foodDatabase.test.tsx`, which failed before the fix. Drawn in Storybook and reviewed by the panel's product designer and UX guard (2026-10-16), with MM-337, MM-338, MM-346 and MM-347 as one batch; their changes were built. A pack at the listed version is not offered; with nothing to offer, the Download group says "Nothing new to download" (stories "Food Database Up To Date", "Food Database Update"). A listed version that differs from the installed one is offered as an update; versions are "a build date or version" (`PackListing`), so no order is assumed between them. The rows' icons are MM-352.
