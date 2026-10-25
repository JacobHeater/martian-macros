const values = [
  // A drink with no sugar kind of its own (tea, coffee, water): "diet" or "unsweetened" makes it a diet drink.
  'drink',
  // "Diet", "zero", "unsweetened", "sugar free", "low calorie": a sweet drink becomes a diet drink.
  'sugarFree',
  // "Sweetened", "with sugar": a drink of no kind of its own (tea, coffee) is a sugary drink.
  'sweetened',
  // "Non alcoholic", "alcohol free": a beer or wine that is not alcohol.
  'alcoholFree',
  // "Lean", "lean only", "93% lean": a fatty meat is a lean protein.
  'lean',
  // A lean cut (sirloin, tenderloin, loin, round, flank): lean, unless the name also names a fatty cut.
  'leanCut',
  // A fatty cut (shoulder, blade): what keeps "loin and shoulder blade" fatty.
  'fattyCut',
  // "Pork, fresh": fresh meat, not cured; what keeps USDA's "Pork, fresh, leg (ham)" from being a processed meat.
  'notProcessed',
  // "Meatless", "meat free", "plant based", "vegan": a sausage or burger that is not meat.
  'meatFree',
  // "Paleo", "grain free": a waffle, pasta or chip that is not grain.
  'grainFree',
  // "Popped": popped chips, not fried.
  'popped',
  // The word "creamy": cream in a soup or sauce, a texture in a milk, cheese or spread.
  'creamyWord',
  // A part that is not lean (thigh, drumstick, skin, dark meat): the name is not a lean protein.
  'notLean',
  // "Flavor", "flavored": the food words before it in the same part of the name are a flavor, not the food.
  'flavor',
  // A food that a fruit or vegetable only flavors (jam, yogurt, tea, gum): the fruit is not eaten as fruit.
  'flavorCarrier',
  // Juice: the fruit named is juice, not fruit.
  'juice',
  // "In juice", "in light syrup", "juice pack": what a fruit is packed in, not a drink.
  'packedIn',
  // Usually fried (fries, chips, nuggets, donuts) unless the name says another method.
  'mostlyFried',
  // "Crispy": fried when it is a meat, fish, egg or vegetable ("crispy chicken"), a texture otherwise ("crispy cookies").
  'crispy',
  // Usually breaded (nuggets, fish sticks) unless the name says grilled or steamed.
  'mostlyBreaded',
  // Chocolate, caramel: candy when the name is about it, a flavor otherwise.
  'sweet',
  // Butter, margarine, cream cheese: a spread when the name is about it, an ingredient otherwise.
  'butter',
  // Cookie butter, chocolate spread: a spread that is also a dessert.
  'sweetSpread',
  // "Plant based", "non dairy", "dairy free": not a dairy food, whatever it imitates.
  'nonDairy',
  // A protein, granola or snack bar: a snack food, whatever dessert or fruit it is named after.
  'snackBar',
  // "Greek", "strained", "Icelandic": a yogurt that is strained, so lean protein.
  'strained',
  // A sauce, dressing or condiment word: when it is the head of the name ("BBQ pulled pork slow cooker sauce"), the
  // food is the sauce and the meats and vegetables named are its flavor. Kept only on the head (`readFoodName`).
  'sauceHead',
  // A category word that opens a catalog name ("Snacks, potato chips", "Beverages, cola"): not the head when the
  // name says more.
  'category',
  // "Protein", "high protein": a shake or drink with protein added is lean protein, not a sugary drink.
  'proteinRich',
  // A biscuit, which is a cookie when it is sweet ("chocolate biscuits", "tea biscuits").
  'biscuit',
  // A food whose other words are its flavor when it is the head of the name ("teriyaki beef jerky", "turkey stuffing
  // mix"), as a snack's or a drink's are.
  'takesFlavors',
  // The word "pie": a dessert, or a pastry when it is filled with a vegetable, cheese, meat or egg.
  'pieWord',
  // The word "snack": a snack food, unless the name says the snack is cheese, fruit, meat or fish ("cheddar cheese snack").
  'snackWord',
  // The word "bar": a snack bar when nothing else says what it is ("cinnamon raisin bars").
  'barWord',
  // A drink or dessert that is often only a flavor name ("tropical punch", "cola", "cheesecake"): the head of the name
  // only when nothing stronger is named ("raisin snacks, tropical punch" are snacks).
  'weakHead',
  // "No": the phrase right after it is not in the food ("pizza, no cheese").
  'noNext',
  // Set by the tagger, not the lexicon: the head of the name is a drink ("iced coffee, cookies 'n' creme"), so the
  // desserts and foods named are its flavor.
  'drinkHead',
  // "Without", "for", "hold the": what follows it, in its part of the name, is not in the food ("without tartar sauce").
  'without',
] as const;

/**
 * A sense the tagger reads from a word that is not itself a tag (MM-617):
 * a qualifier that changes the tags around it ("diet", "lean", "flavored")
 * or a weak tag that holds only when nothing else says otherwise. The
 * lexicon's rules (`foodLexicon.rules`) turn cues into tags; cues never
 * leave `foodTagsOf`.
 */
export type FoodCue = (typeof values)[number];

export const FoodCue = { values } as const;
