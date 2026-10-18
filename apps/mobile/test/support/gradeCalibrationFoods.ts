import type { GradeNutrition } from '../../src/engine/GradeNutrition';
import type { FoodGradeLetter } from '../../src/domain/food/grade/FoodGradeLetter';

/**
 * The calibration set of MM-380: reference foods on approximate USDA SR
 * Legacy values per 100 g (kcal, protein, fiber, sodium, sugars, saturated
 * fat; then potassium, calcium, iron, magnesium, zinc, vitamins A, C, D,
 * B12, folate in the pack's units), and the letter the method gives each.
 * A change to a threshold shows here as the foods it moves. The values
 * are recollections checked for order, not the pack's own (the panel's
 * ME-1, NU-5); `docs/food-grades.md` lists them.
 */
export interface GradeCalibrationFood {
  readonly name: string;
  readonly per100g: GradeNutrition;
  readonly letter: FoodGradeLetter | undefined;
}

const food = (
  name: string,
  letter: FoodGradeLetter | undefined,
  [kcal, proteinG, fiberG, sodiumMg, sugarsG, saturatedFatG]: readonly number[],
  micros?: readonly number[],
): GradeCalibrationFood => {
  const names = ['potassium', 'calcium', 'iron', 'magnesium', 'zinc', 'vitaminA', 'vitaminC', 'vitaminD', 'vitaminB12', 'folate'] as const;
  const stated: Partial<Record<(typeof names)[number], number>> = {};
  (micros ?? []).forEach((amount, i) => {
    const n = names[i];
    if (n !== undefined) stated[n] = amount;
  });
  return {
    name,
    letter,
    per100g: {
      kcal: kcal as number,
      proteinG: proteinG as number,
      fiberG,
      sodiumMg,
      sugarsG,
      saturatedFatG,
      alcoholG: undefined,
      micros: stated,
    },
  };
};

