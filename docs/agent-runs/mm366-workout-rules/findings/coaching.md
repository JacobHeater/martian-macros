# Review: coaching

## Scope and traceability
- Role: coaching (behaviour change and wording). One read-only subagent session in Claude Code, invoked by the chair for run `docs/agent-runs/mm366-workout-rules/`.
- Commit: 684f870, branch `feat/inline-insights-framework`.
- Requirement files inspected: MM-366, MM-362, MM-361, MM-141, MM-108 (`requirements/design-system/TASK.voice-and-wording.MM-108.md`), MM-79, MM-92; MM-363 by search.
- Other inputs: the brief, `design/voice-and-wording.md`, `docs/evidence.md` (search), `apps/mobile/src/coach/inlineInsightRules.ts`, `apps/mobile/src/format/progressionText.ts`, `apps/mobile/src/engine/suggestProgression.ts`, `apps/mobile/src/train/WorkoutExerciseCard.tsx`, `apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx` (312-353), `apps/mobile/test/voice.test.ts`, `docs/agent-runs/mm361-coaching-insights/decision.md` (search).
- Hashes not computed (read-only role); the chair records them.

## Existing facts versus proposals
**Repository facts:**
- MM-79's suggestion text (`progressionText.ts:21-26`): addReps "One more rep on any set would be a step up."; addLoad "Every set reached N last time. A step up would be X."; hold "No more reps at this load in three sessions. Holding X is a fair aim."; match (fat loss) "Matching last time holds your strength while you lose fat."
- On fat loss the suggestion is always "match" (`suggestProgression.ts:106-108`); MM-79: "On fat loss nothing is said about a stall" (line 31).
- The suggestion shows only on a workout in progress (`WorkoutExerciseCard.tsx:70-82`); the inline line is drawn after "Last time" and the suggestion (`:126-135`).
- The code's draft order (volume jump, holding steady, strength on a cut) differs from MM-366's table order; the code drops "Big jumps raise soreness;".
- The Personal records card says "estimated max" (MM-92 line 75); the story's evidence row says "Change in estimated best".
- `voice.test.ts:13-32` checks single words only; praise for a deficit is a semantic rule checked by people.
- MM-141 (53-54) kept "strength holding on a cut" as "an outcome the user earned by training"; the mm361 decision deferred the praise question here.
- Dashboard insights rest 28 days after dismissal; inline insights have no dismiss (MM-362); MM-363 lists a repeating pattern once.
- `docs/evidence.md` has no entry for volume, e1RM or strength on a cut.

**Proposals:** everything under Findings marked "Change".

## Audit coverage
- Mode: `change` (the three drafted rules plus the MM-79 suggestion, the Personal records card and the MM-141 rule they sit beside).
- Not inspected: training figures (to training); `CoachingPolicy.ts` beyond a glance (to safety); the exercise-history screen; renders.
- No inline insight engine exists yet. Methods: source and requirement inspection only.

## Novice mobile experience (when UX/product design is assigned)
Not assigned. Wording comprehension notes are inside the findings; no walkthrough or render.

## Findings

### CO-1: "Holding steady" contradicts or repeats the MM-79 suggestion on the same card (PD-5)
- Classification: confirmed requirement violation (MM-79). Severity: **high**. Confidence: high.
- **Observed** on a workout in progress (Last time, suggestion, line):
  - Fat loss: "Matching last time holds your strength while you lose fat." then "A small step up in reps or load is a common next step." Opposite directions, and a stall message MM-79 forbids on fat loss.
  - MM-79 "hold": "No more reps at this load in three sessions. Holding X is a fair aim." then "About the same in your last 4 sessions. A small step up…". Same fact, two counts, opposite advice.
  - addReps or addLoad: the same advice twice.
