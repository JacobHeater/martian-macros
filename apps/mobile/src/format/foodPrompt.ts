import { FoodGroup } from '../domain/food/FoodGroup';

/**
 * The prompt the person gives their own AI assistant to work out one food,
 * or several, from photos and what they said about it (MM-708). It is
 * fixed and holds nothing about the person, since it goes to a third party;
 * a change to it is reviewed in MM-709. It asks for the format
 * `parseFoodAnalysis` reads, with every field the saved food keeps, per
 * 100 g, and its own example reads back clean.
 */
export const foodPrompt = `You are helping me add a food to my nutrition app, Martian Macros, so I can log it again and again. I will send you one or more photos of the food, and what I know about it.

What I know about the food:
- I will tell you its name, where it is from, what one serving is, and anything else that helps. If I leave the name blank, name it from the photos. If I do not say what one serving is, propose one as someone would usually eat or log it (for example "1 biscuit", "1 scoop", "1 cup") and give its grams.
- If I say it is homemade, list what likely went into one serving of it as "ingredients", each with its grams, and work the nutrition out from them and the photos. Otherwise leave "ingredients" as an empty list.

Find its nutrition per 100 g, in this order of preference:
- the restaurant's published nutrition for that item, or the brand's label (including a label visible in a photo);
- USDA FoodData Central (give the FDC ID);
- Open Food Facts (give the barcode) or a national food composition database;
- a well-known nutrition website (give the page address).
Set "verified" to true only if you actually looked the food up in that source and the numbers are that source's. If you are estimating, or you can't check the source, set "verified" to false and still say what you based it on. Never make up an ID, a barcode or an address.

Answer with one JSON code block and nothing after it, in exactly this format. If there are several foods in the photos, give each as its own entry in "foods":

\`\`\`json
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
        "kcal": 353,
        "protein_g": 6.5,
        "carbs_g": 44,
        "fat_g": 16.3,
        "fiber_g": 1.5,
        "sugar_alcohols_g": 0,
        "alcohol_g": 0,
        "sodium_mg": 920,
        "potassium_mg": 120,
        "calcium_mg": 150,
        "iron_mg": 2.6,
        "magnesium_mg": 14,
        "zinc_mg": 0.5,
        "vitamin_a_ug": 20,
        "vitamin_c_mg": 0,
        "vitamin_d_ug": 0.1,
        "vitamin_b12_ug": 0.1,
        "folate_ug": 60,
        "sugars_g": 3.2,
        "saturated_fat_g": 4.1,
        "cholesterol_mg": 2
      },
      "ingredients": [
        { "name": "All-purpose flour", "grams": 30 },
        { "name": "Buttermilk", "grams": 22 },
        { "name": "Butter", "grams": 10 },
        { "name": "Baking powder", "grams": 1 }
      ],
      "source": { "verified": false, "citation": "Estimated from the ingredients; USDA FoodData Central, FDC ID 174986, Biscuits, plain or buttermilk, prepared from recipe, as a check" }
    }
  ]
}
\`\`\`

Rules for the JSON:
- Every food must have name, brand, lookup, group, serving, barcode, per_100g, ingredients and source. "brand" is the brand or restaurant, "Homemade" for a homemade food, or null. "barcode" is the product's barcode digits as a string when it has one, or null.
- Every number in per_100g is required: kcal, protein_g, carbs_g, fat_g, fiber_g, sugar_alcohols_g, alcohol_g, sodium_mg, potassium_mg, calcium_mg, iron_mg, magnesium_mg, zinc_mg, vitamin_a_ug (RAE), vitamin_c_mg, vitamin_d_ug, vitamin_b12_ug, folate_ug (DFE), sugars_g, saturated_fat_g, cholesterol_mg. Use 0 when the food truly has none, and your best estimate otherwise; never leave a field out.
- Numbers are per 100 g of the food, not per serving. Calories must agree with the macros (protein and carbohydrate 4 kcal per gram, fat 9, alcohol 7).
- "group" is exactly one of: ${FoodGroup.values.join(', ')}.
- "lookup" is two to four plain, generic words for the food, as a food database would name it (for example "chicken breast roasted", "biscuit buttermilk"). No brand names.
- Don't add comments or any other fields.

If I send you a list of problems with your JSON, fix them and answer again with every food, corrected, in the same format, keeping any changes I made.`;
