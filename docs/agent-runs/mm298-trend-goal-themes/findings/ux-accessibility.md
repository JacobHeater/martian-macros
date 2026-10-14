# Review: ux-accessibility

Transcribed by the chair from the read-only subagent's hand-back, 2026-10-14. The reviewer wrote under the template's headings; every finding, severity, piece of evidence and fix is kept, and some sentences are condensed.

## Scope and traceability
Role ux-accessibility, the UX guard, run `mm298-trend-goal-themes`; read-only, no edits, commands or delegation. Read AGENTS.md, agents/roles/ux-accessibility.md, agents/panel-protocol.md, agents/review-contract.md, agents/templates/findings/role.md. Requirements: MM-298, MM-299, MM-297; prior run `mm291-weigh-in/decision.md`; the brief. Code (uncommitted working tree on `fix/dashboard-split-weighin-storybook`): DashboardScreen, WeighInRow, MmListRow, NumberEntry, MmTextField, MmButton, MmSection, MmListGroup, ui.css, tokens.css, CoachScreen, OneThingRow, CoachSnapshot.ts (line 30), Today and Coach stories, the first-day and not-weighed scenarios, OnboardingScreen (220–237), greps of `kind="secondary"` and disabled `onPress`. Captures: the chair's r2 set. SHA-256 not computed.

## Existing facts versus proposals
Facts: before the weigh-in the row shows "Weigh-in", `Last trend …`, and a NumberEntry named "Today’s weigh-in" whose description holds the error, unit and hint; the row's title and subtitle are not tied to the field. After, the title is the trend and the subtitle `Trend · Today X · 7 days Δ`, or `—` with no point from 8 days back. The trend has one point per day from the first weigh-in (`CoachSnapshot.ts:30`), so one weigh-in already makes a trend. Disabled buttons: no fill, `--text3` label, primary and secondary with a 1 px `--outline`. The field: `--outline-strong` border on `--sunken`, on a `--surface` group. Coach order: cautions, pause, under-eating, relief, hero, flags, Goal with "Change", OneThingRow, rest; `MmSection` puts `trailing` after its h2. No test mentioned MM-297, MM-298 or MM-299. Proposals are the remediations under Findings.

## Audit coverage
Mode change. Walked: the morning weigh-in before and after; the Coach reading order. Surveyed: disabled primaries and secondaries app-wide (onboarding Next, WaistEntryCard, RecipeIngredientAdder, TermsGuardScreen), the States story. Not inspected: typed, invalid and refused row states; First Day render; Coach with OneThingRow; 360×740 (out of scope); 200% text; reduced motion; TalkBack. Methods: source, static renders, contrast computed by hand from token hex values.

## Novice mobile experience (when UX/product design is assigned)
Novice on day 2, task: record today's weight and see that it counted.
1. Sees "Weigh-in", "Last trend 189.6 lb", an empty field with "lb", an outlined Save and the hint. On day 2 the last trend is yesterday's single weigh-in, so "Last trend" likely reads as "my last weight". Where to type is clear. Pass with interpretation work (UX-3).
2. Taps Save before typing: nothing happens visually (a screen reader announces it dimmed). Weak pass (UX-4).
3. Types: Save fills Ember; Enter saves. Pass (typed state not drawn).
4. Saves: the snack, then "184.1 lb" with "Trend · Today 183.9 lb · 7 days −0.6 lb". Which number is "my weight"? The large figure is not what they typed and its name is the first token of a dotted line. Degrades (UX-1).
5. Day 1 (from code): "189.6 lb" / "Trend · Today 189.6 lb · 7 days —": the same number twice and a bare dash (UX-2).
Coach: visual and DOM order match; the Change button is heard as just "Change", under a notice about "This week’s change" (UX-7).

## Findings
**UX-1 (should, dashboard):** after a weigh-in the headline is the trend while the person typed another number; "Trend" names it only as the first token of the subtitle (`DashboardScreen.tsx:150-151`); heard "184.1 lb, Trend, Today 183.9 lb, 7 days minus 0.6 lb". Fix: title "Trend 184.1 lb", subtitle "Today 183.9 lb · 7 days −0.6 lb". Acceptance: the headline names Trend; today's entry appears once after "Today".

