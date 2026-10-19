---
id: MM-398
status: done
component: settings
related: [MM-253, MM-320, MM-396]
---

# Story: Settings as an accordion, every section closed

## Context
The owner (2026-10-18): "Please adjust the settings page to use an accordion instead of just a flat page
with hierarchy of sub titles. I want settings menu to be accordion with sections collapsed by default."
Settings was one long page of ten sections, each a heading over its rows.

## Description
Each section of Settings is a header that opens and closes its rows in place, all closed when Settings
opens. The headers keep their icons and names, in today's order ("You" is the profile), 4 px apart, so the
whole menu fits on one screen closed (MM-402). Opening one does not close another. A way into Settings
about one row opens its section: correcting the date of birth from the adults-only screen opens "You"
(the UX role's UX-2). Search with no food database names the section ("in Settings, under Data"). Closed
headers carry no summary (the designer's PD-6: they are categories; the UX role asked for state in them,
declined for now). Erase is closed like the rest; its confirmation is unchanged.

## Acceptance Criteria
```gherkin
Scenario: Settings opens closed
  When Settings is opened
  Then every section's header shows, closed, and none of their rows

Scenario: Opening a section
  When a section's header is pressed
  Then its rows show under it, and it is announced as expanded
  And pressing it again closes it

Scenario: Two open at once
  When two sections are opened
  Then both stay open

Scenario: Correcting the date of birth
  Given the adults-only screen
  When "Correct date of birth" is pressed
  Then Settings opens with "You" open and the rest closed
```

## Notes
Tests: `test/settings/settingsAccordion.test.tsx`; `test/support/openSettings.ts` opens every section unless
asked to keep them closed. The folding heading itself was fixed under MM-399.
