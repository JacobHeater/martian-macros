---
id: MM-233
status: done
component: architecture
related: [MM-232, MM-83]
---

# Bug: Derived state could be worked out from one new value and one old

In the React app's state (MM-232), a value worked out from several others
could be worked out from one input that had changed and another that had
not been brought up to date yet. A cell that changes tells its watchers one
after another; a watcher told early read a second cell that depended on the
same change and had not been told, and got its old value.

What it did: when the health check in Settings was changed to "Pregnant"
on a fat loss goal, the check-in worked out new targets from the new setup
and the coach's view of the old one. It issued fat loss targets for the new
profile, where the rule (MM-83) is maintenance at once, and did not move the
goal to maintenance. The Flutter app does not have this fault; its providers
are brought up to date before they are read.

The fix: a derived cell records the version of each cell it read, checks
them whenever it is read, and works itself out again first if any has
changed. It is worked out once for one change, however many of its inputs
that change reached.

## Acceptance Criteria
```gherkin
Scenario: A health answer that rules a goal out
  Given a female profile on a fat loss goal with targets issued
  When "Pregnant" is ticked in the health check in Settings
  Then the goal becomes maintenance at once
  And the targets issued today are maintenance, flagged as a goal that is not allowed

Scenario: Two values that depend on the same change
  Given a value worked out from a cell, and from another value worked out from that cell
  When the cell changes
  Then the value is never worked out from the new cell and the old other value
  And it is worked out once
```

## Regression
`apps/web/test/state/cells.test.ts`: the three cases under "MM-233" fail
before the fix and pass afterward. `apps/web/test/settings/profileCorrection.test.tsx`:
"becoming pregnant makes the goal maintenance at once" (carried over from
`profile_correction_test.dart`) fails before the fix and passes afterward.
