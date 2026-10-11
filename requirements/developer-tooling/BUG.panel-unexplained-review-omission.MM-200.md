---
id: MM-200
status: done
component: developer-tooling
related: [MM-198]
---

# Bug: Panel completion accepts unexplained review omissions

## Context
Scoped review found omitted assignments bypass the protocol's recorded-reason
requirement, allowing core reviews to disappear without explanation.

## Description
Require a nonblank omission reason indexed in state and recorded in the local
brief or role report. Do not force unnecessary domain reviews.

## Acceptance Criteria
```gherkin
Scenario: Omitted reviews retain their rationale
  Given a complete run whose core assignments are omitted
  When any omission lacks a reason recorded in state and the brief or report
  Then panel validation fails explicitly
  When all omission reasons are recorded in both places
  Then omission validation passes
```

## Notes
Regression: `MM-200 complete runs cannot omit reviews without recorded reasons`
in `tool/test/panel_checker_test.dart`.
Observed the pre-fix absent error, then the same regression passed with
state-indexed reasons matched to the brief/report. Full Windows `mm check`
passed, 82 tool tests.
