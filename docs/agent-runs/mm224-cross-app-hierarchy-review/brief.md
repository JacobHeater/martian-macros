# Brief — MM-224 cross-app hierarchy review

- **Task/outcome:** one bounded, read-only review of the product owner's
  “equal-weight cards / too many choices / what do I look at first?” concern
  across Dashboard, Food/Add food, Coach, Progress and Train; record coverage,
  why prior reviews left gaps, and a prioritized direction with owner decisions
  and device/user verification separated. No implementation and no canonical
  requirement edits.
- **Audit mode:** `feature`, existing UI and product-direction audit.
- **Traceability:** MM-224
  (`requirements/usability/EPIC.cross-app-usability-and-hierarchy.MM-224.md`);
  MM-219, MM-223, MM-218–222; MM-176, MM-179, MM-98, MM-49 and MM-47; design
  direction in `design/ux-architecture.md` and `design/screen-direction.md`.
- **Scope/method:** direct Dart-source inspection and stored PNG screenshot
  inspection for the five named destinations. Cross-app areas are **surveyed**,
  not claimed as newly walked: this run has no new step records for Dashboard,
  Coach, Progress or Train. The prior MM-212 Add food task walkthrough is
  reused only as a prior, bounded report; current Add food source and its
  stored opening screenshot disagree, so this run does not call the current
  screen walked or the old render current.
- **Depth signal:** the prior MM-212 Add food brief records source counts of
  67 controls / 155 branches for Add food, 11 / 34 for Coach, 11 / 30 for
  Progress, 5 / 19 for Food and 39 / 70 for workout logging. These are prior
  review counts, not recounted or hash-validated in this run. MM-212 selected
  Add food and workout logging; the owner's current cross-app signal is the
  reason to survey all five named destinations here. Dashboard was not counted
  in that brief.
- **Rendered inputs:** stored screenshot-test PNGs
  `apps/mobile/test/goldens/images/{dashboard_martian,food_martian,coach_martian,progress_martian,train_martian}.png`
  and `add_food_opened_dark.png`. These are rendered artifacts with synthetic
  fixture values, not a live emulator/phone session. The Add food opening
  image shows the former mixed search/manual form; current Dart source and the
  MM-223 drawing show separate discovery/manual states. MM-223 itself says the
  Linux screenshot baseline is pending. No current render of the separated
  opening state was supplied.
- **HTML-reference boundary:** `requirements/ui-ux-assets/views/*.html` was
  read as product documentation only. In particular, the lower Coach,
  Dashboard metrics, Progress detail and deeper Train/workout frames are
  reference-only for visual claims in this review; source confirms those
  widgets/ordering, but the supplied PNGs do not render those lower states.
  HTML is not treated as a built-screen render or approval.
- **Not inspected:** all states and widgets in each destination, screenshot
  test execution, current emulator/device output, iOS, large text, screen
  reader/focus/keyboard behavior, orientation, actual-user task performance,
  and all domains beyond the named information-hierarchy concern.
- **Research:** current general-web discovery/retrieval was not available on
  this session's tool surface. A delegated research attempt failed at the
  harness depth limit. The report reuses the prior MM-205 chair's retrieved
  public research (accessed 2026-10-10), marks the applicability limits, and
  does not claim fresh search or direct access in this run.
- **Baseline/provenance limits:** this session had no Git/status/hash tool.
  Current branch, commit, dirty-tree state and SHA-256 input hashes are
  therefore unavailable; none are invented. Existing run reports state their
  own earlier commits. No tests or commands were run.
- **Ownership:** no implementation edit owner; report artifacts only in this
  directory. No specialist review or new panel was run, per request.
