# Review: product-designer

Transcribed by the chair from the read-only subagent's hand-back, 2026-10-14. The reviewer wrote under the template's headings; every finding, severity, piece of evidence and fix is kept, and some sentences are condensed.

## Scope and traceability
Role product-designer (read-only), run `mm298-trend-goal-themes`. Read AGENTS.md, agents/roles/product-designer.md, agents/panel-protocol.md, agents/review-contract.md, agents/templates/findings/role.md. Requirements: MM-298, MM-299, MM-297. Inputs: the brief, `docs/agent-runs/mm291-weigh-in/decision.md`, `design/screen-direction.md`. Code (uncommitted working tree on `fix/dashboard-split-weighin-storybook`): DashboardScreen.tsx (83–151), WeighInRow.tsx, MmListRow.tsx, CoachScreen.tsx (130–216), OneThingRow.tsx, ui.css (13–66, 285–358, 455–470, 1236–1245), tokens.css, StatesCatalog.tsx (46–55), CustomFoodForm.tsx (117–176), greps of `kind="secondary"` and `disabled=`. Renders at 412×915 (the chair's r2 captures, plus the two before captures). Input hashes not computed (no command access).

## Existing facts versus proposals
Facts: every disabled `.mm-button` had a transparent fill, transparent border and `--text3` label; disabled primary and secondary added a 1 px `--outline` border; an enabled secondary has `--outline-strong` and `--text` (`ui.css:35-38`), so a disabled primary differed from an enabled secondary only in stroke contrast and label tone, and disabled primary and secondary were identical. Light `--text2` #46526b vs `--text3` #5a6680 are close. Before the weigh-in the subtitle was `Last trend …` (`WeighInRow.tsx:24`); after, the trend title with ``Trend · Today … · 7 days …`` (`DashboardScreen.tsx:150-151`). Coach order: cautions, pause, under-eating, relief, hero, flags, Goal (Ember "Change"), OneThingRow, rest. Rule 7 still said Coach's first viewport is "the hero and the one thing to do". MM-297's text said `--text2`; the code used `--text3`. The States register drew no disabled secondary or text. In the rendered Coach story OneThingRow rendered nothing. Proposals are only in Findings.

## Audit coverage
Mode `change`: the weight row in both states, the Coach order, the disabled styles in three palettes. Rendered: the r2 captures. Source only: the no-trend branch, Dark after-state, Dark States, Coach in Light and Dark, CustomFoodForm, the confirm dialog. Not inspected: other stories, NumberEntry internals, tests, 360×740 (out of scope by the owner). Referrals: ux-accessibility (border contrast, inert affordance); measurement/coaching (anchoring).

## Novice mobile experience (when UX/product design is assigned)
Surveyed, not a formal step record. Task A (weigh in): the field reads as a field in Light; in Martian and Dark both are dark outlined rectangles told apart by stroke, "lb" and the word Save; better than before. In Light the inert Save's label looks like an available secondary, so a person may tap it first (PD-2, analytical). "Last" may read as "previous" (PD-6). Task B (glance after weighing): two numbers 0.2 lb apart; "Trend · Today 183.9 lb" parses as "the trend today is 183.9"; the waist row's "Waist · Today" uses Today as a date (PD-1). Task C (goal on Coach): easy to find; its cost to the one thing to do is not drawn (PD-3). Cautions stay above the hero in full.

## Findings
**PD-1 (should, medium): "Trend · Today 183.9 lb" can be read as the trend's value today.** `DashboardScreen.tsx:151`. Alternatives: today's entry as a trailing value (rejected: two weights at opposite ends, the trailing slot holds the chevron); in the subtitle (right place, wrong words); a second subtitle line (fallback). Fix: name the entry with a verb and keep the trend facts together, e.g. "Trend · −0.6 lb in 7 days · weighed 183.9 today", one line at 412 in all palettes; update MM-298 scenario 2.

**PD-2 (should, medium): the disabled primary reads as an enabled secondary, most in Light.** `ui.css:55-66`, tokens. Same shape, radius and height; differs only in stroke and label tone; Martian label #baa4d3 still bright; in CustomFoodForm an enabled secondary above a disabled primary read as two secondaries. Alternatives: outline (best base); lighter neutral fill (recreates the field look-alike; Ember tint barred); hidden until typed (rejected as a global rule). Fix: keep the outline, give the inert label a clearly quieter tone in every palette (e.g. a disabled text token below `--text3`; SC 1.4.3 exempts inactive components). Proposed acceptance: "Given an enabled secondary and a disabled primary side by side, in each palette, Then they differ in label tone at a glance, not only in stroke."

**PD-3 (should): Goal-first conflicts with rule 7, and its cost to the one thing to do is not drawn.** `CoachScreen.tsx:159-167`. Estimate: with one flag a two-line one-thing row falls at about y 770–850, at the nav. Fix: amend rule 7 and the register row; add a Coach story with the recovery check-in due and a flag; if it falls under the fold, PD-4.

**PD-4 (could): the Goal section is heavier than its fact.** A heading, a static blurb on every visit, and Ember "Change". Rejected alternative: the goal in the hero (shared component, would say two things). Fix: one `MmListRow` (flag, "Fat loss", "Goal · …", opens the chooser), drawn in the story first.

**PD-5 (should): MM-297's text and the States register do not match what is built.** Fix: state the built rule in MM-297 (outline, inert label tone, primary and secondary, no border on text), add PD-2's acceptance, add Disabled cells after Secondary and Text in States, render States in Dark.

**PD-6 (could): "Last trend" is ambiguous, directly above an empty field.** `WeighInRow.tsx:24`. Fix: "Trend 189.6 lb" or "Trend so far 189.6 lb"; placement per the anchoring request.

**PD-7 (could): the Light field border is about 3.0:1 against `--sunken`.** #7c88a3 L≈0.245 vs #e8ecf5 L≈0.838 ≈ 3.00:1; against white ≈ 3.56:1. Fix: measure and record in MM-297; a later lightening breaks SC 1.4.11.

## Sources and evidence
- Flutter gen_defaults, `button_filled.json` (Material 3 tokens), https://flutter.googlesource.com/mirrors/flutter/+/HEAD/dev/tools/gen_defaults/data/button_filled.json, accessed 2026-10-14: an M3 disabled filled button keeps an onSurface container at 0.12 opacity and an onSurface label at 0.38. This is a platform convention, not usability evidence.
- W3C, Understanding SC 1.4.3 Contrast (Minimum), WCAG 2.2, https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html, accessed 2026-10-14: text in an inactive component has no contrast requirement (its own example is a submit button that cannot be activated yet).

## Research
Performed, limited: the convention for disabled primaries and the exemption for inert labels, triggered by the brief's request to weigh alternatives. WebSearch for discovery, WebFetch direct; the m3.material.io page returned only its title, so the Flutter token source was used. No human-factors research on outline vs fill.

## Confidence and limitations
Medium. Several states were reviewed from source only; no measured contrast (PD-7 by hand); no input hashes; fold positions estimated from pixel positions; a single reviewer.

## Acceptance criteria and edge cases
MM-298 scenarios 1–3 are met by code (3 not rendered); MM-299 is met; MM-297's first clause is met in Light and narrowly in Martian and Dark, its 3:1 clause unmeasured. Proposed: PD-1's one-line wording; PD-2's label tone; PD-3's Coach story. Edge cases: long deltas and kg; the hide-weight preference (not inspected); no week-ago trend showing "7 days —".

## Dependencies
ux-accessibility: PD-2, PD-7, whether Save is announced as unavailable. Chair request to measurement (and coaching): does showing the prior trend directly above an empty weigh-in field risk anchoring the number typed, and should it move below the field or after save? Chair request to safety/coaching: does a first-section "Change" goal raise a concern about frequent goal switching (a change already routes through HealthRecheckScreen)? react-capacitor if PD-2 adds a token.

## Safety concerns
None within the visual remit; the cautions stay above the hero. The anchoring and goal-switching questions are routed above. Not clinical clearance.

## Unresolved product decisions
PD-1 wording; PD-2 whether to add a disabled label token and its values; the rule 7 rewrite and the Goal shape (PD-3, PD-4).

## Verification
Source inspection and the chair's PNGs only; no commands, tests or Storybook. Requested renders: Dashboard after in Dark, First Day, States in Dark with the new cells, a Coach story with a due one thing and a flag, CustomFoodForm, all after PD-1 and PD-2.

## Targeted challenges
None yet.

APPROVE WITH CHANGES
