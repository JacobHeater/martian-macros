# Findings: chair

## Scope and traceability
Chair of run `mm253-hierarchy`: the parent session (Claude Fable 5.1),
also the single edit owner on `feature/mm253-hierarchy`. Froze the brief,
rendered the six destinations of `main` at `9fb8c79` (first viewport,
Martian and Light), assigned the product-designer and UX-accessibility
roles in parallel, saved their reports unchanged, gave every finding an
outcome (`../decision.md`), and built MM-254 to MM-259 with the accepted
ones folded in. Requirements: MM-253 to MM-259; the bugs MM-283 to MM-285
and the tasks MM-286 to MM-289 written from this run.

## Existing facts versus proposals
Facts are the reviewers', by render observation and source inspection,
summarised in `../decision.md`. The chair's own facts: the frame of the
register is fixed at the phone's height, so no capture shows a tail; the
Dashboard's new rows read the workouts before a later screen does, which
changed how the retry tests fake a failed read. Every remediation was a
proposal until built; the table in `../decision.md` says which were.

## Audit coverage
Mode: feature. The chair read both reports in full and compared them for
agreement (they converged on the chip, the coach line, the completeness
control, the uncertainty sentence, the safeguards, the fixture) and
conflict (none of substance). After the build the chair looked at the six
destination stories at 412 by 915 in Martian, Light and Dark and ran the
suite. Not inspected: a device, a screen reader, 200% text, the donut
legend's contrast on the hero, the tails as renders.

## Novice mobile experience (when UX/product design is assigned)
The UX role walked Dashboard, Food and Progress as tasks from source; the
chair did not repeat them and observed no person. The first viewport of
each destination after the rebuild answers its question: calories and the
week's rhythm; the hero and the first meal; the hero and the one thing to
do; the weigh-in, the figure and the chart; Start and the week; the first
two sections.

## Findings
None of the chair's own beyond the two facts above. The reviewers'
findings and their outcomes are the table in `../decision.md`.

## Sources and evidence
None consulted by the chair. The UX report cites one retrieval (the HTML
Living Standard's button content model, accessed 2026-10-13); the
product-designer consulted none and offered one bounded request.

## Research
Status: unnecessary for the chair. Every outcome rests on the repository's
design documents, the tickets and the reports.

## Confidence and limitations
High that the findings were real: two independent reviewers converged on
the top items and the renders confirmed the first-viewport ones. Medium on
what was built against them: the chair is also the edit owner, so this
view is not independent, and nothing below the first viewport or on a
device was looked at.

## Acceptance criteria and edge cases
In each ticket's Progress and in `test/gallery/hierarchy.test.tsx` (the
checkable rules), `test/ui/section.test.tsx` (the section and the strip),
`test/dashboard/rhythmDays.test.ts`, `test/train/workoutGroups.test.ts`,
`test/progress/weightEvents.test.tsx`. Edge cases carried: 360 px for the
strip's seven targets; a due check-in or a fresh report opening its
section; a day without a weigh-in; a sheet with no event chosen.

## Dependencies
MM-109 (custom marks, still deferred); MM-286 (state across tabs, which
the folded sections lean on); MM-288 (the owner's Ember decision, which
the row icon size waits for).

## Safety concerns
None in this scope. The safeguards' placement above the hero and outside
the one-thing rationing is written into the direction and built.

## Unresolved product decisions
Four, listed in `../decision.md` and `../state.json`: Ember text actions
(MM-288), the arc on Coach, numeric settings as sheets, the meal glyph
family.

## Verification
`npx vitest run`: 2,145 passed, 4 skipped, on the branch before its
commit. `mm req` valid; `mm panel` on this run; `mm check` and the pull
request's CI. Renders looked at by the chair as stated under coverage.

## Targeted challenges
The chair asked none in a second round: the two reports did not conflict,
and the choices they left open went to the owner as decisions.
