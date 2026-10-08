# Evidence register

Every constant and rule that decides something about a user's body or safety,
with where it comes from and how good that evidence is. A test
(`packages/engine/test/evidence_register_test.dart`) fails `mm check` when a
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
are not given very large targets. Lean people in a deficit get a higher target,
set from their fat-free mass. If you have chronic kidney disease the target is
capped low and you are told to confirm it with your clinician.

Rows: SafetyBounds.proteinRangeG, SafetyBounds.referenceWeightKg, SafetyBounds.excessWeightFraction, SafetyBounds.minFatG, computeTargets.macroSplit

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

## Register

| Name | Value | Where | Decides | Source | Grade | Population | Checked |
|---|---|---|---|---|---|---|---|
| `SafetyBounds.minEnergyAvailabilityKcalPerKgFfm` | 30 kcal per kg fat-free mass a day | engine safety_bounds.dart | The energy floor for lean users | Loucks, on low energy availability, as cited in the code (paper and year not yet confirmed) | moderate | Young women athletes; applied to men and to all lean users as an extrapolation | No |
| `SafetyBounds.absoluteFloorKcal` | 1,500 men, 1,200 women | engine safety_bounds.dart | The lowest target ever issued | NIH minimum-intake guidance, as cited in the code | moderate | Adults with obesity under supervised and unsupervised programs | No |
| `SafetyBounds.energyAvailabilityThresholdPercent` | 15% men, 25% women | engine safety_bounds.dart | Whether the energy-availability floor applies | Product judgement: low-energy-availability harm concentrates in lean users | judgement | None directly | No |
| `SafetyBounds.calorieFloorKcal` | The largest of the absolute floor, resting energy, and for lean users the energy-availability floor | engine safety_bounds.dart | The calorie floor | Product judgement combining the rows above | judgement | None directly | No |
| `SafetyBounds.maxContinuousDeficitWeeks` | 16 weeks | engine safety_bounds.dart | When a maintenance break is forced | MATADOR (Byrne 2018) as cited in MM-31 supports intermittent dieting; the 16 weeks is product judgement | judgement | Men with obesity (MATADOR); the figure is not from it | No |
| `SafetyBounds.maxWeeklyTargetChangeKcal` | 100 kcal | engine safety_bounds.dart | The largest ordinary weekly change in the target | Product judgement for stability | judgement | None | No |
| `SafetyBounds.maxWeeklyTargetChangeFraction` | 5% of the target | engine safety_bounds.dart | The same, for small targets | Product judgement for stability | judgement | None | No |
| `SafetyBounds.maxWeeklyTargetChange` | The smaller of the two above | engine safety_bounds.dart | The weekly step limit | Product judgement | judgement | None | No |
| `SafetyBounds.excessWeightFraction` | 0.25 | engine safety_bounds.dart | How much weight above BMI 25 counts toward the reference weight | The adjusted-body-weight convention in clinical nutrition | judgement | Adults with obesity | No |
| `SafetyBounds.referenceWeightKg` | Body weight up to BMI 25, then a quarter of the excess | engine safety_bounds.dart | The weight that protein and fat rules scale with | The adjusted-body-weight convention (MM-120) | judgement | Adults with obesity | No |
| `SafetyBounds.maxWeeklyLossFraction` | 0.5%, 0.7% or 1.0% of body weight a week by body fat (cut-offs 12% and 15% men, 22% and 25% women) | engine safety_bounds.dart | The fastest allowed pace of loss | Slower loss preserving lean mass: Garthe 2011, Helms 2014, as cited (that direction is moderate). The cut-offs are product judgement | judgement | Athletes (Garthe, Helms); the cut-offs are not from them | No |
| `SafetyBounds.minFatG` | The larger of 0.5 g (men) or 0.6 g (women) per kg of reference weight, and 20% of energy | engine safety_bounds.dart | The lowest daily fat target | Product judgement | judgement | None | No |
| `SafetyBounds.proteinRangeG` | 1.6 to 2.2 g per kg of reference weight; 2.3 to 3.1 g per kg fat-free mass for lean users in a deficit; capped for kidney disease | engine safety_bounds.dart | The daily protein target | Morton 2018 for the general range and Helms 2014 for lean people in a deficit, as cited; the kidney cap is product judgement | moderate | Trained adults (Morton); lean resistance-trained athletes dieting (Helms); the cap is not from either | No |
| `SafetyBounds.checkGoalBodyFat` | Rejected under 8% men or 16% women; warned under 10% or 18% | engine safety_bounds.dart | Whether a goal body fat is accepted | Product judgement | judgement | None | No |
| `fatMassKcalPerKg` | 9,440 kcal per kg (39.5 MJ) | engine partition.dart | The energy in a kilogram of fat | Hall 2008, as cited | strong | Adults | No |
| `fatFreeMassKcalPerKg` | 1,815 kcal per kg (7.6 MJ) | engine partition.dart | The energy in a kilogram of lean tissue | Hall 2008, as cited | moderate | Adults | No |
| `forbesConstantKg` | 10.4 kg | engine partition.dart | How the lean share of a weight change falls as fat mass rises | Forbes, revised in Hall 2007, as cited | moderate | Adults across a range of body fat | No |
| `leanFractionOfChange` | The Forbes curve, halved for resistance-trained people losing weight | engine partition.dart | How much of a weight change is lean tissue | The Forbes curve as above; the halving is a modelling assumption stated in the code | judgement | Not from a trial | No |
| `computeTargets.weeklyRate` | Fat loss 0.75% (up to the safety maximum); recomposition 0.25% or 0.1%; lean gain 0.35%, 0.25% or 0.15% a week | engine compute_targets.dart | The intended pace for each goal | Barakat 2020 informs recomposition; the rates are product judgement | judgement | Novice and returning lifters (Barakat) | No |
| `computeTargets.macroSplit` | After protein and the fat floor, fat is 25% of energy and carbohydrate is the rest | engine compute_targets.dart | How the remaining energy is split | Product judgement | judgement | None | No |
| `mifflinStJeorKcal` | 10 x kg + 6.25 x cm - 5 x age, +5 men or -161 women | engine resting_energy_equations.dart | Resting energy, which starts the expenditure estimate and sets a floor | Mifflin-St Jeor equation, as named in the code | moderate | Healthy adults of a range of weights | No |
| `katchMcArdleKcal` | 370 + 21.6 x kg fat-free mass | engine resting_energy_equations.dart | Resting energy from fat-free mass (not yet used) | Katch-McArdle equation, as named in the code | moderate | Lean and athletic adults | No |
| `activityFactor` | Daily activity 1.20, 1.30, 1.40 or 1.50, plus 0.025 per training day | engine activity_factor.dart | The starting estimate of energy use | Product judgement, cross-checked against the common published multipliers (MM-164) | judgement | None directly | No |
| `initialTdeePrior` | Resting energy x the activity factor, with 15% uncertainty | engine initial_tdee_prior.dart | The estimate of energy use before there is data | Product judgement; replaced by a measurement after about two weeks | judgement | None directly | No |
| `deurenbergBodyFat` | 1.20 x BMI + 0.23 x age - 10.8 (men) - 5.4, with 5 points of uncertainty | engine deurenberg_body_fat.dart | The body-fat estimate when the user gives none | Deurenberg 1991, as cited; BMI-based equations are off by about 4 to 5 points | moderate | Adults, mostly white; poorer in muscular, older and some ethnic groups | No |
| `TdeeEstimator.windowDays` | 28 days | engine tdee_estimator.dart | How far back the measurement looks | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minSpanDays` | 14 days | engine tdee_estimator.dart | The shortest span that can produce a measurement | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minIntakeDays` | 10 days | engine tdee_estimator.dart | The fewest usable food days before measuring | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minWeighIns` | 8 | engine tdee_estimator.dart | The fewest weigh-ins before measuring | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.partialDayFraction` | 0.65 | engine tdee_estimator.dart | Below this share of typical intake an unmarked day is treated as partly logged | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.styleSwitchThreshold` | 0.5 | engine tdee_estimator.dart | What counts as a change in how the user logs | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minDaysPerStyleSegment` | 7 days | engine tdee_estimator.dart | The shortest stretch of one logging style | Product judgement tested in simulation | judgement | None | No |
| `TdeeEstimator.minBmrMultiple` | 1.1 x resting energy | engine tdee_estimator.dart | The lowest plausible measured expenditure | Product judgement; a very wide bound | judgement | None | No |
| `TdeeEstimator.maxBmrMultiple` | 3.0 x resting energy | engine tdee_estimator.dart | The highest plausible measured expenditure | Product judgement; a very wide bound | judgement | None | No |
| `WeightTrendModel.relativeWaterSigma` | 0.6% of body weight | engine weight_trend_model.dart | The size of day-to-day water fluctuation | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.waterPersistence` | 0.65 | engine weight_trend_model.dart | How much one day's water offset carries to the next | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.relativeScaleSigma` | 0.2% of body weight | engine weight_trend_model.dart | Scale and clothing noise | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.levelProcessSigmaKg` | 0.02 kg a day | engine weight_trend_model.dart | How fast the true weight can wander | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.slopeProcessSigmaKgPerDay` | 0.003 kg a day | engine weight_trend_model.dart | How fast the pace of change can change | Product judgement tuned in simulation | judgement | None | No |
| `WeightTrendModel.initialSlopeSigmaKgPerDay` | 0.1 kg a day | engine weight_trend_model.dart | How uncertain the pace is at the start | Product judgement | judgement | None | No |
| `WeightTrendModel.outlierSigmas` | 5 | engine weight_trend_model.dart | How far out of line a reading must be to be set aside | Product judgement | judgement | None | No |
| `WeightTrendModel.maxConsecutiveRejections` | 3 | engine weight_trend_model.dart | How many readings in a row can be set aside | Product judgement | judgement | None | No |
| `calibrationDays` | 14 days | engine coach_constants.dart | How long targets hold at the start | Product judgement | judgement | None | No |
| `safetyRaiseLookbackDays` | 14 days | engine coach_constants.dart | How far back the too-fast-loss check looks | Product judgement (MM-115) | judgement | None | No |
| `safetyRaiseMinWeighIns` | 8 | engine coach_constants.dart | Weigh-ins needed before a too-fast loss can raise targets | Product judgement (MM-115) | judgement | None | No |
| `safetyRaiseSigmas` | 1.5 deviations | engine coach_constants.dart | How clearly over the limit the pace must be | Product judgement (MM-115), compared at 1.0 in simulation | judgement | None | No |
| `safetyRaiseCapKcal` | 400 kcal | engine coach_constants.dart | The most one check-in raises targets for a too-fast loss | Product judgement (MM-115) | judgement | None | No |
| `checkInIntervalDays` | 7 days | engine coach_constants.dart | How often targets can change | Product judgement | judgement | None | No |
| `settlingDays` | 10 days | engine coach_constants.dart | How long after a change of intake the scale moves for reasons other than tissue | Glycogen and water shifts (MM-131); the length is product judgement | judgement | Not from a trial | No |
| `phaseChangeFraction` | 10% of expenditure | engine coach_constants.dart | What counts as a change of intake level | Product judgement (MM-131) | judgement | None | No |
| `settlingShiftFraction` | 0.4% of body weight a day | engine coach_constants.dart | How far the trend may shift inside a settling window | Product judgement tuned in simulation (MM-131) | judgement | None | No |
| `settlingSlopeShiftFraction` | 0.04% of body weight a day | engine coach_constants.dart | How far the trend's pace may change inside a settling window | Product judgement tuned in simulation (MM-131) | judgement | None | No |
| `quartileSigmas` | 0.6745 | engine safety_body_fat.dart | The point with a quarter chance on one side, for the cautious body fat | Statistics: the 75th percentile of a normal distribution | strong | Not applicable | No |
| `safetyBodyFatDeadbandPercent` | 2 points | engine safety_body_fat.dart | How far body fat must move before a safety rule switches | Product judgement (MM-132) | judgement | None | No |
| `underweightBmi` | 18.5 | domain body_mass_index.dart | Below this no deficit is planned | The WHO and CDC boundary of underweight, a convention rather than a threshold of harm (MM-111) | strong | Adults; may differ by age and ancestry | No |
| `lowWeightCautionBmi` | 20 | domain body_mass_index.dart | Below this deficits are allowed only at the gentlest pace | Product judgement: a margin above the boundary (MM-111) | judgement | None | No |
| `lowWeightMaxLossFraction` | 0.5% of body weight a week | domain body_mass_index.dart | The gentlest pace of loss | Garthe 2011, Helms 2014 for slower loss in lean people; the use here is product judgement | judgement | Athletes | No |
