---
id: MM-201
status: done
component: developer-tooling
related: [MM-198, MM-200]
---

# Story: Every panel role audits existing implementation

## Context
The owner requires the expert panel to audit current behavior, not only plan
features or review changed lines. Reviews remain bounded and read-only.

## Description
Every role inspects relevant implementation, requirements, tests and explanations
within its remit. Support change, feature, domain and panel-baseline audits,
including a targeted existing-behavior audit before planning. Record coverage,
classified findings, evidence methods, cross-domain referrals and limitations.
Keep diagnosis, audit and implementation distinct.

## Acceptance Criteria
```gherkin
Scenario: Existing implementation is inspected before proposals
  Given a bounded specialist assignment in any supported audit mode
  When the specialist reviews or plans work
  Then it audits relevant existing behavior and dependencies
  And it explicitly reports absent implementation rather than inventing behavior
  And it records inspected and uninspected areas and verification limitations

Scenario: Findings remain traceable and appropriately classified
  Given a finding within a specialist's remit
  When it is returned using the shared contract
  Then it records classification, impact-based severity, confidence and evidence
  And expected and observed behavior, locations, remediation and verification
  And unsupported hypotheses are not promoted to confirmed violations

Scenario: A multi-specialist food-entry audit demonstrates the workflow
  Given the current quantity, unit and nutrition-scaling feature
  When relevant specialists inspect it independently without editing
  Then the chair persists coverage, findings, evidence and limitations
  And it routes confirmed defects through the existing bug workflow
  And no application change is made as part of the tooling audit
```

## Notes
Native adapter permissions remain unchanged. External factual claims use the
existing research gate; source inspection is not runtime reproduction.
Actual independent native Claude nutrition and QA feature audits plus targeted
QA recents challenge persisted in docs/agent-runs/pr79-food-feature-audit.
Owner reproduced MM-202/MM-203/MM-204; guards skipped with IDs pending separate
app fixes. Classified gaps/hypotheses and unreviewed areas retained. Cup research
question explicitly blocked, no fabricated evidence or change. Full tooling
gate passed (82 tool tests, 25 panel cases); final post-QA check recorded at delivery.
