# Review: coaching

## Scope and traceability
- Role: coaching (behaviour change and wording). One read-only subagent session for run `docs/agent-runs/mm365-food-rules/`. Builds on `docs/agent-runs/mm366-workout-rules/findings/coaching.md` (CO-5 repetition, CO-7 terms carried forward).
- Branch `spec/food-insights-and-snooze`, head f2e8dfe.
- Requirements inspected: MM-365, MM-362, MM-378, MM-141, MM-363, MM-364, MM-108, MM-121, MM-125, MM-370; HANDOFF by search.
- Other inputs: `design/voice-and-wording.md`; `format/insightText.ts`, `itemInsightText.ts`, `Fmt.ts`; `engine/ProteinTargets.ts`, `DailyTargets.ts`, `nextTargets.ts`, `ItemInsightKind.ts`, `itemInsightKinds.ts`, `allowedItemInsights.ts`, `InsightSafeguards.ts`; `state/targetsOn.ts`; `domain/FoodEntry.ts`, `QuantitySource.ts`, `food/portion/Portion.ts`, `CoachingPolicy.ts`; `food/MealSection.tsx`, `FoodScreen.tsx`; `coach/InlineInsight.tsx`, `RecentInsightsSection.tsx`; `settings/CoachAreaScreen.tsx`; `gallery/screens/draftInsightKinds.ts`, `CoachingInsights.stories.tsx`; `test/format/itemInsightText.test.ts`, `test/voice.test.ts`; `docs/evidence.md`, `docs/non-goals.md`; the mm366 and mm361 decisions.
- Hashes not computed; the chair records them.

## Existing facts versus proposals
**Facts:**
- The owner's rulings (MM-365:18-24): mostly fat, light on protein, large portion; swap or add, never eat less; "large portion" asks only whether the amount was entered right; logged foods only; every qualifying entry shows and can be snoozed.
- Drafted lines (MM-365:31-35; `draftInsightKinds.ts:12-34`). The story's peanut-butter line says "A leaner spread" where the ticket says "choice" (`stories.tsx:48`). MM-362:29-30 still keeps "or a smaller portion" in its example.
- MM-108: state, do not judge; never moralise food; no nagging; one term for one thing.
- The protein minimum can be absent: `DailyTargets.proteinMinimumG` is `number | undefined`; `targetsOn` undefined without targets; `nextTargets` undefined when blocked or not allowed; `targetsAllowed: !bariatricSurgery`; `proteinCapGPerKg: 0.8` for CKD, exceeding it "flagged with the care-team note" (MM-121:83-86). `InsightSafeguards` carries nothing about targets or the cap.
- The dashboard's protein words: "Protein has been under your minimum"; the meal line "Adding some there is usually the easiest way to reach it". MM-125 and `docs/non-goals.md:72`: no per-meal targets, no prescribed foods.
- `QuantitySource`: weighed, labelServing, householdMeasure, palm, cuppedHand, thumb, quickAdd; an estimate has no quantity. The story's portion evidence: "Logged: 4 slices, 350 kcal", "Usual serving: 2 slices".
- Undo sibling: "Removed ${entry.name}" with Undo (`MealSection.tsx:61-64`). `Fmt.shortDay` gives "Oct 25".
- The inline words test forbids nothing about eating less, smaller, avoid or should.
- `docs/evidence.md` has no row for 55% fat, 10% protein or 2× a serving.

**Proposals:** the Findings' "Change" items and CO-7's snooze words.

## Audit coverage
Mode `change`. Inspected the above by source; no render, no device. Not inspected: thresholds and "usual serving" (nutrition); policy beyond the filter (safety); the amount step and search. No food rule, snooze or Snoozed list exists yet. Referrals: nutrition (CO-4 false-alarm rate, CO-3 kidney), safety (CO-3, CO-4), product-designer and ux-accessibility (CO-5, CO-7 when MM-378 is drawn).

## Novice mobile experience (when UX/product design is assigned)
Not assigned; comprehension notes inside each finding.

