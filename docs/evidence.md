# Evidence register

Every constant and rule that decides something about a user's body or safety,
with where it comes from and how good that evidence is. A test
(`apps/mobile/test/engine/evidenceRegister.test.ts`) fails `mm check` when a
constant or rule has no row here, or a row names something that no longer
exists. The app's **How this works** screen is generated from this file.

## Grades

Defined once, used in tickets, in this file and in the app's own words.

| Grade | In the app | Means |
|---|---|---|
| strong | Well established | Consistent meta-analyses, consensus statements, or established physiology. |
| moderate | Reasonably supported | A good meta-analysis with inconsistency, or several trials, or strong evidence in a population different from ours. |
| emerging | Early evidence | One or a few small studies. |
| judgement | Our judgement | Expert practice or product reasoning with no direct trial. |

A judgement row is not a failure: many product decisions cannot be anything
else. The failure is a judgement presented as science. **Explanations elsewhere
may not claim more than the row's grade.**

## About the sources

The citations below are the ones recorded in the code and in the requirement
tickets, which were gathered by literature search and, in some cases, from
secondary summaries. **The Checked column is No until someone has read the
primary source and confirmed that it says what the row says.** A row is not
done until then, and the professional review (MM-29) is recorded against rows,
not against the app as a whole. No row has been reviewed by a professional.

Population matters: much of the literature is young, male and trained, or has
obesity and is untrained. Where a row is applied beyond its population, that is
an extrapolation and the row says so.

## Questions

Plain-language entries for the app, grouped by question. Each lists the rows it
draws on.

### How are my calories set?

Your target is your estimated daily energy use, adjusted for the pace of
weight change you chose. The pace is limited by your body fat, because faster
loss costs more muscle in lean people. The energy in a kilogram of body weight
depends on how much of it is fat and how much is lean tissue, which the app
estimates from your body fat. The target never goes below a floor set by your
resting energy and, for lean people, by the energy needed to support the body.

Rows: computeTargets.weeklyRate, SafetyBounds.maxWeeklyLossFraction, SafetyBounds.calorieFloorKcal, SafetyBounds.absoluteFloorKcal, SafetyBounds.energyAvailabilityThresholdPercent, SafetyBounds.minEnergyAvailabilityKcalPerKgFfm, fatMassKcalPerKg, fatFreeMassKcalPerKg, forbesConstantKg, leanFractionOfChange

### How is my protein target chosen?

Protein is set in grams from your body weight, using a reference weight that
counts only part of any weight above a body mass index of 25, so heavier people
are not given very large targets. You see both a minimum and a target; the
minimum depends on your goal and training, and the target rises in a lean
deficit. If you have chronic kidney disease, both are capped and you are told
to confirm them with your clinician.

Rows: SafetyBounds.proteinRangeG, SafetyBounds.proteinTargetsG, SafetyBounds.referenceWeightKg, SafetyBounds.excessWeightFraction, SafetyBounds.minFatG, computeTargets.macroSplit

### How does the app know how much energy I use?

At first it estimates it from your size, age and sex, then from how active your
day is and how often you train. After about two weeks of logging and weighing it
replaces that estimate with a measurement: the food you logged, less the energy
in the weight you gained or lost. The measurement is more reliable the more
fully you log and the more regularly you weigh in.

Rows: mifflinStJeorKcal, katchMcArdleKcal, activityFactor, initialTdeePrior, TdeeEstimator.windowDays, TdeeEstimator.minSpanDays, TdeeEstimator.minIntakeDays, TdeeEstimator.minWeighIns, TdeeEstimator.partialDayFraction, TdeeEstimator.styleSwitchThreshold, TdeeEstimator.minDaysPerStyleSegment, TdeeEstimator.minBmrMultiple, TdeeEstimator.maxBmrMultiple, calibrationDays, settlingDays, phaseChangeFraction

### How is my trend weight worked out?

Your scale weight moves by a kilogram or two from day to day for reasons that
are not body tissue. The trend is a smoothed estimate that separates the slow
change from that noise, and it shows how uncertain it is. A reading that is far
out of line is set aside.

Rows: WeightTrendModel.relativeWaterSigma, WeightTrendModel.waterPersistence, WeightTrendModel.relativeScaleSigma, WeightTrendModel.levelProcessSigmaKg, WeightTrendModel.slopeProcessSigmaKgPerDay, WeightTrendModel.initialSlopeSigmaKgPerDay, WeightTrendModel.outlierSigmas, WeightTrendModel.maxConsecutiveRejections, settlingShiftFraction, settlingSlopeShiftFraction

### Why do my targets change slowly?

Targets change at most once a week, by a small step, so one unusual week cannot
swing them. A step limit also stops a run of poorly logged days from pushing
targets down. Safety rules can override the limit in one direction: when you are
losing faster than the app aims for, calories go back up at once.

Rows: SafetyBounds.maxWeeklyTargetChangeKcal, SafetyBounds.maxWeeklyTargetChangeFraction, SafetyBounds.maxWeeklyTargetChange, checkInIntervalDays, safetyRaiseLookbackDays, safetyRaiseMinWeighIns, safetyRaiseSigmas, safetyRaiseCapKcal

### How sure is my coach?

Confidence is shown as Learning, Fair or Good, based on the weakest of the
expenditure estimate, recent usable food days, weigh-ins and stability. It is
not a score. At Learning, ordinary target changes wait while the coach learns;
the Coach screen shows the part that needs attention and one next step.

Rows: assessCoachConfidence, confidenceGoodEstimateSigmaKcal, confidenceLearningEstimateSigmaKcal, confidenceGoodFoodDays, confidenceMinimumFoodDays, confidenceGoodWeighInDays, confidenceMinimumWeighInDays, confidenceStabilityDays

### When does the app slow or stop a deficit?

A deficit is not offered below a body mass index of 18.5, and loss is limited to
the gentlest pace below 20. After a long unbroken deficit the app plans a
maintenance break. Goals are also limited by your health check.

Rows: underweightBmi, lowWeightCautionBmi, lowWeightMaxLossFraction, SafetyBounds.maxContinuousDeficitWeeks

### How sure is the app about my body fat?

Body fat is estimated from height, weight, age and sex unless you give your own
figure, and either way it is only an estimate, off by several points. Where a
safety limit depends on it, the app takes the cautious side when you could
plausibly be on it, and does not switch back and forth on a small change.

Rows: deurenbergBodyFat, quartileSigmas, safetyBodyFatDeadbandPercent, SafetyBounds.checkGoalBodyFat

### When does the app ask about my health?

The health check is repeated every 90 days and before you switch to a deficit.
You can defer it once; after a second skip, deficit coaching pauses at
maintenance until you confirm your answers.

