# Review: safety

## Scope and traceability
- **Role:** safety (read-only panel specialist). Reviewer: Claude Code subagent, single pass. This is not independent personnel.
- **Commit:** 684f870, branch `feat/inline-insights-framework`. The working tree had `.claude/settings.json` modified and `docs/agent-runs/mm366-workout-rules/` untracked.
- **Requirement files inspected:**
  - `requirements/coach-insights/STORY.inline-insights-for-workouts.MM-366.md` (the draft catalog)
  - `requirements/coach-insights/STORY.insight-under-the-item.MM-362.md` (the framework and its safeguards)
  - `requirements/coach-insights/STORY.rule-based-insights.MM-141.md`
  - `requirements/training/STORY.progression-suggestions.MM-79.md`
  - `requirements/safeguards/STORY.weekly-recovery-check-in.MM-116.md`
  - `requirements/safeguards/STORY.recovery-signals-ease-the-deficit.MM-117.md`
  - `requirements/safeguards/STORY.hide-the-scale-number.MM-118.md`
  - Search hits only: MM-148 (pause), MM-134 and MM-144 (non-goals).
- **Other inputs:** `docs/agent-runs/mm366-workout-rules/brief.md`, `AGENTS.md`, `agents/roles/safety.md`, `agents/panel-protocol.md`, `agents/review-contract.md`, `agents/templates/findings/role.md`.
- **Input hashes:** not computed, because the reviewer cannot run commands. The chair records them.

## Existing facts versus proposals
**Repository facts (code at 684f870):**
- **Under 18.** `CoachingPolicy.derive` returns `blocked: true` for a non-adult (`apps/mobile/src/domain/CoachingPolicy.ts:99-100`). `AppRoot` then shows `AdultsOnlyScreen` instead of the app (`apps/mobile/src/app/AppRoot.tsx:73-74`). Nobody under 18 reaches any screen with an insight, the dashboard insight included.
- **Eating-disorder history, deficit goals.** The answer limits goal modes to maintenance and lean gain (`CoachingPolicy.ts:108-110`) and sets `suppressWeightRewards` (`:149`).
- **Eating-disorder history, dashboard insight.** `AppState.insightSelection` passes `limitToProteinAndLogging: setup.screening.eatingDisorderHistory` (`apps/mobile/src/state/AppState.ts:609`). `findInsights` then drops rules about weight and about other intake (`apps/mobile/src/engine/findInsights.ts:153-155`).
- **Eating-disorder history, inline catalog.** The inline catalog already exists as metadata. `apps/mobile/src/coach/inlineInsightRules.ts` marks "Strength on a cut" `notWithEatingDisorderHistory: true` (`:46-50`). `CoachAreaScreen` shows such a rule as "Not shown for your health answers." (`apps/mobile/src/settings/CoachAreaScreen.tsx:40,75-76`).
- **Pause.** The dashboard insight is suppressed when any pause overlaps the last `InsightRationing.patternDays` (14) days: `pauseWithin` at `AppState.ts:587,596` and `:992-995`. The rule is not just "suppressed while paused".
- **Hidden weight (MM-118).** No implementation exists. A search for weight-display or hidden-weight symbols in `apps/mobile/src` found nothing, and MM-118 is `proposed`.
- **Code and ticket disagree on order and wording.** Code orders the training rules Volume jump, Holding steady, Strength on a cut (`inlineInsightRules.ts:35-50`). MM-366 says holding steady comes first (MM-366 line 33). The code's volume-jump example leaves out the ticket's "Big jumps raise soreness" clause.
- **Recovery check-in.** "How you are holding up" is `apps/mobile/src/coach/RecoveryCard.tsx:43`. It records five answers, including how training felt, and never lowers a target. Its only coaching effect is MM-117's relief offer (`findReliefOffer`), which forbids "train more" and "push through".
- **MM-79.** On fat loss the progression suggestion is to match last time, "holding strength is success", and nothing is said about a stall (MM-79 lines 22, 31).
- **Pain and injury.** The repository has no pain or injury guidance. Searching `requirements/` found only the injury reason for a pause (MM-148) and MM-134. MM-144 makes exercise prescription and deload scheduling non-goals.
- **Evidence register.** `docs/evidence.md` has no entry for volume, soreness or workload.

