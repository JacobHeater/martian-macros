---
id: MM-407
status: done
component: settings
related: [MM-398, MM-403, MM-69, MM-320]
---

# Bug: The health section stopped folding when it became platform-aware

## Context
MM-398 made every section of Settings a header that opens and closes in
place, all closed when Settings opens; the Health Connect section folded
with the rest (`useSettingsSection('healthConnect')`). While giving the
section its Apple Health variant (MM-403, MM-69) the component was
rewritten from a copy read before MM-398 landed, and the fold was lost on
both platforms. The expert panel's product designer found it in the working
tree (docs/agent-runs/mm403-ios-shell, PD-1; the UX guard's F4) before it
was merged. The accordion test did not list the section, so it could not
have caught it.

## Description
The Apple Health / Health Connect section of Settings folds like its
siblings: closed when Settings opens, opened in place, and opened by the
way in that asks for it (`SettingsScreen open="healthConnect"`).

## Acceptance Criteria
```gherkin
Scenario: Settings opens closed, the health section too
  Given a phone with a health platform
  When Settings opens
  Then the health section's header shows, closed, and none of its rows

Scenario: Opened by the way in
  When Settings is opened at the health section
  Then its rows show and every other section is closed
```

## Regression test
`apps/mobile/test/settings/settingsAccordion.test.tsx` lists "Health Connect"
among the sections that open closed, and `test/settings/appleHealth.test.tsx`
checks the same of "Apple Health" on an iPhone. Both failed on the working
tree before the fix and pass with it.
