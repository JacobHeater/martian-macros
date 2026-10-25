/**
 * The owner's buffet day of 2026-10-24 (MM-617's first scenario), as the
 * foods logged: each meal logged as one with its foods, as name, kcal,
 * protein, carbohydrate, fat, sodium and fiber. One source for the
 * analysis's fixture (`test/engine/support/buffetDay.ts`) and the Coach
 * tab's story (`buffetDayScenario`).
 *
 * - **Breakfast:** "Sausage egg and cheese biscuit with extra eggs", 5
 *   foods, 691 kcal, fat 45 g.
 * - **Lunch:** a can of Diet Pepsi (0 kcal) and "Chinese buffet", 13 foods,
 *   2,368 kcal, fat 103 g, General Tso's chicken among them at 744 kcal.
 * - **Snack:** cookie butter, 170 kcal.
 *
 * The day: 3,229 kcal, protein 155 g, fat 159 g, sodium 6,923 mg, fiber 14 g.
 */
export const buffetDayFoods = {
  breakfastMeal: { key: 'breakfast-biscuit', name: 'Sausage egg and cheese biscuit with extra eggs' },
  buffetMeal: { key: 'lunch-buffet', name: 'Chinese buffet' },
  breakfast: [
    ['Buttermilk biscuit', 260, 3, 35, 12, 650, 1],
    ['Pork sausage patty', 170, 7, 1, 15, 420, 0],
    ['Eggs', 140, 12, 1, 10, 140, 0],
    ['Extra egg', 70, 6, 0.5, 5, 70, 0],
    ['American cheese', 51, 3, 1.5, 3, 320, 0],
  ],
  buffet: [
    ["General Tso's chicken", 744, 32, 66, 33, 1800, 0.5],
    ['Fried rice', 274, 6, 36, 11, 600, 1],
    ['Lo mein', 230, 8, 27, 10, 550, 1],
    ['Egg rolls', 220, 6, 22, 12, 450, 0],
    ['Crab rangoon', 180, 5, 14, 12.2, 300, 0],
    ['Steamed broccoli', 50, 4, 8, 0.5, 30, 4],
    ['Steamed chicken with vegetables', 180, 29, 4, 6, 350, 2],
    ['Hot and sour soup', 90, 4, 10, 3.5, 600, 0],
    ['Beef with broccoli', 200, 16, 10, 10, 220, 2],
    ['Peel-and-eat shrimp', 60, 9, 1, 2, 80, 0],
    ['Egg drop soup', 70, 3, 8, 2.5, 140, 0],
    ['Fortune cookie', 30, 0.4, 7, 0.2, 18, 0],
    ['Orange slices', 40, 0.6, 9, 0.1, 0, 2],
  ],
  /** At lunch, on its own: 36 fl oz, 1,065 g. */
  drink: ['Diet Pepsi Cola 12 Fluid Ounce Aluminum Can (Pepsi)', 0, 0, 0, 0, 105, 0],
  drinkGrams: 1065,
  /** The snack, on its own. */
  snack: ['COOKIE BUTTER, CRUNCHY (LOTUS)', 170, 1, 18, 11, 80, 0.5],
  /** The targets: 2,175 kcal on fat loss, protein 187 g with a 149 g minimum, fat 60 g, carbohydrate 222 g; sodium limit 1,800 mg. */
  targets: { kcal: 2175, proteinG: 187, proteinMinimumG: 149, fatG: 60, carbsG: 222 },
  sodiumLimitMg: 1800,
} as const;
