---
id: MM-224
status: in-progress
component: usability
related: [MM-37, MM-212, MM-218, MM-219, MM-220, MM-221, MM-222, MM-223]
---

# Epic: Cross-app usability and information hierarchy

## Context
The product owner has identified the same usability concern across multiple
destinations: screens present many cards and controls with similar visual
weight, leaving it unclear what deserves attention first. The Add food sheet
puts search, recent foods, and a manual-entry form together. The Coach source
places cautions, targets, the last change, stall/recomp reviews, adherence,
reports, recovery, metabolism, confidence, goal, and body in one scroll. The
Dashboard reference similarly continues from the hero into a long metrics
section of nutrition, protein, weight, waist, coverage, coaching, and recovery.

The existing Food logging epic (MM-37) is about completing food logging
capabilities, not cross-screen information hierarchy. The walkthrough work
under MM-212 improved how the panel records findings, but its recent deep
walkthroughs targeted Add food and workout logging, not Coach or every app
destination. The Coach reference specifically says the sections below targets
have no screenshot comparison; the Dashboard reference says its tests show
only parts of the long page. A drawing or source inspection alone is not
evidence that a screen is usable.

## Decisions
- Choices made from inspection are recorded as findings, not claims about
  observed user behavior.
- The epic does not approve every proposed story or authorize a broad redesign.
  Concrete fixes need regression coverage; behavior or hierarchy choices that
  materially change the product remain proposed until accepted.
- Review all product destinations with a declared depth and evidence method;
  do not claim a destination is usable merely because it was not reviewed.

## Description
Make the app's information hierarchy and primary next action understandable
across its main destinations, including Dashboard, Food/Add food, Coach,
Progress, and Train. First establish what each screen asks the person to
notice or do; then identify and prioritize excess competing cards, labels,
controls, and routes. Turn each finding into a regression-backed bug, a
proposed story, an owner question, a verified resolution, or a reasoned
rejection. Preserve proposed status for unresolved product decisions.

## Acceptance Criteria
The epic is done when:
- Each main destination has a recorded review scope, built-screen evidence,
  and an explicit primary information or action hierarchy.
- A person can tell what to look at first and what to do next on each reviewed
  destination without treating every card as equally important.
- Findings across Dashboard, Food/Add food, Coach, Progress, and Train have an
  explicit outcome and priority; none is silently left in a report or handoff.
- Concrete defects have regression coverage, while changes that require a
  product decision remain proposed until the owner accepts them.
- Changed screens, their requirements, drawings, manifest entries, and tests
  agree before the epic is closed.

## Notes
- **Delivery reconciliation, 2026-10-12:** #81 and #101 are merged. Add food
  discovery separation (MM-223), live macro previews (MM-225), simple serving
  entry (MM-226), and edit precision/alcohol fixes (MM-202 to MM-204) shipped.
  MM-227 corrects the confirmed HTML Back to search parity defect in #102.
  MM-218 to MM-221 now distinguish historical observations, shipped partial
  resolutions, and remaining criteria. Those stories stay proposed because
  their remaining scope has not been implemented or verified.
- **Current priority/disposition:** Coach and Dashboard hierarchy remain
  implementation work under this epic, not cleared by the survey. Progress
  grouping remains a proposed refinement; Train's Start/Continue priority is
  retained, with deeper task evidence still missing. Add food's remaining
  action visibility/dismissal and pre-log clarity work is tracked by MM-220
  and MM-218; route vocabulary/access by MM-219; edit presentation by MM-221.
  No destination is certified usable by this inventory.
- **Evidence boundary:** the owner confirmed a phone/reference discrepancy.
  MM-227 was verified against source and browser assertions, not an installed
  phone walkthrough. Establish the installed build and compare equivalent
  state/theme/viewport before claiming phone parity. Do not attribute a
  discrepancy to an older installation without evidence.
- The Add food search/manual-entry collision is tracked separately in MM-223
  and is being fixed without deciding the remaining MM-219 questions.
- Session 19's bounded cross-app survey is recorded at
  `docs/agent-runs/mm224-cross-app-hierarchy-review/`. It surveyed source and
  stored screenshot-test images for Dashboard, Food, Coach, Progress, and
  Train; it did not run a live-device review or new task walkthrough. The
  stored Add food image is stale and shows the old mixed state, so it cannot
  verify MM-223. Lower Coach sections, Dashboard metrics, Progress detail,
  and deeper Train states were source/reference-only in this survey.
- The survey's recommendations preserve required data and safety information:
  keep Train's Start/Continue action primary; organize Progress around
  weigh-in then trend; make Coach's routine focus primary and group its
  supporting evidence. Dashboard prominence and the remaining MM-219 behavior
  choices are unresolved; do not remove metrics or decide those behaviors by
  inference.
- External context: Cordeiro et al., “Rethinking the Mobile Food Journal,”
  CHI 2015 ([DOI](https://doi.org/10.1145/2702123.2702154)), and Silva &
  Epstein, “Investigating Preferred Food Description Practices in Digital
  Food Journaling,” DIS 2021
  ([DOI](https://doi.org/10.1145/3461778.3462145)), provide context on
  capture and description practices in food journals, not evidence that this
  app's card count causes difficulty or that one proposed hierarchy is
  effective. W3C's
  [Resize Text guidance](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
  informs accessibility verification, not hierarchy effectiveness. ACM
  pages were not freshly retrievable during Session 19; the research citations
  were carried from the prior MM-205 research record. Treat them as context,
  not evidence of user behavior in this app.
- Design-system guidance, distinct from research findings: the
  [GOV.UK summary list](https://design-system.service.gov.uk/components/summary-list/)
  recommends summary lists for key facts and says not to use them for simple
  lists or tasks; headings can structure multiple lists. Use a container only
  when its content and actions form a meaningful group, not as a default
  wrapper.

## The owner's diagnosis (2026-10-13)
The app lacks iconography and segmenting; its views are monolithic and the person carries the load; it needs more graphics, more natural segmenting and view hierarchies. Decided with it: Material icons everywhere now and custom art after MM-109; both macro pictures behind a switcher; one direction across every destination, built in stages. The direction is MM-253; the destinations are MM-254 to MM-259. This epic stays open until they are built and the panel has graded them.