export const gradeCalibrationFoods: readonly GradeCalibrationFood[] = [
  // Vegetables, legumes and fruit
  food('Broccoli, raw', 'A+', [34, 2.8, 2.6, 33, 1.7, 0.04], [316, 47, 0.7, 21, 0.4, 31, 89, 0, 0, 63]),
  food('Spinach, raw', 'A+', [23, 2.9, 2.2, 79, 0.4, 0.06], [558, 99, 2.7, 79, 0.5, 469, 28, 0, 0, 194]),
  food('Mushrooms, white, raw', 'A+', [22, 3.1, 1, 5, 2, 0.05], [318, 3, 0.5, 9, 0.5, 0, 2.1, 0.2, 0.04, 17]),
  food('Swiss chard, raw', 'A', [19, 1.8, 1.6, 213, 1.1, 0.03], [379, 51, 1.8, 81, 0.4, 306, 30, 0, 0, 14]),
  food('Celery, raw', 'A', [14, 0.7, 1.6, 80, 1.3, 0.04], [260, 40, 0.2, 11, 0.13, 22, 3.1, 0, 0, 36]),
  food('Iceberg lettuce', 'A+', [14, 0.9, 1.2, 10, 2, 0.02], [141, 18, 0.4, 7, 0.15, 25, 2.8, 0, 0, 29]),
  food('Green beans, canned', 'A-', [20, 1.2, 1.9, 236, 0.8, 0.03], [97, 29, 0.9, 13, 0.3, 20, 3.3, 0, 0, 23]),
  food('Sweet potato, baked', 'A-', [90, 2, 3.3, 36, 6.5, 0.05], [475, 38, 0.7, 27, 0.3, 961, 19.6, 0, 0, 6]),
  food('Lentils, cooked', 'A', [116, 9, 7.9, 2, 1.8, 0.05], [369, 19, 3.3, 36, 1.3, 0, 1.5, 0, 0, 181]),
  food('Edamame, cooked', 'A', [121, 12, 5.2, 6, 2.2, 0.5], [436, 63, 2.3, 64, 1.4, 0, 6.1, 0, 0, 311]),
  food('Apple, with skin', 'B', [52, 0.3, 2.4, 1, 10.4, 0.03], [107, 6, 0.1, 5, 0.04, 3, 4.6, 0, 0, 3]),
  food('Banana', 'B', [89, 1.1, 2.6, 1, 12.2, 0.1], [358, 5, 0.3, 27, 0.15, 3, 8.7, 0, 0, 20]),
  food('Grapes', 'C+', [69, 0.7, 0.9, 2, 15.5, 0.05], [191, 10, 0.4, 7, 0.07, 3, 3.2, 0, 0, 2]),
  food('Watermelon', 'B-', [30, 0.6, 0.4, 1, 6.2, 0.02], [112, 7, 0.24, 10, 0.1, 28, 8.1, 0, 0, 3]),
  food('Avocado', 'B', [160, 2, 6.7, 7, 0.7, 2.1], [485, 12, 0.55, 29, 0.64, 7, 10, 0, 0, 81]),
  food('Raisins', 'D+', [299, 3.1, 3.7, 11, 59, 0.06], [749, 50, 1.9, 32, 0.2, 0, 2.3, 0, 0, 5]),
  food('Orange juice', 'C', [45, 0.7, 0.2, 1, 8.4, 0.02], [200, 11, 0.2, 11, 0.05, 10, 50, 0, 0, 30]),
  // Protein foods
  food('Greek yogurt, nonfat', 'A-', [59, 10.2, 0, 36, 3.2, 0.1], [141, 110, 0.07, 11, 0.5, 1, 0, 0, 0.75, 7]),
  food('Tofu, firm', 'A-', [144, 17, 2.3, 14, 0.6, 1.3], [237, 683, 2.7, 58, 1.6, 0, 0.2, 0, 0, 29]),
  food('Tuna, canned in water', 'A-', [116, 25.5, 0, 247, 0, 0.2], [237, 11, 1.5, 27, 0.8, 17, 0, 1.7, 2.5, 4]),
  food('Chicken breast, roasted', 'B+', [165, 31, 0, 74, 0, 1.0], [256, 15, 1.0, 29, 1.0, 6, 0, 0.1, 0.3, 4]),
  food('Salmon, farmed, cooked', 'B+', [206, 22, 0, 61, 0, 2.5], [384, 15, 0.3, 30, 0.4, 58, 4, 11, 2.8, 29]),
  food('Egg, hard-boiled', 'B', [155, 12.6, 0, 124, 1.1, 3.3], [126, 50, 1.2, 10, 1.1, 149, 0, 2.2, 1.1, 44]),
  food('Ground beef 80/20, cooked', 'B+', [254, 26, 0, 75, 0, 6.5], [318, 18, 2.6, 20, 6.2, 0, 0, 0.2, 2.6, 9]),
  food('Deli ham', 'B-', [108, 16.6, 0, 1100, 1, 1.2], [287, 7, 0.9, 19, 2.1, 0, 0, 0.5, 0.4, 3]),
  food('Bacon, cooked', 'C-', [541, 37, 0, 1717, 0, 14], [565, 11, 1.4, 33, 3.5, 11, 0, 0.4, 1.2, 1]),
  food('Whey protein powder', 'B+', [375, 75, 2, 300, 5, 3]),
  food('Protein bar', 'B', [400, 30, 10, 300, 15, 5]),
  // Dairy
  food('Skim milk', 'A-', [34, 3.4, 0, 42, 5.1, 0.06], [156, 122, 0.03, 11, 0.4, 61, 0, 1.1, 0.5, 5]),
  food('Milk, 2%', 'B+', [50, 3.3, 0, 44, 5.1, 1.2], [150, 120, 0.02, 11, 0.4, 57, 0.2, 1.1, 0.5, 5]),
  food('Whole milk', 'B-', [61, 3.2, 0, 43, 5.1, 1.9], [132, 113, 0.03, 10, 0.4, 46, 0, 1.3, 0.45, 5]),
  food('Yogurt, plain, whole', 'B-', [61, 3.5, 0, 46, 4.7, 2.1], [155, 121, 0.05, 12, 0.6, 27, 0.5, 0.1, 0.4, 7]),
  food('Fruit yogurt, low-fat', 'B-', [102, 4.4, 0, 58, 19, 0.7], [194, 152, 0.07, 15, 0.7, 11, 0.7, 0, 0.5, 9]),
  food('Cheddar', 'C-', [403, 23, 0, 653, 0.5, 21], [76, 710, 0.1, 27, 3.6, 330, 0, 0.6, 1.1, 27]),
  food('Ice cream, vanilla', 'C-', [207, 3.5, 0.7, 80, 21, 6.8], [199, 128, 0.09, 14, 0.7, 118, 0.6, 0.2, 0.4, 5]),
  food('Butter, salted', 'D-', [717, 0.85, 0, 643, 0.06, 51], [24, 24, 0.02, 2, 0.09, 684, 0, 1.5, 0.17, 3]),
  // Grains
  food('Oats, dry', 'B', [389, 16.9, 10.6, 2, 1, 1.2], [429, 54, 4.7, 177, 4, 0, 0, 0, 0, 56]),
  food('Oats, cooked in water', 'B', [71, 2.5, 1.7, 4, 0.3, 0.2], [70, 9, 1.0, 27, 1.0, 0, 0, 0, 0, 6]),
  food('Whole-wheat bread', 'B', [247, 13, 6, 455, 4.3, 0.8], [250, 161, 2.5, 76, 1.8, 0, 0, 0, 0, 42]),
  food('White bread', 'B-', [265, 9, 2.7, 490, 5, 0.7], [115, 211, 3.6, 25, 0.9, 0, 0, 0, 0, 171]),
  food('Pasta, cooked', 'B-', [158, 5.8, 1.8, 1, 0.6, 0.2], [44, 7, 1.3, 18, 0.5, 0, 0, 0, 0, 60]),
  food('Brown rice, cooked', 'C+', [123, 2.7, 1.6, 4, 0.2, 0.3], [86, 3, 0.6, 39, 0.7, 0, 0, 0, 0, 9]),
  food('White rice, cooked', 'C+', [130, 2.7, 0.4, 1, 0.05, 0.08], [35, 10, 1.2, 12, 0.5, 0, 0, 0, 0, 58]),
  food('Fortified whole-grain oat cereal', 'B+', [376, 12, 10, 500, 4.4, 1.1], [460, 400, 32, 130, 13, 530, 21, 7, 6.4, 700]),
  food('Fortified sweetened cereal', 'B-', [375, 6, 10, 400, 37, 1], [150, 15, 27, 35, 11.5, 490, 38, 6.4, 4.4, 620]),
  food('Pizza, cheese', 'C+', [266, 11, 2.3, 598, 3.6, 4.5], [172, 188, 2.5, 23, 1.3, 70, 1, 0, 0.4, 60]),
  // Nuts, oils, sweets and condiments
  food('Almonds', 'B-', [579, 21, 12.5, 1, 4.4, 3.8], [733, 269, 3.7, 270, 3.1, 0, 0, 0, 0, 44]),
  food('Walnuts', 'C-', [654, 15.2, 6.7, 2, 2.6, 6.1], [441, 98, 2.9, 158, 3.1, 1, 1.3, 0, 0, 98]),
  food('Peanut butter, salted', 'C', [588, 25, 6, 429, 9, 10], [649, 49, 1.7, 169, 2.7, 0, 0, 0, 0, 87]),
  food('Potato chips', 'C-', [536, 7, 4.8, 525, 0.4, 3.1], [1196, 24, 1.6, 67, 1.1, 0, 18, 0, 0, 45]),
  food('Olive oil', 'D', [884, 0, 0, 2, 0, 14], [1, 1, 0.6, 0, 0, 0, 0, 0, 0, 0]),
  food('Milk chocolate', 'D', [535, 7.7, 3.4, 79, 52, 18.5], [372, 189, 2.4, 63, 2.3, 60, 0, 0, 0.7, 11]),
  food('Honey', 'D', [304, 0.3, 0.2, 4, 82, 0], [52, 6, 0.4, 2, 0.2, 0, 0.5, 0, 0, 2]),
  food('Dark chocolate, 70%', 'D+', [598, 7.8, 10.9, 20, 24, 24], [715, 73, 11.9, 228, 3.3, 2, 0, 0, 0.3, 0]),
  food('Sandwich cookies', 'D+', [480, 4.5, 2.5, 380, 38, 6.5], [120, 20, 3.5, 40, 0.8, 0, 0, 0, 0, 80]),
  food('Gummy candy', 'D', [332, 0, 0, 50, 59, 0], [5, 2, 0.2, 1, 0, 0, 0, 0, 0, 0]),
  food('Sweetened condensed milk', 'D', [321, 7.9, 0, 127, 54, 5.5], [371, 284, 0.2, 26, 0.9, 74, 2.6, 0.2, 0.4, 11]),
  food('Coconut oil', 'D-', [862, 0, 0, 0, 0, 82.5], [0, 0, 0.04, 0, 0, 0, 0, 0, 0, 0]),
  food('Lard', 'D', [902, 0, 0, 0, 0, 39.2], [0, 0, 0, 0, 0.1, 0, 0, 2.5, 0, 0]),
  food('Cola', 'D', [37, 0, 0, 4, 9, 0], [2, 2, 0.1, 0, 0, 0, 0, 0, 0, 0]),
  food('Pickles, dill', 'B-', [11, 0.3, 1.2, 1200, 1.1, 0.05], [23, 57, 0.4, 7, 0.1, 5, 2.3, 0, 0, 1]),
  food('Soy sauce', 'C', [53, 8.1, 0.8, 5493, 0.4, 0.07], [435, 33, 1.5, 74, 0.4, 0, 0, 0, 0, 14]),
  food('Chicken broth', undefined, [7, 0.6, 0, 343, 0.3, 0.1]),
];
