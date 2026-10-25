/**
 * Every phrasing of the coach's analysis (MM-617), by slot: the owner's
 * voice, terse, second person, the number and then the order. A slot's
 * phrasing is chosen for a finding and a day (`coachPhrase`), so the same
 * day reads the same and the next day's like finding may read another.
 *
 * - `{name}` is filled from the finding's own figures and foods, already
 *   formatted ("1,054 kcal", "General Tso's chicken"); a sentence that opens
 *   with one is capitalized.
 * - Verdicts on choices are allowed here and only here ("does nothing for
 *   your goal", "that was the mistake"); nothing is said of the person's
 *   body, weight or worth, and there is no profanity and no exclamation
 *   mark. `test/format/coachPhrasings.test.ts` holds every phrasing to it.
 * - The owner's buffet day reads the voice standard (MM-617's Decisions),
 *   line for line: `test/format/buffetDayText.test.ts`.
 * - Slots ending in `Words` are pieces of a sentence, not sentences.
 */
export const coachPhrasings = {
  // ---- The headline: the day's verdict about the biggest thing ----
  headlineOver: ['Over by {over}.', '{over} over.', '{over} over your target.'],
  headlineCause: ['{cause} did it.', 'That was {cause}.', '{cause} put you there.'],

  // ---- The cause: which meal, which food ----
  causeMeal: ['The problem was {meal}.', '{meal} was the problem.', '{meal} did the damage.'],
  causeLoggedMeal: ['The {name}: {kcal}, {share}.', 'The {name} alone: {kcal}, {share}.', '{kcal} at the {name}: {share}.'],
  causeSlotMeal: ['{meal} came to {kcal}, {share}.', '{meal}: {kcal}, {share}.'],
  shareWholeDayWords: ["more than your whole day's {target}", "more than all of your day's {target}"],
  shareHalfDayWords: ["over half your day's {target}", "more than half of your day's {target}"],
  sharePartDayWords: ["{percent} of your day's {target}", "{percent} of the {target} you get a day"],
  causeOnDay: ['{day} did it: {meal} came to {kcal}.', 'One day did it: {day}, {kcal} at {meal}.'],
  causeFoods: ['{foods} did it.', 'That was {foods}.', '{foods} put it there.'],
  causeFoodShare: ['{food} gave {share} of it.', '{food} was {share} of it.'],
  causeFoodsLowProtein: ['{foods} gave the most calories with the least protein.', 'The calories with little protein: {foods}.'],
  causeFoodsCalories: ['{foods} gave the most calories.', 'Most of the calories: {foods}.'],
  causeFoodsFat: ['{foods} gave the most fat.', 'Most of the fat: {foods}.'],
  causeFoodsSplit: ['{foods} gave the most of it.', 'Most of it: {foods}.'],
  worstFood: [
    'The worst of it: {food}, {kcal}, {fat} fat.',
    '{food} was the worst of it: {kcal}, {fat} fat.',
    '{food} did the most damage: {kcal}, {fat} fat.',
  ],
  worstFoodNext: ['{food} was next: {kcal}, {fat} fat.', 'Then {food}: {kcal}, {fat} fat.'],
  since: ['Since {date}.', 'It started {date}.'],

  // ---- The orders: one sentence each ----
  orderSkipSpoonful: [
    'Skip it next time, or take one spoonful.',
    'Next time skip it, or take one spoonful.',
    'Leave it next time, or take one spoonful.',
  ],
  orderSkip: ['Skip it next time.', 'Next time, skip it.', 'Leave it out next time.'],
  orderKeep: [
    'Start the plate with {keep} and steamed vegetables.',
    'Load up on {keep} and steamed vegetables first.',
    'Fill the plate with {keep} and steamed vegetables first.',
  ],
  orderKeepWithVegetables: ['Start the plate with {keep}.', 'Load up on {keep} first.', 'Fill the plate with {keep} first.'],
  orderSwapIn: [
    'Or order {replacement}: {figures}.',
    'Swap in {replacement}: {figures}.',
    'The better plate is {replacement}: {figures}.',
  ],
  swapFoodAtMeal: ['At {meal}, the {food}: {kcal}, {fat} fat.', 'The {food} at {meal}: {kcal}, {fat} fat.', '{meal}: the {food}, {kcal}, {fat} fat.'],
  swapFood: ['The {food}: {kcal}, {fat} fat a time.', '{food}: {kcal} and {fat} fat a time.'],
  orderSwap: ['Have {replacement} instead: {figures}.', 'Swap it for {replacement}: {figures}.', 'Trade it for {replacement}: {figures}.'],
  orderSwapPlain: ['Swap it for {replacement}.', 'Have {replacement} instead.'],
  orderHalve: ['Eat half next time.', 'Half the portion next time.', 'Halve it.'],
  orderHalveOrSwap: ['Halve it, or swap it for {replacement}.', 'Eat half, or have {replacement} instead.'],
  orderHalveFat: ['Halve the added fats: oil, butter, dressing.', 'Cut the added fats in half: oil, butter, dressing.'],
  orderHalvePortions: ['Halve the portions.', 'Cut the portions in half.'],
  lowProteinFood: ['{food}: {kcal}, {protein} protein.', '{food}: {kcal} for {protein} of protein.'],
  lowProteinVerdict: ['It does nothing for your goal.', 'Does nothing for your goal.', 'Nothing in it for your goal.'],
  orderSkipLowProtein: ['Skip it next time.', 'Skip it.', 'Leave it out.'],
  orderVegetablesAt: ['{cups} of vegetables at {meal}.', 'Eat {cups} of vegetables at {meal}.', '{cups} at {meal}.'],
  orderVegetablesToday: ['Get {cups} of vegetables in before the day is out.', '{cups} of vegetables before bed.'],
  orderVegetablesDaily: ['Add {cups} of vegetables a day.', '{cups} of vegetables a day, every day.', 'Put {cups} of vegetables on your plate each day.'],
  orderVegetablesWithFood: [
    'Add {cups} of vegetables a day. More {food} counts: you already log it.',
    'More {food}, which you already log, and {cups} of vegetables a day.',
  ],
  orderProteinAmountFood: ['Get {amount} more protein: {food} fits.', '{amount} of protein to go: {food} fits.'],
  orderProteinAmount: ['Get {amount} more protein in today.', '{amount} of protein to go today.', 'Find {amount} more protein before the day ends.'],
  orderProteinFood: ['Add {food}: you already log it, and it carries protein.', 'More {food}. You already log it.'],
  orderProteinAtMeal: ['Put a protein food in {meal}.', 'Give {meal} a protein food.'],
  orderProteinDays: ["Hit the minimum on {days} too: it's the same every day.", '{days} need the same minimum. Hit it.'],
  orderProteinEveryDay: ['Hit the protein minimum every day.', 'Protein minimum, every day.'],
  orderProtein: ['Add a protein food to each meal.', 'Put protein in every meal.', 'Add a protein food at your next meal.'],
  /** The protected path (MM-612's safeguards): calm and plain, protein only, nothing restricted. */
  orderProteinCalm: ['A protein food at your next meal covers it.', 'Your next meal can carry it: a protein food.'],
  orderFat: ['Add a fat food to a meal: nuts, olive oil or avocado.', 'Put some fat back in: nuts, olive oil or avocado.'],
  orderCarbohydrate: ['Add a carbohydrate food to a meal: rice, oats, potatoes or fruit.', 'Put carbohydrate back in: rice, oats, potatoes or fruit.'],
  orderCalories: ['Eat about {kcal} more a day.', 'Add about {kcal} a day: a lean gain runs on the surplus.'],
  orderLeanProtein: ['Add lean protein: chicken, fish, eggs or Greek yogurt.', 'More lean protein: chicken, fish, eggs or Greek yogurt.'],
  orderLimit: [
    "That's the day's food. If you're hungry, {meal} under {limit}: lean protein and vegetables.",
    "You're done for today. Hungry? {meal} under {limit}: lean protein and vegetables.",
    "You're done eating for today. If you're hungry, {meal} under {limit}: lean protein and vegetables.",
  ],
  orderNoSauce: ['No sauce, nothing fried.', 'Skip the sauce.', 'No sauce.'],
  orderWater: ['Drink water tonight.', 'Drink plenty of water tonight.', 'Water tonight, and plenty of it.'],
  orderWaterPlain: ['Drink more water on those days.', 'More water on the salty days.'],
  orderWaterTraining: [
    'Log {amount} on training days: a glass before and after the session.',
    'Training days: {amount} of water, logged.',
    'Drink to your {amount} goal on training days, and log it.',
  ],
  orderSauceOnSide: ['Next time, get the sauce on the side.', 'Sauce on the side next time.', 'Next time: sauce on the side.'],
  orderBackToPlan: ["Back to {target} a day. Don't skip meals to make up for it.", 'Eat to {target} a day. No skipped meals to make up.'],
  orderBackToTarget: ["Back to your target. Don't skip meals to make up for it.", 'Eat to your target. No skipped meals to make up.'],
  orderTrain: ['Get {sessions} sessions in this week.', 'Train {sessions} times this week.', '{sessions} sessions this week. Book them.'],
  orderTrainOnce: ['Get one session in this week.', 'Train once this week. Book it.'],
  orderAddSetsGroup: ['Add {sets} a week for {group}.', '{sets} more a week for {group}.'],
  orderAddSetsLifts: ['{more} a session on {lifts}.', 'Each session, {more} on {lifts}.'],
  orderSlowDown: ['Slow the cut to {rate} of body weight a week.', 'Ease off: lose {rate} of body weight a week.'],
  orderBreak: ['Or take a maintenance break.', 'A maintenance break eases the deficit.'],
  orderSleep: ['Sleep {hours} a night, at least.', 'At least {hours} of sleep a night.'],
  orderKeepLifting: ['Keep the loads. Cut sets before weight.', 'Hold the weight on the bar. Drop sets before load.'],
  orderPause: ['Planned break? Set a pause.', 'If the break is planned, set a pause.'],

  // ---- The consequence: what the day would have been ----
  consequenceOver: [
    "Skip the {food} and you're {without} over, not {over}.",
    "Without the {food} you'd be {without} over, not {over}.",
    "No {food}, and you'd be {without} over, not {over}.",
  ],
  consequenceOnTarget: ["Without the {food} you'd be on target.", 'Skip the {food} and the day is on target.'],
  consequenceOverOn: [
    'Without the {food}, {day} would have been {without} over, not {over}.',
    'Skip the {food} and {day} is {without} over, not {over}.',
  ],
  consequenceOnTargetOn: ['Without the {food}, {day} would have been on target.', 'Skip the {food} and {day} is on target.'],

  // ---- The close: tomorrow is back to plan ----
  close: [
    "Tomorrow is {target}, like any day. Don't skip meals to make up for today.",
    "Tomorrow: back to {target}. Don't skip meals to make up for today.",
    'Back to {target} tomorrow. No skipped meals to make up for today.',
  ],

  // ---- Holding up: blunt and short ----
  holdKeep: ['Keep that.', 'Keep it there.', 'Same again next time.'],
  leadProteinHeld: ['Protein {protein}. Minimum met.', 'Protein {protein}. Minimum hit.', 'Protein {protein}, minimum hit.'],
  leadProteinMinimumHeld: ['Protein minimum hit on {met} of {judged} days.', '{minimum} of protein or more on {met} of {judged} days.'],
  leadProteinTargetHeld: ['Protein at or near {target} on {close} of {judged} days.', 'Protein on target on {close} of {judged} days.'],
  leadProteinByMealHeld: [
    '{per} of protein or more at breakfast, lunch and dinner on {spread} of {judged} days.',
    'Protein in every main meal on {spread} of {judged} days.',
  ],
  leadDensityHeld: ['{density} protein per 100 kcal, at or over the {required} you need.', 'Protein per 100 kcal: {density}. Enough.'],
  leadFatHeld: ['Fat within 15% of {target} on {within} of {judged} days.', 'Fat on target on {within} of {judged} days.'],
  leadCarbohydrateHeld: ['Carbohydrate within 15% of {target} on {within} of {judged} days.', 'Carbohydrate on target on {within} of {judged} days.'],
  leadSplitHeld: ['Protein, carbohydrate and fat each within 5 points of the plan.', 'Your split is on plan.'],
  leadWaterRichHeld: ['{meal} mostly water-rich foods on {days}.', '{meal}: water-rich foods on {days}.'],
  leadFiberHeld: ['Fiber averaged {average}, at or over the {guide} guide.', 'Fiber {average} a day. Guide hit.'],
  leadFiberDayHeld: ['Fiber {fiber}. Guide hit.', 'Fiber {fiber}, at the {guide} guide.'],
  leadSodiumHeld: ['Sodium under your {limit} limit on {under} of {judged} days.', 'Under the {limit} sodium limit on {under} of {judged} days.'],
  leadCaloriesDayHeld: ['{kcal}, inside the band around {target}.', '{kcal}. Inside the band.'],
  leadCaloriesHeld: ['Calories in the band on {within} of {judged} days.', 'On target on {within} of {judged} days.'],
  leadMealBalanceHeld: [
    'Every big meal carried at least 70% of the {required} g of protein per 100 kcal you need.',
    'Protein spread across your meals: each big one at 70% or more of the {required} g per 100 kcal you need.',
  ],

  // ---- The leads of a fix: the number and the verdict ----
  leadProteinMinimum: [
    'Protein minimum hit on {met} of {judged} days. About {short} short on the rest.',
    'Minimum hit on only {met} of {judged} days, about {short} short on the others.',
  ],
  leadProteinTarget: [
    'Protein averaged {average} against {target}, 10% or more under on {short} of {judged} days.',
    'Protein {average} a day against {target}: short on {short} of {judged} days.',
  ],
  leadProteinByMeal: [
    '{meal} under 10 g protein on {low} of the {missed} days you missed the minimum.',
    '{meal} carried under 10 g protein on {low} of {missed} short days.',
  ],
  leadDensity: [
    '{density} protein per 100 kcal. You need {required}.',
    'Protein per 100 kcal: {density}, against the {required} you need.',
    '{density} protein per 100 kcal, short of the {required} you need.',
  ],
  leadFat: ['Fat averaged {average} against {target}.', 'Fat {average} a day, against {target}.'],
  leadFatDay: ['Fat {fat} so far, against {target}.', 'Fat {fat} against {target}.'],
  fatWhyProtein: ['That fat crowded out protein: {short} under your minimum on average.', 'Protein paid for it: {short} under your minimum on average.'],
  fatWhyProteinDays: ['Protein missed the minimum on {missed} of {judged} days.', 'Protein came up short on {missed} of {judged} days.'],
  fatWhyProteinTarget: ['That fat crowded out protein: {short} under your target on average.', 'Protein paid for it: {short} under your target on average.'],
  fatWhyCalories: ['Calories went over the band on {above} of {judged} days.', 'Over the calorie band on {above} of {judged} days.'],
  fatWhyDay: ['That fat crowded out protein: {protein} so far.', 'Protein is only {protein} so far.'],
  leadFatLow: ['Fat under the {minimum} minimum on {low} of {judged} days.', 'Fat short of {minimum} on {low} of {judged} days.'],
  leadFatShare: ['Fat {share} of calories; your targets plan {planned}.', 'Fat gave {share} of calories, against {planned} planned.'],
  leadCarbohydrate: ['Carbohydrate under {floor} on {low} of {judged} days.', 'Carbohydrate short of {floor} on {low} of {judged} days.'],
  leadSplit: ['{largest} gave {share} of calories, against {planned} planned.', '{largest} {share} of calories; the plan is {planned}.'],
  splitShares: [
    'Protein {protein}, carbohydrate {carbs}, fat {fat}; the plan is {plannedProtein}, {plannedCarbs} and {plannedFat}.',
    'The split: protein {protein}, carbohydrate {carbs}, fat {fat}, against {plannedProtein}, {plannedCarbs} and {plannedFat}.',
  ],
  leadCalorieDensity: [
    '{food}: {kcalPerG} kcal a gram, {protein} protein per 100 kcal, {share} of your calories on {days}.',
    '{food} on {days}: {kcalPerG} kcal a gram and {protein} protein per 100 kcal, {share} of your calories.',
  ],
  calorieDenseVerdict: ['Calorie-dense for its protein.', 'It is calorie-dense for its protein: too many calories, too little protein.'],
  leadFiber: ['Fiber averaged {average} against {guide}.', 'Fiber {average} a day, against {guide}.'],
  fiberWhy: ['More fiber fills you up for the same calories.', 'Fiber fills you up for the same calories.'],
  leadFiberDay: ['Fiber: {fiber} of {guide}.', '{fiber} of fiber against {guide}.', 'Fiber {fiber} of {guide}.'],
  fiberNoVegetables: ['Almost no vegetables today.', 'Hardly a vegetable all day.', 'You ate almost no vegetables.'],
  fiberFewVegetables: ['Not enough vegetables.', 'Too few vegetables.', 'Short on vegetables.'],
  leadSodiumMultiple: ['Sodium {sodium}: {multiple} your {limit} limit.', '{sodium} of sodium, {multiple} your {limit} limit.', 'Sodium {sodium}, {multiple} your {limit} limit.'],
  leadSodiumOver: ['Sodium {sodium}, over your {limit} limit.', 'Sodium {sodium} against a {limit} limit.'],
  leadSodium: ['Sodium over your {limit} limit on {over} of {judged} days.', 'Over the {limit} sodium limit on {over} of {judged} days.'],
  leadCaloriesDay: ['{kcal} so far, over the band around {target}.', '{kcal} so far against {target}: over the band.'],
  leadCalories: [
    'Calories over the band on {above} of {judged} days, about {over} over on those days.',
    'Over the band on {above} of {judged} days: about {over} over each time.',
  ],
  leadCaloriesLow: [
    'Calories averaged {average} against {target}, under the band on {below} of {judged} days.',
    '{average} a day against {target}: under the band on {below} of {judged} days.',
  ],
  caloriesLowWhy: ['A lean gain runs on the planned surplus.', 'No surplus, no gain.'],
  leadEnergyUseLow: ['Intake averaged {average}; you use about {use}. No surplus.', 'You eat about {average} and use about {use}: no surplus.'],
  leadEnergyUse: ['Intake averaged {average}, about the {use} you use.', 'You eat about {average} and use about {use}.'],
  leadMealBalance: [
    '{meal}: {share} of your calories at {density} protein per 100 kcal. You need {required} across the day.',
    '{meal} gave {share} of your calories at only {density} protein per 100 kcal, against the {required} you need.',
  ],

  // ---- What is left today ----
  leftOver: ['{over} over. No calories left.', 'No calories left: {over} over.'],
  leftBoth: ['{protein} protein and {kcal} left today.', '{kcal} and {protein} protein left today.'],
  leftCalories: ['{kcal} left today.', '{kcal} to go today.'],
  leftCaloriesProteinMet: ['{kcal} left today. Protein {protein}: target hit.', '{kcal} left today, protein at target.'],
  leftProtein: ['{protein} of protein left today.', '{protein} protein to go today.'],
  leftProteinMet: ['Protein {protein}: target hit.', 'Protein {protein}, at your target.'],
  leftAtTarget: ['{kcal} logged, your {target} target reached.', '{kcal} in, the {target} target reached.'],
  leftFits: ['Your usual {foods} fits.', 'Your usual {foods} fits here.'],
  leftMarkedTotals: ['Logged so far: {kcal}, {protein} protein, {carbs} carbohydrate and {fat} fat.', 'So far: {kcal}, {protein} protein, {carbs} carbohydrate and {fat} fat.'],
  leftMarkedProtein: ['Logged so far: {protein} protein.', 'So far: {protein} protein.'],

  // ---- Data quality: what limits the rest ----
  leadPartialDays: [
    "{partial} of {logged} days partly logged. Partial days are left out, so your food isn't read from this span.",
    "{partial} of your {logged} days were partial, and partial days are left out: this span can't read your food.",
  ],
  leadEstimates: [
    "About {share} of your calories came from estimates, so your food isn't read from this span.",
    "Estimates gave about {share} of your calories: this span can't read your food.",
  ],
  orderLogWhole: ['Log every meal, every day.', 'Log the whole day.'],
  orderWeigh: ['Weigh or scan more of it.', 'Fewer estimates: weigh or scan it.'],
  leadLoggingStyle: [
    'Your logging changed around {date}. A change in intake beside it reads as logging, not eating.',
    'You log differently since about {date}, so a change in intake there reads as logging, not eating.',
  ],

  // ---- Training, water and sleep ----
  leadTrainingStopped: ['No session in {days} days.', '{days} days without a session.'],
  trainingStoppedPaused: [
    'Your surplus is paused at maintenance until you log a workout: a surplus without training is stored as fat.',
    'Without training a surplus is stored as fat, so targets sit at maintenance until you log a workout.',
  ],
  trainingStoppedGain: ['The gain runs on training: the surplus pauses at {days} days without a session.', 'No training, no gain: the surplus pauses at {days} days.'],
  trainingStoppedLoss: ['Lifting is what keeps your muscle while you lose weight.', 'Lifting keeps the muscle on while the weight comes off.'],
  leadTrainingStoppedHeld: ['Trained every week for {weeks} weeks: {sessions}.', '{sessions} in {weeks} weeks, none missed.'],
  leadTrainingDropped: ['{recent} in {days} days. You usually do about {usual} a week.', '{recent} in {days} days, against about {usual} a week before.'],
  trainingDroppedWhy: [
    'One session a week with heavy sets holds strength for most younger adults; older adults need two.',
    'Heavy sets once a week hold strength for most younger adults; older adults need two.',
  ],
  leadTrainingDroppedHeld: ['{recent} in {days} days, your usual.', '{recent} in {days} days: on your usual pace.'],
  leadSets: ['{group}: about {sets} a week. {top} gets about {topSets}.', '{group} at about {sets} a week, against about {topSets} for {top}.'],
  setsWhy: ['Ten to twenty a week is the range.', 'The range is ten to twenty a week.'],
  leadSetsHeld: ['{groups} at {low} to {high} hard sets a week.', '{groups}: {low} to {high} hard sets a week, the range.'],
  leadStrengthRisingHeld: ['{name} up from {from} to {to} over {sessions}.', '{possessive} estimated max: {from} to {to} over {sessions}.'],
  keepPushing: ['Keep pushing.', 'Keep adding weight.'],
  leadStalled: ['{lifts} flat for {weeks} weeks: three sessions at one load, no more reps.', '{lifts}: no progress in {weeks} weeks, three sessions at one load.'],
  leadStrengthFalling: ['{lifts} down 5% or more in {weeks} weeks.', '{lifts}: down 5% or more over {weeks} weeks.'],
  strengthFallingSleep: ['Sleep averaged {sleep} over {nights}.', '{sleep} of sleep a night, over {nights}.'],
  strengthFallingProtein: ['Protein minimum hit on {met} of {days} days.', 'Protein met the minimum on {met} of {days} days.'],
  leadStrengthHeld: ['{lifts} held for {weeks} weeks on a cut.', '{lifts}: held through {weeks} weeks on a cut.'],
  leadTrainingDaysHeld: ['You train {days}.', 'Your days: {days}.'],
  leadRir: [
    'Reps in reserve on {recorded} of {hard} hard sets. Without it every set counts as hard, so weekly sets read high.',
    'Only {recorded} of {hard} hard sets carry reps in reserve, so weekly sets read high.',
  ],
  orderRecordRir: ['Record it on every set.', 'Log reps in reserve on each set.'],
  leadProteinByTrainingDay: [
    'Protein minimum on {trainingMet} of {trainingDays} training days and {restMet} of {restDays} rest days.',
    'Training days: {trainingMet} of {trainingDays} at the minimum. Rest days: {restMet} of {restDays}.',
  ],
  sameEveryDay: ['The minimum, {minimum}, is the same every day, {days} included.', '{minimum}, the same every day, {days} included.'],
  foldedProteinByTrainingDay: [
    'Training days: {trainingMet} of {trainingDays} at the minimum. Rest days: {restMet} of {restDays}. {lowerStart} are the gap; the minimum is the same every day.',
    'At the minimum on {trainingMet} of {trainingDays} training days and {restMet} of {restDays} rest days, lower on {lower}; the minimum is the same every day.',
  ],
  leadWater: [
    'Water logged under goal on {under} of {training} training days. Training days average {trainingAverage} logged, rest days {restAverage}.',
    'On {under} of {training} training days the water logged fell short: {trainingAverage} against {restAverage} on rest days.',
  ],
  waterNote: ["What's logged isn't all that's drunk.", 'Logged is not all you drink.'],
  leadWaterHeld: ['Water logged at your {goal} goal on {atGoal} of {training} training days.', '{atGoal} of {training} training days at the {goal} water goal, logged.'],
  leadWaterLogged: ['Water logged on {logged} of the last {days} days.', 'You logged water on {logged} of {days} days.'],

  // ---- MM-607's trade ----
  tradeX: ['{x}: {figures}.', 'The {x}: {figures}.'],
  tradeXDays: ['{x} on {days} of {span} days: {figures}.', '{x}, {days} of {span} days: {figures}.'],
  tradeLogged: ['Swap it for {y}, which you log{where}: {figures}.', 'Have {y} instead, which you log{where}: {figures}.'],
  tradeCatalog: ["Swap it for {y}, a food you haven't logged: {figures}.", "Have {y} instead, a food you haven't logged: {figures}."],
  tradeProtein: ["That's about {gain} more protein a day, at {delta}.", 'About {gain} more protein a day, at {delta}.'],
  tradeProteinToday: ["That's about {gain} more protein, at {delta}.", 'About {gain} more protein, at {delta}.'],
  tradeCalories: ["That's about {gain} fewer a day, with protein no lower.", 'About {gain} fewer a day, protein no lower.'],
  tradeCaloriesToday: ["That's about {gain} fewer today, with protein no lower.", 'About {gain} fewer today, protein no lower.'],
  tradeOther: ["That's about {what} a day, at {delta}.", 'About {what} a day, at {delta}.'],
  tradeOtherToday: ["That's about {what} today, at {delta}.", 'About {what} today, at {delta}.'],
  // ---- Accountability: what the coach said before, and what keeps happening ----
  followSaidBeforeSkip: [
    "{day} I told you to skip the {food}. It's back: {kcal} again.",
    "{day} I said skip the {food}. It's back: {kcal} again.",
    'I told you {day} to skip the {food}. Back again: {kcal}.',
  ],
  followSaidBeforeSwap: [
    "{day} I told you to swap the {food} for {replacement}. It's back: {kcal} again.",
    "{day} I said swap the {food} for {replacement}. It's back: {kcal} again.",
  ],
  followSaidBeforeOrder: ["{day} I told you about the {food}. It's back: {kcal} again.", "{day} I flagged the {food}. It's back: {kcal} again."],
  followRepeatOver: [
    '{nth} day over by {over} or more this week.',
    '{nth} day this week over by {over} or more.',
    'Over by {over} or more again: {nth} day this week.',
  ],
  followRepeatFood: ['The {food} keeps doing it: {driven} of the {days} days.', '{food} again: {driven} of the {days} days.'],
  followRepeatMeal: ['{meal} again: {driven} of the {days} days.', '{meal} keeps doing it.'],
  followRepeatFat: ['Fat over target {days} of the last {of} days.', 'Fat over again: {days} of the last {of} days.', 'Fat over target on {days} of the last {of} days. A pattern.'],
  followRepeatProtein: [
    'Protein short of the minimum {days} of the last {of} days.',
    'Protein under the minimum again: {days} of the last {of} days.',
    'Short on protein {days} of the last {of} days. A pattern.',
  ],
  followAdviceTaken: [
    "No {food} for {days} days running: {saved} you didn't eat.",
    "{days} days running without the {food}. That's {saved} you didn't eat.",
    "You skipped the {food} {days} days running. That's {saved} you didn't eat.",
  ],
  followAdviceTakenAdd: ['You took the advice: {days} days running.', '{days} days running on the advice. It shows.'],
  orderBreakRun: ['Plan {meal} before you get there.', 'Decide {meal} before you sit down.'],
} as const;
