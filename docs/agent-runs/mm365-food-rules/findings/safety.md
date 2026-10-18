# Review: safety

## Scope and traceability
- **Role:** safety (read-only panel specialist). One subagent pass; not independent personnel. Builds on `docs/agent-runs/mm366-workout-rules/findings/safety.md`.
- **Commit:** f2e8dfe, branch `spec/food-insights-and-snooze`.
- **Requirements inspected:** MM-365 (the draft), MM-362, MM-378, MM-141; MM-108; MM-11; MM-112, MM-114, MM-118; MM-92; MM-150, MM-370.
- **Other inputs:** the brief; `docs/agent-runs/mm361-coaching-insights/decision.md` and findings; `docs/agent-runs/mm366-workout-rules/decision.md`; `docs/evidence.md`; the canonical role, protocol and contract files.
- **Input hashes:** not computed; the chair records them.

## Existing facts versus proposals
**Repository facts (f2e8dfe):**
- `ItemInsightKind.withheld` is true with `eatingDisorderHistory` for `aboutWeight` or `notWithEatingDisorderHistory` kinds, or with `weightHidden` for `aboutWeight` (`engine/ItemInsightKind.ts:29-33`). `allowedItemInsights` shows nothing for a non-adult, while paused or with the master off, then drops withheld and switched-off kinds (`allowedItemInsights.ts:30-49`).
- `InsightSafeguards` has exactly `adult`, `eatingDisorderHistory`, `weightHidden`, `paused` (`InsightSafeguards.ts:5-14`); `AppState` builds it from `setup.screening.eatingDisorderHistory`, `weightHidden: false`, `activePause` (`AppState.ts:642-652`). Nothing from `CoachingPolicy.cautions`, `underweight`, `targetsAllowed`, pregnancy, breastfeeding or the under-eating finding reaches the filter.
- The dashboard drops `aboutWeight` and `otherIntake` rules with `limitToProteinAndLogging` (`findInsights.ts:153-155`).
- Drafts: `largePortion` dataQuality with `notWithEatingDisorderHistory`, `lightOnProtein` pattern unflagged, `mostlyFat` pattern flagged (`draftInsightKinds.ts:11-34`). None is in `itemInsightKinds`; `itemInsightText` has words for `volumeJump` only.
- `test/engine/allowedItemInsights.test.ts:60-62` proves the eating-disorder filter on a synthetic catalog, not the real one. No food words test yet.
- `CoachingPolicy.derive`: under 18 blocked; pregnancy or breastfeeding maintenance only; eating-disorder history maintenance and lean gain plus `suppressWeightRewards`; underweight (BMI < 18.5) removes fat loss and recomp and adds `underweight`, BMI 18.5-20 adds `lowBodyWeight`; bariatric surgery `targetsAllowed: false`; CKD caps protein at 0.8 g/kg.
- Cautions in the app's voice (`format/cautionMessage.ts:4-24`): pregnancy "Follow your clinician's guidance on intake"; underweight "If you are not eating enough … talk to a clinician"; eating-disorder history "If food or weight tracking starts to feel distressing, stop and talk to your care team".
- Siblings that hedge: `EasyToMissLine` is suppressed for the history and while the under-eating finding holds (`food/EasyToMissLine.tsx:31-35`); `UnderEatingNotice` adds a support line for the history.
- Screening answers are editable in Settings and the policy re-derives at once (MM-112); `insightSafeguards` is derived over `setup`.
- Grades are shown with the history by the owner's decision; MM-370 records that the composition insights stay off for that person.
- `docs/evidence.md` has no row for any food rule, nor for the eating-disorder limit itself.

**Proposals:** everything under Findings.

## Audit coverage
- **Mode:** `change`: the MM-365 draft, the snooze and the safeguard code they rest on.
- **Inspected:** the files above; `FoodEntry.ts`, `Portion.ts`, `QuantitySource.ts`, `Caution.ts`, `ScreeningAnswers.ts`; two tests; the stories' eating-disorder preview by search.
- **Not inspected:** `ProteinTargets.ts`; `findUnderEating`; the entry row's macro display; `CoachAreaScreen` beyond the earlier report; `voice-and-wording.md`; renders. Nothing run.
- **Not built:** the three food kinds, their words, the snooze, hidden weight.
- **Referrals:** nutrition (SA-3, SA-7, SA-8), coaching (SA-8, SA-9), product (SA-3, SA-5, SA-6).

## Novice mobile experience (when UX/product design is assigned)
Not assigned.

## Findings

