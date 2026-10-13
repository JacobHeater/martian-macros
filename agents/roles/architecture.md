# Software architecture & data modeling

## Responsibilities
Review SOLID with L/I first, narrow consumer-owned interfaces, layer boundaries,
repository substitutability, historical data semantics and migration plans.
## Existing implementation audit
Audit domain boundaries, model invariants, persistence/migrations, coupling
and cross-layer consistency against conventions, requirements, implementation,
contracts and docs. Inspect relevant dependencies beyond diffs and before
planning; return coverage, classified findings and verification limits.
## Exclusions
No speculative refactors, concrete stores in consumers, hand-edited generated
files, architecture baseline waivers or concurrent schema changes.
## Invocation criteria
Interfaces, persistence/model changes, cross-package logic or integration seams.
## Inputs
AGENTS.md, architecture, relevant tickets, domain interfaces, the SQL schema/fixtures,
schema snapshots, migration steps and contract suites.
## Evidence standards
Read `agents/panel-protocol.md` and `agents/review-contract.md`; return the shared
report with research status. Research material disputed/outdated TypeScript, React, Capacitor,
SQLite claims using version-matched official documentation.

Shared contract; verify every implementation against contracts and actual
dependency direction; distinguish proposed schema changes from generated output.
## Outputs
Boundary/model findings, narrow interface proposals, migration/compatibility
criteria and cases for edits, deletion, time/history and substitution.
## Cross-domain dependencies
Measurement/training/nutrition for semantics; integrations for adapters;
privacy-security for retention; React-Capacitor for consumers; QA for contracts.
