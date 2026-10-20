# Review: ux-accessibility

## Scope and traceability
- Role: UX & accessibility (the UX guard), one round, read-only, no edits, no commands, no delegation. Reviewer: Claude Code subagent, run `docs/agent-runs/mm250-sleep`, 2026-10-20.
- Repository: worktree `/Users/jacobheater/dev/mm-wt/sleep`. Baseline per the brief: `feat/m2` at 24130ec, working tree uncommitted. The reviewer could not run `git`; hashes not computed (the chair records them in `state.json`).
- Requirements inspected: `requirements/sleep/STORY.a-night-of-sleep-recorded.MM-250.md`, `requirements/sleep/STORY.the-coach-reads-sleep.MM-252.md`, `requirements/sleep/EPIC.sleep.MM-249.md`.
- Protocol inputs read in full: `AGENTS.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/roles/ux-accessibility.md`, `agents/templates/findings/role.md`, `docs/agent-runs/mm250-sleep/brief.md`, `design/screen-direction.md` (rule 9 and the states section), `design/anti-cruft-and-anti-slop.md`.
- Implementation inputs read in full: `apps/mobile/src/progress/SleepNightCard.tsx`, `apps/mobile/src/ui/MmDurationField.tsx`, `apps/mobile/src/coach/RecoveryCard.tsx`, `apps/mobile/src/coach/RecoveryCheckInScreen.tsx`, `apps/mobile/src/coach/ReliefOfferCard.tsx`, `apps/mobile/src/format/reliefOfferText.ts`, `shortSleepText.ts`, `sleepDurationText.ts`, `apps/mobile/src/ui/MmChoiceChip.tsx`, `MmTextField.tsx`, `MmSection.tsx`, `MmButton.tsx`, `StatRow.tsx`, `Notice.tsx`, `MmPressable.tsx`, `apps/mobile/src/progress/PeriodDaysCard.tsx`, `WaistEntryCard.tsx`, `apps/mobile/src/domain/SleepNight.ts`, `apps/mobile/src/engine/SleepRule.ts`, `sleepAverageOf.ts`, `findReliefOffer.ts`, `apps/mobile/src/state/Loadable.ts`, `mergeSleepNights.ts`, `apps/mobile/src/healthIngest/nightlySleep.ts`, `apps/mobile/src/gallery/screens/shortSleepScenario.ts`, `healthPlatform.ts`; in part: `AppState.ts`, `ProgressScreen.tsx`, `CoachScreen.tsx`, `MmOverlays.tsx`, `Fmt.ts`, `Progress.stories.tsx`, `Coach.stories.tsx`, `progress.css`, `ui.css`, `app.css`, `coach.css`, `theme/tokens.css`.
- Tests read in full: `apps/mobile/test/progress/sleepEntry.test.tsx`, `apps/mobile/test/coach/sleepOnCoach.test.tsx`, `apps/mobile/test/coach/recoveryCheckIn.test.tsx`; `apps/mobile/test/ui/fieldErrors.test.tsx` lines 11-32 by grep.
- Render: the Storybook stories, read from source only. **No browser, emulator, device, screen reader or text-scaling run exists in this session.** Every "heard" statement below is inferred from the DOM the components render; every "at large text" statement is inferred from the CSS. Neither is an observation.

