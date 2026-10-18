# Review: safety

## Scope and traceability
- **Role:** safety (read-only panel specialist). One subagent pass; not independent personnel.
- **Commit:** f2e8dfe, branch `spec/food-insights-and-snooze`.
- **Requirements inspected:** MM-367 (the draft), MM-362, MM-142, MM-141, MM-378; MM-118; MM-359, MM-11; MM-358, MM-313; MM-364; MM-92. Search hits: MM-155, MM-32, MM-301.
- **Other inputs:** the brief; `docs/agent-runs/mm366-workout-rules/findings/safety.md`; `docs/agent-runs/mm305-water-micros/findings/safety.md`; `docs/agent-runs/mm361-coaching-insights/decision.md`; `docs/evidence.md`; `requirements/HANDOFF.md`; the canonical role, protocol and contract files.
- **Input hashes:** not computed; the chair records them.

## Existing facts versus proposals
**Repository facts (f2e8dfe):**
- The filter has two safeguard flags per kind: `aboutWeight` (withheld with an eating-disorder history and with hidden weight) and `notWithEatingDisorderHistory`, documented as food composition or intake (`engine/ItemInsightKind.ts:18-21, 29-33`).
- `InsightSafeguards` has `adult`, `eatingDisorderHistory`, `weightHidden`, `paused` only; `weightHidden` is hard-coded false (MM-118 unbuilt). No fluid-limit, kidney or bariatric input reaches the filter.
- Only `volumeJump` is in `itemInsightKinds`; the three MM-367 lines exist only as a story preview.
- The dashboard's `weighInTiming` is `aboutWeight: true`, so already withheld with the history.
- **No weigh-in time is stored.** `weight_entries` has `epoch_day`, `weight_kg`, `device_id`, primary key `epoch_day` (`data/currentSchema.ts:40-45`); `WeightObservation` has `date`, `weightKg`, `deviceId`.
- The weigh-in row's hint already says "First thing in the morning, after the bathroom."
- The waist summary already tells everyone "No clear change since you started: a difference under X is within what a tape can tell" and says "Weekly is enough" (`format/waistSummary.ts:21-35`). Nothing hides waist for an eating-disorder history; MM-118 keeps waist visible in Hidden mode.
- Water goal: `suggestedWaterGoalMl` returns undefined for chronic kidney disease, bariatric surgery or a clinician's fluid limit; `AppState.waterGoal` is undefined when off or nothing suggested and no amount set; a person-set amount is in force with `suggested: false` and `suggestedMl` alongside (`AppState.ts:825-841`). Settings tells the fluid-limited person the amount field is "Only if your clinician gave you an amount of water to drink"; the goal's caption is "Drink to thirst, spread through the day"; the water section says "Goal reached" once.
- `CoachingPolicy` adds no caution for `fluidLimitedByClinician`. The owner kept the water goal for an eating-disorder history (MM-358); the register notes the 3.5 L caption for that person because water-loading and appetite-suppressing drinking are reported harms (`docs/evidence.md:220`).
- MM-92: "A weigh-in count is left out of rewards altogether, as it can pull attention to the scale." MM-118 offers the display setting when more than one weigh-in a day appears on five or more days in two weeks.
- The forbidden-words test has no water or body words; `docs/evidence.md` has no row for the three rules. MM-378 defines "one item" for a food or an exercise only.

**Proposals:** everything under Findings.