**SA-1. "Mostly fat" with an eating-disorder history must be off.** Severity: blocker if removed; satisfied as drafted. Confidence high. Food composition, excluded by MM-141 and MM-362; a fat percentage followed by a direction toward less fat. Reduced preference for high-fat food persists after weight restoration (Schebendach 2017); lower energy density and fat predicted poor one-year outcome (Schebendach 2011). **Change:** keep the flag; add a test over the real catalog that `mostlyFat` and `largePortion` carry it and `lightOnProtein` does not; record the limit in the register (SA-11).

**SA-2. "Large portion" with an eating-disorder history: off, settled.** Severity high; satisfied as drafted. A restriction cue even as an entry check: it appears only when the amount is large, so its message is "that is a lot", and inviting a second look at a quantity eaten is checking behaviour. **Change:** keep the flag; MM-365 states the reason as settled.

**SA-3. "Large portion" for everyone else.** Severity medium, confidence medium. A unit slip is a real logging error and the data-quality basis is honest, but at "≥ 2× the usual serving and ≥ 300 kcal" it fires on ordinary meals, carries a norm ("the usual serving"), and questions only large entries while MM-150 records that large meals are under-logged. **Change (owner with nutrition):** (a) an implausibility check with words that state the amount and nothing normative, or (b) as drafted with SA-4 and the snooze. Either way, no "usual" comparison in the words.

**SA-4. "Mostly fat" and "large portion" while MM-114's under-eating finding holds.** Severity high, confidence high. The app cannot tell a partial logger from someone restricting; `EasyToMissLine` already goes quiet in that state. A "leaner choice" or "check the amount" under the food of someone averaging 1,050 kcal is a restriction cue in exactly the population the app has identified, and the only backstop for an undisclosed history. **Change:** `InsightSafeguards` gains `underEating` (from `state.underEatingFinding !== undefined`); kinds flagged `notWhileUnderEating` are withheld; flag `mostlyFat` and `largePortion`. Scenario: under-eating notice due, an entry satisfying "mostly fat": no line; "light on protein" still can be.

