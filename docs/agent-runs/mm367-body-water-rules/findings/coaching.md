# Review: coaching

## Scope and traceability
- Role: coaching (behaviour change and wording). One read-only subagent session, invoked by the chair for run `docs/agent-runs/mm367-body-water-rules/`. Builds on `docs/agent-runs/mm366-workout-rules/findings/coaching.md` (CO-5 repetition, CO-7 terms, CO-9 evidence rows).
- Branch `spec/food-insights-and-snooze`, head f2e8dfe.
- Requirements inspected: MM-367, MM-362, MM-378, MM-142, MM-141, MM-361, MM-365; MM-108; MM-118; MM-301; MM-155; MM-313, MM-358; MM-359.
- Other inputs: `design/voice-and-wording.md`; `dashboard/DashboardScreen.tsx`, `WeighInRow.tsx`, `WaistRow.tsx`, `WaterRow.tsx`; `food/WaterSection.tsx`; `domain/WeightObservation.ts`; `domain/water/WaterGoal.ts`, `suggestedWaterGoalMl.ts`, `waterGlasses.ts`; `engine/waistNoiseOf.ts`, `waistChangeOf.ts`, `ReminderRule.ts`, `findInsights.ts`, `ItemInsightKind.ts`, `itemInsightKinds.ts`, `volumeJumpInsights.ts`; `format/itemInsightText.ts`, `insightText.ts`, `waistSummary.ts`; `gallery/screens/draftInsightKinds.ts`, `CoachingInsights.stories.tsx` (375-460); `test/voice.test.ts`; `docs/evidence.md`; `docs/agent-runs/mm366-workout-rules/decision.md`; `requirements/HANDOFF.md`.
- Hashes not computed (read-only role); the chair records them.

## Existing facts versus proposals
**Repository facts:**
- A weigh-in stores a date and kilograms only; no time of day (`domain/WeightObservation.ts:4-13`). The default weigh-in reminder is 07:00 (`engine/ReminderRule.ts:7`). The weigh-in field's hint already says "First thing in the morning, after the bathroom." (`dashboard/WeighInRow.tsx:32`).
- MM-142 (the weight-jump explanation) is `proposed`; no code implements it. MM-367's scenario "The weight jump keeps its own explanation" refers to behaviour that does not exist.
- The waist row shows the value and "Waist · <day>" and opens Progress (`DashboardScreen.tsx:204-212`). The app's words for a difference inside the noise: "No clear change since you started: a difference under 0.5 in is within what a tape can tell." (`format/waistSummary.ts:32-35`); "no clear change is a result, not an absence" (`engine/MeasuredChange.ts:5`, MM-155). `waistChangeOf` compares smoothed middles over 28 days, not one reading with the last (`engine/waistChangeOf.ts:17-31`).
- The water row's subtitle already says the goal: "Water · of 2.5 L" (`dashboard/WaterRow.tsx:48`); its control is "Add a glass". MM-313: "there is no streak, badge or reminder" for water. MM-358: the goal is on by default; the safety bound is "drink to thirst, spread through the day", never "keep going"; a "drink to thirst" caption is not built. A fluid-limited person gets no suggested goal but may set their own (`suggestedWaterGoalMl.ts:27`, MM-359).
- Nothing downstream reads water logs: not the metabolism estimate, the Dashboard metrics or any insight rule.
- Draft kinds: "unusual time" and "water on few days" priority `dataQuality`, "within the noise" `pattern`; the weigh-in kind `aboutWeight`, the waist kind `notWithEatingDisorderHistory`, the water kind unguarded (`draftInsightKinds.ts:52-74`).
- The dashboard "weigh-in timing" insight fires only for someone who has weighed before (`findInsights.ts:76-80`).
- MM-378 defines "one item" for a food and an exercise; not for the weigh-in, waist or water rows.
- The banned-word test catches single words only; "easy", "habit", "yet" and imperatives are judged by people.

**Proposals:** everything under Findings marked "Change".

