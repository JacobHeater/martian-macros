# Review — chair, cross-app hierarchy

## Scope and traceability

Role: chair, direct read-only audit and synthesis; no independent specialist
review. Task ID `mm224-cross-app-hierarchy-review`; audit mode `feature`.
Requirements inspected: MM-224 (`requirements/usability/EPIC.cross-app-usability-and-hierarchy.MM-224.md`),
MM-219, MM-223, MM-176, MM-179, MM-98, MM-49, MM-47 and MM-222 at their
listed `requirements/**` paths. Related process evidence: MM-205 and MM-212
run briefs/decisions/state, `requirements/HANDOFF.md`, `design/ux-architecture.md`,
`design/screen-direction.md`, `requirements/ui-ux-assets/README.md` and
`coverage.json`.

Current branch/commit and input hashes could not be read or computed with the
available tools. The preceding run's commit/hashes are not represented as this
run's baseline. Source was read in workspace; current external sites were not
searched/retrieved in this session. Tests were not run. Stored screenshot PNGs
were viewed directly; they are screenshot-test artifacts, not device/user
observations.

## Existing facts versus proposals

### Repository facts

- **Dashboard:** `apps/mobile/lib/src/dashboard/dashboard_screen.dart:90-166`
  orders notices/relief/report, `CalorieHero`, `Macronutrient split`,
  `WeightCard`, `InsightCard`, `ProcessCard`, then `DashboardMetrics`.
  The stored `dashboard_martian.png` shows the hero and macro chart in the
  first viewport. MM-176 deliberately expands the sparse MM-98 dashboard into
  a scrollable metrics overview; MM-179 requires the macro-energy chart on
  Dashboard and Food. The page is not permission to remove the data.
- **Food:** `apps/mobile/lib/src/food/food_screen.dart:30-125` presents the
  calorie/macro hero, macro-energy split, then the four meal sections, and
  completeness. `food_martian.png` shows the summary/chart before meal groups.
  MM-179 expressly retains the chart. The visual form is a stored screenshot,
  not a phone observation.
- **Add food, current code:** `apps/mobile/lib/src/food/add_food_sheet_state.dart:454-575`
  (approximate current range; commit unavailable) gates Search/routes/recents
  separately from `_form()` and exposes `Enter manually`; the form labels its
  name field `Food name`. `apps/mobile/test/add_food_discovery_test.dart:18-103`
  specifies the distinct states and transitions, but was not run. By contrast,
  stored `apps/mobile/test/goldens/images/add_food_opened_dark.png` visibly
  contains both Search and the full manual form. MM-223 calls the Linux
  screenshot baseline pending. Consequently the source supports an in-progress
  separation, but this review cannot certify that a current built render matches
  it. The HTML `views/add-food.html#add-food-default` is a reference drawing,
  not substitute render evidence.
- **Coach:** `apps/mobile/lib/src/coach/coach_screen.dart:55-181` places the
  calorie hero and `Your targets` before Last change, Stall, Recomp review,
  Adherence, Reports, Recovery, Metabolism, Coach confidence, Goal and Body.
  Stored `coach_martian.png` renders only the top portion (including a target
  caution); lower-card appearance/sequence is source-confirmed, not screenshot-
  confirmed here. The longer Coach reference frames are HTML-only.
- **Progress:** `apps/mobile/lib/src/progress/progress_screen_state.dart:50-143`
  begins with today's weigh-in, then weight trend and its uncertainty caption,
  weight events, waist, recomp signal and strength. `progress_martian.png`
  directly renders weigh-in/trend and the start of events. Later surfaces are
  source-confirmed; their detailed appearance in the HTML is reference-only.
- **Train:** `apps/mobile/lib/src/train/train_screen.dart:35-117` puts
  Continue first when a workout is in progress; otherwise Start workout is
  primary, Repeat last workout is conditional/secondary, Weekly training volume
  secondary, with workout history below. `train_martian.png` shows the primary
  Start and two visually secondary routes. The screenshot is direct artifact
  evidence of the entry surface, not workout-in-progress/device behavior.

