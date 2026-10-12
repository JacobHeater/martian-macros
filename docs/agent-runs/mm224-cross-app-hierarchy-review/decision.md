# Recommendation — MM-224 cross-app hierarchy

## Recommendation in one sentence

Keep the information, but stop presenting all routine information as peers:
give each destination one legible primary task/status, a compact supporting
summary, then grouped details with clear routes—while keeping safety, uncertainty
and required data visible. Do not interpret “fewer cards” as permission to
remove Dashboard metrics or the MM-179 macro chart.

## Prioritized direction by destination

| Priority | Surface | Primary hierarchy recommendation | What to preserve / what is not proven |
|---|---|---|---|
| 0 — verify state | Food → Add food | Keep discovery first, with one explicit “Enter manually” route; keep manual entry as its own step. Then make Estimate and recent/found-result next actions explicit and consistent. | Current Dart source/test specify separated discovery/manual states (MM-223); the stored opening screenshot still depicts the old mixed screen and the ticket says baseline pending. Verify before calling it fixed. Remaining MM-219 criteria and recent-food behavior are unresolved. |
| 1 — owner policy | Dashboard | First viewport: orient to today and the one most common next action; visually distinguish current status from secondary analysis. Keep detailed time-series data available below or one deliberate step deeper. Make labels distinguish target attainment from the macro-energy-share chart. | MM-176 intentionally requires a metrics-heavy overview; MM-179 requires the three-share chart. Do not remove metrics, demote a safety message, or choose a new first-fold inventory without the owner's decision. |
| 1 — owner policy | Coach | Lead with the current target/status and the single next action (if one applies); place the reason/last change directly after it. Group supporting adherence, reports, recovery, metabolism, confidence evidence, goal and body under intentional sections/disclosures rather than treating each as a separate same-weight stop. | Keep a relevant caution/safeguard and confidence/uncertainty visible. The “one next step” already appears in `design/screen-direction.md`, but MM-224 owner approval and current lower-screen render are missing. |
| 2 — refine | Progress | Keep weigh-in as the clear immediate task; follow with the trend and an always-readable uncertainty explanation. Group weight events, waist, recomp and strength as supporting progress areas with names and routes to detail. | The initial screenshot/source already indicate a sensible first action. Do not hide uncertainty or imply day-to-day weight is tissue change. |
| 2 — preserve | Train | Keep Continue as the first action for an active workout; otherwise Start workout primary, with Repeat and Weekly volume secondary and history subordinate. | Current source and Train screenshot already demonstrate clearer primary/secondary hierarchy. Do not turn the broader audit into a workout-widget review. |
| Cross-cutting | All five | Use fewer competing outlined containers and repeatable typography/spacing tiers to group related facts; reserve the strongest visual treatment for the current task/status. Put optional explanation one step deeper, not critical warnings or data-validity qualifiers. | Card count alone is not a usability finding. Keep equal visual treatment as an inspection signal, not a user outcome. Preserve offline/privacy constraints; do not add analytics by default. |

## What is confidently actionable now

1. **Close the evidence loop on MM-223, not the feature blindly.** The current
   source/test define discovery/manual separation, and the automated test
   explicitly checks opening, entering manually, returning, reusing a recent,
   and carrying a search query into the manual name. Run it and compare a fresh
   built render to the stored PNG; the old `add_food_opened_dark.png` conflicts
   with the intended new render and the ticket says its replacement is pending.
   Update screenshot/reference-manifest bookkeeping only after inspecting that
   render. This is bounded verification, not another product decision.
2. **Preserve the Train primary/secondary pattern** already expressed in code
   and the entry screenshot; do not introduce three equally primary actions.
3. **Keep all currently required information reachable and keep safeguards/
   uncertainty actionable.** Use grouping, emphasis and progressive detail
   rather than deleting required series, silently changing Simple mode or
   flattening protective explanations.
4. **Disposition existing Add-food proposals explicitly.** The earlier panel
   already supplied step records for MM-218–221; retain them as findings, not
   “unverified because no users were observed.” A product owner may accept,
   revise or decline each. MM-219's first-screen collision has its own
   no-policy-change MM-223 route; remaining behavior still needs the owner.