Rows: UserSetup.healthCheckIntervalDays, CoachingPolicy.seniorMaxWeeklyLossFraction, CoachingPolicy.seniorMinimumProteinGPerKgReferenceWeight, CoachingPolicy.insulinUnconfirmedMaxWeeklyLossFraction, CoachingPolicy.targetsAllowed

### How is a food graded?

Every food gets a grade from A+ to D- for the food itself, per 100 g, from
its energy, sugars, saturated fat, salt, fiber and protein, using the point
tables published for the Nutri-Score label (2023 update) with the
differences the rows below record: no fruit, vegetable and legume share, one
table for every food, twelve steps, and no grade for alcoholic drinks or when
a value is missing. The grades are not Nutri-Scores, and the app is not
registered with Santé publique France. The amount eaten does not change a
food's grade; a meal's or a day's grade counts its foods by their calories.

Rows: foodGrade, FoodGradeRule.energyKJ, FoodGradeRule.sugarsG, FoodGradeRule.saturatedFatG, FoodGradeRule.saltG, FoodGradeRule.fiberG, FoodGradeRule.proteinG, FoodGradeRule.proteinNotCountedFrom, FoodGradeRule.alcoholLimitG, FoodGradeRule.letterSteps, FoodGradeRule.rollupCoverage, foodGrade.fvlOmitted, foodGrade.oneTableForAll, foodGrade.requiredNutrients

## Register

