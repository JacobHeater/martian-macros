# Review: Flutter implementation challenge

## Scope and traceability

Role: Flutter/application implementation; bounded source-only challenge of
UX-01 on baseline `44251604bac61bdc5dd9eb69bec045e13f7e2929`.
The consultation inspected selected-day state, tab navigation, Dashboard,
manual sheet initialization/save, repositories and relevant requirements.
Input hashes are in `state.json`.

## Existing facts versus proposals

MM-100 requires Dashboard Add food to log today. MM-38/MM-41 require Food to
continue honoring the viewed historical day; MM-99 retains destination state.
Resetting the selection everywhere would break legitimate Food behavior.

## Audit coverage

Traced Food date selection → selected-day provider → bottom-tab `IndexedStack`
→ shared AddFoodButton → sheet day initialization → manual save → Drift and
fixture repository date handling. Inspected MM-38/40/41/47/99/100 and related
tests. Did not audit catalog, scan, estimate persistence, all app paths or
production database execution.

## Novice mobile experience (when UX/product design is assigned)

Dashboard visibly remains on today while the shared action can use Food's
retained date. A saved record may therefore be absent from the visible day's
totals. No claim about actual novice response was made.

## Findings

### FL-01 — Dashboard manual entry persists Food's retained date

- **Classification:** confirmed MM-100 requirement violation.
- **Severity/confidence:** High for silent wrong-day data; high confidence in
  source route, before parent runtime/widget reproduction.
- **Evidence:** `apps/mobile/lib/src/food/food_day_header.dart:15-19`
  updates selection; `selected_day_provider.dart:7-13` returns selected date
  over today; `apps/mobile/lib/src/app/home_shell_state.dart:63-108` retains
  screens and shares the button; `apps/mobile/lib/src/dashboard/dashboard_screen.dart:56-57`
  displays today's intake; `apps/mobile/lib/src/food/add_food_button.dart:13-19`
  passes `shownDay`; `add_food_sheet_state.dart:51,321-345` saves that date.
  Drift and fixture repositories preserve the supplied date.
- **Expected/observed:** Dashboard Add food saves for today; source path
  supplies the historical date selected in Food.
- **Impact/remediation:** wrong day in records and daily intake. Scope the
  Dashboard action to today; preserve Food's historical entry and the
  Dashboard intake-hero reset behavior.
- **Verification:** source trace only for reviewer. Parent's MM-206 guard
  reproduced the missing-today-record failure; no production database or
  device run.

## Sources and evidence

No external source required for a behavior explicitly specified by MM-100.
This review used local source, requirements and tests only.

## Research

Status: `unnecessary` for this bounded requirement/data-flow question.
Researching health evidence or current external APIs would not change the
required date behavior.

## Confidence and limitations

High confidence in the manual-entry path. Catalog/scan/estimate paths,
day-rollover and resume cases, production DB and user impact were not
verified.

## Acceptance criteria and edge cases

With fixed today, select yesterday in Food, return to Dashboard by bottom
navigation (not intake hero), log a uniquely named manual item, then assert
it exists exactly once today, yesterday is unchanged, and Dashboard totals
increase. Preserve the separate Food historical-save test.

## Dependencies

Implementation owns MM-206; QA runs the integration guard before and after
the fix. UX may evaluate user-facing recovery but no additional product
decision is needed.

## Safety concerns

This is a data-integrity concern; downstream clinical harm was not
established. No personal data involved.

## Unresolved product decisions

None for the required manual Dashboard date. Additional route-specific date
semantics can be reviewed separately.

## Verification

Reviewer: source inspection only, no commands/tests. Parent enabled the
ticketed test and observed the expected failure at
`apps/mobile/test/dashboard_test.dart:206`; the guard is now skipped pending
MM-206.

## Targeted challenges

The parent kept Food's historical selection intact, used bottom navigation
and tested the real add/save integration with fixed-clock in-memory
repositories. This distinguishes a Dashboard-specific fix from clearing
selection globally.
