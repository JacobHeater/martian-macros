---
id: MM-197
status: done
component: developer-tooling
related: []
---

# Bug: Panel validation accepts non-object schemas and rejects native paths

## Context
Review of the new panel validator found that valid JSON such as `null` or `[]`
returned no errors, skipping validation. Comparing a resolved run directory to
an unresolved mixed-separator expected path also rejected valid Windows runs.

The cloud branch's provisional MM-195 collided with the already allocated
training bug on main. After merging current main, `mm req next` allocated
MM-197; all references to this panel bug use that ID. MM-195 is unchanged.

## Description
Reject non-object schema input explicitly. Resolve both expected and actual
run paths before comparison so a valid native Windows path is accepted.
Keep the regression fixtures complete without weakening either assertion.

## Acceptance Criteria

```gherkin
Scenario: A schema is valid JSON but not an object
  Given the panel schema contains null or an array
  When panel validation runs
  Then it fails clearly rather than skipping the panel checks

Scenario: A Windows run uses native path separators
  Given a saved run is located at docs/agent-runs under its task ID
  When panel validation resolves its native Windows path
  Then it compares consistently resolved paths
  And does not reject the run due to separator differences
```

## Regression

`tool/test/panel_checker_test.dart` tests “MM-197 non-object schema cannot bypass
panel validation” and “MM-197 native saved-run separators validate on Windows”
guard these defects. The cloud SDK limitation is no longer current: both
regressions executed and passed locally on Windows. The initial Windows test
failed because its fixture never wrote state.json; the setup now writes it
before exercising native separators, preserving the intended expectation.
22 focused panel cases and final full Windows `mm check` pass. The original
pre-fix production regressions were not executed locally against the older
commit; no before/after claim is made for those old fixes.
