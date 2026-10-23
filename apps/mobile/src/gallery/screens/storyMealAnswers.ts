/**
 * Answers an AI assistant might give to the meal analysis prompt (MM-586),
 * for the stories and the tests: one to log as it is, with its chatter
 * around the code block, and one with problems to fix.
 */

/** Three foods: one cited and verified, one estimate, one "verified" with only a database's name. */
export const cleanMealAnswer = `Thanks! Here is your meal.

\`\`\`json
{
  "format": "martian-macros-meal",
  "version": 1,
  "name": "Chicken and rice",
  "eaten_at": "2026-10-22T19:15",
  "items": [
    {
      "name": "Grilled chicken breast",
      "lookup": "chicken breast roasted",
      "grams": 150,
      "usual_portion": { "description": "1 breast", "grams": 172 },
      "kcal": 248,
      "protein_g": 46.5,
      "carbs_g": 0,
      "fat_g": 5.4,
      "fiber_g": 0,
      "sugars_g": 0,
      "saturated_fat_g": 1.5,
      "sodium_mg": 111,
      "potassium_mg": 384,
      "source": { "verified": true, "citation": "USDA FoodData Central, FDC ID 171477, Chicken breast, roasted" }
    },
    {
      "name": "White rice",
      "lookup": "rice white cooked",
      "grams": 186,
      "usual_portion": { "description": "1 cup", "grams": 158 },
      "kcal": 242,
      "protein_g": 4.4,
      "carbs_g": 53.2,
      "fat_g": 0.4,
      "fiber_g": 0.6,
      "sugars_g": 0.1,
      "saturated_fat_g": 0.1,
      "sodium_mg": 2,
      "source": { "verified": false, "citation": "Typical values for cooked white rice" }
    },
    {
      "name": "Steamed broccoli",
      "lookup": "broccoli cooked",
      "grams": 90,
      "usual_portion": { "description": "1 cup chopped", "grams": 156 },
      "kcal": 32,
      "protein_g": 2.2,
      "carbs_g": 6.3,
      "fat_g": 0.4,
      "fiber_g": 3,
      "sugars_g": 1.3,
      "saturated_fat_g": 0.1,
      "sodium_mg": 37,
      "source": { "verified": true, "citation": "USDA" }
    }
  ]
}
\`\`\`

Enjoy your meal!`;

/** Two foods with problems: one missing what its grade needs, one whose calories disagree with its macros. */
export const troubledMealAnswer = `\`\`\`json
{
  "format": "martian-macros-meal",
  "version": 1,
  "name": "Diner breakfast",
  "items": [
    {
      "name": "Pancakes",
      "lookup": "pancakes plain",
      "grams": 160,
      "usual_portion": { "description": "2 pancakes", "grams": 160 },
      "kcal": 362,
      "protein_g": 10,
      "carbs_g": 56,
      "fat_g": 10.6,
      "fiber_g": 2,
      "source": { "verified": false, "citation": "Estimated from the photo" }
    },
    {
      "name": "Bacon",
      "lookup": "bacon cooked",
      "grams": 24,
      "usual_portion": { "description": "3 slices", "grams": 24 },
      "kcal": 900,
      "protein_g": 9,
      "carbs_g": 0.4,
      "fat_g": 10,
      "fiber_g": 0,
      "sugars_g": 0,
      "saturated_fat_g": 3.4,
      "sodium_mg": 420,
      "source": { "verified": false, "citation": "Estimated from the photo" }
    }
  ]
}
\`\`\``;
