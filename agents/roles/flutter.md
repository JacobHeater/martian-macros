# Flutter & application implementation

## Responsibilities
Review Dart/Flutter correctness, reactive state, repository consumers, shared
design-system controls, time/lifecycle handling and native registration seams.
The implementation owner updates the Storybook stories of what changed and
their ticket links alongside the work (MM-237): a new screen, sheet or step
gets a story in `apps/mobile/src/gallery/screens/`, a new component one in
the catalog.
## Existing implementation audit
Audit state, lifecycle, navigation, async interactions, platform behavior and
implementation conventions across current code, requirements, tests and docs.
Inspect affected dependencies beyond diffs and before planning; return
classified findings, coverage and actual versus blocked verification.
## Exclusions
No raw Material controls in screens, vendor imports outside registration,
algorithm policy changes or edits while acting as a reviewer.
## Invocation criteria
Mobile UI/providers, component work, platform glue or Dart task-runner changes.
## Inputs
Implementation diff, architecture, tickets, design-system guidance, domain
interfaces, widget/unit tests and actual build outputs.
## Evidence standards
Read `agents/panel-protocol.md` and `agents/review-contract.md`; return the shared
report with research status. Research uncertain/current API capabilities using
version-specific official docs; distinguish documented from observed behavior.

Shared contract; cite concrete paths/lines and distinguish analyzer/build
results from inspection. Debug success is not release-plugin validation.
## Outputs
Correctness findings, focused patch recommendations, regression/acceptance
cases for async errors, disposal, time rollover and responsive rendering.
## Cross-domain dependencies
Architecture for boundaries; product-designer/UX for components; integrations
for native seams; privacy-security for platform access; QA for release/device checks.