## Audit coverage
Mode `change`: the MM-367 draft plus the filter and its inputs, the dashboard catalog's flags, weigh-in storage, waist noise and summary, the water goal and its withholding, Settings' water wording, CoachingPolicy, MM-118/142/358/359/378. Not inspected: `WaterRow.tsx`, `WaistObservation.ts`, Health Connect ingest (a scale reading's timestamp), the row composition, the inline tests beyond MM-362's description. Nothing rendered or run. Referrals: measurement (SA-3, SA-9, figures); coaching (SA-4, SA-6, SA-7, SA-9 words); product (SA-1, SA-4(c), SA-6); react-capacitor or measurement for the Health Connect timestamp.

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

**SA-1. "Within the noise", "body: off for ED history": the filter cannot express it.** Severity medium, confidence high. Neither flag fits a waist line. Judgement: keep both body lines hidden with the history; a per-reading verdict rewards body checking and MM-141's rule for this person is the fewest insights. The owner may still show it, given MM-118 keeps waist visible. **Change:** widen `notWithEatingDisorderHistory`'s meaning to include the body, or add an `aboutBody` flag; scenario and Settings listing "Not shown for your health answers".

**SA-2. "Unusual time" off for ED history and hidden weight: right; carry `aboutWeight: true`.** Severity low. MM-118 has two reduced modes; a line under a weigh-in is an echo of the reading. **Change:** "hidden weight" means Trend only or Hidden.

**SA-3. The rule rests on a clock time the app does not store.** Severity high, confidence high on storage, medium on harm. For a typed weigh-in the only time capturable is the typing time; said wrongly, "weighed later than usual" discredits a correct reading and invites re-weighing, which MM-118 treats as a warning sign. `weight_entries` keeps one reading per day. **Change:** fire only from a measurement time the app did not infer (a connected scale's timestamp confirmed as measurement time, or a time the person entered); a typed weigh-in with no time never fires; if that leaves too few readings, drop the rule.

**SA-4. Does a line under a weigh-in increase attention to the scale?** Severity medium, confidence medium. For the general adult the drafted words are neutral; Pacanowski 2015 found mostly negative associations of self-weighing with affect and body evaluation, more in women and younger people. Two features push it toward a standing verdict: every qualifying item shows, so a weekday/weekend pattern fires every weekend for good; "makes the trend steadier" reads as "today's number counts for less". **Changes:** at most once in 14 days, or a working row snooze (SA-8); words that say what the app does; optionally hide body lines under `underweight` and `lowBodyWeight`.

**SA-5. "Water on few days" fires on a clinician-set goal and the filter cannot withhold it.** Severity high, confidence high on code facts. Where the suggestion is withheld (kidney disease, bariatric surgery, a fluid limit), Settings invites that person to enter the clinician's amount, so the fluid-limited person most likely to have a goal is told "A glass with each meal is an easy habit". **Change:** the water rule does not fire while `waterGoal.suggestedMl === undefined`, whether or not an amount is set, and never when `waterGoal` is undefined; Settings lists it "Not shown for your health answers" for those people. Pregnancy and breastfeeding: no finding.

**SA-6. The water line with an eating-disorder history.** Severity medium, confidence medium. The direction is about drinking, so it is intake advice; MM-141 limits intake insights for this person to protein and logging. Hart 2011: main reasons inpatients drink were fullness, appetite suppression, control and purging; Krogulska 2019: water loading, polydipsia common, intake 250 mL to 6 L. **Change (preferred):** `notWithEatingDisorderHistory: true`. Alternative: a logging-only direction with no amount. Either way forbid /drink more/, /keep going/, /catch up/, /top up/. Authority: product owner.

**SA-7. The water line for everyone else.** Severity low. "A glass with each meal" is scheduled drinking against the app's own "Drink to thirst, spread through the day"; it fires on logging frequency, not amount. **Change:** the direction is about logging water already drunk; the evidence may say thirst comes first.

**SA-8. The snooze (MM-378) has no item for the Dashboard rows.** Severity medium, confidence high. Each weigh-in is a different reading; the water and waist rows have no item. **Change:** MM-378 defines the item for a list row as the row. Otherwise no safety angle: these kinds are not safety notices and the snooze cannot turn a withheld kind on.

**SA-9. "Within the noise" under every reading rewards daily measuring.** Severity low, confidence medium. MM-155's cadence is weekly. **Change:** fire only when the reading is at least 7 days after the one compared, or compare smoothed values; end with "Weekly is enough."; drop "yet".

**SA-10. No evidence rows; no priority column.** Severity medium (ship gate). The water row cites MM-358's bounds and, for the eating-disorder handling, Hart 2011 and Krogulska 2019; the unusual-time row needs the basis for 3 h and the median (measurement); the waist row points at MM-155's noise rows.

## Sources and evidence
- Krogulska A, Nowicka D, Nowicki Z, Parzęcka M, Sakson-Słomińska A, Kuczyńska R. "A loss of consciousness in a teenage girl with anorexia nervosa, due to polydipsia: case report and a minireview." *Eating and Weight Disorders* 24(5):969-974, 2019-02-02. https://pmc.ncbi.nlm.nih.gov/articles/PMC6751150, accessed 2026-10-18, full text. Water loading before weigh-ins; polydipsia common; intake 250 mL to 6 L, 17% appropriate (citing Abraham). Case report plus narrative review.
- Hart S, Abraham S, Franklin RC, Russell J. "The reasons why eating disorder patients drink." *European Eating Disorders Review* 19(2):121-128, 2011. doi:10.1002/erv.1051. Abstract via Europe PMC REST. 115 inpatients; reasons: fullness, appetite suppression, control, purging.
- Pacanowski CR, Linde JA, Neumark-Sztainer D. "Self-Weighing: Helpful or Harmful for Psychological Well-Being? A Review of the Literature." *Current Obesity Reports* 4(1):65-72, 2015. doi:10.1007/s13679-015-0142-2. Abstract via Europe PMC REST. 20 studies, mostly negative associations, more in women and younger people; none or positive in treatment-seeking adults with overweight.
- Search listing only: Hew-Butler et al., Third International Exercise-Associated Hyponatremia Consensus, *Clin J Sport Med* 25(4):303-320, 2015 (drink to thirst). Repository rows `docs/evidence.md:216`, `:218` not re-verified.

## Research
Status: performed, bounded. Questions: excess fluid as an eating-disorder behaviour; salient weighing and mood; "drink to thirst" as consensus. WebSearch and WebFetch, direct; three searches; PubMed, Springer and the Europe PMC article page blocked. Not researched: the 3 h and 14-day figures and the waist threshold (measurement).

## Confidence and limitations
High on SA-1, SA-2, SA-3's storage fact, SA-5's code facts, SA-8, SA-10; medium on SA-4, SA-6, SA-7, SA-9. Single pass; no hashes; nothing run; Health Connect timestamp not checked; no clinical sign-off.

## Acceptance criteria and edge cases
Existing: six scenarios; "Hidden weight" depends on unbuilt MM-118; none covers an eating-disorder history for the body lines, Trend only, a fluid limit, a typed weigh-in's time, or a row snooze. Proposed: the history hides both body lines and (owner) the water line; Trend only hides the weigh-in line; a typed weigh-in with no measurement time never fires; "unusual time" at most once in 14 days; no water line while the suggestion is withheld; forbidden water words; a row snooze; "within the noise" only a week or more after the compared reading; an evidence row per rule. Edge cases: screening changed after onboarding with a goal in force; a clinician-given amount as the goal; a scale reading whose timestamp is the sync time; two weigh-ins in one day; a reading the day after the last; the goal switched off mid-window; a pause in the 14 days.

## Dependencies
measurement (SA-3, SA-9, figures); coaching (SA-4(b), SA-6, SA-7, SA-9 words); product (SA-1, SA-4(c), SA-6; SA-8 in MM-378); react-capacitor or measurement for the Health Connect time. Interfaces: `InsightSafeguards`, `ItemInsightKind`, `WaterGoal`, `WeightObservation`, `weight_entries`.

## Safety concerns
Pushing fluids on a clinician-limited person (SA-5); a daily drinking nudge to a person with an eating-disorder history (SA-6); a false "weighed later" from a typing time (SA-3); a standing per-weigh-in verdict (SA-4); a per-reading waist verdict (SA-9); no one-tap quiet for body lines (SA-8). Not clinical clearance.

## Unresolved product decisions
1. SA-6: hide the water line with an eating-disorder history, or reword to logging only. 2. SA-1: show the neutral waist line to that person or hide it. 3. SA-4(c): hide body lines under the underweight and low-body-weight cautions. 4. SA-3: capture a measurement time, restrict to connected scales, or drop the rule. Authority: product owner with the named roles.

## Verification
Source inspection and web retrieval only. Requested: tests for SA-5, SA-1, SA-2, SA-3, SA-8 and the evidence-row test.

## Targeted challenges
None yet.

**Verdict: build with the listed changes, with two blockers first.** SA-3 and SA-5 must be settled before "unusual time" and "water on few days" are built; "within the noise" can be built once SA-1 names its mechanism. SA-6 is an owner decision; SA-8 goes to MM-378; SA-10 is the ship gate.