## Existing facts versus proposals
Repository facts (cited):
- The Sleep section is an `MmSection` with icon `sleep`, title "Sleep", a summary line, collapsible, open only while last night is unrecorded (`SleepNightCard.tsx:84`). Summary: "Last night not recorded yet." or "Last night 7 h 20 m[, from Watch]." (`:72-75`).
- Fourteen chips, labelled "Last night", "The night before", then `Fmt.day` ("Sat, Oct 17"), each with " · 7 h 20 m" when recorded (`:59, :93`); one chip is selected; selecting resets typed text (`:95-98`). `MmChoiceChip` is a `<button aria-pressed>` with the check icon `aria-hidden` (`MmChoiceChip.tsx:13-25`).
- Two dense number fields in a `role="group"` named for the picked night (`MmDurationField.tsx:23`), each `MmTextField` with label "Hours"/"Minutes", `name` "<night>, hours"/"<night>, minutes", suffix "h"/"m", `inputMode="decimal"`, Enter submits when ready (`MmTextField.tsx:83-98`).
- Validation: "Up to 24 hours." when hours > 24 or unparsable; "Minutes from 0 to 59." otherwise (`SleepNightCard.tsx:49-51`); the error is passed to the hours field only (`MmDurationField.tsx:31`); `MmTextField` renders it with `role="alert"`, `aria-invalid`, `aria-describedby` (`MmTextField.tsx:86-88, 106-110`).
- Save: secondary `MmButton` label "Save", name "Save night", disabled until a changed, valid total within 1..1440 minutes (`:54-57, :111`). Saving blurs the focused element, writes a typed `SleepNight`, and on failure shows the snack "Could not save the night. Please try again." (`:61-69`); the snack host is `role="status" aria-live="polite"` (`MmOverlays.tsx:223`). Nothing is announced on success.
- Note under the fields: "N of the last 14 nights recorded." with, when the picked night is imported, "<night>: 6 h 52 m from Watch. A night you type is used instead." or, when any night is imported, "... A night you type is used instead of one read from Health Connect." (`:79-81`).
- A typed night replaces an imported one for the same day and the import is kept unused (`mergeSleepNights.ts:37`; test `sleepEntry.test.tsx:77-97`).
- The `sleepNights` cell carries a failed typed read as failed (`AppState.ts:528-535`); `SleepNightCard` returns `null` while not ready, failed or loading (`:41`); `sleepAverage` is undefined in either case; `retryCoach` does not include `typedSleep`; the Coach's `ReadFailedNotice` sources do not include sleep (`CoachScreen.tsx:116`).
- Coach: `RecoveryCard` summary appends "Sleep 6 h 50 m over 12 nights." (`RecoveryCard.tsx:45`); `StatRow` label "Sleep, last 14 nights", value "6 h 50 m" or "Not recorded", detail "12 of 14 nights recorded" or "No nights recorded yet" (`:46, :52-56`).
- Offer: `Notice` with icon `heart`, title "Two weeks of short sleep", body `shortSleepText` + suggestion sentence; buttons "Take a maintenance week", "Slow to <pace>", "Carry on", the primary chosen by `offer.suggestion` (`ReliefOfferCard.tsx:24-57`, `reliefOfferText.ts:44-50`).
- Check-in: `SectionLabel` "Typical hours of sleep (optional)", `MmDurationField` named "Typical hours of sleep", pre-filled from `sleepAverage` by `fieldsOf` (`RecoveryCheckInScreen.tsx:22-25, :38, :92-98`), caption "Your average over the last 14 nights, from N recorded. Change it if that is not typical." (`:99-101`); no error prop; an out-of-range value is saved as `sleepHours: undefined` (`:58`).
- `MmTextField` composes label and name when the name does not contain the label, case-sensitively: label "Reps" + name "How many" is heard "Reps, How many" (`MmTextField.tsx:61`; pinned by `fieldErrors.test.tsx:26-31`).
- Stories: `SleepNotRecorded`, `SleepRecorded`, `SleepFromWatch`, `SleepMistyped`; `CoachShortSleep`, `CoachSleepLine`, `RecoveryCheckInNoNights`, `WhyYourTargetsShortSleep`. No sleep loading or failed-read story; the sibling weight-events section has both.
- Sibling facts the brief misstates: `WaistEntryCard` puts its three fields in one row and its Save *under* them beside the note (`WaistEntryCard.tsx:60-77`, `progress.css:24-41`), not "beside" the fields. The Sleep entry puts Save beside the fields in a non-wrapping row (`progress.css:66-74`).

Proposals: everything under "Findings" marked remediation, and the proposed criteria under "Acceptance criteria and edge cases". Nothing here is promoted to a requirement.

## Audit coverage
Mode: change. Inspected: the files above; the three tests; the four MM-250 and four MM-252 stories; rule 9 and the states section of the direction. Not inspected: the engine thresholds and `shortSleep` (brief: not reviewed), `HealthImporter` and the Settings health rows, the native plugins and schema, `TargetChangeSheet` (story read only), `SectionLabel`, `MmSegmented`, `ReadFailedNotice`, `Overlays.snack` beyond the host. Evidence methods: source inspection and DOM inference only; no runtime reproduction, no test run, no render. Cross-domain referrals: product-designer (F9, rule 9), react-capacitor (F1, F3, F5 component changes), QA/edit owner (running the tests named in F1 and the stories at large text). Blocked verification: text scaling, TalkBack/VoiceOver, contrast, the stories in the three palettes.