### Approved direction, proposals and tensions

- MM-224 is `in-progress`; its context says similar visual weight makes
  priority unclear, requires explicit review/outcomes for all five destinations,
  and says drawings/source alone do not establish usability
  (`requirements/usability/EPIC.cross-app-usability-and-hierarchy.MM-224.md:5-41`).
- MM-176 authorizes a metrics-heavy Dashboard; MM-179 authorizes the full
  labeled macro-energy chart. `design/screen-direction.md` says equal-weight
  decoration is still prohibited and describes different default grouping/
  hierarchy for Dashboard, Food, Coach and Progress. `design/ux-architecture.md`
  similarly assigns one job and one detail owner per destination. These are
  relevant direction, not authority to silently remove required metrics or
  rewrite the owner's dashboard policy.
- The owner has not recorded acceptance/change/decline of MM-218–222. The
  Add-food collision is split into MM-223 with explicit no-policy-change
  criteria; MM-223 remains `in-progress`, with baseline pending. MM-219 remains
  `proposed`, specifically for result-route/label/next-step issues and the
  recent-food behavior decision. Neither status should be silently promoted.

## Audit coverage

| Area | Status in this run | Evidence and limits |
|---|---|---|
| Dashboard | **Surveyed** | Dart source + stored `dashboard_martian.png`; no task step record or live render. |
| Food destination | **Surveyed** | Dart source + stored `food_martian.png`; no task step record. |
| Add food | **Surveyed now; prior bounded walk reused** | Current source/test plus `add_food_opened_dark.png`, which conflicts with current source. Prior MM-212 step records were performed against the earlier built sheet at `ca3ff57`, not this current tree. |
| Coach | **Surveyed** | Dart source + upper-fold `coach_martian.png`; lower sections only source/HTML-reference evidence. |
| Progress | **Surveyed** | Dart source + top-fold `progress_martian.png`; detailed lower surfaces not rendered in this review. |
| Train | **Surveyed** | Train destination Dart source + `train_martian.png`; no new set-logging walkthrough. |

No area is marked walked for the current cross-app source baseline: a UI
walkthrough must pair step records with a render of the same built screen.
The previous Add-food walk is valid evidence for the version it inspected,
but not proof of the present tree. Other uninspected areas are listed in the
brief. No whole-app certification is implied.

## Prior-panel / implementation-process trace

1. **MM-205 was a first-meal journey, not a destination-by-destination
   hierarchy review.** Its brief bounded onboarding → Dashboard/Food/Add food,
   with only limited Coach/Progress entry views; all other domains were omitted.
   The product-design report had no Add-food render and classified the mixed
   entry modes as a source-only design improvement needing a render. The UX
   report's route/metric interpretation item was an unverified hypothesis.
   That earlier contract lacked the later explicit rule that a step-by-step
   inspection can itself establish a usability problem without claiming user
   failure rates. MM-205's own decision cautioned not to equate card count with
   overload.
2. **MM-212 fixed the evidence method, but retained bounded assignments.**
   Its Add-food brief explicitly excluded the Dashboard's own layout, Coach,
   Progress, and other destinations; the separate second walkthrough covered
   workout logging. Coach and the other card-heavy surfaces were not accidentally
   cleared: they were out of scope. The method did count Add food/workout
   controls and branches and required renders/“walked vs surveyed.”
3. **The later Add-food walkthrough did surface actionable findings.** The
   decision classified the mixed search/manual screen and lost/ambiguous
   routes as “usability problems found by inspection,” traced them to MM-219,
   and marked MM-218–222 proposed. Its reviewers were independent; the current
   synthesis is not a new independent panel. The story's `proposed` status
   records that no owner decision was made, not that no evidence existed.
4. **A safe subset was separated out.** MM-223 calls the opening search/name
   collision a concrete bug needing no choice about other behavior. Current
   source and a widget-test file now encode separate discovery and manual
   states. However the ticket says screenshot baseline pending and the stored
   opening PNG still shows the old mixed form. Until the current render/test/
   ticket are reconciled, status remains in progress and visual completion is
   unverified.
