/**
 * Answers an AI assistant might give to the food prompt (MM-709), for the
 * stories and the tests: a clean one with its chatter around the code
 * block, a homemade food with its ingredients, and one with problems to fix.
 */

/** A food's per-100 g numbers with every field, so an answer reads clean; the figures are plausible for a yogurt. */
const yogurtPer100g = `"per_100g": {
        "kcal": 59, "protein_g": 10.2, "carbs_g": 3.6, "fat_g": 0.4, "fiber_g": 0, "sugar_alcohols_g": 0, "alcohol_g": 0,
        "sodium_mg": 36, "potassium_mg": 141, "calcium_mg": 110, "iron_mg": 0.1, "magnesium_mg": 11, "zinc_mg": 0.5,
        "vitamin_a_ug": 1, "vitamin_c_mg": 0, "vitamin_d_ug": 0, "vitamin_b12_ug": 0.8, "folate_ug": 7,
        "sugars_g": 3.2, "saturated_fat_g": 0.1, "cholesterol_mg": 5
      }`;

/** Two foods: one cited and verified (a bar), one "verified" with only a database's name, matched in the packs. */
export const cleanFoodAnswer = `Here you go!

\`\`\`json
{
  "format": "martian-macros-food",
  "version": 1,
  "foods": [
    {
      "name": "Chocolate protein bar",
      "brand": "Quest",
      "lookup": "protein bar chocolate",
      "group": "snacksAndSweets",
      "serving": { "description": "1 bar", "grams": 60 },
      "barcode": null,
      "per_100g": {
        "kcal": 317, "protein_g": 33, "carbs_g": 37, "fat_g": 13, "fiber_g": 23, "sugar_alcohols_g": 2, "alcohol_g": 0,
        "sodium_mg": 383, "potassium_mg": 300, "calcium_mg": 333, "iron_mg": 2.2, "magnesium_mg": 83, "zinc_mg": 2.5,
        "vitamin_a_ug": 0, "vitamin_c_mg": 0, "vitamin_d_ug": 0, "vitamin_b12_ug": 0, "folate_ug": 0,
        "sugars_g": 2, "saturated_fat_g": 4.2, "cholesterol_mg": 8
      },
      "ingredients": [],
      "source": { "verified": true, "citation": "USDA FoodData Central, FDC ID 1844006, Quest Chocolate Chip Cookie Dough Protein Bar" }
    },
    {
      "name": "Greek yogurt, plain nonfat",
      "brand": null,
      "lookup": "greek yogurt plain nonfat",
      "group": "dairyAndYogurt",
      "serving": { "description": "1 cup", "grams": 227 },
      "barcode": null,
      ${yogurtPer100g},
      "ingredients": [],
      "source": { "verified": true, "citation": "USDA" }
    }
  ]
}
\`\`\`

Let me know if you want any of these adjusted.`;

/** A homemade biscuit: its ingredients listed, its numbers estimated from them. */
export const homemadeFoodAnswer = `\`\`\`json
{
  "format": "martian-macros-food",
  "version": 1,
  "foods": [
    {
      "name": "Buttermilk biscuit",
      "brand": "Homemade",
      "lookup": "biscuit buttermilk",
      "group": "breadsAndGrains",
      "serving": { "description": "1 biscuit", "grams": 60 },
      "barcode": null,
      "per_100g": {
        "kcal": 353, "protein_g": 6.5, "carbs_g": 44, "fat_g": 16.3, "fiber_g": 1.5, "sugar_alcohols_g": 0, "alcohol_g": 0,
        "sodium_mg": 920, "potassium_mg": 120, "calcium_mg": 150, "iron_mg": 2.6, "magnesium_mg": 14, "zinc_mg": 0.5,
        "vitamin_a_ug": 20, "vitamin_c_mg": 0, "vitamin_d_ug": 0.1, "vitamin_b12_ug": 0.1, "folate_ug": 60,
        "sugars_g": 3.2, "saturated_fat_g": 4.1, "cholesterol_mg": 2
      },
      "ingredients": [
        { "name": "All-purpose flour", "grams": 30 },
        { "name": "Buttermilk", "grams": 22 },
        { "name": "Butter", "grams": 10 },
        { "name": "Baking powder", "grams": 1 }
      ],
      "source": { "verified": false, "citation": "Estimated from the ingredients and the photo" }
    }
  ]
}
\`\`\``;

/** Two foods with problems: one missing vitamin D and its group, one whose calories disagree with its macros. */
export const troubledFoodAnswer = `\`\`\`json
{
  "format": "martian-macros-food",
  "version": 1,
  "foods": [
    {
      "name": "Pancake",
      "brand": null,
      "lookup": "pancake plain",
      "serving": { "description": "1 pancake", "grams": 80 },
      "barcode": null,
      "per_100g": {
        "kcal": 227, "protein_g": 6.4, "carbs_g": 28, "fat_g": 9.7, "fiber_g": 1.2, "sugar_alcohols_g": 0, "alcohol_g": 0,
        "sodium_mg": 439, "potassium_mg": 132, "calcium_mg": 219, "iron_mg": 1.7, "magnesium_mg": 15, "zinc_mg": 0.6,
        "vitamin_a_ug": 49, "vitamin_c_mg": 0.3, "vitamin_b12_ug": 0.3, "folate_ug": 60,
        "sugars_g": 5.9, "saturated_fat_g": 2.1, "cholesterol_mg": 59
      },
      "ingredients": [],
      "source": { "verified": false, "citation": "Estimated from the photo" }
    },
    {
      "name": "Bacon",
      "brand": null,
      "lookup": "bacon cooked",
      "group": "meatAndPoultry",
      "serving": { "description": "3 slices", "grams": 24 },
      "barcode": null,
      "per_100g": {
        "kcal": 900, "protein_g": 37, "carbs_g": 1.4, "fat_g": 42, "fiber_g": 0, "sugar_alcohols_g": 0, "alcohol_g": 0,
        "sodium_mg": 1750, "potassium_mg": 565, "calcium_mg": 11, "iron_mg": 1.4, "magnesium_mg": 33, "zinc_mg": 3.5,
        "vitamin_a_ug": 11, "vitamin_c_mg": 0, "vitamin_d_ug": 0.4, "vitamin_b12_ug": 1.2, "folate_ug": 1,
        "sugars_g": 0, "saturated_fat_g": 14, "cholesterol_mg": 110
      },
      "ingredients": [],
      "source": { "verified": false, "citation": "Estimated from the photo" }
    }
  ]
}
\`\`\``;