**UX-2 (should, dashboard):** with one weigh-in the trend has one point, so day 1 shows the same value twice and "7 days —"; the "no trend" branch looks unreachable and MM-298 scenario 3 claims an undrawn story. Fix: drop "7 days" when there is no week-ago point; with fewer than N trend points say today's weight without a trend label; correct scenario 3. Acceptance: a First Day render shows no bare dash and no duplicate value.

**UX-3 (could, dashboard):** "Last trend" above an empty field may anchor the entry (hypothesis, to measurement); the subtitle is not heard from the field. Fix: "Trend so far 189.6 lb"; add the subtitle to the field's description.

**UX-4 (should, design system):** a disabled primary is an outlined button with a legible label, the shape of an enabled secondary. Martian: border 2.06:1 vs 5.66:1; label `--text3` 7.6:1 vs `--text` about 17:1. Disabled secondaries (WaistEntryCard, RecipeIngredientAdder) differ from enabled only by lightness; onboarding's disabled Next, the first screen a novice meets, looks pressable. Not blocking: the state is exposed (`disabled`), disabled controls are exempt from SC 1.4.3 and 1.4.11, and the ready state's Ember fill is unmistakable. Fix: a disabled label emphasis well below `--text3`, or a dashed or absent border; add Secondary / Disabled to States. Acceptance: in a grayscale capture of States in three palettes, disabled and enabled are told apart for both kinds.

**UX-5 (could, design system):** no defect; MM-297's "differ in fill or outline at a glance" is met by outline (narrowly in Dark; clearly in Light).

**UX-6 (could, design system):** SC 1.4.11 field boundary, `--outline-strong` against `--surface`: Martian 5.66:1, Light 3.55:1, Dark 3.33:1, all pass; inner side against `--sunken`: Martian 6.04, Light 3.00, Dark 3.45. Margins are thin and no test asserts them. Fix: a token test asserting `--outline-strong` ≥ 3:1 against `--surface`, `--raised` and `--canvas` in every palette.

**UX-7 (should, coach):** the Goal action is heard as "Change" with no object, under a notice about "This week’s change". Fix: visible "Change goal" (preferred) or an accessible-name prop. Acceptance: the name contains "goal".

**UX-8 (could, coach):** OneThingRow now follows the static Goal (the owner's call, accepted); comments in `CoachScreen.tsx:75-80` and `Coach.stories.tsx:11-16` describe the old order; no story draws Coach with the one thing due. Fix: update both comments and add the story.

## Sources and evidence
- W3C, Understanding SC 1.4.11: Non-text Contrast, https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html, accessed 2026-10-14: 3:1 against adjacent colors; inactive components exempt; adjacent means outside the component; a border that identifies an input must meet 3:1. Ratios are the reviewer's calculations, not rendered measurements.

## Research
Performed, narrowly: what SC 1.4.11 requires of field borders and disabled controls, on the brief's request; WebFetch direct, no discovery search. Not researched: platform conventions for disabled buttons.

## Confidence and limitations
Medium overall; static captures; no First Day, typed, error or Coach-with-one-thing render; no TalkBack, scaling or device; contrast by hand; no input hashes; a single reviewer, independent of the product designer.

## Acceptance criteria and edge cases
MM-298 scenarios 1 and 2 match; 3 likely unreachable or undrawn (UX-2). MM-297 met on outline and contrast but not tested (UX-5, UX-6). MM-299 matches. Proposed: UX-1, UX-2, UX-6, UX-7, UX-4 acceptance lines. Edge cases: large text wrapping, kg, a gain as "+", a paused week, weighed today with no trend.

## Dependencies
product-designer: the disabled visual (UX-4) and copy (UX-1, UX-3). react-capacitor: an accessible-name prop if not visible (UX-7). Chair request to measurement: does showing the prior trend directly above the field risk anchoring self-entered weights, and should it be hidden until a minimum number of trend points? QA: a First Day render and a test for scenario 3.

## Safety concerns
None found. Repeatedly seeing the trend could feed compulsive weighing in vulnerable users; for the safety role. Not clinical clearance.

## Unresolved product decisions
Trend or today's entry as the headline (owner chose trend; UX-1 asks only that it be named). Goal before the due one thing (owner decided; recorded). The disabled visual (UX-4).

## Verification
Source inspection and supplied captures only; no tests, commands, runtime, assistive technology or device. Requested: First Day in three palettes, States with a disabled secondary, a Coach story with the one thing due, the token contrast test.

## Targeted challenges
None yet.

GUARD PASS