5. **The process preserved owner authority but had no completed cross-app
   synthesis.** MM-212's findings were ticketed as proposed; HANDOFF explicitly
   asked the owner to accept/change/decline them. MM-224 now requires review
   coverage across five destinations, but its acceptance criteria are still
   open and there is no owner-recorded hierarchy decision. The implementation
   process therefore did not “reject” Add food or Coach; it preserved the
   proposal boundary and lacked a scheduled cross-app pass/decision handoff.
   The direct next step is owner disposition of proposals and an explicit
   MM-224 direction, not silent implementation.

## Findings

### HIER-01 — MM-223 source and visual evidence do not yet reconcile

- **Classification:** unverified hypothesis requiring investigation.
- **Severity/confidence:** Medium; high confidence that the source, stored
  image and ticket describe different verification states; current runtime
  behavior is unknown.
- **Evidence:** `add_food_sheet_state.dart:454-575`,
  `test/add_food_discovery_test.dart:18-103`,
  `requirements/food-logging/BUG.add-food-search-and-manual-entry-compete.MM-223.md:1-54`,
  and stored `apps/mobile/test/goldens/images/add_food_opened_dark.png`.
- **Expected vs observed:** MM-223 expects discovery-only at open and a separate
  Food name form after an explicit action. The inspected source/test specify
  that separation; the stored PNG displays search, route buttons, recents and
  the full typed form together. The ticket labels the screenshot baseline
  pending. This is a source/artifact mismatch, not a reproduced runtime defect.
- **Impact/remediation:** risk of falsely declaring the most visible Add-food
  issue fixed or leaving an outdated golden. Owner/implementation QA should
  run the named discovery widget test, capture/inspect the actual opening and
  manual states from the current tree, update the golden and `coverage.json`
  only if that render confirms source, then resolve MM-223. Do not redo the
  separation if current built behavior already passes.
- **Verification:** source inspection + stored-render inspection only; no
  command/test/runtime execution in this review.
- **Proposed acceptance:** built opening render matches discovery-only
  requirements; manual route and query handoff work; updated golden depicts
  that build; MM-223 status/provenance accurately says what was tested.

### HIER-02 — MM-219 contains distinct unresolved, inspection-backed Add-food problems

- **Classification:** usability problem found by inspection (from the prior
  MM-212 task walkthrough; not newly walked on current build).
- **Severity/confidence:** Medium; high confidence for the old walked state
  because two reviewers recorded steps/renders; present-state confidence is
  lower because no current discovery screenshot is available and MM-223 changes
  the entry route.
- **Evidence:** `requirements/food-logging/STORY.finding-a-food-and-typing-one-are-told-apart.MM-219.md:10-50`;
  prior `docs/agent-runs/mm212-add-food-walkthrough/decision.md` and
  `findings/ux-accessibility.md` step records; current source's conditional
  discovery-route controls in `add_food_sheet_state.dart:454-575`.
- **Expected vs observed in the prior walk:** a person searching unsuccessfully
  should still find visible manual-entry and estimate routes; distinct controls
  should name distinct actions; a recent and database result should make the
  next step clear. The prior screen hid routes while search text was present,
  had two uses of “Estimate,” and recent/found rows led to different
  form/amount behavior without explaining that difference. The new source
  offers `Enter manually` during results, but the Estimate route appears only
  when the query is empty; result-row next-step explanation and the recent-food
  policy are not established as resolved.
- **Impact/remediation:** an unrecoverable “not found” route can force clearing
  a query; ambiguous result actions create extra interpretation each entry.
  Owner should disposition MM-219's remaining scenarios after inspecting the
  current rendered search/results states. Decide explicitly whether a recent
  food with a stored reference should use the amount step or remain a typed
  form; do not choose on the owner's behalf.
- **Verification/limits:** prior step records are analytical evidence, not
  observed-user rates; no current screenshot, test execution, runtime or
  owner choice.
- **Proposed acceptance:** manual entry remains visible in no-result and
  result states; “Estimate” labels distinguish meal estimation from quantity
  estimation or use distinct words; each result row says what opens; recent
  behavior follows a written owner decision and remains editable.