## Owner decisions needed before changing hierarchy

1. **Dashboard first fold:** reconcile the owner's MM-176 metrics-heavy
   direction and MM-179 chart requirement with the earlier MM-98 and
   `screen-direction.md` summary order. Choose what is prominent vs grouped,
   not what data is removed. Authority: product owner.
2. **Coach:** designate the routine first-read (targets, last change, action,
   or other) and which analyses are supporting detail. Confirm that the
   screen-direction “one next step, if any” is still the policy; safeguards
   remain surfaced. Authority: product owner, with relevant safety review if
   a warning would move.
3. **Food/Add food:** disposition MM-219's estimate visibility, vocabulary,
   found/recent next-step explanation and whether a recent item with a stored
   reference opens an amount step. Do not silently make recents behave like
   database results. Authority: product owner.
4. **Progress:** confirm whether weigh-in remains the dominant first task
   after it has already been entered and how lower-priority strength/recomp
   summaries should appear. Authority: product owner.
5. **Scope and approval:** decide whether each visual hierarchy change needs a
   ticket/proposed sheet; no current `Current` HTML drawing approves a
   redesign. Maintain MM-210/MM-211 bookkeeping and update assets/tests
   together after decisions.

## Phased work and verification

### Phase 0 — establish the actual baseline

- Implementation/QA owner runs `add_food_discovery_test.dart`, captures current
  built Add-food opening/manual/search/no-result states, and reconciles
  source, golden, MM-223 status and `coverage.json`.
- Capture comparable current top-fold and full-scroll renders for all five
  destinations. Label HTML frames as references; do not substitute them for
  renders. This review did not execute tests or inspect a live device.

### Phase 1 — record product hierarchy

- Product owner answers the five decisions above and approves/rejects/revises
  each proposed story, beginning with the concrete MM-219/MM-223 split.
- Add proposed acceptance criteria to MM-224 or linked screen requirements:
  named primary information/action, clear secondary grouping, complete route
  to detail, and explicit preservation of safety/uncertainty/data semantics.
- Keep approved vs exploratory vs proposed sheets separate.

### Phase 2 — ship small, traceable changes

- Start only with approved changes: verify/finalize MM-223; then apply a shared
  hierarchy treatment to the specifically approved Dashboard/Coach/Food
  groups. Do not bundle a broad widget-by-widget restyle.
- Update requirement(s), HTML drawing, `coverage.json`, screenshot/golden
  tests and implementation in the same change. Add regression cases for
  branches (empty/loading/error, no results, active workout, already-entered
  weigh-in, partial/missing records and notice states).

### Phase 3 — review on actual devices and with task measures

- Inspect Android and iOS where supported (the handoff records iOS has not
  been run), narrow and typical widths, light/dark/Martian, default and large
  system text, keyboard-open sheets, safe areas, long scrolls, back/drag exit,
  screen-reader reading order/focus and touch targets.
- Use first-week/new-to-product participants, not simulated panel personas.
  Give realistic tasks for all five destinations: identify what matters/what
  next on Dashboard; find, manually enter or estimate food; explain target vs
  macro-share meaning; locate the Coach next step and its reason; record a
  weigh-in and interpret the trend uncertainty; start/resume/repeat a workout.
- Measure success, first action, time, wrong routes/backtracks, task-specific
  comprehension (including what will be logged and what chart units mean) and
  perceived effort separately. Compare the approved proposal to the current
  render; record sample/context/limits. Do not present a small formative study
  as population incidence or clinical validation.
- Do not introduce telemetry/analytics to collect these measures without an
  explicit privacy/product decision; moderated, consented evaluation with
  synthetic scenarios is sufficient for initial validation.

## Coverage disposition for MM-224

This report supplies an explicit source/render coverage record and a proposed
hierarchy direction; it does **not** satisfy MM-224's “person can tell” criterion
or close the epic. All named app destinations were surveyed; Add food's previous
walk is version-bounded; lower Coach/Progress/Dashboard/Train visuals and device
behavior remain unverified. The epic stays `in-progress` until owner decisions,
current renders, test/device verification and ticket/asset updates are recorded.
