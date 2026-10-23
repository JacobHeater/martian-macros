/**
 * The prompt the person gives their own AI assistant with photos of a meal
 * (MM-586). It is fixed and holds nothing about the person, since it goes
 * to a third party; a change to it is reviewed in MM-586. It asks for the
 * format `parseMealAnalysis` reads, with every number the grade needs.
 */
export const mealAnalysisPrompt = `You are helping me log a meal in my nutrition app, Martian Macros. I will send you one or more photos of everything I ate in one sitting (it may be several plates, seconds or dessert).

Before you answer, ask me, in one message:
1. What should this meal be called? (Required. Use my answer exactly as the meal's "name".)
2. How much of what is shown did I actually eat? (All of it, half, everything except the fries, and so on.)
3. Is any of it from a brand or a restaurant? If so, which?
4. When did I eat it? (The day and the time. I may leave this blank.)
Wait for my reply. If I already answered any of these, don't ask again.

Then identify each separate food and estimate the grams I ate of it, counting only what I said I ate. Include cooking oil, butter, sauces and dressings as their own items when they are likely there.

For each food, find its nutrition, in this order of preference:
- the restaurant's published nutrition for that item, or the brand's label (including a label visible in a photo);
- USDA FoodData Central (give the FDC ID);
- Open Food Facts (give the barcode) or a national food composition database;
- a well-known nutrition website (give the page address).
Scale the numbers to the grams I ate. Set "verified" to true only if you actually looked the food up in that source and the numbers are that source's. If you are estimating, or you can't check the source, set "verified" to false and still say what you based it on. Never make up an ID, a barcode or an address.

Answer with one JSON code block and nothing after it, in exactly this format:

\`\`\`json
{
  "format": "martian-macros-meal",
  "version": 1,
  "name": "the meal's name, as I gave it",
  "eaten_at": "2026-10-22T12:30",
  "items": [
    {
      "name": "Corn tortilla",
      "lookup": "tortilla corn",
      "grams": 52,
      "usual_portion": { "description": "1 tortilla", "grams": 26 },
      "kcal": 113,
      "protein_g": 2.9,
      "carbs_g": 23.2,
      "fat_g": 1.5,
      "fiber_g": 3.3,
      "sugars_g": 0.4,
      "saturated_fat_g": 0.2,
      "sodium_mg": 23,
      "source": { "verified": true, "citation": "USDA FoodData Central, FDC ID 2343304, Tortillas, corn" }
    }
  ]
}
\`\`\`

Rules for the JSON:
- Every item must have name, lookup, grams, usual_portion, kcal, protein_g, carbs_g, fat_g, fiber_g, sugars_g, saturated_fat_g, sodium_mg and source. Use 0 when a food truly has none; never leave a field out.
- "eaten_at" is the day and time I said I ate, as local YYYY-MM-DDTHH:MM in 24-hour time (for example "2026-10-21T18:45" for yesterday at 6:45 PM if today is October 22, 2026). If I leave question 4 blank, leave "eaten_at" out and don't ask again: the app uses the day I'm logging on. If I give a day like "yesterday" and you don't know today's date, ask me for it; never guess a date.
- "usual_portion" is one reasonable serving of that food on its own, as someone would usually eat or log it, whatever I ate of it this time: a description and its grams (for example { "description": "1 tbsp", "grams": 15 } for mayonnaise, { "description": "1 cup", "grams": 158 } for cooked rice, { "description": "1 breast", "grams": 172 } for chicken breast). It lets me log the food again on its own.
- "lookup" is two to four plain, generic words for the food, as a food database would name it (for example "chicken breast roasted", "rice white cooked", "avocado raw"). No brand names.
- Numbers are plain numbers for the grams I ate, not per 100 g. Calories must agree with the macros (protein and carbohydrate 4 kcal per gram, fat 9).
- You may add these when the source states them, for the grams I ate: potassium_mg, calcium_mg, iron_mg, magnesium_mg, zinc_mg, vitamin_a_ug (RAE), vitamin_c_mg, vitamin_d_ug, vitamin_b12_ug, folate_ug (DFE), cholesterol_mg.
- Don't add comments or any other fields.

If I send you a list of problems with your JSON, fix them and answer again with the whole meal, corrected, in the same format, keeping any changes I made.`;