### HIER-03 — Cross-destination hierarchy needs one coherent, owner-approved
information priority

- **Classification:** design/usability improvement.
- **Severity/confidence:** Medium priority because the concern recurs across
  core destinations; medium confidence in the visual pattern from source and
  stored screenshots, low confidence that the pattern causes task failure
  without user/device testing.
- **Evidence:** current ordered children above; stored Dashboard/Food/Coach/
  Progress/Train PNGs. Coach source stacks many separately titled sections;
  Progress and Train start with more explicit tasks. `design/screen-direction.md`
  (Dashboard, Food, Coach, Progress direction), `design/ux-architecture.md`
  (destination ownership) and MM-224 are the internal direction.
- **Expected vs observed:** shared owner signal asks that a person know what to
  inspect first. Dashboard gives the day summary first and Train gives Start a
  strong primary treatment, but multiple summary surfaces remain prominent;
  Coach's current sequence spreads targets, change history, adherence, reports,
  recovery, metabolism, confidence, goal and body through similarly card-like
  sections. Progress's first task is more direct (weigh-in, then trend) in its
  source and first render. These are source/render descriptions, not usability
  failures or observed-user findings.
- **Remediation:** adopt a consistent 3-tier hierarchy (primary next action or
  current status; concise supporting summary; grouped/detail-on-demand
  evidence), reduce equal visual framing rather than deleting facts, preserve
  the route to detail, and keep safety/uncertainty information actionable and
  visible. Apply per-screen directions in `decision.md`; keep Train's existing
  primary/secondary distinction.
- **Proposed acceptance:** for each of the five destinations an approved
  first-priority item and next action are named; supporting content has an
  intentional lower hierarchy; required health/safety caveats and uncertainty
  remain legible; data retained by MM-176/MM-179 remains reachable; a fresh
  render confirms no occlusion at target sizes.
- **Verification:** no current device render, task-performance evidence, or
  broad multi-screen step walkthrough.

## Research

**Status: blocked for fresh research in this session; relevant prior retrieved
research reused.** The current tool surface provided repository `view` and
GitHub-scoped search, not general web search or arbitrary URL retrieval. A
bounded `research` delegation returned a maximum-depth error. No search
success is claimed. The prior report
`docs/agent-runs/mm205-novice-mobile-experience/findings/research.md` records
browser-backed discovery/retrieval on 2026-10-10; its provenance is reused,
not independently re-fetched today.

