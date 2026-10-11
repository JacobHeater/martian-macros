# Decision: bounded novice mobile-experience audit

The panel behavior changes and findings are limited to what the audit actually
supports. Do not equate cards or visible metrics with proven cognitive
overload. MM-176 requests a metrics-heavy Dashboard, and MM-179 requires all
three macro-energy shares in Simple mode. Preserve that behavior unless the
product owner changes the policy.

## Accepted findings and disposition

- **UX-01 / MM-206 — Dashboard logs against Food's retained historical day.**
  Confirmed MM-100 violation and reproducible implementation defect. The
  bounded Flutter source trace showed `shownDay(ref)` reaches manual save;
  the owner enabled the integration guard and observed the new entry absent
  from today (`WhereIterable<FoodEntry>: []`, expected one). Keep Food's
  historical-day logging intact; Dashboard's action must target today.
- **UX-02 / MM-207 — meal deletion has no visible non-gesture route.**
  Confirmed violation of the repository's explicit visible-alternative
  interaction direction. QA independently corroborated the criterion. The
  owner enabled the widget guard and reproduced the missing per-entry actions
  control. Add a visible, named and adequately sized alternative with Undo;
  preserve swipe as an accelerator.
- **PD-01 / MM-208 — Dashboard FAB overlaps lower macro-chart content.**
  The stored Martian golden and independent QA review support the finding.
  The owner reproduced the overlap in the geometry guard after loading the
  bundled production fonts; without those fonts the Windows test's fallback
  metrics did not reproduce it. At audit close, the guard was skipped pending
  the fix; it is now enabled and passes after the action moved to the app bar.
  Keep the one-tap action, but do not cover chart labels/content.
- **UX-03 — Food/search may conflate unavailable data with empty data.**
  Evidence-supported concern from source inspection; no injected provider
  failure was run. Do not call it a reproduced defect or create a ticket until
  an owner-run delayed/error-state verification confirms the behavior.
- **UX-04 / PD-02 — Simple detail has conflicting scope.**
  Requirement/documentation gap, not a confirmed violation. MM-49 describes
  Simple as calories and protein; MM-179 explicitly keeps all three pie
  shares. No chart change was authorized; the follow-up preserves the full
  chart required by MM-179.
- **UX-05 — route/metric interpretation burden.**
  Unverified hypothesis. Research supports investigating food-entry friction
  generally but does not demonstrate that this interface confuses novices.
- **PD-03 — Add-food sheet presents several routes and the manual form.**
  Design/usability improvement candidate based on source inspection only.
  No sheet render or novice task observation was made. Verify the first-view
  sheet before proposing a flow change.

## Research synthesis

UX and Product Designer direct browsing was blocked, then chair-delegated
research was completed through a browser-backed research surface. Official
accessibility documents support accessible alternatives, feedback, and text
scaling, but do not determine nutrition hierarchy. Food-journaling studies
support investigating search/portion/choice friction in mixed or experienced
populations; none directly tests progressive disclosure for novice food
logging or the Dashboard's macro-chart prominence. Retain a novice
comprehension test as the right future verification, not an evidence-backed
UI prescription. Full provenance and limitations are in `findings/research.md`.

## Scope and ownership

The Product Designer and UX roles each inspected a bounded existing journey
and returned distinct visual-design and task-flow reports. QA and Flutter
provided source-bounded challenges.

## Implementation follow-up

After reviewing these recommendations, the owner directed implementation of
the three ticketed findings. MM-206 now routes Dashboard Add food to today
while preserving selected-day logging from Food. MM-207 adds a named,
48-by-48 More actions trigger with Delete and Undo while retaining swipe.
MM-208 moves the labeled Dashboard action into the app bar so it does not
overlay chart labels. Enabled widget tests verify the behavior, including
1.5x text-scale chart-label reachability. These are separate app fixes, not
changes to the MM-205 role-guidance scope.

No Simple-mode chart policy change was made; the full macro split required by
MM-179 remains. No emulator, native screen-reader, or novice-user study was
performed. The exact test outcomes and remaining limitations are in
`state.json`.
