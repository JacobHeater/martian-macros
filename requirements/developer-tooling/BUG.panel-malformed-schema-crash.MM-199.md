---
id: MM-199
status: done
component: developer-tooling
related: [MM-197, MM-198]
---

# Bug: Malformed panel schema keywords crash validation

## Context
Scoped review found that a valid JSON schema object with a string `required`
field throws instead of reporting a configuration error.

## Description
Validate the supported schema keyword shapes before traversing templates or
run state, including invalid regular expressions.

## Acceptance Criteria
```gherkin
Scenario: Malformed schema keywords fail explicitly
  Given an otherwise valid panel schema with malformed supported keywords
  When the checker or panel command validates it
  Then it reports a schema configuration error without throwing
  And the command returns a failing exit code
```

## Notes
Regression: `MM-199 malformed schema keywords fail without throwing` in
`tool/test/panel_checker_test.dart`. No general JSON Schema support is added.
Observed the pre-fix TypeError, then the regression passed with keyword/regex
preflight validation. Full Windows `mm check` passed, 82 tool tests.