## Audit coverage
- Mode: `change`. Inspected by source only; no render. Not inspected: the Progress waist card, Settings > Coach screens, `InlineInsight`/`RowWithInsight`, the inline tests, AppState's water cells, any device. Measurement figures are measurement's; safeguards are safety's.
- No body or water rule is implemented. Methods: source and requirement inspection, plus web search.

## Novice mobile experience (when UX/product design is assigned)
Not assigned; comprehension notes sit inside each finding.

## Findings

### CO-1: The water line prescribes a drink and judges, on a logging fact
- Confirmed requirement violation (MM-108, MM-362) and evidence-supported concern. Severity **high**; confidence high on words, medium on evidence.
- "Water logged on 5 of the last 14 days. A glass with each meal is an easy habit to log." The fact is about logging; the direction is about drinking (a quantity and a timing). The app cannot tell whether the person drank. "Easy" grades the task. "Habit" is lore; the one trial found (Rodger 2023) saw no automatising. Nothing in `docs/evidence.md` supports a glass with each meal.
- **Change:** keep the line about logging: "Water logged on 5 of the last 14 days. Add a glass here logs one in a tap." If a drinking direction is wanted at all: "Drinking to thirst through the day is enough for most people." Never "easy", "habit", a glass count or a time. Rename the kind "Water logged on few days".

### CO-2: The water rule fires for almost everyone, daily, and is a streak in disguise
- Usability problem and requirement gap (MM-313 no streak; MM-108 no nagging). Severity **high**; confidence high.
- The goal is on by default, so the condition holds for everyone who has not adopted water logging, from day 14 onward, daily, until they log on 7 of 14 days, snooze, or switch the goal off. "0 of 14" is not a pattern in their behaviour. The counter works as a daily tally of missed days.
- **Change:** fire only for someone who has logged water before the 14-day window (precedent `findInsights.ts:77`), and not in the first 14 days after setup. Ask the owner whether a days-logged line is wanted at all, given MM-313 and that nothing uses water logs.

### CO-3: "Not a change yet" reads as no progress, and departs from the app's own words
- Design improvement with a consistent-terms violation. Severity **medium**; confidence medium-high.
- "Yet" presumes a change is wanted and coming; on fat loss it says "no progress this week" for the ordinary state of a waist. A reading down 0.1 in gets the same line as one up. The app already says this in fixed words. "Day-to-day difference" is odd under a weekly measure. "Noise" in the Settings title is jargon.
- **Change:** "About the same as last week. A difference under 0.5 in is within what a tape can tell." No "yet". Fire only when the reading differs from the last. Title: "Waist: no clear change". Measurement to say whether "last week" or the 28-day smoothed comparison is the basis.

### CO-4: The weigh-in line instructs after the fact and repeats the row's own hint
- Design improvement. Severity **medium**; confidence medium.
- The sentence is a rule to follow tomorrow, under today's number, and the field above already said when to weigh. "Makes the trend steadier" claims an effect the person cannot see. Only "later" is worded; the trigger is 3 h either way. Split times (shift work, weekends) fire it on every day off.
- **Change:** figures first, no imperative: "Weighed at 11:40; your usual is about 7:00. Weigh-ins at about the same time of day compare best with each other." Owner to decide whether the rule is worth a line once CO-6 is settled.

### CO-5: No snooze can quiet these lines, because their "item" is undefined
- Requirement gap (MM-378). Severity **medium**; confidence high.
- **Change:** MM-378 states that the Dashboard's weigh-in, waist and water rows are each one item for a snooze.

### CO-6: The words assume a weigh-in time the app does not keep
- Documentation gap, measurement's domain, recorded because it decides the words. **Blocker for the rule as worded.**
- `WeightObservation` has no time. A save time would make "Weighed later than usual" a false statement about behaviour. Health-platform readings carry a time; manual ones would need one added.
- **Change:** only if the weigh-in's own time is stored may the line say "Weighed at"; otherwise the rule should not fire. Referred to measurement.