**Proposals (the reviewer's, not approved):** everything under Findings.

## Audit coverage
- **Mode:** `change`: the MM-366 draft plus the existing safeguard code it depends on (MM-141 filtering, CoachingPolicy, AppRoot gate, pause logic, recovery check-in, relief offer, the inline rule metadata and the Settings > Coach area screen).
- **Inspected:** the files cited above, and the `WorkoutWithInsights` and `WorkoutInsightOpen` stories (`apps/mobile/src/gallery/screens/CoachingInsights.stories.tsx:314-353`).
- **Not inspected:** the e1RM, weekly-volume and muscle-group code (training role); `InsightRule.aboutWeight` and `otherIntake`; `UnderEatingNotice` and `EasyToMissLine` beyond a search hit; MM-108's file; tests.
- **Not built yet:** no inline insight engine, filter or `ItemInsight` record exists. Only the rule metadata and the design seam `InsightPreview` do.
- **Methods:** source inspection only. Nothing was rendered or run.
- **Referrals:** training (thresholds, minimum floor, baseline windows, PD-5), coaching (wording), product (the open decisions below).

## Novice mobile experience (when UX/product design is assigned)
Not assigned to this role.

## Findings

**SA-1 (safety and training). Evidence-supported domain concern. Severity: high. Confidence: high.**
- **Rule:** "holding steady". It tells a user on a cut to step up. "A small step up in reps or load is a common next step" fires on any flat e1RM across 4 sessions. MM-79 says that on fat loss holding strength is success, the suggestion is to match last time, and nothing is said about a stall. MM-117 treats strength held in a deficit as the success signal.
- **Why it matters:** on a fat-loss or recomp goal this line is a push to do more while under-fuelled. It contradicts the MM-79 suggestion on the same card, and it fires on exactly the lifts where "strength on a cut" fires; ranked first, the user sees the push instead of the reassurance.
- **Evidence:** MM-79 lines 22 and 31; MM-117 Context; MM-366 lines 22 and 33.
- **Change:** "holding steady" does not fire while the goal is a deficit (fat loss or recomp).
- **Proposed scenario:** Given a fat-loss goal and four bench sessions with e1RMs within 1%, then "holding steady" is not shown.

**SA-2 (safety). Requirement gap. Severity: high. Confidence: high.**
- **Rule:** priority. MM-362 allows one insight per item, highest priority wins, and MM-141's order puts safety first. MM-366 ranks holding steady above volume jump, so a lift with a ≥ 50% set jump and a flat e1RM (common in a high-volume week) would show "step up" and hide "a smaller step is easier to recover from". The code already lists volume jump first.
- **Change:** volume jump, then holding steady, then strength on a cut.
- **Proposed scenario:** Given a flat e1RM and a qualifying volume jump on the same lift, then "volume jump" is shown.

**SA-3 (safety and coaching). Requirement gap. Severity: medium. Confidence: medium.**
- **Rule:** "holding steady" ignores the recovery signals the app holds. It can urge more reps or load the same week MM-117's relief offer shows, the user just took a maintenance week, or their latest "How you are holding up" training (or energy) answer is at the hard end.
- **Change:** suppress "holding steady" while a relief offer is open, when a requested maintenance week falls in its period, or when the latest check-in within 7 days has training at 1 or 2. "Volume jump" stays allowed.
- **Limitation:** the signal set is judgement, not evidence. Product decides.

**SA-4 (safety). Requirement gap. Severity: medium. Confidence: high.**
- **Rules:** both pattern rules misfire after a pause. MM-362 hides inline insights only "while coaching is paused"; the dashboard insight is suppressed when any pause overlaps its 14-day window (`AppState.ts:587,596`). After an illness or injury pause, "volume jump" compares the return week with an average lowered by the pause, and "holding steady" can urge a step up on a lift just resumed.
- **Change:** a training pattern insight is not shown when any pause overlaps its basis (the 4 sessions; this week plus the previous 4 weeks). Alternatively, leave paused weeks out of the baseline and keep "holding steady" quiet after an injury pause.
- **Proposed scenario:** Given an injury pause that ended 5 days ago, then neither rule shows for lifts whose basis overlaps it.

**SA-5 (safety and training). Evidence-supported domain concern. Severity: medium. Confidence: medium.**
- **Rule:** "volume jump" is a useful cue and neither alarms nor pressures as written. "Big jumps raise soreness" keeps to soreness, not injury, which is right: soreness after unaccustomed work is well established; the injury link through workload spikes (acute:chronic workload ratio) is contested and studied mostly in team sports.
- **Changes:** (a) hedge to "can raise soreness"; never mention injury, "overtraining", "too much" or "stop". (b) Make ticket and code examples agree. (c) Add an absolute floor (2 to 3 sets is a 50% jump) and require 4 prior weeks containing training. Threshold to training. (d) State whether it can appear mid-week; it should not read as an instruction to stop the current workout.

**SA-6 (safety and coaching). Evidence-supported domain concern. Severity: low. Confidence: medium.**
- **Rule:** "strength on a cut" with an eating-disorder history: hiding it is right (it names eating below maintenance; MM-141 limits intake insights for this person to protein and logging). It rarely arises, since the answer removes fat loss and recomp; the hide is defence in depth if screening changes while a deficit goal is set. Not verified whether the goal resets then.
- **Wording:** "That is what a well-run cut looks like" credits the deficit as much as the training; MM-362 bans praise for eating under target. Credit the training in MM-79's words, e.g. "Holding strength is the aim on a cut." Coaching owns the words.
- **Optional:** also hide under the `lowBodyWeight` caution. Product decides.

**SA-7 (safety). Documentation gap. Severity: low. Confidence: high.**
- Under 18 the whole app is blocked, so MM-362's filter is a second layer. Keep it as written and tested; MM-366 may say so.

**SA-8 (safety). Requirement gap. Severity: low. Confidence: medium.**
- No line encourages training through pain; the app cannot see pain and has no pain guidance. Adding some would be exercise prescription (MM-144) and medical scope.
- **Changes:** (a) a words test for training rules forbidding "pain", "injury", "push through", "train more", "more sets", "no excuses", as MM-117 has. (b) Optionally, the expanded "volume jump" evidence points to "How you are holding up". (c) No injury-pause link in the line.

**SA-9 (documentation). Severity: low. Confidence: high.**
- MM-366's Description says "The four rules" with three in the table; order and words differ from `inlineInsightRules.ts`. Say three and make ticket, code and Settings examples agree.

**SA-10 (safety). Requirement gap. Severity: medium. Confidence: high.**
- `docs/evidence.md` has no entry for any of the three rules; MM-362 requires one before a rule ships. Volume jump: soreness after unaccustomed volume established, injury link contested and not claimed. Holding steady: MM-79's progression basis and its deficit exception.

**Hidden weight (MM-118):** no finding. No line mentions body weight; lift loads and e1RM are strength figures, which MM-118 shows in every mode.

## Sources and evidence
- Zouhal H, Boullosa D, Ramirez-Campillo R, Ali A, Granacher U. "Editorial: Acute:Chronic Workload Ratio: Is There Scientific Evidence?" *Frontiers in Physiology* 12:669687, 2021-05-07. doi:10.3389/fphys.2021.669687. https://pmc.ncbi.nlm.nih.gov/articles/PMC8138569/, accessed 2026-10-17. Finding: the workload-spike and injury literature is controversial, mostly team sports, with no support for a "sweet spot" ratio. Interpretation: an injury claim would be unsupported for recreational lifters; soreness and recovery framing is defensible.
- Search listing only, not retrieved: repeated-bout-effect literature (e.g. Doma et al. 2023, https://researchonline.jcu.edu.au/81416). Background, not a verified register citation.
- Repository evidence: MM-117 (Murphy and Koehler 2022, as cited there) and MM-116 (Saw et al. 2016, as cited there), not re-verified.

## Research
- **Status:** performed, limited.
- **Question:** is there a basis for claiming harm from a sudden jump in weekly sets, and of what kind? Trigger: a proposed health rule.
- **Surface:** the subagent's WebSearch and WebFetch, direct path. One source retrieved in full.
- **Not researched:** the 1% and 50% thresholds (training role).

## Confidence and limitations
High on SA-1, SA-2, SA-4 and SA-7 (direct reading of requirements and code); medium on SA-3, SA-5 and SA-6 (judgement, limited evidence). Single-pass self-review; no hashes; no tests read or run; engine e1RM and volume code not inspected; no clinical sign-off.

## Acceptance criteria and edge cases
**Existing in MM-366:** holding steady, not enough history, volume jump, no line under a set, eating-disorder history.

**Proposed:** no "holding steady" on fat loss or recomp (SA-1); volume jump outranks holding steady (SA-2); no "holding steady" with an open relief offer or a hard check-in (SA-3); no training pattern insight whose basis overlaps a pause (SA-4); no volume jump below the floor or without 4 prior trained weeks (SA-5); forbidden words (SA-8); an evidence entry per rule (SA-10).

**Edge cases:** deload weeks; goal changed in the basis period; screening changed on a deficit goal; a bodyweight lift with no e1RM; a lift mapped to several muscle groups.

## Dependencies
training (SA-1, SA-5 floor and baseline, deloads, PD-5); coaching (SA-6 words, SA-5 hedge); product (SA-3 signals, SA-6 low-BMI option). Requirements MM-79, MM-116, MM-117, MM-148, MM-362, MM-143. Interfaces: CoachingPolicy, pause cells, RecoveryCheckIn, relief offer.

## Safety concerns
Pressure to progress load in a deficit and against the user's own recovery signals (SA-1, SA-2, SA-3); a misleading cue after a pause (SA-4); praise for a cut (SA-6); a possible injury overclaim if the soreness words drift (SA-5). Nothing encourages training through pain. Eating-disorder handling is appropriate as drafted. Not clinical clearance.

## Unresolved product decisions
1. SA-3: which recovery signals silence "holding steady". Authority: product owner.
2. SA-6: hide "strength on a cut" under the low-body-weight caution. Authority: product owner, with safety and coaching.
3. SA-4: suppress when a pause overlaps the basis, or leave paused weeks out of the baseline. Authority: product owner, with training.

## Verification
Source inspection only. No tests run or read, no runtime reproduction.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** SA-1 and SA-2 must be in MM-366 before it is built. SA-3, SA-4, SA-5 and SA-10 should be resolved in the ticket before it ships.