## Novice mobile experience (when UX/product design is assigned)
Person: someone a few weeks into the app, phone in hand, who has never recorded sleep, with a screen reader on and text at the largest size. Goal: record that they slept 7 h 20 m two nights ago, and know it is kept. Second goal: on Coach, understand what the coach is saying about their sleep and that nothing changed by itself. Evidence basis: analytical walkthrough from source; every "heard" is DOM inference; every "at large text" is CSS inference.

### Walked: Progress, Sleep section (depth target)
1. **Find Sleep on Progress.** Hears: heading level 2 "Sleep", then a button "Sleep Last night not recorded yet., expanded". On a first visit the section is already open. Passes.
2. **Read the line and the caption.** The caption carries exactly the two things a novice would otherwise guess wrong (in-bed vs asleep; which day a night belongs to). Passes; useful context, not narration.
3. **Tell which night a chip is.** Fourteen chips, the first selected (surface plus the check: two signals, not colour alone). Hears "Last night, toggle button, pressed"... Must interpret: "Sat, Oct 17" is the morning the night ended on; the caption just said so. Passes.
4. **Tell that a chip's hours are what is recorded.** A chip with hours is a recorded night; a bare one is not. The contrast carries it without a legend. Whether "·", "h" and "m" are spoken sensibly is a device question (**F8**, hypothesis). Passes visually; unverified aurally.
5. **Pick "The night before".** The fields' group is now named "The night before" and the fields clear or fill with that night's value. Sighted at large text: the selected chip may be two or three rows above the fields, and nothing in text beside the fields names the night unless it is imported. Passes for the screen reader; weak for the sighted novice at large text (**F10**, low).
6. **Type hours and minutes.** Hears, by `MmTextField.tsx:61`, "Hours, The night before, hours, edit text, h" — the label is repeated because "The night before, hours" does not contain "Hours" (**F1**). `inputMode="decimal"` allows "7.5", kept as 450 minutes: forgiving. Save turns on when the value is valid and changed. Passes, with F1 as a defect in what is heard.
7. **The mistyped state.** 25 hours: "Up to 24 hours." under the hours box, Save stays off. 6 h 75 m: "Minutes from 0 to 59." appears, but under and around the **hours** box (**F3**). 24 h 30 m, or 0 h 0 m: no message, Save simply stays off (**F6**). Partially fails.
8. **Press Save.** Focus is blurred to the document; the record is written; the fields keep showing the value and Save goes off; the picked chip gains the hours; the note count rises. No live announcement on success. **Fails for the screen-reader user, weak for the sighted novice (F2, medium).**
9. **Know which value is kept when a watch's night and a typed one both exist.** The note says "The night before: 6 h 52 m from Watch. A night you type is used instead." and afterwards "... A night you type is used instead of one read from Health Connect." Passes: the rule is stated at the moment it applies and again generally afterwards.
10. **Recovery from a wrong pick.** A night saved against the wrong chip can only be overwritten, not removed (non-goal per brief). Recorded under unresolved product decisions.

### Walked: Coach
11. **The folded line.** "Last answered Yesterday. Sleep 6 h 50 m over 12 nights." Passes. No score, grade or percentage.
12. **The StatRow.** "Sleep, last 14 nights  6 h 50 m" with "12 of 14 nights recorded". "12 of 14" sits above the "Hunger 3 of 5" rows; the word "recorded" prevents the rating reading. Passes.
13. **The check-in's pre-filled fields and caption.** Passes, except: a fractional average can pre-fill "60" minutes (**F5**), and a typed 25 h is silently dropped at Save (**F7**).
14. **The short-sleep offer and its three buttons.** The primary matches the sentence that recommends it; "Carry on" is one tap and uncommented. Passes. The "%" in "Slow to 0.5% a week" is a pace, not a sleep figure; the MM-252 "No score" test scopes to the recovery section, which is right.

### Surveyed (no step record)
`HealthStep.tsx:85-87`, the `WhyYourTargetsShortSleep` story, the Settings health rows (not read).

## Findings