| Retrieved source (prior chair report) | Population/method and outcome relevant here | Strength / limits / use |
|---|---|---|
| [Cordeiro et al., “Barriers and Negative Nudges: Exploring Challenges in Food Journaling” (CHI 2015)](https://depstein.net/assets/pubs/fcordeiro_chi15.pdf), published 2015; accessed 2026-10-10. DOI [10.1145/2702123.2702155](https://doi.org/10.1145/2702123.2702155). | Survey of 141 mixed-experience journalers plus analysis of 5,526 forum posts; reports search/database reliability, portion/entry-choice and lapse barriers. | Empirical but convenience/mixed-experience and not a controlled disclosure experiment; supports investigating Add-food friction, not this UI's failure rate or a prescribed hierarchy. |
| [Silva & Epstein, “Investigating Preferred Food Description Practices in Digital Food Journaling” (DIS 2021)](https://depstein.net/assets/pubs/lsilva_dis21.pdf), published 2021; accessed 2026-10-10. DOI [10.1145/3461778.3462145](https://doi.org/10.1145/3461778.3462145). | Two-week multimodal prototype deployment with 15 participants, 1,008 food logs and interviews; mainly people with prior journaling experience; explores food descriptions/units/entry practices. | Small, experienced-heavy and not a novice card-hierarchy comparison; justifies validating food-entry assumptions, not a causal recommendation to hide choices. |
| [W3C WCAG 2.2 Understanding SC 1.4.4: Resize Text](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html), WCAG 2.2 Recommendation date reported as 2023-12-05 in prior retrieval (not independently reverified); accessed 2026-10-10. | Normative web accessibility guidance explains text resize to 200% without loss of content/function; not an empirical preference or task study. | Useful verification constraint for responsive hierarchy; web standard is not an assertion of native Flutter conformance. |
| [Apple HIG: Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility), prior report says latest changelog entry 2025-06-09; accessed 2026-10-10. | Official platform design guidance; no comparative study population/outcome. | Use as current platform guidance only; it cannot decide nutrition hierarchy or prove this UI usable. |

Interpretation: external evidence makes entry friction and accessibility worth
testing, but does not prove that card count causes the owner's reported
confusion, select what should be most prominent, or resolve MM-219. No invented
user study or causal claim is used. More direct, fresh choice/hierarchy research
remains a bounded request if the owner asks for an evidence claim beyond this
inspection.

## Novice experience and walkthrough boundary

No new step-by-step walkthrough is claimed for this cross-app audit. The prior
Add-food run walked four tasks for a first-week user with a database installed
at 360 dp, using source and six renders; its finding remains version-bounded.
The current screen-level survey asks what each destination seems to foreground:

- Dashboard: calories/targets and macro bars, then energy-share pie; the top-bar
  Add food route is visually prominent. The person must understand two
  different macro representations (target progress vs share of recorded
  macro energy); MM-179 labels the second. No comprehension was tested.
- Food: daily summary/chart before meal groups; the task action is on a meal
  row or Add food route. Preserve access to all required summary/detail.
- Coach: hero/targets/caution appear first in the screenshot; source places
  many further evidence/action areas below. Which of those is the one next step
  is a product question, not inferred from card count.
- Progress: weigh-in action and trend/uncertainty are visible immediately;
  the person can interpret the chart caption, then reach events/waist/strength.
  Later-state comprehension was not inspected.
- Train: Start is the dominant action; Repeat and weekly volume are secondary;
  continue takes precedence when a workout exists. Do not infer the interior
  workout task from this destination screenshot.

## Acceptance criteria and edge cases (proposed, not accepted)

1. Each named destination has a declared first concern/action, a secondary
   information layer and routes to full detail, tied to owner-approved MM-176,
   MM-179 and safety requirements.
2. MM-219's no-results, search-results, estimate-vocabulary, recent-food and
   found-food branches are verified against a render for the current source;
   the recent-food route is not changed until its owner decision is written.
3. Safety notices, target limitations, confidence/uncertainty and data
   provenance are not hidden in a generic collapsed card; missing/error/partial
   data remains explicitly distinguished from zero/complete.
4. Test at narrow/wide devices, large text, themes, safe areas and keyboard
   states. Include accessibility semantics/reading order and user task
   comprehension in verification.

## Dependencies, safety and unresolved authority

- **Owner decision required:** first-fold Dashboard scope under MM-176 vs the
  previous MM-98/screen-direction order; which Coach item is the one next step;
  how much analysis is routine vs detail; MM-219 recent-food next-step behavior;
  whether any required macro/metric is collapsed, and how its availability is
  signaled. Product owner is decision authority.
- **Referrals for any implementation:** product/requirements owner to accept
  or change proposed stories; Product Designer for hierarchy; UX & accessibility
  for task-flow/readability and device walkthrough; Flutter/QA for current
  widget/golden/runtime consistency; relevant safety/privacy roles if a
  proposal hides safeguard, health or sensitive data. No new panel was run.
- **Safety/privacy:** no new safety/privacy defect established in this bounded
  hierarchy survey. This is not clinical or privacy clearance. Do not hide
  safety notices, uncertainty, restricted-target explanations or correction/
  recovery paths to reduce visual density.

## Verification and limitations

Evidence methods: source inspection, stored render inspection, review of prior
task walkthrough and requirements. No runtime reproduction, command, test,
device session or user study was performed in this session. Confidence is
medium for source ordering and visible top-fold composition, low for impact on
actual people. Branch, commit, dirty state and hashes are not available. Areas
marked surveyed do not constitute a usability finding or clearance.