### CO-7: The evidence row "Your goal: on" says nothing
- Severity **low**. The opened evidence should carry the amount and its origin: "Your goal · 2.5 L a day (suggested for you)". Days row: "Days with water logged · 5 of 14".

### CO-8: Ticket gaps in MM-367
- Severity **low**. The MM-142 scenario cannot be tested until MM-142 is built; no scenario for "earlier than usual", a fluid-limited person, a person who never logged water; no words criterion; no evidence rows named; no priority column.

## Sources and evidence
Accessed 2026-10-18. Search listings unless marked retrieved.
- Rodger A, Vezevicius A, Papies EK. "Can a simple plan change a complex behavior? Implementation intentions in the context of water drinking." *Appetite* 2023;183:106459 (record retrieved). 95 adults, if-then plan vs control, 5 days: no clear group difference; the plan "did not automatize remembering". Supports CO-1's doubt.
- Steinberg DM et al. 2014, *Am J Prev Med*, daily self-weighing RCT, 91 adults, 6 months (snippet): no difference in depressive symptoms, disinhibition or binge eating. Reviews (PMC4846305, PMC2150565, snippets): harms concentrate in young women and normal-weight samples.
- Helander et al. 2014 *PLoS ONE*; 2021 *JMIR* smart-scale cohort (snippets): breaks in daily weighing associate with gain. About frequency, not time of day.
- Marshfield Clinic commentary (snippet): no research fixes a best time; same conditions reduce variation. Lay guidance.
- No study found on consistency of weigh-in time of day, nor a trial of a "glass with each meal" cue.

## Research
Status: performed (limited). Questions: consistent weigh-in time and trend steadiness (none found); meal-anchored water plans (one small trial against); daily weighing and affect (one RCT, no harm on average). WebSearch and one WebFetch, direct.

## Confidence and limitations
High for CO-2, CO-5, CO-6, CO-7, CO-8; medium-high CO-3; medium CO-1's evidence weight and CO-4. No render; no tests; single session; no hashes.

## Acceptance criteria and edge cases
- Existing: six scenarios; none tests words, direction, the never-logged person, a fluid limit, or the snooze item; one depends on unbuilt MM-142.
- Proposed: a weigh-in 3 h earlier shows "earlier" words; a save time never says "Weighed"; an identical waist reading shows no line; 0.1 in down and up show the same directionless words; a person who never logged water shows no water line; a fluid-limited person sees no line mentioning drinking; no line contains "easy", "habit", "yet", a glass count or a time to drink; snoozing the weigh-in line today keeps it quiet tomorrow.
- Edge cases: 0 of 14; goal switched off mid-window; suggested to own goal; weigh-in re-entered; platform weigh-ins with times beside manual ones; a pause in the 14 days; the first 14 days after setup.

## Dependencies
measurement (CO-6; CO-3's basis); safety (CO-1, fluid limit, water-loading, waist line off for ED history); product-designer/ux-accessibility (Settings titles, the Snoozed list entry for a Dashboard row); nutrition only if a drinking direction is wanted.

## Safety concerns
The water line as drafted tells a person to drink about three more glasses a day from a logging count; a fluid-limited person can set their own goal, so the rule fires for them. Either never mention drinking or be off for `fluidLimitedByClinician`, kidney disease and bariatric surgery. CO-3's "no progress" reading is a mood risk on a fat-loss goal. Not clinical clearance.

## Unresolved product decisions
1. Does a water line exist at all, given nothing uses water logs and MM-313 chose no streak? Owner, advised by safety.
2. Whether "unusual time" is worth a line when the hint already teaches the time and no time is stored. Owner, after measurement.
3. The snooze item for the Dashboard rows (CO-5). Owner; a wording change to MM-378.

## Verification
Source inspection only. Requested: the words tests once the words land, and the proposed scenarios as engine tests.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** CO-1 and CO-6 must be resolved before the water and weigh-in rules are built; CO-2 and CO-5 need rulings; CO-3's words replace the draft's.
