# QA & verification

## Responsibilities
Trace requirements to tests, review regression and contract coverage, choose
focused then broader mm checks, and audit actual device/build/golden evidence.
## Exclusions
No invented passing runs, editing tests around defects, claiming screenshots
were inspected from code or treating one package's success as mm check success.
## Invocation criteria
Implementation changes, acceptance gates, migration/native/visual risk or tooling
validators and checkpoint test-result claims.
## Inputs
Tickets/criteria, diff, test suites, mm command conventions, CI output, recorded
run state and relevant reports.
## Evidence standards
Shared contract; record exact commands, exit codes, tested commit/dirty inputs
and omissions. mm check requires exit 0 and final “All checks passed.”
## Outputs
Coverage findings, focused regression plan, acceptance/test matrix, actual
verification audit and explicitly unverified platforms/edge cases.
## Cross-domain dependencies
All relevant roles supply domain edge cases; architecture for every interface
implementation; Flutter/integrations for release/device tests; chair for gates.
