import type { ItemInsightKind } from './ItemInsightKind';

/**
 * The kinds of inline insight the app has, in priority order within each
 * area (MM-362). Each joins once the panel's domain roles have checked it
 * (MM-361), with its row in the evidence register (MM-143). Sleep's kinds
 * (MM-368) wait for a night of sleep to be recorded (MM-250).
 */
export const itemInsightKinds: readonly ItemInsightKind[] = [
  // MM-365, checked by the nutrition, coaching and safety roles (docs/agent-runs/mm365-food-rules/).
  {
    id: 'portionCheck',
    area: 'food',
    title: 'Portion check',
    example: 'Logged as 3 servings (690 kcal); one serving is 55 g. Right as logged? If not, the amount can be edited.',
    priority: 'dataQuality',
    // A second look at an amount eaten is checking behaviour the app should not prompt (the panel's SA-2, SA-4, SA-6).
    notWithEatingDisorderHistory: true,
    notWhileUnderEating: true,
    notWithCautions: ['underweight'],
  },
  {
    id: 'lightOnProtein',
    area: 'food',
    title: 'Light on protein',
    example: '9 g of protein in 520 kcal. A protein food alongside is the easiest way to add some.',
    priority: 'pattern',
    // No minimum after bariatric surgery; a ceiling, not a floor, with kidney disease (the panel's NU-3, SA-7).
    notWithCautions: ['bariatricSurgery', 'chronicKidneyDisease'],
  },
  {
    id: 'mostlyFat',
    area: 'food',
    title: 'Mostly fat',
    example: 'Most of this food’s calories come from fat (76%). A protein food alongside balances the meal.',
    priority: 'pattern',
    notWithEatingDisorderHistory: true,
    notWhileUnderEating: true,
    // The app has handed intake to the clinician, or plans no deficit (the panel's SA-5, SA-6).
    notWithCautions: ['underweight', 'pregnancy', 'breastfeeding'],
  },
  // MM-366, checked by the training, coaching and safety roles (docs/agent-runs/mm366-workout-rules/).
  {
    id: 'volumeJump',
    area: 'training',
    title: 'Volume jump',
    example:
      '14 sets for chest in the 7 days to this workout. Your usual is about 9 a week. A jump this big can bring ' +
      'more soreness; adding sets more slowly is easier to recover from.',
    priority: 'coaching',
  },
  // MM-377, checked by the measurement and nutrition roles (docs/agent-runs/mm377-strength-on-fat-loss/), after the
  // training, coaching and safety roles' findings on its draft (docs/agent-runs/mm366-workout-rules/).
  {
    id: 'strengthOnFatLoss',
    area: 'training',
    title: 'Strength on fat loss',
    example:
      'Your strength on this lift has held through 8 weeks on your fat-loss goal. Keeping it is the aim right now, and ' +
      'your training is doing that.',
    priority: 'pattern',
    // Approval attached to weeks on a fat-loss goal is unwanted where restriction is a risk (the panel's SA-6, NU-6).
    notWithEatingDisorderHistory: true,
    notWhileUnderEating: true,
    notWithCautions: ['underweight', 'lowBodyWeight'],
  },
  // MM-367, checked by the measurement, coaching and safety roles (docs/agent-runs/mm367-body-water-rules/).
  {
    id: 'waistWithinNoise',
    area: 'body',
    title: 'Waist: no clear change',
    example: 'About the same as 4 weeks ago. A difference under 1.5 cm is within what a tape can tell.',
    priority: 'pattern',
    // A verdict under a body reading rewards body checking (the panel's SA-1).
    notWithEatingDisorderHistory: true,
  },
  {
    id: 'waterFewDays',
    area: 'water',
    title: 'Water logged on few days',
    example: 'Water logged on 5 of the last 14 days. Add a glass here logs one in a tap.',
    priority: 'dataQuality',
    // Fluid is part of eating-disorder behaviour in both directions (the panel's SA-6).
    notWithEatingDisorderHistory: true,
  },
];
