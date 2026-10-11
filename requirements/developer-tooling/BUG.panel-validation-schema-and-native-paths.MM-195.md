---
id: MM-195
status: in-progress
component: developer-tooling
related: []
---

# Bug: Panel validation accepts non-object schemas and rejects native paths

Review of the new panel validator found that valid JSON such as `null` or `[]`
returned no errors, skipping validation. Comparing a resolved run directory to
an unresolved mixed-separator expected path also rejected valid Windows runs.

MM-195 is provisional: the existing files end at MM-194, but `mm req next`
cannot execute without Dart/Flutter. Validate allocation before merging.

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

`tool/test/panel_checker_test.dart` tests “MM-195 non-object schema cannot bypass
panel validation” and “MM-195 native saved-run separators validate on Windows”
guard these defects. They are expected to fail on the reviewed implementation;
execution before/after is unverified because no Dart/Flutter SDK is available.
The Windows-only path test is skipped on other platforms, not evidence of a
Windows run. Fixes are implemented; retain in-progress until tests are executed.