**F1 — Duration fields are heard with the label twice, and the anchored queries in a story and a test should not find them.** Domain: react-capacitor, QA. Classification: reproducible implementation defect (by inspection; not run). Severity: high. Confidence: high (the composition rule is pinned by `fieldErrors.test.tsx:26-31`; `String.prototype.includes` is case-sensitive). Where: `MmDurationField.tsx:25-27, 36-38`; `MmTextField.tsx:61`. Expected: heard "Last night, hours". Observed: `aria-label` = "Hours, Last night, hours". Consequences: redundant names; `Progress.stories.tsx:322` (`/^Last night, hours/`) and `recoveryCheckIn.test.tsx:59, 137` (`/^Typical hours of sleep, hours/`) are anchored at `^` and should not match. Remediation: give the name a form that contains the label (`${name}, Hours`), or make the composition case-insensitive. Acceptance: the hours field's accessible name is exactly "<night>, Hours" in the tests and the story; `fieldErrors.test.tsx` still passes. Verification: not run; the edit owner should run the named tests first.

**F2 — Saving gives no sign to a screen-reader user and drops focus; the sighted sign is weak and far from Save.** Classification: usability problem found by inspection (step 8). Severity: medium. Where: `SleepNightCard.tsx:62, :64-65, :111`. Remediation: a polite snack "Saved: The night before, 7 h 20 m." through the host already used for failure, and keep focus inside the section; or make the note a `role="status"` line naming the saved night (see F10). Acceptance: after Save, a status region contains the saved night and duration; a test asserts it.

**F3 — A minutes error marks the hours box.** Classification: reproducible implementation defect (by inspection). Severity: medium. Where: `MmDurationField.tsx:31`, `SleepNightCard.tsx:51`. Remediation: `MmDurationField` takes the message and which field it concerns. Acceptance: typing 6 h 75 m marks the minutes textbox `aria-invalid` and not the hours one; 25 h does the reverse.

**F4 — A loading or failed sleep read renders nothing on Progress and reads as "Not recorded" on Coach; no story draws either.** Classification: documentation/requirement gap and design-rule violation (`design/screen-direction.md:349-352`, "A failed read is never shown as zero or as an empty success"). Severity: medium. Where: `SleepNightCard.tsx:41`; `AppState.ts:528-535`; `RecoveryCard.tsx:46, 54`; `retryCoach`; `CoachScreen.tsx:116`. Remediation: branch on `Loadable.hasFailed(state.sleepNights)` in both places, add a `retrySleep`, and add `SleepReadFailed` (and `SleepLoading` if drawn) stories. Acceptance: with the sleep store failing, Progress shows the notice inside the Sleep section and Coach's StatRow does not read "Not recorded"; Try again re-reads; `npm run unseen` passes.

**F5 — A fractional average pre-fills "60" minutes.** Classification: reproducible implementation defect (by calculation). Severity: medium. Where: `RecoveryCheckInScreen.tsx:22-25` truncates hours then rounds the remainder; `sleepAverageOf.ts:24` returns an unrounded mean. 419.58 → "6" and "60", while `sleepDurationText` says "7 h". Latent in `SleepNightCard.tsx:22-25`. Remediation: round the total to whole minutes first, then split; one shared helper. Acceptance: 419.58 gives {"7","0"}; 419.4 gives {"6","59"}.

**F6 — Two invalid states disable Save without a word.** Classification: usability problem found by inspection (step 7). Severity: low. Where: `SleepNightCard.tsx:49-57`: a total over 1440 and 0 h 0 m produce no `error`. Remediation: "Up to 24 hours in all." and "Type the hours asleep." Acceptance: the mistyped test adds both and finds the messages.

**F7 — The check-in drops an out-of-range typed sleep silently.** Classification: usability problem found by inspection (step 13). Severity: low. Where: `RecoveryCheckInScreen.tsx:47-58`. Remediation: the same messages as Progress through the `error` prop, Save held while the value is invalid. Acceptance: typing 25 h shows "Up to 24 hours." and the check-in is not saved until fixed or cleared.

**F8 — Chip and line text may be spoken as letters and a symbol.** Classification: unverified hypothesis requiring investigation (device). Severity: low until observed. Where: `SleepNightCard.tsx:93`, `sleepDurationText.ts:11-12`, `RecoveryCard.tsx:45, 54`. Needs one pass with TalkBack and VoiceOver. If confirmed: `MmChoiceChip` gains a `name` prop so the chip can say "Last night, 7 hours 20 minutes".