**SA-5. "Mostly fat" in pregnancy and breastfeeding.** Severity medium, confidence medium. The app holds maintenance and hands intake to the clinician. PERILIP (Koletzko 2007) recommends oily fish, eggs and nuts, all in the ≥ 55% band. **Change:** withhold `mostlyFat` for `pregnancy` and `breastfeeding` (needs SA-6's extension). "Light on protein" stays; "large portion" the owner's call.

**SA-6. "Mostly fat" and "large portion" with `underweight`.** Severity medium-high (underweight), low (`lowBodyWeight`). The app plans no deficit and says "If you are not eating enough … talk to a clinician"; a leaner-choice line contradicts it. **Change:** `InsightSafeguards` gains `cautions: ReadonlySet<Caution>`; `ItemInsightKind` gains `notWithCautions`; `withheld` honours it. `{underweight, pregnancy, breastfeeding}` on `mostlyFat`, `{underweight}` on `largePortion`; `lowBodyWeight` by the owner. Underweight is derived only with a weight.

**SA-7. "Light on protein" says "makes your minimum easier".** Severity medium. After bariatric surgery there is no minimum (`targetsAllowed` false); with CKD the minimum is capped with a care-team note. **Change:** not shown when `targetsAllowed` is false (via `bariatricSurgery`); CKD to the owner; at least the words must refer to the person's actual minimum.

**SA-8. "Mostly fat" for everyone: the direction.** Severity medium, confidence medium. "A leaner choice" is substitutive toward less fat, which within a budget is toward fewer calories; it fires daily on olive oil, nuts, avocado, eggs, cheese, oily fish and peanut butter until snoozed. The association between tracking apps and disordered eating is cross-sectional (Anderberg 2025; Wallace 2026). **Change:** prefer an additive direction ("A protein source alongside balances it"); nutrition to decide whole-food exemptions or a higher threshold.

**SA-9. "Light on protein" leads with calories.** Severity low. Lead with protein: "9 g of protein in 520 kcal."

**SA-10. Snooze (MM-378).** Severity low. No safety problem with a protein line snoozed "always": the dashboard rules and targets also coach protein; quieting repetition is protective. Criteria: withheld is checked before snooze; the Snoozed list never lists a withheld kind; a snooze made before a screening change stays inert. Safety notices are not snoozable; keep it so.

**SA-11. Register rows.** Severity medium. None for the three kinds, their thresholds or the eating-disorder limit itself. Add them: the limit as judgement resting on MM-11, Schebendach 2017 and 2011 as direction; "Population: people with a self-reported history; rests on disclosure".

**Under 18, hidden weight:** no finding.

## Sources and evidence
Accessed 2026-10-18.
- Anderberg I, Kemps E, Prichard I. "The link between the use of diet and fitness monitoring apps, body image and disordered eating symptomology: A systematic review." *Body Image* 2025;52:101836. doi:10.1016/j.bodyim.2024.101836. Europe PMC abstract. 38 cross-sectional and qualitative studies; no causal conclusions.
- Wallace T, Koebbel C, Heath J. "A systematic search and review focusing on the influence of health-tracking technologies on eating habits and attitudes." *J Health Psychol* 2026;31(3):885-898. doi:10.1177/13591053251351222. Abstract. 15 studies, non-clinical adults.
- Schebendach J, Mayer LES, Devlin MJ, Attia E, Walsh BT. "Dietary energy density and diet variety as risk factors for relapse in anorexia nervosa: A replication." *Int J Eat Disord* 2011;45(1):79-84. doi:10.1002/eat.20922. Full text (PMC4469286). n = 16.
- Schebendach JE, Call CC, Attia E, Devlin MJ, Walsh BT, Mayer LE. "The effect of acute weight restoration on dietary fat preference in hospitalized patients with anorexia nervosa." *Int J Eat Disord* 2017;50(2):148-151. doi:10.1002/eat.22620. Abstract.
- Koletzko B, Cetin I, Brenna JT et al. "Dietary fat intakes for pregnant and lactating women." *Br J Nutr* 2007;98(5):873-877. doi:10.1017/S0007114507764747. Abstract; consensus, 2007.
- Repository: MM-114's citations as given; `docs/evidence.md` rows `underweightBmi`, `lowWeightCautionBmi`, `sodiumOverLimit`.
- Not retrieved: PubMed pages; Schebendach 2008 AJCN; MM-150's source.

## Research
Status: performed, bounded. Questions: fat-composition feedback with an eating-disorder history; tracking-app feedback and disordered eating generally; fat guidance in pregnancy and lactation. WebSearch (4 queries) and WebFetch, direct; 5 sources. Not researched: thresholds (nutrition), portion-prompt effects, lowBodyWeight.

## Confidence and limitations
High on SA-1, SA-2, SA-4, SA-7 (bariatric), SA-10, SA-11; medium on SA-3, SA-5, SA-6 scope, SA-8, SA-9. Single pass; no hashes; nothing run; safeguards rest on self-disclosure, SA-4 the only behavioural backstop. No clinical sign-off.

## Acceptance criteria and edge cases
Existing: the two eating-disorder scenarios satisfied by the flags but tested on a synthetic catalog; "Plain words" needs a food forbidden list ("less", "smaller", "too much", "usual", "cut back", "lighter"). Proposed: no composition or portion line while under-eating holds; none in pregnancy, breastfeeding, underweight; no protein line without targets; real-catalog flag test; snooze never beats withheld; register rows. Edge cases: screening ticked after a snooze; underweight with no weigh-in; the finding keyed on itself, not the notice's visibility; an entry with no portion; CKD plus senior floor.

## Dependencies
nutrition (SA-3, SA-7, SA-8), coaching (SA-8, SA-9), product (SA-3, SA-5, SA-6, SA-7). Interfaces: `InsightSafeguards`, `ItemInsightKind`, `CoachingPolicy.cautions`/`targetsAllowed`, `state.underEatingFinding`.

## Safety concerns
Restriction cues to a disclosed history (handled), to an undisclosed or current restrictor (SA-4, not handled), to pregnancy, breastfeeding and underweight users (SA-5, SA-6, not handled); care-team advice spoken anyway (SA-5, SA-7); a soft composition judgement repeated daily on whole foods (SA-8). The additive protein line already outranks the fat line on one entry, which is right. Not clinical clearance.

## Unresolved product decisions
1. SA-3: "large portion" for the general person. 2. SA-5/SA-6: pregnancy and `lowBodyWeight` scope. 3. SA-7: CKD. 4. SA-8: additive versus substitutive direction and whole-food exemptions. Authority: product owner with the named roles.

## Verification
Source inspection only. Requested: the real-catalog flag test, the SA-4 scenario, the food forbidden-words list.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** The eating-disorder handling must stay (SA-1, SA-2). Before build: SA-4 and SA-7's bariatric case, with SA-5 and SA-6 decided in the same change. SA-11 before ship. SA-3, SA-8, SA-9 do not block.
