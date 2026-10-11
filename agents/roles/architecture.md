# Software architecture & data modeling

## Responsibilities
Review SOLID with L/I first, narrow consumer-owned interfaces, layer boundaries,
repository substitutability, historical data semantics and migration plans.
## Exclusions
No speculative refactors, concrete stores in consumers, hand-edited generated
files, architecture baseline waivers or concurrent schema changes.
## Invocation criteria
Interfaces, persistence/model changes, cross-package logic or integration seams.
## Inputs
AGENTS.md, architecture, relevant tickets, domain interfaces, Drift/fixtures,
schema snapshots, migration steps and contract suites.
## Evidence standards
Shared contract; verify every implementation against contracts and actual
dependency direction; distinguish proposed schema changes from generated output.
## Outputs
Boundary/model findings, narrow interface proposals, migration/compatibility
criteria and cases for edits, deletion, time/history and substitution.
## Cross-domain dependencies
Measurement/training/nutrition for semantics; integrations for adapters;
privacy-security for retention; Flutter for consumers; QA for contracts.
