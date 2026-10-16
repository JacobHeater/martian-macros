---
id: MM-346
status: proposed
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
Guarded by "MM-346" in `apps/mobile/test/settings/foodDatabase.test.tsx`, skipped with this ID until the
fix lands; the fix also changes "a downloaded pack is listed, searched, and can be removed", which asserts
the disabled button today. A design fix: drawn in Storybook, reviewed by the panel, then built.