## Findings

### CO-1: "A leaner choice leaves more room for protein" borrows body words and a budget frame
Severity **medium**, confidence medium-high. The glossary uses "lean" for bodies; a novice reads "leaner" as "lower-calorie, better". "Leaves more room" is budget logic (eat less of this so protein fits). The story's "spread" names a food category, against "Plain words". Only a swap is offered where the ruling allows a swap or an addition; under olive oil, nuts or salmon an addition is the honest one. **Change:** "Most of this food's calories come from fat (62%). A lower-fat version, or a protein food alongside, puts more protein in the meal." No "leaner", "room" or "item". One set of words in ticket, drafts and story.

### CO-2: "makes your minimum easier" assumes a minimum, and "here" implies every food should carry protein
Severity **high**, confidence high. The minimum is undefined for old targets rows, a person with no targets yet, bariatric surgery, a failed pause load. "Source" and "here" are shorthand; "your minimum" without "protein" is ambiguous. A single-item rule cannot see the day, so on a day already at 180 g it still asks for protein under the pasta, teaching "each food must carry protein" (against MM-125, MM-144). **Change:** "520 kcal with 9 g of protein. A protein food alongside is the easiest way to add some." The minimum only in "The numbers behind this", and that row left out when undefined. Criteria: no minimum named without one; never "here", "source" or "minimum" in the line.

### CO-3: the protein line pushes protein where the app elsewhere caps or declines it
Severity **high**, confidence medium-high. With CKD the protein bar carries a cap and a care-team note; after bariatric surgery the app declines to set protein at all. **Change:** no light-on-protein line when `proteinCapGPerKg` is defined or `targetsAllowed` is false, via one more filter input; Settings lists the kind as "Not shown for your health answers." Safety to confirm the kidney reading.

### CO-4: the portion line's parenthesis is ambiguous, "the usual serving" has no owner, and the title says what the line must not
Severity **medium-high**. "About twice the usual serving (2 cups)": a novice cannot tell which figure 2 cups is. The usual serving can only be the label's or pack's (nutrition to confirm). "Worth checking" implies they have probably erred and recurs under a food they did eat. The title "Large portion" is a judgement on amount. **Change:** "2 cups logged, about twice the label's serving (1 cup). Right as logged? If not, the amount can be edited." Title "Portion check". Evidence: "Logged · 2 cups, 450 kcal", "Label's serving · 1 cup". Behaviour (owner): (a) the snooze as the answer, or (b) a per-entry "Right as logged" acknowledgement for this kind only; recommended (b).

### CO-5: a daily food wears the same direction every day until the person finds the snooze
Severity **medium**, confidence medium. A repeated direction reads as being told again; the snooze is one tap down and nothing tells a novice it exists. **Change (within the ruling):** on a repeat showing (the log already has this kind for this item on an earlier day), the closed line is the fact sentence alone and the direction moves into the opened body. If declined, the Snoozed section's empty words should name "Snooze…".

### CO-6: "light on protein" still fires on estimated entries by the ticket's words
Severity **low**. MM-365 says "no composition insight" for an estimate but the scenario covers mostly fat only; an estimate has no quantity so the portion rule cannot compute. **Change:** an estimated entry gets none of the three; the scenario names all three.

### CO-7: the snooze's words
Severity **medium**. "Snooze" promises a return, so "always" contradicts it; the snack and the Settings list should use one form for the end. **Proposed:** button "Snooze…"; heading "Snooze “Mostly fat” for Peanut butter"; lengths "For a day", "For a week", "For a month", "Until I turn it back on"; snack "Snoozed for Peanut butter until Oct 25" (a day: "until tomorrow"; open-ended: "until turned back on") with Undo; Settings section "Snoozed" under "Kinds of insight", rows titled by the kind, subtitle "Peanut butter · until Oct 25" / "… · until turned back on", trailing "Turn back on"; empty state "Nothing is snoozed. Open an insight under a food and choose Snooze… to quiet that kind for that food."; after "Turn back on", a snack "Mostly fat is back on for Peanut butter" with Undo.