- **Change:** (1) never on a fat-loss goal; (2) on a workout in progress, not when the suggestion is "hold", and never a direction differing from the suggestion; (3) training chooses: (a) only where no suggestion shows (a finished workout, the exercise's history), or (b) a second sentence pointing to the suggestion; (4) MM-366 states the screens each rule appears on.

### CO-2: "That is what a well-run cut looks like." praises the deficit
- Classification: confirmed violation of MM-92 ("Reward the work, never the deficit") and MM-108 ("state, do not judge"). Severity: **high**. Confidence: medium-high.
- Yes, as worded it praises eating below maintenance: the intake is centred and "a well-run cut" grades the diet. "Held" has no subject; "cut" is slang (the app says "fat loss"); "below maintenance" asserts intake the app may not know with partial logs (to measurement).
- **Change:** credit the training, name the goal not the intake:
  - Held: "Your strength on this lift has held through 6 weeks on your fat-loss goal. Keeping it is the aim right now, and your training is doing that."
  - Gone up: "Your strength on this lift has gone up during 6 weeks on your fat-loss goal. Your training is doing more than holding it."
  - Rename to "Strength on fat loss". Keep the eating-disorder exclusion (safety to confirm).
- Proposed criterion: no intake, maintenance, deficit or "cut"; no grading word.

### CO-3: The priority order hides the strength line and puts a nudge before a caution
- Classification: requirement gap. Severity: **medium**. Confidence: high.
- With holding steady first, a flat lift on a cut always shows "step up", so the held-strength acknowledgement never appears; the recovery caution sits below a nudge.
- **Change:** volume jump, then strength on fat loss, then holding steady; ticket and code agree.

### CO-4: The words of "holding steady"
- Classification: design improvement. Severity: **medium**. Confidence: medium.
- "About the same" does not say what; "a common next step" appeals to what others do (near MM-108's no comparison); on fixed-step equipment flat is normal and repeated nudging becomes pressure.
- **Change:** "Your strength on this lift has stayed about the same for 4 sessions." Then, where no suggestion shows: "One more rep, or a small step up in load, is one way to move it on next time." Keep "load", never "weight".

### CO-5: A pattern line repeats every session while the pattern holds
- Classification: design improvement (MM-108 no nagging; MM-141 28-day rest). Severity: **medium**. Confidence: medium.
- Without a dismiss, a deliberately held lift shows the line every session for weeks; it reads as a standing "not progressing" remark and teaches people to skip the coach's lines.
- **Change (owner):** show on the sessions of the first week the pattern holds, then rest 28 days or until it breaks and forms again. Strength on fat loss once at 6 weeks (later milestone optional). Volume jump not throttled within its week.

### CO-6: Volume jump repeats under every exercise for the muscle, and its words are vague
- Severity: **medium**. Confidence: medium-high.
- Three chest lifts show three identical lines; "lately" is undefined; ticket and code differ.
- **Change:** show under the first exercise for that muscle group only. Words: "14 sets for chest this week. Your usual is about 9 a week. A jump this big often brings more soreness; adding sets more slowly is easier to recover from." Training sets a minimum average or history.

### CO-7: Terms are inconsistent and "cut" is used in user text
- Severity: **low**. "Estimated best" vs "estimated max"; "cut" appears nowhere else. Use "estimated max" for figures and "strength" in sentences; add both to the glossary; replace "cut" with "fat loss"; no "e1RM" in user text.

### CO-8: The ticket does not match itself, the epic or the catalog
- Severity: **low**. "The four rules" with three listed; MM-361 says "a set" can show a line; no criteria for fat loss, words, repetition, under-18 or pause. Fix the count, amend MM-361 to "an exercise", add criteria from CO-1, CO-2, CO-5.

### CO-9: No evidence register entries yet
- Severity: **low** for wording, blocking before ship (MM-362). "Big jumps raise soreness" and "keeping strength is the aim on fat loss" need MM-143 entries.

## Sources and evidence
- https://ueaeprints.uea.ac.uk/id/document/82951, https://doaj.org/article/365919c42ed9403488306ee459593c9e, https://pmc.ncbi.nlm.nih.gov/articles/PMC11583291, https://pubmed.ncbi.nlm.nih.gov/38848557/. Dates null as retrieved; accessed 2026-10-17. Search finding: engagement with just-in-time health messages falls over time; no source tested repetition and tune-out. Interpretation: CO-5 rests on the product's own rules, not outcome evidence. Snippets only; not cited for any number.

## Research
- Status: performed (limited). Question: does repeating the same in-app message reduce attention? Trigger CO-5. WebSearch, direct. No systematic review found; CO-5 is a design improvement.

## Confidence and limitations
High for CO-1, CO-3, CO-8; medium-high CO-2; medium CO-4 to CO-6. No render viewed; exercise-history screen not inspected; no hashes; single session.

## Acceptance criteria and edge cases
Existing: MM-366's five scenarios, none testing words, goal or repetition.
Proposed: fat loss and 4 flat sessions shows no holding steady and shows strength on fat loss at 6 weeks; MM-79 "hold" on the card shows no holding steady; strength up uses the "gone up" words; three chest lifts in a jump show one line; a shown pattern rests 28 days; no line contains maintenance, deficit, cut, below, well-run, "common" or e1RM.
Edge cases: too few weeks of history; a returning lifter; bodyweight lifts whose estimate includes body weight (check against hidden weight); goal changing in the 6 weeks; an edited or deleted session.

## Dependencies
training (CO-1 option, whether a flat estimated max is meaningful given MM-79 rejected e1RM, CO-6 floor, CO-9 entries); safety (exclusion for the reworded line; "fat-loss goal" wording with weight hidden); measurement (can a 6-week deficit be established from partial logs, or use the goal setting); product-designer and ux-accessibility (once-per-workout placement).

## Safety concerns
CO-2 mainly: praising six weeks below maintenance risks reinforcing restriction. CO-5: repeated "not progressing" lines may press some toward overreaching. Not clinical clearance.

## Unresolved product decisions
1. Repetition (CO-5): every session while it holds, first week then 28-day rest, or a dismiss (rejected by the owner). Authority: product owner.
2. "Qualifying item" for a week-based rule (CO-6): every exercise of the group or the first. Authority: product owner, advised by product-designer.
3. Where holding steady appears (CO-1). Authority: product owner, advised by training.

## Verification
Source and requirement inspection only. Requested: `npx vitest run test/voice.test.ts`, a words test for training rules, the fat-loss and "hold" scenarios.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** CO-1 and CO-2 must be resolved before build, and CO-5 needs the owner's ruling.
