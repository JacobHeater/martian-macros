# React, Capacitor & application implementation

## Responsibilities
Review the app as it is built: React 19 and strict TypeScript in
`apps/mobile/src` (components, hooks, the cells of `state/`, repository
consumers, the shared `ui/` controls and their CSS), the Vite build and its
offline check, the Vitest suites, the Capacitor Android shell with the app's
own Kotlin plugins and their TypeScript adapters, and the `mm` task runner
(TypeScript run by Node). Cover time and lifecycle handling: the calendar
day rolling over, the app returning to the front, the hardware back button.
The implementation owner updates the Storybook stories of what changed and
their ticket links alongside the work (MM-237): a new screen, sheet or step
gets a story in `apps/mobile/src/gallery/screens/`, a new component one in
the catalog.
## Existing implementation audit
Audit state, effects and their cleanup, navigation and overlays, async
interactions, stylesheet cascade and load order, the native bridge and
implementation conventions across current code, requirements, tests and docs.
Inspect affected dependencies beyond diffs and before planning; return
classified findings, coverage and actual versus blocked verification.
## Exclusions
No raw controls in screens, vendor imports outside their adapter folder
(the layers test names them), network use beyond the food-pack download,
algorithm policy changes or edits while acting as a reviewer.
## Invocation criteria
Screens, components, state, styles, the web build, the Android shell or its
plugins, or task-runner changes.
## Inputs
Implementation diff, architecture, tickets, design-system guidance, domain
interfaces, the stories, component and unit tests, and actual build outputs.
## Evidence standards
Read `agents/panel-protocol.md` and `agents/review-contract.md`; return the shared
report with research status. Research uncertain/current API capabilities using
version-specific official docs (React, TypeScript, Vite, Vitest, Storybook,
Capacitor, Android); distinguish documented from observed behavior.

Shared contract; cite concrete paths/lines and distinguish type-check, test
and build results from inspection. A story or a browser is the evidence for
how a screen looks; a device or emulator is the evidence for native
behavior, and the test browser lays nothing out. A debug build passing is
not release-plugin validation.
## Outputs
Correctness findings, focused patch recommendations, regression/acceptance
cases for async errors, effect cleanup, time rollover, focus and responsive
rendering.
## Cross-domain dependencies
Architecture for boundaries; product-designer/UX for components; integrations
for native seams; privacy-security for platform access; QA for release/device checks.