### CO-8: the ticket, MM-362, the story and the words test disagree with the ruling
Severity **low**. MM-362's example keeps "or a smaller portion"; the story says "spread"; "Plain words" has no test. **Change:** amend MM-362; one set of words; add to the forbidden list `less`, `smaller`, `cut back`, `avoid`, `too much`, `should`, `lean`, `room`, `minimum`, `source`, with representative figures including a minimum-less set.

### CO-9: no evidence register rows
Severity **low** now, blocking before ship. Nutrition owns the rows; each says "product judgement" where it is.

## Sources and evidence
- Simpson CC, Mazzeo SE. "Calorie counting and fitness tracking technology: Associations with eating disorder symptomatology." *Eating Behaviors* 26 (2017) 89-92. PMID 28214452. Europe PMC abstract, 2026-10-18. 493 students, cross-sectional: tracker users showed higher eating concern and restraint.
- Hahn SL et al. "Introducing dietary self-monitoring to undergraduate women via a calorie counting app has no effect on mental health or health behaviors." *J Acad Nutr Diet* 2021;121(12):2377-2388. PMID 34427188. Abstract. One-month RCT, low-risk sample: no increase in eating-disorder risk.
- Search listings only, not cited: a 2025 approach-avoidance smartphone RCT; approach-versus-avoidance goal-framing summaries.
- Interpretation: no evidence on item-level nutrient feedback; supports the existing eating-disorder exclusion and caution about repeated quantity-flavoured lines; establishes no threshold.

## Research
Status: performed (bounded). Questions: does nutrient feedback in logging apps raise eating concern, and in whom; does "add" framing beat "restrict" framing. WebSearch (two queries), WebFetch (Europe PMC; PubMed search page). Not researched: thresholds; message fatigue (earlier report).

## Confidence and limitations
High for CO-2, CO-3's conflict, CO-6, CO-8; medium-high CO-1, CO-4's ambiguity; medium CO-4's tone, CO-5, CO-7. No render; no device; single session; hashes not computed.

## Acceptance criteria and edge cases
Existing: none tests an absent minimum, a protein cap, no targets, a repeat showing or the snooze's words. Proposed: as in CO-1 to CO-5; given no minimum, no evidence row names one; given CKD or bariatric surgery, no protein line and "Not shown for your health answers."; a repeat showing is the fact only; a week's snooze on Oct 18 says "until Oct 25" in both places. Edge cases: a food logged twice in one meal; an entry edited so the rule no longer holds; a custom food with no serving; a recipe's own serving ("the recipe's serving"); mixed units; the renamed title keeps its id.

## Dependencies
nutrition (usual serving, false-alarm rate, caps, rows); safety (CO-3, CO-4, the reworded fat line's exclusion); product-designer and ux-accessibility (CO-5, CO-7 when MM-378 is drawn; the title at 200% text).

## Safety concerns
CO-3: urging protein to a person with a cap or without targets contradicts the app's caution. CO-4: a recurring quantity remark reads as "you ate too much". CO-5: repetition is a mild compulsion risk. Not clinical clearance.

## Unresolved product decisions
1. A per-entry "Right as logged" acknowledgement for the portion check (CO-4). 2. A repeat showing drops the direction from the closed line (CO-5). 3. Whether the minimum may appear in the line with a branch (CO-2). 4. The title "Portion check" (CO-4). 5. "Until I turn it back on" versus "Always" (CO-7). Authority: product owner.

## Verification
Source inspection only. Requested: a food words test with representative figures including a minimum-less set; the extended forbidden list; filter tests for the cap and no-targets cases; a repeat-showing test if accepted; the MM-378 stories before build.

## Targeted challenges
None yet.

**Verdict: build with the listed changes.** CO-2 and CO-3 before build; CO-4's words and title settled before build; CO-5 and CO-7 to the owner and MM-378's drawing; CO-6, CO-8, CO-9 in the same pull request.
