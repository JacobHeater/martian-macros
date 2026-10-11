# Review: QA & verification challenge

## Scope and traceability

Role: QA & verification; bounded read-only challenge of UX-02 and separate
review of PD-01's stored golden. Baseline application commit:
`44251604bac61bdc5dd9eb69bec045e13f7e2929`. Inspected
`design/interaction-and-motion.md`, `design/screen-direction.md`, MM-48 and
MM-180, `MealSection`, `FoodEntryTile`, edit form, related widget tests and
the Dashboard golden/FAB layout. Input hashes are indexed in `state.json`.

## Existing facts versus proposals

The interaction direction says gestures are accelerators only and each has
a visible alternative; the meal row direction specifically calls for a
visible overflow deletion alternative and Undo. MM-48 describes swipe
deletion recovery but does not replace that visible control. A runtime
semantic dismissal, if present, would not satisfy a visible-alternative
requirement.

## Audit coverage

Inspected the meal-row/edit deletion path and focused test coverage. Separately
inspected the stored Dashboard golden and source placement of FAB over
scrollable content. No broad app scan, commands, tests, current build render,
screen reader, keyboard or switch-access test was run by the reviewer.

## Novice mobile experience (when UX/product design is assigned)

A novice who taps an entry to edit sees no visible Delete control and may not
discover swipe. The Dashboard golden shows the Add food FAB above the lower
macro label/caption; this is visible occlusion rather than a card-count
preference. Runtime effects and user reactions were not measured.

## Findings

### QA-01 — Missing visible deletion alternative is a confirmed violation

- **Classification:** confirmed repository design-rule violation.
- **Severity/confidence:** Medium; high for the inspected source and explicit
  rule, runtime/AT behavior unverified.
- **Evidence:** `apps/mobile/lib/src/food/meal_section.dart:134` uses
  `Dismissible`; row tap edits. The edit form has no Delete control.
  `apps/mobile/test/food_edit_test.dart` covers swipe/Undo but not a visible
  alternative; `meal_cards_test.dart` covers Add controls, not deletion.
- **Expected/observed:** a visible, named action provides deletion without a
  swipe; none was found in row/edit paths.
- **Impact/remediation:** users unfamiliar with swipe lack an apparent
  deletion route. Add a visible per-entry overflow action, accessible name,
  adequate touch target and Undo; retain swipe. Avoid positioning destructive
  action beside Save.
- **Verification:** initial review source-only. Parent enabled MM-207; its
  finder for `More actions for Chicken and rice` found zero widgets, exit 1.
  MM-207 is now ticketed and the guard skipped.

### QA-02 — Stored Dashboard golden shows actual FAB/content overlap

- **Classification:** evidence-supported implementation defect; parent later
  supplied current widget-layout reproduction.
- **Severity/confidence:** Medium; high after bundled-font geometry guard.
- **Evidence:** `apps/mobile/test/goldens/images/dashboard_martian.png`
  visibly shows the FAB obscuring the Fat label; `HomeShellState` positions
  the FAB in the Scaffold above independently scrolling Dashboard content.
- **Expected/observed:** action available without covering chart content;
  golden shows overlap.
- **Verification:** reviewer only inspected image/source and did not run
  current UI. Parent geometry test with bundled production fonts failed on
  overlap. Windows fallback-font run passed and was not accepted as
  disconfirmation. Ticket MM-208; guard skipped pending UI fix.

## Sources and evidence

The deletion criterion is local design evidence; no external evidence is
needed to establish the visible route gap. The chair separately retrieved
W3C Pointer Gestures guidance, recorded in `findings/research.md`. External
guidance informs accessibility follow-up but does not supersede the
repository's more specific visible-control direction.

## Research

Status: `unnecessary` for the bounded finding classification, which is
explicit in repository design and source. The platform-specific question of
whether the pinned Flutter `Dismissible` exposes a semantic dismiss action
remains open; the API page fetched by the chair describes drag dismissal but
does not document that semantic behavior. No claim about runtime semantics
is made.

## Confidence and limitations

High confidence that no visible delete control exists in inspected paths.
No runtime, screen-reader, keyboard, switch-access or device behavior was
certified. Golden image is a stored artifact; the parent separately
reproduced overlap in a font-calibrated widget layout.

## Acceptance criteria and edge cases

Without swiping, find a visible per-entry action, delete, verify removal,
then Undo and verify the original entry/date/macros. Keep existing
swipe/Undo coverage. Verify accessible name, 48 dp target, focus and
activation with TalkBack/VoiceOver/keyboard/switch access.

## Dependencies

Flutter/product design own control placement/semantics; QA owns the
non-gesture regression, undo and compatibility checks. A Flutter/platform
source/runtime check is still needed for semantic dismissal.

## Safety concerns

Destructive actions need recovery and must remain distinguishable from
high-frequency save. No personal data was involved.

## Unresolved product decisions

None on whether the visible alternative is required; repository design
direction is explicit. Exact visual affordance remains an implementation
choice.

## Verification

Reviewer ran no commands/tests. Parent observed three expected
failing-before probes: MM-206, MM-207 and MM-208 with production fonts.
Focused affected test files later passed with the three tracked guards
skipped. Runtime platform accessibility remains unverified.

## Targeted challenges

QA's initial challenge confirms UX-02. Its targeted follow-up found the
stored PD-01 overlap in the golden/source but correctly did not call that an
independent runtime reproduction.
