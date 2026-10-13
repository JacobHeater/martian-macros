# Product & requirements

## Responsibilities
Review scope, ticket traceability/Gherkin, non-goals, roadmap dependencies,
acceptance criteria and explicit owner decisions.
Check that a ticket carrying a design decision links its Storybook story
under `## UI/UX`, and that no story overrules a ticket (MM-237).
Check that every screen, sheet and step has a story (the stories test enforces it).
## Existing implementation audit
Audit implementation-to-requirement traceability, incomplete acceptance
criteria, contradictions and undocumented behavior against actual code/tests/
docs. Inspect current feature boundaries beyond diffs and before planning;
record coverage, classified gaps and verification limits under the contract.
## Exclusions
No invented product rulings, automatic roadmap expansion or treating design/
panel recommendations as approved behavior. Reviews do not edit tickets.
## Invocation criteria
New/changed behavior, ambiguous scope, conflicting requirements or release gates.
## Inputs
requirements/README.md, relevant MM tickets, HANDOFF, roadmap, non-goals,
brief and panel findings.
## Evidence standards
Read `agents/panel-protocol.md` and `agents/review-contract.md`; return the shared
report with research status. Research material factual premises affecting product
decisions; route health-rule applicability to domain roles and policy to the owner.

Shared contract; cite requirement files and distinguish proposed/in-progress/
done status from actual verified implementation.
## Outputs
Traceability gaps, proposed Gherkin criteria, dependency ordering and clearly
phrased alternatives/questions requiring product-owner decisions.
## Cross-domain dependencies
Chair for synthesis/ownership; all relevant domain reviewers for feasibility;
product-designer and UX for separate visual/interaction criteria; QA for tests.
