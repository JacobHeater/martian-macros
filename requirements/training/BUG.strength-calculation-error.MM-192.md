---
id: MM-192
status: done
component: training
related: [MM-77]
---

# Bug: Invalid strength evidence bypasses the retry state

The synchronous derived provider threw an ArgumentError when stored evidence
was malformed, instead of returning its declared AsyncError. A consumer could
crash rather than show the strength retry state. Logged data must not change.

## Acceptance Criteria
```gherkin
Scenario: Invalid stored evidence
  Given a finished workout contains a non-finite load
  When strength history is calculated
  Then its provider returns an error state with the cause and stack trace
  And the strength section offers retry without changing the logged sets
```

## Regression
`strength_progress_test.dart`: "MM-192 invalid evidence is an AsyncError".
Run failing before the fix and passing afterward.