| Name | Value | Where | Decides | Source | Grade | Population | Checked |
|---|---|---|---|---|---|---|---|
| `SafetyBounds.minEnergyAvailabilityKcalPerKgFfm` | 30 kcal per kg fat-free mass a day | engine SafetyBounds.ts | The energy floor for lean users | Loucks, on low energy availability, as cited in the code (paper and year not yet confirmed) | moderate | Young women athletes; applied to men and to all lean users as an extrapolation | No |
| `SafetyBounds.absoluteFloorKcal` | 1,500 men, 1,200 women | engine SafetyBounds.ts | The lowest target ever issued | NIH minimum-intake guidance, as cited in the code | moderate | Adults with obesity under supervised and unsupervised programs | No |
| `SafetyBounds.energyAvailabilityThresholdPercent` | 15% men, 25% women | engine SafetyBounds.ts | Whether the energy-availability floor applies | Product judgement: low-energy-availability harm concentrates in lean users | judgement | None directly | No |
| `SafetyBounds.calorieFloorKcal` | The largest of the absolute floor, resting energy, and for lean users the energy-availability floor | engine SafetyBounds.ts | The calorie floor | Product judgement combining the rows above | judgement | None directly | No |
| `SafetyBounds.maxContinuousDeficitWeeks` | 16 weeks | engine SafetyBounds.ts | When a maintenance break is forced | MATADOR (Byrne 2018) as cited in MM-31 supports intermittent dieting; the 16 weeks is product judgement | judgement | Men with obesity (MATADOR); the figure is not from it | No |
| `SafetyBounds.maxWeeklyTargetChangeKcal` | 100 kcal | engine SafetyBounds.ts | The largest ordinary weekly change in the target | Product judgement for stability | judgement | None | No |
| `SafetyBounds.maxWeeklyTargetChangeFraction` | 5% of the target | engine SafetyBounds.ts | The same, for small targets | Product judgement for stability | judgement | None | No |
| `SafetyBounds.maxWeeklyTargetChange` | The smaller of the two above | engine SafetyBounds.ts | The weekly step limit | Product judgement | judgement | None | No |
| `SafetyBounds.excessWeightFraction` | 0.25 | engine SafetyBounds.ts | How much weight above BMI 25 counts toward the reference weight | The adjusted-body-weight convention in clinical nutrition | judgement | Adults with obesity | No |
| `SafetyBounds.referenceWeightKg` | Body weight up to BMI 25, then a quarter of the excess | engine SafetyBounds.ts | The weight that protein and fat rules scale with | The adjusted-body-weight convention (MM-120) | judgement | Adults with obesity | No |
| `SafetyBounds.maxWeeklyLossFraction` | 0.5%, 0.7% or 1.0% of body weight a week by body fat (cut-offs 12% and 15% men, 22% and 25% women) | engine SafetyBounds.ts | The fastest allowed pace of loss | Slower loss preserving lean mass: Garthe 2011, Helms 2014, as cited (that direction is moderate). The cut-offs are product judgement | judgement | Athletes (Garthe, Helms); the cut-offs are not from them | No |
| `SafetyBounds.minFatG` | The larger of 0.5 g (men) or 0.6 g (women) per kg of reference weight, and 20% of energy | engine SafetyBounds.ts | The lowest daily fat target | Product judgement | judgement | None | No |
| `SafetyBounds.proteinRangeG` | Evidence range: 1.6 to 2.2 g per kg of reference weight; 2.3 to 3.1 g per kg fat-free mass for lean users in a deficit; capped for kidney disease | engine SafetyBounds.ts | The evidence-backed range used to inform target selection; not the selected app target | Morton 2018 for the general range and Helms 2014 for lean people in a deficit, as cited; the kidney cap is product judgement | moderate | Trained adults (Morton); lean resistance-trained athletes dieting (Helms); the cap is not from either | No |
| `SafetyBounds.proteinTargetsG` | Minimum and target vary by goal and lifting; lean-deficit target interpolates over 3 body-fat points; kidney disease sets both to 0.8 g/kg body weight | engine SafetyBounds.ts | The minimum to clear and goal-specific target (MM-121) | Moderate evidence from Morton 2018, Nunes 2022, and Helms 2014 informs the selection; exact points, interpolation, and kidney cap are product judgement | judgement | Adults by goal and training status; lean dieters; kidney disease cap is not from the cited protein trials | No |
| `SafetyBounds.checkGoalBodyFat` | Rejected under 8% men or 16% women; warned under 10% or 18% | engine SafetyBounds.ts | Whether a goal body fat is accepted | Product judgement | judgement | None | No |
| `fatMassKcalPerKg` | 9,440 kcal per kg (39.5 MJ) | engine partitionConstants.ts | The energy in a kilogram of fat | Hall 2008, as cited | strong | Adults | No |
| `fatFreeMassKcalPerKg` | 1,815 kcal per kg (7.6 MJ) | engine partitionConstants.ts | The energy in a kilogram of lean tissue | Hall 2008, as cited | moderate | Adults | No |
| `forbesConstantKg` | 10.4 kg | engine partitionConstants.ts | How the lean share of a weight change falls as fat mass rises | Forbes, revised in Hall 2007, as cited | moderate | Adults across a range of body fat | No |
| `leanFractionOfChange` | The Forbes curve, halved for resistance-trained people losing weight | engine leanFractionOfChange.ts | How much of a weight change is lean tissue | The Forbes curve as above; the halving is a modelling assumption stated in the code | judgement | Not from a trial | No |
| `computeTargets.weeklyRate` | Fat loss 0.75% (up to the safety maximum); recomposition 0.25% or 0.1%; lean gain 0.35%, 0.25% or 0.15% a week | engine computeTargets.ts | The intended pace for each goal | Barakat 2020 informs recomposition; the rates are product judgement | judgement | Novice and returning lifters (Barakat) | No |
| `computeTargets.macroSplit` | After protein and the fat floor, fat is 25% of energy and carbohydrate is the rest | engine computeTargets.ts | How the remaining energy is split | Product judgement | judgement | None | No |
| `mifflinStJeorKcal` | 10 x kg + 6.25 x cm - 5 x age, +5 men or -161 women | engine mifflinStJeorKcal.ts | Resting energy, which starts the expenditure estimate and sets a floor | Mifflin-St Jeor equation, as named in the code | moderate | Healthy adults of a range of weights | No |
| `katchMcArdleKcal` | 370 + 21.6 x kg fat-free mass | engine katchMcArdleKcal.ts | Resting energy from fat-free mass (not yet used) | Katch-McArdle equation, as named in the code | moderate | Lean and athletic adults | No |
| `activityFactor` | Daily activity 1.20, 1.30, 1.40 or 1.50, plus 0.025 per training day | engine activityFactor.ts | The starting estimate of energy use | Product judgement, cross-checked against the common published multipliers (MM-164) | judgement | None directly | No |
| `initialTdeePrior` | Resting energy x the activity factor, with 15% uncertainty | engine initialTdeePrior.ts | The estimate of energy use before there is data | Product judgement; replaced by a measurement after about two weeks | judgement | None directly | No |
| `deurenbergBodyFat` | 1.20 x BMI + 0.23 x age - 10.8 (men) - 5.4, with 5 points of uncertainty | engine deurenbergBodyFat.ts | The body-fat estimate when the user gives none | Deurenberg 1991, as cited; BMI-based equations are off by about 4 to 5 points | moderate | Adults, mostly white; poorer in muscular, older and some ethnic groups | No |
| `TdeeEstimator.windowDays` | 28 days | engine TdeeEstimator.ts | How far back the measurement looks | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minSpanDays` | 14 days | engine TdeeEstimator.ts | The shortest span that can produce a measurement | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minIntakeDays` | 10 days | engine TdeeEstimator.ts | The fewest usable food days before measuring | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minWeighIns` | 8 | engine TdeeEstimator.ts | The fewest weigh-ins before measuring | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.partialDayFraction` | 0.65 | engine TdeeEstimator.ts | Below this share of typical intake an unmarked day is treated as partly logged | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.styleSwitchThreshold` | 0.5 | engine TdeeEstimator.ts | What counts as a change in how the user logs | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minDaysPerStyleSegment` | 7 days | engine TdeeEstimator.ts | The shortest stretch of one logging style | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minBmrMultiple` | 1.1 x resting energy | engine TdeeEstimator.ts | The lowest plausible measured expenditure | Product judgement; a very wide bound | judgement | None | No |
| `TdeeEstimator.maxBmrMultiple` | 3.0 x resting energy | engine TdeeEstimator.ts | The highest plausible measured expenditure | Product judgement; a very wide bound | judgement | None | No |
| `WeightTrendModel.relativeWaterSigma` | 0.6% of body weight | engine WeightTrendModel.ts | The size of day-to-day water fluctuation | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.waterPersistence` | 0.65 | engine WeightTrendModel.ts | How much one day's water offset carries to the next | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.relativeScaleSigma` | 0.2% of body weight | engine WeightTrendModel.ts | Scale and clothing noise | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.levelProcessSigmaKg` | 0.02 kg a day | engine WeightTrendModel.ts | How fast the true weight can wander | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.slopeProcessSigmaKgPerDay` | 0.003 kg a day | engine WeightTrendModel.ts | How fast the pace of change can change | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.initialSlopeSigmaKgPerDay` | 0.1 kg a day | engine WeightTrendModel.ts | How uncertain the pace is at the start | Product judgement | judgement | None | No |
| `WeightTrendModel.outlierSigmas` | 5 | engine WeightTrendModel.ts | How far out of line a reading must be to be set aside | Product judgement | judgement | None | No |
| `WeightTrendModel.maxConsecutiveRejections` | 3 | engine WeightTrendModel.ts | How many readings in a row can be set aside | Product judgement | judgement | None | No |
| `calibrationDays` | 14 days | engine coachConstants.ts | How long targets hold at the start | Product judgement | judgement | None | No |
| `safetyRaiseLookbackDays` | 14 days | engine coachConstants.ts | How far back the too-fast-loss check looks | Product judgement (MM-115) | judgement | None | No |
| `safetyRaiseMinWeighIns` | 8 | engine coachConstants.ts | Weigh-ins needed before a too-fast loss can raise targets | Product judgement (MM-115) | judgement | None | No |
| `safetyRaiseSigmas` | 1.5 deviations | engine coachConstants.ts | How clearly over the limit the pace must be | Product judgement (MM-115), compared at 1.0 in simulation | judgement | None | No |
| `safetyRaiseCapKcal` | 400 kcal | engine coachConstants.ts | The most one check-in raises targets for a too-fast loss | Product judgement (MM-115) | judgement | None | No |
| `checkInIntervalDays` | 7 days | engine coachConstants.ts | How often targets can change | Product judgement | judgement | None | No |
| `assessCoachConfidence` | The worst of four states: estimate, usable food days, weigh-ins and stability; Learning holds adaptive target changes | engine CoachConfidence.ts | Confidence wording and whether an ordinary target update proceeds | Product judgement; thresholds and behavior are defined in MM-139 | judgement | None | No |
| `confidenceGoodEstimateSigmaKcal` | Under 200 kcal standard deviation | engine CoachConfidence.ts | The Good estimate boundary | Product judgement; requires simulator calibration | judgement | Not calibrated for a population | No |
| `confidenceLearningEstimateSigmaKcal` | Over 350 kcal standard deviation | engine CoachConfidence.ts | The Learning estimate boundary | Product judgement; requires simulator calibration | judgement | Not calibrated for a population | No |
| `confidenceGoodFoodDays` | 20 usable days in the past 28 | engine CoachConfidence.ts | The Good food-log boundary | Product judgement | judgement | None | No |
| `confidenceMinimumFoodDays` | 10 usable days in the past 28 | engine CoachConfidence.ts | The minimum Fair food-log boundary | Matches the estimator's minimum day count; product judgement | judgement | None | No |
| `confidenceGoodWeighInDays` | 20 weigh-ins in the past 28 | engine CoachConfidence.ts | The Good weigh-in boundary | Product judgement | judgement | None | No |
| `confidenceMinimumWeighInDays` | 8 weigh-ins in the past 28 | engine CoachConfidence.ts | The minimum Fair weigh-in boundary | Matches the estimator's minimum weigh-in count; product judgement | judgement | None | No |
| `confidenceStabilityDays` | 14 days | engine CoachConfidence.ts | How long a recent phase change, logging-style restart or lasting weight event lowers stability | Product judgement aligned with a settling period (MM-136) | judgement | None | No |
| `settlingDays` | 10 days | engine coachConstants.ts | How long after a change of intake the scale moves for reasons other than tissue | Glycogen and water shifts (MM-131); the length is product judgement | judgement | Not from a trial | No |
| `phaseChangeFraction` | 10% of expenditure | engine coachConstants.ts | What counts as a change of intake level | Product judgement (MM-131) | judgement | None | No |
| `settlingShiftFraction` | 0.4% of body weight a day | engine coachConstants.ts | How far the trend may shift inside a settling window | Product judgement tuned in simulation (MM-131) | judgement | None | No |
| `settlingSlopeShiftFraction` | 0.04% of body weight a day | engine coachConstants.ts | How far the trend's pace may change inside a settling window | Product judgement tuned in simulation (MM-131) | judgement | None | No |
| `weightEventStepPriorKg` | Signed mean +1.5/-1.5 kg, standard deviation 1.5 kg | engine weightEventConstants.ts | Prior for creatine start/stop, updated from scale observations | Creatine-related water shifts; prior width is product judgement (MM-136) | judgement | Not an individually measured water shift | No |
| `weightEventStepDays` | 21 days | engine weightEventConstants.ts | Creatine transition excluded from the expenditure slope | Product judgement within the expected one-to-four-week transition (MM-136) | judgement | Loading and individual response vary | No |
| `weightEventNoiseMultiplier` | 1.6 times noise | engine weightEventConstants.ts | Passing-event readings pull the trend less | Product judgement reusing the cycle-noise starting value (MM-136) | judgement | Event-specific magnitude is not calibrated | No |
| `weightEventReductionPauseDays` | 28 days | engine weightEventConstants.ts | Defers ordinary calorie reductions after creatine start/stop | Product judgement protecting the four weekly check-ins required by MM-136; safety and user corrections still apply | judgement | None | No |
| `quartileSigmas` | 0.6745 | engine safetyBodyFatConstants.ts | The point with a quarter chance on one side, for the cautious body fat | Statistics: the 75th percentile of a normal distribution | strong | Not applicable | No |
| `safetyBodyFatDeadbandPercent` | 2 points | engine safetyBodyFatConstants.ts | How far body fat must move before a safety rule switches | Product judgement (MM-132) | judgement | None | No |
| `underweightBmi` | 18.5 | domain lowWeightLimits.ts | Below this no deficit is planned | The WHO and CDC boundary of underweight, a convention rather than a threshold of harm (MM-111) | strong | Adults; may differ by age and ancestry | No |
| `lowWeightCautionBmi` | 20 | domain lowWeightLimits.ts | Below this deficits are allowed only at the gentlest pace | Product judgement: a margin above the boundary (MM-111) | judgement | None | No |
| `lowWeightMaxLossFraction` | 0.5% of body weight a week | domain lowWeightLimits.ts | The gentlest pace of loss | Garthe 2011, Helms 2014 for slower loss in lean people; the use here is product judgement | judgement | Athletes | No |
| `UserSetup.healthCheckIntervalDays` | 90 days | domain UserSetup.ts | How often the health check is due | Product judgement balancing timely updates against repeated-question friction (MM-112) | judgement | All users | No |
| `CoachingPolicy.seniorMaxWeeklyLossFraction` | 0.5% of body weight a week | domain CoachingPolicy.ts | The loss pace offered from age 65 | Product judgement informed by preserving lean mass in older adults (MM-112) | judgement | Adults aged 65 and older | No |
| `CoachingPolicy.seniorMinimumProteinGPerKgReferenceWeight` | 1.2 g per kg of reference weight | domain CoachingPolicy.ts | Protein minimum from age 65 | PROT-AGE and ESPEN position papers, as cited in MM-112 (primary sources not yet confirmed) | moderate | Older adults | No |
| `CoachingPolicy.insulinUnconfirmedMaxWeeklyLossFraction` | 0.5% of body weight a week | domain CoachingPolicy.ts | The loss pace until an insulin- or sulfonylurea-treated user confirms care-team discussion | Hypoglycemia risk is standard clinical guidance; this cap is product judgement (MM-112) | judgement | People treated with insulin or a sulfonylurea | No |
| `CoachingPolicy.targetsAllowed` | False after bariatric surgery | domain CoachingPolicy.ts | Whether the app issues nutrition targets | Product judgement: post-surgical intake and protein rules are set by the surgical team (MM-112) | judgement | People who have had bariatric surgery | No |
| `NutritionGoals.suggestedSodiumLimitMg` | 2,300 mg a day | domain NutritionGoals.ts | Suggested when the sodium limit is switched on (MM-311) | NASEM 2019 Chronic Disease Risk Reduction Intake for ages 14 and over, pregnancy and lactation included; the Dietary Guidelines' limit | strong | Apparently healthy US and Canadian population; sodium has no UL | No |
| `NutritionGoals.minSodiumLimitMg` | 1,500 mg a day | domain NutritionGoals.ts | The lowest limit the app accepts | NASEM 2019 Adequate Intake for adults; a lower limit belongs to a clinician (owner, 2026-10-14; panel SA-7) | moderate | Adults | No |
| `NutritionGoals.maxSodiumLimitMg` | 6,000 mg a day | domain NutritionGoals.ts | The highest limit the app accepts | Product judgement: above typical intakes, catches a mistyped number (MM-311) | judgement | None | No |
| `suggestedWaterGoalMl.baseMl` | 1,500 ml women, 2,000 ml men | domain water/suggestedWaterGoalMl.ts | The base of the suggested plain-water goal (MM-358) | The beverage share of the EFSA 2010 total-water AIs (2.0 and 2.5 L), rounded down because only plain water counts; NASEM 2004 AIs as a cross-check (EFSA primary not retrieved) | judgement | Adults; not pregnancy or breastfeeding | No |
| `suggestedWaterGoalMl.perProteinGramMl` | 7 ml per gram of protein | domain water/suggestedWaterGoalMl.ts | The urea offset of the protein target above the reference intake (MM-358) | Renal solute load: ~5.7 mOsm of urea per gram of protein; NASEM 2005, 40-60 ml of water per gram of urea nitrogen; Martin 2006 (PMID 16567155) saw hydration markers rise on 3.6 g/kg. Coefficient is product judgement (owner, 2026-10-16) | emerging | Healthy adults on high-protein targets | No |
| `suggestedWaterGoalMl.referenceProteinGPerKg` | 0.8 g per kg | domain water/suggestedWaterGoalMl.ts | Protein above this adds the urea offset (MM-358) | The adult protein RDA (NASEM 2005) | strong | Adults | No |
| `suggestedWaterGoalMl.perTrainingDayMl` | 500 ml per training day, spread over the week | domain water/suggestedWaterGoalMl.ts | The sweat of resistance training in the suggestion (MM-358) | Nearest data: CrossFit sessions lost about 0.75 L (Cronin 2016); ACSM 2007 and ISSN 2018 advise individual plans. Amount is product judgement | judgement | Adults who lift 0-7 days a week | No |
| `suggestedWaterGoalMl.pregnantMl` | 1,750 ml | domain water/suggestedWaterGoalMl.ts | The suggestion in pregnancy, with no protein or training terms (MM-358) | EFSA 2010: about +300 ml total water in pregnancy (via secondary sources), beverage share rounded down | judgement | Pregnant women | No |
| `suggestedWaterGoalMl.breastfeedingMl` | 2,000 ml | domain water/suggestedWaterGoalMl.ts | The suggestion when breastfeeding, with no protein or training terms (MM-358) | EFSA 2010: about +700 ml total water when breastfeeding (via secondary sources), beverage share rounded down | judgement | Breastfeeding women | No |
| `suggestedWaterGoalMl.capMl` | 3,500 ml | domain water/suggestedWaterGoalMl.ts | Never suggested above this, in metric (MM-358) | The panel's safety specialist: below the 4 L 'more than most people need' note; hyponatraemia depends on rate (Rangan 2021) | judgement | Healthy adults | No |
| `suggestedWaterGoalMl.capFlOz` | 120 fl oz | domain water/suggestedWaterGoalMl.ts | Never suggested above this, in imperial (MM-358) | The metric cap, as whole 8 fl oz glasses | judgement | Healthy adults | No |
| `suggestedWaterGoalMl.withheld` | Kidney disease, bariatric surgery, a clinician-set fluid limit | domain water/suggestedWaterGoalMl.ts | When no water goal is suggested (MM-358, MM-359) | NIDDK on CKD fluid limits; AHA/ACC/HFSA 2022 and HFA 2024 on heart-failure fluid limits; surgical programmes set sipping after bariatric surgery (owner, 2026-10-16) | moderate | The groups named | No |
| `NutritionGoals.minWaterGoalMl` | 500 ml a day | domain NutritionGoals.ts | The lowest water goal accepted | Product judgement: catches a mistyped number | judgement | None | No |
| `NutritionGoals.maxWaterGoalMl` | 6,000 ml a day | domain NutritionGoals.ts | The highest water goal accepted | Owner, 2026-10-14; hyponatraemia from drinking depends on rate (kidney excretion about 735-970 ml an hour), with reported cases at a median of 8 L a day (Rangan 2021, BMJ Open, systematic review of case reports) | emerging | Healthy adults; not people with kidney disease, heart failure or fluid restriction | No |
| `NutritionGoals.highWaterGoalMl` | 4,000 ml a day | domain NutritionGoals.ts | Above it the goal is said to be more than most people need | Product judgement above the NASEM water AIs (owner, 2026-10-14; panel SA-5) | judgement | Adults | No |
| `NutritionGoals.highWaterGoalEatingDisorderMl` | 3,500 ml a day | domain NutritionGoals.ts | Above it the goal is said to be more than most people need, for someone with an eating-disorder history (MM-358) | The panel's safety specialist: water-loading before weigh-ins and drinking to suppress appetite are reported harms (Krogulska 2019); the note comes at the cap of a suggestion | judgement | People with an eating-disorder history | No |
| `referenceAmount` | US DRIs (RDA, or AI for potassium) by sex and age band | domain food/micros/referenceAmount.ts | The reference marker on each vitamin and mineral (MM-310) | NASEM DRI tables, as reproduced by Health Canada (2025); IOM 2000 on applying DRIs: a goal for usual intake, not one day | strong | Apparently healthy adults 19 and over; not pregnancy, lactation, kidney disease or after bariatric surgery | No |
| `ReferenceWithheld` | Pregnancy or breastfeeding, kidney disease, bariatric surgery, under 19 | domain food/micros/ReferenceWithheld.ts | When no reference marker is drawn (MM-310) | The DRIs differ or a care team sets the amounts in these groups (NASEM; panel SA-1, MN-6) | judgement | The groups named | No |
| `SodiumDay.minimumCoverage` | 70% of the day's calories | domain food/micros/SodiumDay.ts | A day under the sodium limit is judged only with this much of it stating sodium (MM-312) | Product judgement, the fiber rule's threshold (MM-126) | judgement | None | No |
| `sodiumOverLimit` | Over the limit on more than half of the judged whole days since the limit was set, at least the minimum basis | engine findInsights.ts | Whether the coach mentions sodium (MM-312) | Product judgement; the body's claim rests on CDC MMWR 2012 (65% of US sodium from stores, 25% from restaurants, 2007-08) | judgement | US adults; suppressed for an eating-disorder history | No |
| `countHardSets` | A set is hard with 4 or fewer reps in reserve, or none recorded; it counts in full for its exercise's main muscle and half for each other muscle it trains | engine countHardSets.ts | How weekly volume (MM-78) and the volume jump (MM-366) count sets | Product judgement; the half for a secondary muscle is a common convention in set counting, not a measured share | judgement | None directly | No |
| `volumeJump` | Hard sets for a muscle group in the 7 days to a workout at least `VolumeJumpRule.ratio` times its usual week and `VolumeJumpRule.minimumMoreSets` more; said once a workout, whenever it holds, until snoozed (MM-378) | engine volumeJumpInsights.ts | Whether the coach mentions a jump in weekly sets under a lift (MM-366) | The figures are product judgement. The direction, that unaccustomed work can bring more soreness and smaller steps help, rests on the repeated bout effect (Nosaka and Aoki 2011). The acute:chronic workload ratio is contested (Impellizzeri 2020) and is not the source; no injury is claimed | judgement | Mostly untrained adults in eccentric-exercise studies, extrapolated to weekly set counts | No |
| `VolumeJumpRule.ratio` | 1.5 | engine VolumeJumpRule.ts | How far above the usual week counts as a jump | Product judgement, checked by the panel's training role (TR-4); not from workload-ratio studies | judgement | None | No |
| `VolumeJumpRule.minimumMoreSets` | 4 sets | engine VolumeJumpRule.ts | The smallest jump said, so 2 to 3 sets says nothing | Product judgement (the panel's TR-4, SA-5) | judgement | None | No |
| `VolumeJumpRule.usualWeeks` | 4 weeks | engine VolumeJumpRule.ts | The weeks averaged for the usual week | Product judgement (the panel's TR-4) | judgement | None | No |
| `VolumeJumpRule.weeksWithSets` | 3 of the 4 weeks | engine VolumeJumpRule.ts | How much history a usual week needs, so a first block or a missed month says nothing | Product judgement (the panel's TR-4) | judgement | None | No |
| `mostlyFat` | An entry of at least `FoodInsightRule.mostlyFatMinKcal` with at least `FoodInsightRule.mostlyFatShare` of its calories from fat and under `FoodInsightRule.proteinDenseShare` from protein; not for an estimate, or an entry whose macros do not explain its energy | engine foodItemInsights.ts | Whether the coach says most of a food's calories are fat and suggests a protein food alongside (MM-365) | No guideline tests one food's fat share: the AMDR of 20–35% of energy from fat is a daily range (Health Canada DRI tables, 2025). The trigger is product judgement; nuts, oils and avocado meet it although guidance includes them (Aune 2016 on nuts), accepted so the owner's peanut-butter example stands (the panel's NU-2). The direction adds, never removes (the owner, 2026-10-18) | judgement | Adults; off with an eating-disorder history, while under-eating, and with the underweight, pregnancy and breastfeeding cautions | No |
| `FoodInsightRule.mostlyFatShare` | 55% of calories | engine FoodInsightRule.ts | How much of a food must be fat | Product judgement, well above the AMDR ceiling of 35% so a mixed dish rarely qualifies | judgement | None | No |
| `FoodInsightRule.mostlyFatMinKcal` | 150 kcal | engine FoodInsightRule.ts | The smallest food spoken about | Product judgement: a tablespoon of oil or 30 g of cheese is left alone | judgement | None | No |
| `FoodInsightRule.proteinDenseShare` | 20% of calories | engine FoodInsightRule.ts | A protein food is never called "mostly fat" | Product judgement inside the AMDR for protein (10–35%); eggs, cheese, tofu, fish and meat carry 25–47% (the panel's NU-1) | judgement | None | No |
| `FoodInsightRule.knownMacrosShare` | 75% of calories | engine FoodInsightRule.ts | A composition line needs the macros to explain the energy, so a food typed with calories alone says nothing | Product judgement; label rounding moves shares a few points (the panel's NU-4) | judgement | None | No |
| `lightOnProtein` | An entry of at least `FoodInsightRule.lightOnProteinMinKcal` with under `FoodInsightRule.lightOnProteinShare` of its calories from protein and under `FoodInsightRule.alcoholShare` from alcohol, while a protein minimum is in force; not for an estimate | engine foodItemInsights.ts | Whether the coach says a food is light on protein and suggests a protein food alongside (MM-365) | 10% is the AMDR lower bound for protein as a share of the day's energy (Health Canada DRI tables); 10 g at 400 kcal matches MM-125's "almost none". Per-meal synthesis breakpoints (0.24 g/kg young, 0.40 older men, Moore 2015; 0.4 g/kg over four meals, Schoenfeld and Aragon 2018) are not the trigger: the daily total is what the minimum rests on (MM-121) | judgement | Adults with a protein minimum; not after bariatric surgery (no minimum) or with kidney disease (a cap, not a floor) | No |
| `FoodInsightRule.lightOnProteinShare` | 10% of calories | engine FoodInsightRule.ts | How little protein counts as light | The AMDR lower bound for protein, applied to one food by judgement | judgement | Adults | No |
| `FoodInsightRule.lightOnProteinMinKcal` | 400 kcal | engine FoodInsightRule.ts | The smallest food spoken about | Product judgement: a meal-sized item, a fifth of a 2,000 kcal day | judgement | None | No |
| `FoodInsightRule.alcoholShare` | 50% of calories | engine FoodInsightRule.ts | A drink whose energy is mostly alcohol gets no protein line | Product judgement (the panel's NU-7) | judgement | None | No |
| `portionCheck` | An entry logged as at least `FoodInsightRule.largePortionRatio` of its usual serving and at least `FoodInsightRule.largePortionMinKcal`, or at least `FoodInsightRule.largePortionMaxServings` servings; only where a usual serving exists (`usualServing`) | engine foodItemInsights.ts | Whether the coach asks if an amount was entered right (MM-365) | A label serving rests on FDA reference amounts "customarily consumed per eating occasion" (21 CFR 101.12, amended 2016), so twice one is twice a typical sitting. That it signals an entry error is product judgement: large meals are under- rather than over-estimated (Wansink and Chandon 2006) and portions of energy-dense foods are over-estimated by 20–50% in a lab study (Almiron-Roig 2013). The line asks, never judges (the owner, 2026-10-18) | judgement | US adults (reference amounts); off with an eating-disorder history, while under-eating, and with the underweight caution | No |
| `FoodInsightRule.largePortionRatio` | 2 servings | engine FoodInsightRule.ts | How many of the usual serving counts as a check | Product judgement, for entries counted in servings only (the panel's NU-6) | judgement | None | No |
| `FoodInsightRule.largePortionMinKcal` | 300 kcal | engine FoodInsightRule.ts | The smallest entry asked about | Product judgement | judgement | None | No |
| `FoodInsightRule.largePortionMaxServings` | 10 servings | engine FoodInsightRule.ts | A count that is almost surely a typo, asked about whatever the calories | Product judgement | judgement | None | No |
| `usualServing` | The serving an entry was counted in: the label's for a packaged food, the saved one for a food or recipe of the person's own, the typed one for a label-serving entry; none for a food logged by weight or a household measure, a hand portion, an estimate, or an entry from before portions were kept | domain food/portion/usualServing.ts | What "usual serving" means in the food log (MM-365) | FDA reference amounts underlie US label servings (21 CFR 101.12); a person's own serving is their own; USDA household measures are measures, not amounts eaten (the panel's NU-5) | judgement | US packaged foods; the person’s own foods | No |
| `waistWithinNoise` | The app's one shared waist answer (`waistChangeOf`, 28 days, smoothed) is no clear change, said only when the latest reading moved from the one before by at least the tape's noise, with at least 3 entries across both ends | engine waistWithinNoiseInsights.ts | Whether the coach says a waist reading is within what a tape can tell (MM-367) | MM-155's rule of record; self-measured waist error is large (Verweij 2013; Barrios 2016, home duplicates about 1.9 cm). Said only at the moment a change is likely to be read into one reading (the panel's ME-5) | judgement | Adults measuring their own waist; off with an eating-disorder history | No |
| `WaistRule.medianOfThreeNoiseCm` | 1.0 cm | engine WaistRule.ts | The noise of an entry made as the middle of three | Verweij 2013: intra-observer error 0.7–9.2 cm (trained observers); Barrios 2016: lab self-duplicates 0.74 cm; the figure is judgement at the optimistic end | judgement | Mostly trained observers; one small self-measurement study | No |
| `WaistRule.singleReadingNoiseCm` | 1.5 cm | engine WaistRule.ts | The noise of a single reading | Barrios 2016: home self-duplicates about 1.9 cm (41 women); the figure is judgement below it | judgement | 41 mothers, mean age 38 | No |
| `WaistRule.singleReadingFactor` | 1.5 | engine WaistRule.ts | How much noisier a comparison resting on a single reading is | The ratio of the two rows above; product judgement | judgement | None | No |
| `WaistRule.personalAfter` | 8 triples | engine WaistRule.ts | When the noise becomes the person's own | Product judgement (MM-155) | judgement | None | No |
| `WaistRule.personalFloorCm` | 0.5 cm | engine WaistRule.ts | The lowest personal noise | Product judgement: the tape reads to 0.5 cm (MM-155) | judgement | None | No |
| `WaistRule.differenceFactor` | 1.4 (about √2) | engine WaistRule.ts | A difference of two measurements is √2 noisier than one | Statistics: the standard deviation of a difference of two independent equal-variance measurements | strong | Not applicable | No |
| `WaistRule.smoothedEntries` | 3 | engine WaistRule.ts | Entries smoothed at each end | Product judgement (MM-155) | judgement | None | No |
| `WaistRule.latestWithinDays` | 14 days | engine WaistRule.ts | How recent "now" must be | Product judgement (MM-155) | judgement | None | No |
| `WaistRule.recentWithinDays` | 21 days | engine WaistRule.ts | The oldest entry "now" may include | Product judgement (MM-155) | judgement | None | No |
| `WaistRule.baselineWithinDays` | 10 days | engine WaistRule.ts | How far an entry may be from the day compared with | Product judgement (MM-155) | judgement | None | No |
| `waterFewDays` | A water goal the app suggested is in force, the app has been in use for the whole window, the person has logged water in the `WaterFewDaysRule.usedWithinDays` before it, and water was logged on fewer than `WaterFewDaysRule.fewerThanDays` of the `WaterFewDaysRule.windowDays` complete days before the day shown | engine waterFewDaysInsights.ts | Whether the coach mentions sparse water logging under the Dashboard's water row (MM-367) | Product judgement; it measures logging, not drinking, and its direction is about logging (the panel's CO-1, ME-8). Not said with a goal the person set while the suggestion is withheld (a clinician's fluid limit, kidney disease, bariatric surgery: MM-358, MM-359; the panel's SA-5), nor with an eating-disorder history, in which fluid loading and appetite-suppressing drinking are reported (Hart 2011; Krogulska 2019; the panel's SA-6) | judgement | Adults with a suggested water goal | No |
| `WaterFewDaysRule.windowDays` | 14 complete days before the day shown | engine WaterFewDaysRule.ts | The days counted | `InsightRationing.patternDays` (MM-141) | judgement | None | No |
| `WaterFewDaysRule.fewerThanDays` | 7 (half) | engine WaterFewDaysRule.ts | What counts as few | Product judgement, the app's half-of-days convention (MM-121, MM-312) | judgement | None | No |
| `WaterFewDaysRule.usedWithinDays` | 60 days before the window | engine WaterFewDaysRule.ts | So a feature never used, or long dropped, gets no line | `weighInTiming`'s "ever weighed before" guard, bounded as intake is (60 days) | judgement | None | No |
| `foodGrade` | A food's nutrient-profile score per 100 g on twelve steps, A+ to D-, from its energy, sugars, saturated fat, sodium, fiber and protein; the same for every person | engine gradeOfNutrition.ts | The grade on every food, meal and day (MM-370) | The point tables published by Santé publique France's Scientific Committee for the Nutri-Score label (2023 update, general foods), as read in Open Food Facts' `Nutriscore.pm` and the German Wikipedia table (2026-10-18; the official FAQ V11 not yet read). The predecessor score, as an energy-weighted dietary index, associates with all-cause mortality (HR 1.07, 95% CI 1.03–1.10; EPIC, n = 501,594; Deschasaux 2020) and cancer (HR 1.07; Deschasaux 2018): association in adult European cohorts, not validation of one food's grade. The grades are not Nutri-Scores: no fruit, vegetable and legume share; one table for every food; twelve steps; the app is not registered with Santé publique France | moderate | Adults in seven European countries' labelling; EPIC cohorts for the predecessor score | No |
| `FoodGradeRule.energyKJ` | 335 … 3,350 kJ per 100 g, 10 steps | engine FoodGradeRule.ts | The energy points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.sugarsG` | 3.4 … 51 g per 100 g, 15 steps | engine FoodGradeRule.ts | The sugars points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.saturatedFatG` | 1 … 10 g per 100 g | engine FoodGradeRule.ts | The saturated fat points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.saltG` | 0.2 … 4.0 g per 100 g, 20 steps | engine FoodGradeRule.ts | The salt points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.fiberG` | 3.0, 4.1, 5.2, 6.3, 7.4 g per 100 g | engine FoodGradeRule.ts | The fiber points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.proteinG` | 2.4, 4.8, 7.2, 9.6, 12, 14, 17 g per 100 g | engine FoodGradeRule.ts | The protein points | As `foodGrade` | moderate | As above | No |
| `FoodGradeRule.proteinNotCountedFrom` | 11 unfavourable points | engine FoodGradeRule.ts | When protein stops counting | As `foodGrade` (the general-foods rule; the cheese exception is not applied) | moderate | As above | No |
| `FoodGradeRule.alcoholLimitG` | 1.2 g per 100 g | engine FoodGradeRule.ts | When a food is outside the method's scope | The label's exclusion of drinks above 1.2% alcohol (EU TRIS notification 2025/0025; German Wikipedia 2026-09-12); reading it by weight is product judgement | judgement | None | No |
| `FoodGradeRule.kJPerKcal` | 4.184 | engine FoodGradeRule.ts | Energy unit conversion | The definition of the kilocalorie | strong | Not applicable | No |
| `FoodGradeRule.saltPerSodium` | 2.5 | engine FoodGradeRule.ts | Sodium to salt | The EU labelling convention salt = sodium × 2.5 | strong | Not applicable | No |
| `FoodGradeRule.rollupCoverage` | 70% of calories | engine FoodGradeRule.ts | When a meal or a day has a grade | MM-370's choice, matching MM-126's fiber rule | judgement | None | No |
| `FoodGradeRule.letterSteps` | A+ ≤ −6, A ≤ −3, A- ≤ 0, B+ 1, B 2, B- 3, C+ ≤ 5, C ≤ 7, C- ≤ 10, D+ ≤ 14, D ≤ 18, D- above | engine FoodGradeRule.ts | The twelve steps | The published A/B (0), C/D (10) and D/E (18) boundaries and the fats-category A boundary (−6); the splits are product judgement; B- takes the published C's first point and E is folded into D- (MM-369) | judgement | None | No |
| `foodGrade.fvlOmitted` | The fruit, vegetable and legume share is never counted (0 of its 5 points) | engine gradeOfNutrition.ts | Why whole fruit grades one to two steps lower than the label would | Product judgement: the pack has no fruit, vegetable or legume share (MM-369); a pack category column would allow a proxy | judgement | None; an apple grades B-, a banana C+ | No |
| `foodGrade.oneTableForAll` | The general-foods table for drinks, fats, nuts, cheese and red meat too | engine gradeOfNutrition.ts | Which table a food uses | Product judgement: the pack has no category (MM-369); drinks grade higher and oils, nuts and cheese lower than the label would | judgement | None | No |
| `foodGrade.requiredNutrients` | Sugars, saturated fat, sodium and fiber must be stated | engine gradeOfNutrition.ts | When a grade is impossible | MM-310: a missing value is never zero. The packs published 2026-10-09 are format 1 and carry no sugars or saturated fat, so no pack food is graded until a format 2 pack is published (MM-307) | judgement | None | No |
| `strengthOnFatLoss` | A lift with added weight whose smoothed estimated max (MM-77) at the workout is at least `StrengthOnFatLossRule.heldTolerance` below its value at the start of an unbroken run of at least `StrengthOnFatLossRule.minDeficitWeeks` whole weeks of fat-loss targets in force as of the workout (`deficitStartOn`, every record in fat-loss mode), with at least `StrengthOnFatLossRule.minSessions` sessions on distinct days, no gap over `StrengthOnFatLossRule.maxGapDays`, each end's mean on at least `StrengthOnFatLossRule.minSmoothedPoints` sessions; gone up at `StrengthOnFatLossRule.upBy`; not a bodyweight lift; not while progress is assessed as stalled | engine strengthOnFatLossInsights.ts | Whether the coach says a lift's strength held, or rose, through weeks on the fat-loss goal (MM-377) | Strength is generally maintained by resistance training in an energy deficit of 3 weeks or more while lean-mass gains are impaired (Murphy and Koehler 2022: strength ES −0.31, p = 0.28; lean mass ES −0.57, p = 0.02), which is MM-79's and MM-117's rule that holding strength is the aim on fat loss. The weeks are planned targets, not eaten intake: food records under-report energy intake by 11–41% against doubly labelled water (Burrows 2019), so the log cannot show a deficit. The line claims nothing about muscle: strength held does not show lean mass was kept, and the app measures no lean mass (the panel's NU-3, NU-4) | judgement | Adults on a planned fat-loss goal who log sets with reps in reserve; off with an eating-disorder history, while under-eating, and with the underweight and low-body-weight cautions | No |
| `StrengthOnFatLossRule.minDeficitWeeks` | 6 whole weeks | engine StrengthOnFatLossRule.ts | How long the fat-loss targets must have run | MM-141's figure; the trials behind the direction ran 3 weeks or more; product judgement | judgement | None | No |
| `StrengthOnFatLossRule.heldTolerance` | 2.5% of the smoothed value at the start | engine StrengthOnFatLossRule.ts | How far below the start still counts as held | About one effective rep in Epley (2.4–3.2% from 1 to 11 reps) and one 2.5 kg plate at 100 kg; about 0.75 of the noise of the comparison, taking a session-to-session CV of about 4% (1RM retest CV median 4.2%, trained 3.3%: Grgic 2020; a 1-RIR load CV 2.7–6.2%: Lovegrove 2022) smoothed over 3 sessions at each end, so a lift that truly held is missed about one time in five and a lift down 5% is called held about one time in five (the panel's ME-2) | judgement | Healthy adults in 1RM retest studies; novice 17-year-olds for the RIR figure; extrapolated | No |
| `StrengthOnFatLossRule.upBy` | 5% of the smoothed value at the start | engine StrengthOnFatLossRule.ts | How far above the start counts as gone up | Two effective reps or two plate steps at 100 kg; about 1.5 times the comparison's noise, so a flat lift is called up about one time in sixteen; the mirror of MM-117's 5% drop, so falling, held and up sit on one scale (the panel's ME-3) | judgement | As above | No |
| `StrengthOnFatLossRule.minSessions` | 4 sessions on distinct days, from the baseline's day to the workout's | engine StrengthOnFatLossRule.ts | How much training the claim needs | Product judgement; MM-117's strength trigger uses three sessions in three weeks | judgement | None | No |
| `StrengthOnFatLossRule.maxGapDays` | 28 days between consecutive sessions | engine StrengthOnFatLossRule.ts | When the history is too broken to compare | MM-77's smoothing window: within it every session's mean includes the one before; a longer gap leaves an unsmoothed value | judgement | None | No |
| `StrengthOnFatLossRule.baselineWithinDays` | 7 days either side of the deficit's start | engine StrengthOnFatLossRule.ts | Which session stands for "the start" | MM-77's 7-day baseline tolerance, widened to the week after the start so a person who began logging with the diet has a baseline; a few deficit days in the baseline bias slightly toward "held" (the panel's ME-1) | judgement | None | No |
| `StrengthOnFatLossRule.minSmoothedPoints` | 2 sessions in each end's mean | engine StrengthOnFatLossRule.ts | Whether an end is smoothed enough to compare | The noise of a mean falls as 1/√k; a lone session at either end raises the comparison's noise from about 3.3% to about 4.6–4.9% of the value (the panel's ME-4) | judgement | None | No |
| `deficitStartOn` | The earliest of the trailing targets records planned below maintenance, moved up to the restart a gap of `GapRule.deficitBreakDays` or a pause of `PauseRule.deficitBreakDays` set, as of the day asked | engine deficitStartOn.ts | Where the deficit count (MM-31, MM-117, MM-140) and the fat-loss weeks of MM-377 start | Product judgement (MM-31, MM-147, MM-148); recomp counts as a deficit here and is told apart by the record's mode where it matters | judgement | None | No |
| `GapRule.deficitBreakDays` | 14 days with no weigh-in and no food | engine GapRule.ts | A gap this long restarts the deficit count | Product judgement (MM-147): the app does not know what was eaten | judgement | None | No |
| `PauseRule.deficitBreakDays` | 7 days | engine PauseRule.ts | A pause this long restarts the deficit count | Product judgement (MM-148) | judgement | None | No |
| `estimatedOneRepMax` | Epley with effective reps: resistance × (1 + (reps + RIR)/30); none above 12 effective reps, at RIR 5 or more, or for a bodyweight lift without a weigh-in in 7 days; a missing RIR counts as 0 | engine estimatedOneRepMax.ts | The per-session strength estimate behind MM-77, MM-117, MM-129 and MM-377 | The Epley equation is a conventional estimator, a comparison tool and not a real max (MM-77); people misjudge reps to failure by about a rep on average (0.95, 95% CI 0.17–1.73, I² 97.9%) and judge better at 12 reps or fewer, which supports the cap (Halperin 2022) | judgement | 414 healthy adults across 12 studies (Halperin); the formula's validity not re-verified | No |
| `buildStrengthTrends.smoothing` | The mean of up to 3 sessions within 28 days inclusive, trailing, never carried across a longer gap | engine buildStrengthTrends.ts | The smoothed value every strength rule compares | MM-77's choice; it cuts the per-session noise by up to 1/√3 and never uses a later session for an earlier point | judgement | None | No |