**F9 — The entry row at large text, and its difference from the Waist sibling.** Classification: unverified hypothesis requiring investigation (render) plus a rule 9 question. Severity: low. Where: `progress.css:66-74` versus `progress.css:24-41`, `WaistEntryCard.tsx:60-77`. Hypothesis: at 200% text the "Minutes" label wraps and `align-items: flex-start` levels Save with the labels, not the boxes. The brief's description of the sibling does not match its code; the written reason rule 9 asks for is owed either way.

**F10 — Nothing in text beside the fields names the night being typed unless it is imported.** Classification: design/usability improvement (step 5). Severity: low. Where: `SleepNightCard.tsx:79-81, :113`. Proposal: lead the note with the picked night in every state: "The night before: not recorded yet. 3 of the last 14 nights recorded."

**No finding** (within scope and method) on: chip naming and the morning rule; which value is kept; the fold and summary semantics; the Save's spoken name; "No score" on Coach; the offer's three buttons; the fields-not-stepper choice. Nothing checked for contrast, reduced motion or palette, which need a render.

**Fields versus stepper (the brief's question).** Two number fields with the decimal keyboard are right for a value entered once a day with up to 1440 distinct answers; a stepper would need many presses; no other entry uses one. The ticket's phrase "the same stepper the other entries use" describes nothing in the app and should be corrected so the requirement and the build agree.

## Sources and evidence
None consulted. No external claim is made; every claim cites a repository file and line.

## Research
Status: unnecessary. No finding rests on a contested external convention. The one platform-behaviour question (F8) is settled by a device pass, not a document.

## Confidence and limitations
Medium-high on the code-path findings (F1, F3, F4, F5, F6, F7), medium on the interaction findings (F2, F10), low on the device/render hypotheses (F8, F9). No browser, device, screen reader or text-scaling run; no tests run; single reviewer; F1's test outcome is predicted, not observed.

## Acceptance criteria and edge cases
Existing criteria traced: MM-250 "A typed night" → `sleepEntry.test.tsx:62-75`; "Imported nights" → `:77-97`; MM-252 "Pre-filled" → `recoveryCheckIn.test.tsx:130-148` (anchored query, see F1); "A signal of its own" → `sleepOnCoach.test.tsx:72-88`; "No score" → `:53-63`. Proposed criteria: per finding. Edge cases: fractional averages (F5); totals over a day (F6); a day rollover while the section is open (behaves correctly by inspection); an imported night dated after today is dropped; a night the platform deleted disappears from the chips while a typed one stays.

## Dependencies
- react-capacitor: F1, F3, F5; F4 (`retrySleep`, failed-read branches).
- product-designer: F9 (rule 9, Save beside or under the fields).
- QA / edit owner: run the two test files and the `SleepMistyped` story (F1); render `SleepNotRecorded` at 200% text (F9); one TalkBack and one VoiceOver pass over `SleepRecorded` (F8).
- Requirements: correct MM-250's "stepper" wording.

## Safety concerns
None found within scope; not clinical clearance. The offer changes nothing until pressed; "Carry on" is one tap and uncommented. No sleep figure is graded or coloured. Privacy: the section names the health platform and the source app in text; both are the person's own data, on their phone; nothing leaves the device by inspection.

## Unresolved product decisions
1. A night typed against the wrong chip cannot be removed, only overwritten (non-goal per brief). Impact: a wrong night stays in the fourteen-night average. Authority: product owner.
2. Whether the pace label "Slow to 0.5% a week" should be excluded explicitly if the "No score" voice test is ever widened beyond the recovery section. Authority: chair/QA.

## Verification
Nothing run; no runtime reproduction; no screenshots. Requested of the edit owner: `npx vitest run test/coach/recoveryCheckIn.test.tsx test/progress/sleepEntry.test.tsx test/coach/sleepOnCoach.test.tsx test/ui/fieldErrors.test.tsx`; the Storybook test for `SleepMistyped`; a render of `SleepNotRecorded` at 200% text; a TalkBack and a VoiceOver pass.

## Verdict
**No blocking finding for the build.** F1 is high and must be verified by running the named tests before the build proceeds; F3, F4 and F5 should be fixed with the build; F2, F6, F7, F10 are recommended; F8 and F9 await device and render evidence.

## Targeted challenges
None; initial independent report.
