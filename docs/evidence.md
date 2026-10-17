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
